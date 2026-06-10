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
  public static from(
    resolver: () => string | null | Promise<string | null>,
  ): BearerTokenWsAuthAdapter {
    return new BearerTokenWsAuthAdapter(resolver);
  }

  /** Resolve the bearer token through the configured resolver. */
  public getToken(): string | null | Promise<string | null> {
    return this.resolver();
  }
}
