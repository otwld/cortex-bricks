import { WsAuthAdapter } from './ws-auth.adapter';

/**
 * `WsAuthAdapter` backed by a token resolver.
 */
export class BearerTokenWsAuthAdapter extends WsAuthAdapter {
  private constructor(private readonly resolver: () => string | null | Promise<string | null>) {
    super();
  }

  /**
   * Build an adapter from a resolver.
   *
   * @param resolver Token resolver.
   */
  /**
   * Runs from.
   *
   * @param resolver - resolver value.
   *
   * @returns The bearer token ws auth adapter from result.
   */
  public static from(
    resolver: () => string | null | Promise<string | null>,
  ): BearerTokenWsAuthAdapter {
    return new BearerTokenWsAuthAdapter(resolver);
  }

  /**
   * Runs get token.
   *
   * @returns The bearer token ws auth adapter get token result.
   */
  public getToken(): string | null | Promise<string | null> {
    return this.resolver();
  }
}
