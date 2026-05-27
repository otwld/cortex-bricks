import { Inject, Injectable, Optional } from '@nestjs/common';
import { AiQuotaLimit, AiQuotaSubject, AiQuotaUsageSnapshot, AiUsage } from '@otwld/ts-ai';
import { AI_ENDPOINT_OPTIONS, NormalizedAiEndpointOptions } from '../config/ai-module-options';
import { AiException } from '../exceptions/ai.exception';
import { AI_QUOTA_STORAGE } from './ai-quota.tokens';
import { AiQuotaReservation, AiQuotaStorage } from './ai-quota-storage';
import { AiQuotaRequestBody, AiQuotaRequestKind, estimatePromptTokens } from './default-prompt-token-estimator';

/** Coordinates AI quota policy resolution, reservations, and usage snapshots. */
@Injectable()
export class AiQuotaService {
  /**
   * Creates a ai quota service instance.
   *
   * @param endpoints - endpoints value.
   *
   * @param storage - storage value.
   */
  constructor(
    @Inject(AI_ENDPOINT_OPTIONS) private readonly endpoints: Pick<NormalizedAiEndpointOptions, 'quota' | 'limits'>,
    @Optional() @Inject(AI_QUOTA_STORAGE) private readonly storage?: AiQuotaStorage,
  ) {}

  /** Reserves quota for a request body before an AI provider call starts. */
  /**
   * Runs reserve for request.
   *
   * @param request - request value.
   *
   * @param kind - kind value.
   *
   * @param body - body value.
   *
   * @returns The ai quota service reserve for request result.
   *
   * @throws When the operation cannot be completed.
   */
  async reserveForRequest(request: unknown, kind: AiQuotaRequestKind, body: AiQuotaRequestBody): Promise<AiQuotaReservation | null> {
    if (!this.endpoints.quota.enabled) return null;
    if (!this.storage) throw AiException.misconfigured('AI quota is enabled but no quota storage provider is registered');

    const subject = await this.resolveSubject(request);
    const limits = this.resolveLimits(subject);
    const maxPromptTokens = this.resolveMaxPromptTokens(subject);
    const promptTokens = estimatePromptTokens(kind, body);

    if (maxPromptTokens && promptTokens > maxPromptTokens) {
      throw AiException.promptTokenLimitExceeded(promptTokens, maxPromptTokens);
    }

    const requestedMaxOutputTokens = body.maxOutputTokens ?? this.endpoints.limits.maxOutputTokens;
    return this.storage.reserve({
      subject,
      limits,
      requestedTokens: promptTokens + requestedMaxOutputTokens,
      now: new Date(),
    });
  }

  /** Returns the current user's effective quota usage snapshot. */
  /**
   * Runs snapshot for request.
   *
   * @param request - request value.
   *
   * @returns The ai quota service snapshot for request result.
   *
   * @throws When the operation cannot be completed.
   */
  async snapshotForRequest(request: unknown): Promise<AiQuotaUsageSnapshot> {
    if (!this.endpoints.quota.enabled) {
      throw AiException.misconfigured('AI quota usage is unavailable because quota is disabled');
    }
    if (!this.storage) throw AiException.misconfigured('AI quota is enabled but no quota storage provider is registered');

    const subject = await this.resolveSubject(request);
    const limits = this.resolveLimits(subject);
    const buckets = await this.storage.getUsage(subject, limits, new Date());

    return {
      subject,
      maxPromptTokens: this.resolveMaxPromptTokens(subject),
      buckets,
    };
  }

  /** Commits actual provider usage against an existing reservation. */
  /**
   * Runs commit.
   *
   * @param reservation - reservation value.
   *
   * @param usage - usage value.
   */
  async commit(reservation: AiQuotaReservation | null, usage: unknown): Promise<void> {
    if (!reservation || !this.storage) return;
    await this.storage.commit(reservation, this.normalizeUsage(usage));
  }

