import { provideHttpClient } from '@angular/common/http';
import { inject, provideEnvironmentInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import type { Preview } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAi } from '@otwld/ng-ai';
import { provideAuth } from '@otwld/ng-auth/core';
import { FEATURE_FLAGS_API_TOKEN, FEATURE_FLAGS_CONTEXT_TOKEN, type FeatureFlagsApi } from '@otwld/ng-feature-flags';
import { provideDarkMode } from '@otwld/ng-cdk';
import {
  DashboardLayoutService,
  provideDashboardLayoutConfig,
  provideDashboardLayoutState,
} from '@otwld/ng-dashboard/core';
import { provideStorage } from '@otwld/ng-storage';
import { createStorybookMswPreview, defineStorybookMswHandlers } from '@otwld/ng-storybook';
import { provideUsers } from '@otwld/ng-users/core';
import type { FeatureFlagDto } from '@otwld/ts-feature-flags';
import { of } from 'rxjs';
import { PrimeNG } from 'primeng/config';

const now = '2026-06-11T00:00:00.000Z';
const featureFlags: FeatureFlagDto[] = [
  {
    _id: 'feature-candidate-match-insights',
    allowUserIds: [],
    conditions: [],
    createdAt: now,
    createdBy: 'story-admin',
    denyUserIds: [],
    enabled: true,
    name: 'candidate-match-insights',
    payload: {
      model: 'hiring-v2',
      panel: 'candidate-profile',
    },
    scope: 'app',
    slug: 'candidate-match-insights',
    updatedAt: now,
    updatedBy: 'story-admin',
  },
  {
    _id: 'feature-recruiter-copilot',
    allowUserIds: ['recruiter-ada'],
    conditions: [],
    createdAt: now,
    createdBy: 'story-admin',
    denyUserIds: [],
    enabled: true,
    name: 'recruiter-copilot',
    payload: {
      defaultPrompt: 'Summarize this candidate for the hiring panel.',
    },
    scope: 'user',
    slug: 'recruiter-copilot',
    updatedAt: now,
    updatedBy: 'story-admin',
  },
];

function getFeatureFlag(name: string): FeatureFlagDto {
  return (
    featureFlags.find((feature) => feature.name === name) ?? {
      _id: `feature-${name}`,
      allowUserIds: [],
      conditions: [],
      createdAt: now,
      createdBy: 'storybook',
      denyUserIds: [],
      enabled: false,
      name,
      payload: {},
      scope: 'app',
      slug: name,
      updatedAt: now,
      updatedBy: 'storybook',
    }
  );
}

const featureFlagsApi: FeatureFlagsApi = {
  getConditionMeta: () => of({}),
  list: (scope) => of(scope ? featureFlags.filter((feature) => feature.scope === scope) : featureFlags),
  listEnabledForApp: () =>
    of(
      featureFlags
        .filter((feature) => feature.enabled && feature.scope === 'app')
        .map(({ enabled, name, payload, slug }) => ({ enabled, name, payload, slug })),
    ),
  listEnabledForUser: () =>
    of(
      featureFlags
        .filter((feature) => feature.enabled && feature.scope === 'user')
        .map(({ enabled, name, payload, slug }) => ({ enabled, name, payload, slug })),
    ),
  remove: () => of({ ok: true }),
  toggle: (name, enabled) =>
    of({
      ...getFeatureFlag(name),
      enabled,
      updatedAt: now,
    }),
  upsert: (dto) =>
    of({
      _id: `feature-${dto.name}`,
      allowUserIds: dto.allowUserIds ?? [],
      conditions: dto.conditions,
      createdAt: now,
      denyUserIds: dto.denyUserIds ?? [],
      enabled: dto.enabled,
      name: dto.name,
      payload: dto.payload,
      scope: dto.scope,
      slug: dto.name,
      updatedAt: now,
    }),
};

const BlueAura = definePreset(Aura, {
  semantic: {
    primary: Aura.primitive!.blue,
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.900}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
});

const primeNgProvider = provideEnvironmentInitializer(() => {
  inject(PrimeNG).setConfig({
    theme: {
      preset: BlueAura,
      options: {
        darkModeSelector: '.app-dark',
        cssLayer: {
          name: 'primeng',
          order: 'theme, base, primeng',
        },
      },
    },
  });
});

const mswPreview = createStorybookMswPreview(
  defineStorybookMswHandlers({
    health: [],
  }),
);

const preview: Preview = {
  controls: {
    sort: 'requiredFirst', // for stories
  },
  docs: {
    controls: {
      sort: 'requiredFirst', // for docs
    },
  },
  decorators: [
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideAuth({
          afterLoginRoute: '/dashboard',
          afterLogoutRoute: '/auth/login',
          apiUrl: '/api/auth',
          devLoginEnabled: true,
        }),
        provideUsers({ apiUrl: '/api/users' }),
        provideAi({ apiBaseUrl: '/api/ai' }),
        provideStorage({
          signedUrlEndpoint: '/api/storage/signed-url',
          tusEndpoint: '/api/storage/uploads',
        }),
        provideDarkMode({ initialPreference: 'dark', persistence: false, autoSync: true, viewTransitions: false }),
        provideDashboardLayoutConfig(),
        provideDashboardLayoutState(),
        primeNgProvider,
        DashboardLayoutService,
        {
          provide: FEATURE_FLAGS_API_TOKEN,
          useValue: featureFlagsApi,
        },
        {
          provide: FEATURE_FLAGS_CONTEXT_TOKEN,
          useValue: {
            getAppContext: async () => ({ version: 'storybook-2026.06' }),
            getUserContext: async () => ({ userId: 'recruiter-ada' }),
          },
        },
      ],
    }),
  ],
  loaders: [...(Array.isArray(mswPreview.loaders) ? mswPreview.loaders : [])],
  parameters: {
    docs: {
      codePanel: true,
    },
    ...(mswPreview.parameters ?? {}),
  },
};

export default preview;
