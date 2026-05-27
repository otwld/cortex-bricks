import { AiQuotaLimit, AiQuotaSubject, AiQuotaUsageBucket, AiUsage } from '@otwld/ts-ai';

/** Resolved quota limit used by the storage adapter. */
export type AiResolvedQuotaLimit = AiQuotaLimit;

/** Request to reserve quota before an AI provider call starts. */
export interface AiQuotaReservationRequest {
  subject: AiQuotaSubject;
  requestedTokens: number;
  limits: AiResolvedQuotaLimit[];
  now: Date;
}

/** One bucket touched by a quota reservation. */
export interface AiQuotaReservationEntry {
  windowKey: string;
  reservedTokens: number;
  limit: AiResolvedQuotaLimit;
}

/** Reservation returned after quota is held for a request. */
export interface AiQuotaReservation {
  id: string;
  subject: AiQuotaSubject;
  requestedTokens: number;
  entries: AiQuotaReservationEntry[];
}

/** Durable quota storage abstraction used by nest-ai. */
export interface AiQuotaStorage {
  getUsage(subject: AiQuotaSubject, limits: AiResolvedQuotaLimit[], now: Date): Promise<AiQuotaUsageBucket[]>;
  reserve(request: AiQuotaReservationRequest): Promise<AiQuotaReservation>;
  commit(reservation: AiQuotaReservation, usage: AiUsage): Promise<void>;
  release(reservation: AiQuotaReservation): Promise<void>;
}
