import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import type { FeatureFlagDto, FeatureFlagUpsertDto } from '@otwld/ts-feature-flags';
import { of } from 'rxjs';
import { FeatureFlagsService } from '../../feature-flags.service';
import { FEATURE_FLAGS_API_TOKEN } from '../../tokens/feature-flags-api.token';
import { FeatureFlagsAdminComponent } from './feature-flags-admin.component';

const createdAt = '2026-06-11T00:00:00.000Z';

const featureFlags: FeatureFlagDto[] = [
  {
    _id: 'feature-candidate-profile-notes',
    allowUserIds: [],
    conditions: [],
    createdAt,
    denyUserIds: [],
    enabled: true,
    name: 'Candidate Profile Notes',
    payload: {},
    scope: 'app',
    slug: 'candidate-profile-notes',
    updatedAt: createdAt,
    variants: [],
  },
  {
    _id: 'feature-interview-ai-summary',
    allowUserIds: [],
    conditions: [],
    createdAt,
    denyUserIds: [],
    enabled: false,
    name: 'Interview AI Summary',
    payload: {},
    scope: 'user',
    slug: 'interview-ai-summary',
    updatedAt: createdAt,
    variants: [],
  },
];

const list = fn(() => of(featureFlags));
const upsert = fn((dto: FeatureFlagUpsertDto) =>
  of({
    _id: `feature-${dto.name}`,
    allowUserIds: [],
    conditions: dto.conditions,
    createdAt,
    denyUserIds: [],
    enabled: dto.enabled,
    name: dto.name,
    payload: dto.payload,
    scope: dto.scope,
    slug: dto.name,
    updatedAt: createdAt,
    variants: dto.variants,
  } satisfies FeatureFlagDto),
);
const toggle = fn((name: string, enabled: boolean) =>
  of({
    ...featureFlags[0],
    enabled,
    name,
  }),
);
const remove = fn(() => of({ ok: true }));
const refreshApp = fn(async () => undefined);
const refreshUser = fn(async () => undefined);

const meta: Meta<FeatureFlagsAdminComponent> = {
  argTypes: {},
  component: FeatureFlagsAdminComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: FEATURE_FLAGS_API_TOKEN,
          useValue: {
            getConditionMeta: fn(() => of({})),
            list,
            listEnabledForApp: fn(() => of([])),
            listEnabledForUser: fn(() => of([])),
            remove,
            toggle,
            upsert,
          },
        },
        {
          provide: FeatureFlagsService,
          useValue: {
            refreshApp,
            refreshUser,
          },
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
    template: `<feature-flags-admin></feature-flags-admin>`,
  }),
  title: 'feature-flags/ng/components/admin/feature-flags-admin',
};

export default meta;

type Story = StoryObj<FeatureFlagsAdminComponent>;

/** Default Feature Flags Admin Component state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('load existing feature flags', async () => {
      await expect(canvas.getByRole('heading', { name: /feature flags/i })).toBeVisible();
      await expect(await canvas.findByText('Candidate Profile Notes')).toBeVisible();
      await expect(canvas.getByText('Interview AI Summary')).toBeVisible();
    });

    await step('refresh the feature flag list', async () => {
      list.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /refresh/i }));
      await expect(list).toHaveBeenCalledTimes(1);
    });

    await step('toggle an enabled app feature off', async () => {
      toggle.mockClear();
      refreshApp.mockClear();
      refreshUser.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /disable/i }));

      await expect(toggle).toHaveBeenCalledWith('Candidate Profile Notes', false);
      await expect(refreshApp).toHaveBeenCalledTimes(1);
      await expect(refreshUser).toHaveBeenCalledTimes(1);
    });

    await step('create a new feature flag from the form', async () => {
      upsert.mockClear();

      await userEvent.type(canvas.getByLabelText('Feature name'), 'Candidate Match Scoring');
      await userEvent.click(canvas.getByRole('checkbox', { name: /enabled/i }));
      await userEvent.click(canvas.getByRole('button', { name: /create/i }));

      await expect(upsert).toHaveBeenCalledWith({
        conditions: [],
        enabled: true,
        name: 'Candidate Match Scoring',
        payload: {},
        scope: 'app',
        variants: [],
      });
    });
  },
};
