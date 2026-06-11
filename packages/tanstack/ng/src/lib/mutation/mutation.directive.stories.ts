import { signal } from '@angular/core';
import { type CreateMutationResult } from '@tanstack/angular-query-experimental';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { MutationDirective } from './mutation.directive';

const meta: Meta<MutationDirective> = {
  argTypes: {
    mutation: {
      control: false,
      description: 'TanStack mutation result to trigger and observe.',
      table: { category: 'Inputs' },
    },
    mutationIsMe: {
      control: false,
      description: 'Optional predicate used to scope pending state to this host.',
      table: { category: 'Inputs' },
    },
    mutationVariables: {
      control: 'object',
      description: 'Variables passed to mutation.mutate.',
      table: { category: 'Inputs' },
    },
  },
  component: MutationDirective,
  decorators: [
    moduleMetadata({
      imports: [MutationDirective],
    }),
  ],
  title: 'tanstack/ng/mutation',
};

export default meta;

type Story = StoryObj<MutationDirective>;

interface CandidateMutationVariables {
  candidateId: string;
}

const isPending = signal(false);
const variables = signal<CandidateMutationVariables | undefined>(undefined);
const mutate = fn((nextVariables: CandidateMutationVariables) => {
  variables.set(nextVariables);
});

const candidateMutation = {
  isPending,
  mutate,
  variables,
} as unknown as CreateMutationResult<unknown, unknown, CandidateMutationVariables>;

/** Button host that submits a candidate status mutation. */
export const Default: Story = {
  args: {
    mutationVariables: {
      candidateId: 'candidate-001',
    },
  },
  render: (args) => ({
    props: {
      candidateMutation,
      mutationVariables: args.mutationVariables,
    },
    template: `<button
      type="button"
      [tanstackMutation]="candidateMutation"
      [mutationVariables]="mutationVariables"
    >
      Move candidate to interview
    </button>`,
  }),
  play: async ({ canvas, step, userEvent }) => {
    await step('trigger the candidate status mutation with row variables', async () => {
      mutate.mockClear();
      variables.set(undefined);

      await userEvent.click(canvas.getByRole('button', { name: /move candidate to interview/i }));

      await expect(mutate).toHaveBeenCalledWith({
        candidateId: 'candidate-001',
      });
      await expect(variables()).toEqual({
        candidateId: 'candidate-001',
      });
    });
  },
};
