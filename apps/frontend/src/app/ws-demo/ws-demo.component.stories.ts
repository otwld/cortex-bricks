import { signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { WS_CLIENT, type WsClient } from '@otwld/ng-websocket';
import { ChatContract } from '@otwld/ts-chat';
import { ConnectionState } from '@otwld/ts-websocket';
import { of } from 'rxjs';
import { WsDemoComponent } from './ws-demo.component';

const disconnect = fn(async () => undefined);
const joinRoom = fn(async () => undefined);
const sendMessage = fn(async () => undefined);

const wsDemoClient = {
  connected: signal(false),
  disconnect,
  emitWithAck: sendMessage,
  on: () => of(),
  room: () => ({
    joined: signal(false),
    join: joinRoom,
  }),
  state: signal(ConnectionState.Disconnected),
} as unknown as WsClient<typeof ChatContract>;

const meta: Meta<WsDemoComponent> = {
  argTypes: {},
  component: WsDemoComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: WS_CLIENT(ChatContract),
          useValue: wsDemoClient,
        },
      ],
    }),
  ],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-ws-demo></app-ws-demo>`,
  }),
  title: 'frontend/ng/ws-demo',
};

export default meta;

type Story = StoryObj<WsDemoComponent>;

/** Default WebSocket Demo Component state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('show disconnected websocket state', async () => {
      await expect(canvas.getByTestId('state')).toHaveTextContent('State: disconnected');
      await expect(canvas.getByTestId('connected')).toHaveTextContent('Connected: false');
      await expect(canvas.getByTestId('joined')).toHaveTextContent('Joined: false');
      await expect(canvas.getByTestId('send')).toBeDisabled();
    });

    await step('request joining the demo room', async () => {
      await userEvent.click(canvas.getByTestId('join'));
      await expect(joinRoom).toHaveBeenCalledTimes(1);
      await expect(sendMessage).not.toHaveBeenCalled();
      await expect(disconnect).not.toHaveBeenCalled();
    });
  },
};
