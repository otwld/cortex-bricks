import { InjectionToken } from '@angular/core';
import type { WsConfig } from '../models/ws-config.model';

/** Resolved configuration for the websocket client. */
export const WS_CONFIG = new InjectionToken<WsConfig>('@otwld/ng-websocket/WS_CONFIG');
