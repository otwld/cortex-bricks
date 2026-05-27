import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConnectionState, type Contract } from '@otwld/ts-websocket';
import type { WsClient } from '../services/ws-client.service';
import { WsConnectedDirective } from './ws-connected.directive';

@Component({
  imports: [WsConnectedDirective],
  template: '<ng-container *wsConnected="target; client: client">online</ng-container>',
})
class HostComponent {
  public readonly state = signal(ConnectionState.Disconnected);
  public readonly client = { state: this.state.asReadonly() } as unknown as WsClient<Contract>;
  public target: ConnectionState | '' = '';
}

describe('WsConnectedDirective', () => {
  it('uses an explicit client input instead of requiring a class-token provider', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('');

    fixture.componentInstance.state.set(ConnectionState.Connected);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('online');
  });
});