  /** Releases an existing reservation without committing usage. */
  /**
   * Runs release.
   *
   * @param reservation - reservation value.
   */
  async release(reservation: AiQuotaReservation | null): Promise<void> {
    if (!reservation || !this.storage) return;
    await this.storage.release(reservation);
  }

  /** Commits or releases a streaming reservation once final usage is available. */
  /**
   * Runs commit when usage settles.
   *
   * @param reservation - reservation value.
   *
   * @param usage - usage value.
   */
  commitWhenUsageSettles(reservation: AiQuotaReservation | null, usage: PromiseLike<unknown> | undefined): void {
    if (!reservation || !usage) return;
    void Promise.resolve(usage)
      .then((value) => this.commit(reservation, value))
      .catch(() => this.release(reservation));
  }

  private async resolveSubject(request: unknown): Promise<AiQuotaSubject> {
    const configured = this.endpoints.quota.user?.resolve;
    if (configured) {
      const resolved = await configured(request);
      return { type: 'user', id: resolved.id, roles: resolved.roles ?? [] };
    }

    const user = (request as { user?: unknown }).user as Record<string, unknown> | undefined;
    const configuredIdPath = this.endpoints.quota.user?.idPath?.replace(/^user\./, '');
    const id = this.readPath(user, configuredIdPath) ?? user?.['id'] ?? user?.['_id'] ?? user?.['sub'];
    if (typeof id !== 'string' || id.length === 0) throw AiException.misconfigured('AI quota requires an authenticated user id');

    return { type: 'user', id, roles: this.extractRoles(user) };
  }

  private readPath(source: Record<string, unknown> | undefined, path: string | undefined): unknown {
    if (!source || !path) return undefined;
    return path
      .split('.')
      .filter(Boolean)
      .reduce<unknown>((value, segment) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[segment] : undefined), source);
  }

  private extractRoles(user: Record<string, unknown> | undefined): string[] {
    const configuredRolesPath = this.endpoints.quota.user?.rolesPath?.replace(/^user\./, '');
    const value = this.readPath(user, configuredRolesPath) ?? user?.['roles'];
    if (!Array.isArray(value)) return [];

    return value
      .map((role) => (typeof role === 'string' ? role : typeof role === 'object' && role !== null ? (role as Record<string, unknown>)['name'] : undefined))
      .filter((role): role is string => typeof role === 'string' && role.length > 0);
  }

  private resolveLimits(subject: AiQuotaSubject): AiQuotaLimit[] {
    const matches = this.endpoints.quota.rules.filter(
      (rule) => rule.userIds?.includes(subject.id) || rule.roles?.some((role) => subject.roles.includes(role)),
    );
    const limits = matches.length ? matches.flatMap((rule) => rule.limits) : this.endpoints.quota.defaultLimits ?? [];
    const byWindow = new Map<string, AiQuotaLimit>();

    for (const limit of limits) {
      const key = `${limit.window.unit}:${limit.window.size}`;
      const current = byWindow.get(key);
      if (!current || limit.maxTokens > current.maxTokens) byWindow.set(key, limit);
    }

    return [...byWindow.values()];
  }

  private resolveMaxPromptTokens(subject: AiQuotaSubject): number | undefined {
    const matches = this.endpoints.quota.rules.filter(
      (rule) => rule.userIds?.includes(subject.id) || rule.roles?.some((role) => subject.roles.includes(role)),
    );
    return Math.max(0, ...matches.map((rule) => rule.maxPromptTokens ?? 0), this.endpoints.quota.maxPromptTokens ?? 0) || undefined;
  }

  private normalizeUsage(usage: unknown): AiUsage {
    const value = (usage ?? {}) as Partial<AiUsage>;
    const inputTokens = value.inputTokens ?? 0;
    const outputTokens = value.outputTokens ?? 0;
    return {
      inputTokens,
      outputTokens,
      totalTokens: value.totalTokens ?? inputTokens + outputTokens,
    };
  }
}
