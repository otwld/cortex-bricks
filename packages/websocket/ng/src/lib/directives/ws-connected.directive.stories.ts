import { signal } from '@angular/core';
import { ConnectionState } from '@otwld/ts-websocket';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { WsConnectedDirective, type WsConnectionStateClient } from './ws-connected.directive';

const meta: Meta<WsConnectedDirective> = {
  argTypes: {
    wsConnected: {
      control: 'select',
      description: 'Connection state that must match before projected content renders.',
      options: Object.values(ConnectionState),
      table: { category: 'Inputs' },
    },
    wsConnectedClient: {
      control: false,
      description: 'Contract-scoped websocket client that exposes connection state.',
      table: { category: 'Inputs' },
    },
  },
  component: WsConnectedDirective,
  decorators: [
    moduleMetadata({
      imports: [WsConnectedDirective],
    }),
  ],
  parameters: {
    actions: { disable: true },
  },
  title: 'websocket/ng/ws-connected',
};

export default meta;

type Story = StoryObj<WsConnectedDirective>;

const connectedClient: WsConnectionStateClient = {
  state: signal(ConnectionState.Connected),
};

/** Structural host shown while the recruitment websocket is connected. */
export const Default: Story = {
  args: {
    wsConnected: ConnectionState.Connected,
    wsConnectedClient: connectedClient,
  },
  render: (args) => ({
    props: args,
    template: `<ng-template [wsConnected]="wsConnected" [wsConnectedClient]="wsConnectedClient">
      <section>Live candidate updates connected.</section>
    </ng-template>`,
  }),
  play: async ({ canvas, step }) => {
    await step('render content when the websocket state matches', async () => {
      await expect(canvas.getByText(/live candidate updates connected/i)).toBeVisible();
    });
  },
};
