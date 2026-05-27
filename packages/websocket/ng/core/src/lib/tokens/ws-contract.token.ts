import { InjectionToken } from '@angular/core';
import type { Contract } from '@otwld/ts-websocket';

/** Source contract bound by `provideWebsocket`. */
export const WS_CONTRACT = new InjectionToken<Contract>('@otwld/ng-websocket/core/WS_CONTRACT');
