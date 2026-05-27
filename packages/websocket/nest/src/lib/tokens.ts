/**
 * Internal DI token containing resolved websocket module options.
 */
export const WS_RESOLVED_OPTIONS = Symbol.for(
  '@otwld/nest-websocket:resolved-options',
);

/**
 * Internal DI token containing the active scaling adapter instance.
 */
export const WS_SCALING_ADAPTER = Symbol.for(
  '@otwld/nest-websocket:scaling-adapter',
);
