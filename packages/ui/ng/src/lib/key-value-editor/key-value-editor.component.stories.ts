import { type Meta, type StoryObj } from '@storybook/angular';
import { FormArray } from '@angular/forms';
import { expect } from 'storybook/test';
import {
  KeyValueEditorComponent,
  objectToKeyValueFormGroup,
  type KeyValueFormArray,
} from './key-value-editor.component';

function createCandidateMetadataFormArray(): KeyValueFormArray {
  return new FormArray(
    objectToKeyValueFormGroup({
      availability: 'Immediate',
      role: 'Frontend Engineer',
    }),
  );
}

const meta: Meta<KeyValueEditorComponent> = {
  argTypes: {
    formArray: {
      control: false,
      description: 'Reactive form array owned by the consuming form.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    formArray: createCandidateMetadataFormArray(),
  },
  component: KeyValueEditorComponent,
  parameters: {
    actions: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<kit-key-value-editor [formArray]="formArray"></kit-key-value-editor>`,
  }),
  title: 'ui/ng/key-value-editor',
};

export default meta;

type Story = StoryObj<KeyValueEditorComponent>;

/** Default Key Value Editor Component state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render existing metadata rows', async () => {
      const keys = canvas.getAllByLabelText('Key');
      const values = canvas.getAllByLabelText('Value');

      await expect(keys[0]).toHaveValue('availability');
      await expect(values[0]).toHaveValue('Immediate');
      await expect(keys[1]).toHaveValue('role');
      await expect(values[1]).toHaveValue('Frontend Engineer');
    });

    await step('add and remove metadata rows', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /add/i }));

      const keys = canvas.getAllByLabelText('Key');
      const values = canvas.getAllByLabelText('Value');

      await expect(keys).toHaveLength(3);
      await userEvent.clear(keys[2]);
      await userEvent.type(keys[2], 'source');
      await userEvent.type(values[2], 'Referral');
      await expect(keys[2]).toHaveValue('source');
      await expect(values[2]).toHaveValue('Referral');

      await userEvent.click(canvas.getAllByRole('button', { name: /remove/i })[0]);
      await expect(canvas.getAllByLabelText('Key')).toHaveLength(2);
    });
  },
};
