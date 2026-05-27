export { ConnectionState } from './lib/enums/connection-state.enum';
export { WsErrorKind } from './lib/enums/ws-error-kind.enum';

export type { HandshakeContext } from './lib/interfaces/handshake-context.interface';
export type { RoomId } from './lib/interfaces/room-id.interface';
export type { UserContext } from './lib/interfaces/user-context.interface';

export { WsAckTimeoutError, type WsAckTimeoutErrorArgs } from './lib/errors/ws-ack-timeout-error';
export { WsError, type WsErrorArgs } from './lib/errors/ws-error';
export { WsValidationError, type WsValidationErrorArgs } from './lib/errors/ws-validation-error';

export type { EventDirection } from './lib/contract/event-direction';
export type {
  AnyEventDef,
  ClientEventDef,
  PatternOf,
  PayloadOf,
  ResponseOf,
  ServerEventDef,
} from './lib/contract/event-def';
export type {
  ClientEventGroup,
  Contract,
  ContractInput,
  ServerEventGroup,
} from './lib/contract/define-contract';
export type {
  C2sAckKeys,
  C2sKeys,
  InferClientToServer,
  InferServerToClient,
  S2cKeys,
} from './lib/contract/infer-socket-types';
export type { DefaultJoinRoomDef, DefaultLeaveRoomDef } from './lib/contract/room-management';

export { clientEvent, serverEvent } from './lib/contract/event-builder';
export { defineContract } from './lib/contract/define-contract';
export { withRoomManagement } from './lib/contract/room-management';
