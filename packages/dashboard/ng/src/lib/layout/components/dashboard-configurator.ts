import { booleanAttribute, Component, computed, inject, model, input, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { $t, updatePreset, updateSurfacePalette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { PrimeNG } from 'primeng/config';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';
import { DarkModeService } from '@otwld/ng-cdk';

const presets = {
  Aura,
  Lara,
  Nora,
} as const;

type KeyOfType<T> = Extract<keyof T, string>;

type SurfacesType = {
  name: string;
  palette?: {
    0?: string;
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
    950?: string;
  };
};

const ATLANTIS_THEME_VALUES = {
  preset: 'Aura',
  primary: 'emerald',
  surface: null,
  menuMode: 'static',
  defaultSurface: {
    light: 'slate',
    dark: 'zinc',
  },
  primaryPalette: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  surfacePalette: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
} as const;

/**
 * Dashboard theme and layout configurator drawer.
 */
@Component({
  selector: 'app-configurator',

  imports: [FormsModule, SelectButtonModule, DrawerModule, ToggleSwitchModule, RadioButtonModule],
  styleUrl: './dashboard-configurator.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (simple()) {
      <button class="layout-config-button config-link" type="button" (click)="toggleConfigSidebar()">
        <i class="pi pi-cog"></i>
      </button>
    }
    <p-drawer
      [visible]="visible()"
      (onHide)="onDrawerHide()"
      position="right"
      [transitionOptions]="'.3s cubic-bezier(0, 0, 0.2, 1)'"
      styleClass="layout-config-sidebar w-80"
      header="Settings"
    >
      <div class="flex flex-col gap-4">
        <div>
          <span class="text-lg font-semibold">Primary</span>
          <div class="pt-2 flex gap-2 flex-wrap">
            @for (primaryColor of primaryColors(); track primaryColor.name) {
              <button
                type="button"
                [title]="primaryColor.name"
                (click)="updateColors($event, 'primary', primaryColor)"
                [class.outline]="primaryColor.name === selectedPrimaryColor()"
                [class.outline-primary]="primaryColor.name === selectedPrimaryColor()"
                class="cursor-pointer w-6 h-6 rounded-full flex shrink-0 items-center justify-center outline-offset-1 shadow"
                [style]="{
                  'background-color': primaryColor?.name === 'noir' ? 'var(--text-color)' : primaryColor?.palette?.['500'],
                }"
              ></button>
            }
          </div>
        </div>

        <div>
          <span class="text-lg font-semibold">Surface</span>
          <div class="pt-2 flex gap-2 flex-wrap">
            @for (surface of surfaces; track surface.name) {
              <button
                type="button"
                [title]="surface.name"
                (click)="updateColors($event, 'surface', surface)"
                class="cursor-pointer w-6 h-6 rounded-full flex shrink-0 items-center justify-center p-0 outline-offset-1"
                [class]="{
                  'outline outline-primary': selectedSurface()
                    ? selectedSurface() === surface.name
                    : darkModeEnabled()
                      ? surface.name === atlantisThemeValues.defaultSurface.dark
                      : surface.name === atlantisThemeValues.defaultSurface.light,
                }"
                [style]="{
                  'background-color': surface?.palette?.['500'],
                }"
              ></button>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-lg font-semibold">Presets</span>
          <p-selectbutton [options]="presets" [ngModel]="selectedPreset()" (ngModelChange)="onPresetChange($event)" [allowEmpty]="false" />
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-lg font-semibold">Color Scheme</span>
          <p-selectbutton
            [ngModel]="darkModeEnabled()"
            (ngModelChange)="setDarkMode($event)"
            [options]="themeOptions"
            optionLabel="name"
            optionValue="value"
            [allowEmpty]="false"
          />
        </div>

        @if (!simple()) {
          <div class="flex flex-col gap-2">
            <span class="text-lg font-semibold">Menu Type</span>
            <div class="flex flex-wrap flex-col gap-3">
              <div class="flex">
                <div class="flex items-center gap-2 w-1/2">
                  <p-radiobutton name="menuMode" value="static" [(ngModel)]="menuMode" (ngModelChange)="setMenuMode('static')" inputId="static" />
                  <label for="static">Static</label>
                </div>
                <div class="flex items-center gap-2 w-1/2">
                  <p-radiobutton name="menuMode" value="overlay" [(ngModel)]="menuMode" (ngModelChange)="setMenuMode('overlay')" inputId="overlay" />
                  <label for="overlay">Overlay</label>
                </div>
              </div>
              <div class="flex">
                <div class="flex items-center gap-2 w-1/2">
                  <p-radiobutton name="menuMode" value="slim" [(ngModel)]="menuMode" (ngModelChange)="setMenuMode('slim')" inputId="slim" />
                  <label for="slim">Slim</label>
                </div>
                <div class="flex items-center gap-2 w-1/2">
                  <p-radiobutton name="menuMode" value="slim-plus" [(ngModel)]="menuMode" (ngModelChange)="setMenuMode('slim-plus')" inputId="slim-plus" />
                  <label for="slim-plus">Slim+</label>
                </div>
              </div>
              <div class="flex">
                <div class="flex items-center gap-2 w-1/2">
                  <p-radiobutton name="menuMode" value="reveal" [(ngModel)]="menuMode" (ngModelChange)="setMenuMode('reveal')" inputId="reveal" />
                  <label for="reveal">Reveal</label>
                </div>
                <div class="flex items-center gap-2 w-1/2">
                  <p-radiobutton name="menuMode" value="drawer" [(ngModel)]="menuMode" (ngModelChange)="setMenuMode('drawer')" inputId="drawer" />
                  <label for="drawer">Drawer</label>
                </div>
              </div>
              <div class="flex items-center gap-2 w-1/2">
                <p-radiobutton name="menuMode" value="horizontal" [(ngModel)]="menuMode" (ngModelChange)="setMenuMode('horizontal')" inputId="horizontal" />
                <label for="horizontal">Horizontal</label>
              </div>
            </div>
          </div>
        }

        @if (!simple()) {
          <div class="flex flex-col gap-2">
            <span class="text-lg font-semibold">Menu Theme</span>
            <div class="flex flex-wrap flex-col gap-4">
              <div class="flex items-center gap-2">
                <p-radiobutton
                  name="menuTheme"
                  value="colorScheme"
                  [ngModel]="menuTheme()"
                  (ngModelChange)="setMenuTheme('colorScheme')"
                  inputId="menutheme-colorscheme"
                />
                <label for="scheme">Color Scheme</label>
              </div>
              <div class="flex items-center gap-2">
                <p-radiobutton
                  name="menuTheme"
                  value="primaryColor"
                  [ngModel]="menuTheme()"
                  (ngModelChange)="setMenuTheme('primaryColor')"
                  inputId="menutheme-primarycolor"
                />
                <label for="primary">Primary Color</label>
              </div>
              <div class="flex items-center gap-2">
                <p-radiobutton
                  name="menuTheme"
                  value="transparent"
                  [ngModel]="menuTheme()"
                  (ngModelChange)="setMenuTheme('transparent')"
                  inputId="menutheme-transparent"
                  [disabled]="isTransparentThemeOptionDisabled()"
                />
                <label for="transparent">Transparent</label>
              </div>
            </div>
          </div>
        }
      </div>
    </p-drawer>
  `,
})
export class DashboardConfigurator {
  protected readonly atlantisThemeValues = ATLANTIS_THEME_VALUES;

  /**
   * Enables the compact cog-only trigger used by embedded dashboard layouts.
   */
  readonly simple = input<boolean, unknown>(false, {
    transform: booleanAttribute,
  });

  /**
   * Router dependency reserved for route-aware configurator behavior.
   */
  router = inject(Router);

  /**
   * PrimeNG configuration service used by the theme controls.
   */
  config = inject(PrimeNG);

  /**
   * Shared dashboard layout state updated by menu and drawer controls.
   */
  layoutService = inject(DashboardLayoutService);

  /**
   * Dark-mode state service backing the color-scheme selector.
   */
  darkModeService = inject(DarkModeService);

  /**
   * PrimeNG runtime API used for theme preset updates.
   */
  primeng = inject(PrimeNG);

  /**
   * Available PrimeNG preset names displayed in the preset selector.
   */
  presets = Object.keys(presets);

  /**
   * Binary color-scheme options bound to the dark-mode select button.
   */
  themeOptions = [
    { name: 'Light', value: false },
    { name: 'Dark', value: true },
  ];

  /**
   * Supported surface palettes offered by the theme configurator.
   */
  surfaces: SurfacesType[] = [
    {
      name: 'slate',
      palette: {
        0: '#ffffff',
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
    },
    {
      name: 'gray',
      palette: {
        0: '#ffffff',
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
        950: '#030712',
      },
    },
    {
      name: 'zinc',
      palette: { ...ATLANTIS_THEME_VALUES.surfacePalette },
    },
    {
      name: 'neutral',
      palette: {
        0: '#ffffff',
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
        950: '#0a0a0a',
      },
    },
    {
      name: 'stone',
      palette: {
        0: '#ffffff',
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
        950: '#0c0a09',
      },
    },
    {
      name: 'soho',
      palette: {
        0: '#ffffff',
        50: '#ececec',
        100: '#dedfdf',
        200: '#c4c4c6',
        300: '#adaeb0',
        400: '#97979b',
        500: '#7f8084',
        600: '#6a6b70',
        700: '#55565b',
        800: '#3f4046',
        900: '#2c2c34',
        950: '#16161d',
      },
    },
    {
      name: 'viva',
      palette: {
        0: '#ffffff',
        50: '#f3f3f3',
        100: '#e7e7e8',
        200: '#cfd0d0',
        300: '#b7b8b9',
        400: '#9fa1a1',
        500: '#87898a',
        600: '#6e7173',
        700: '#565a5b',
        800: '#3e4244',
        900: '#262b2c',
        950: '#0e1315',
      },
    },
    {
      name: 'ocean',
      palette: {
        0: '#ffffff',
        50: '#fbfcfc',
        100: '#F7F9F8',
        200: '#EFF3F2',
        300: '#DADEDD',
        400: '#B1B7B6',
        500: '#828787',
        600: '#5F7274',
        700: '#415B61',
        800: '#29444E',
        900: '#183240',
        950: '#0c1920',
      },
    },
  ];

  /**
   * Currently selected primary palette name from the layout configuration.
   */
  selectedPrimaryColor = computed(() => {
    return this.layoutService.layoutConfig().primary;
  });

  /**
   * Currently selected surface palette name from the layout configuration.
   */
  selectedSurfaceColor = computed(() => this.layoutService.layoutConfig().surface);

  /**
   * Currently selected PrimeNG preset name from the layout configuration.
   */
  selectedPreset = computed(() => this.layoutService.layoutConfig().preset);

  /**
   * Writable menu mode model shared with the menu type radio controls.
   */
  menuMode = model(this.layoutService.layoutConfig().menuMode);

  /**
   * Whether the settings drawer is currently visible.
   */
  visible = computed(() => this.layoutService.layoutState().configSidebarVisible ?? false);

  /**
   * Current dark-mode state used by the color-scheme selector.
   */
  darkModeEnabled = computed(() => this.darkModeService.isDarkMode());

  /**
   * Selected surface palette name used to highlight the active surface swatch.
   */
  selectedSurface = computed(() => this.layoutService.layoutConfig().surface);

  /**
   * Primary palettes derived from the active PrimeNG preset plus the Atlantis default.
   */
  primaryColors = computed<SurfacesType[]>(() => {
    const presetPalette = presets[this.layoutService.layoutConfig().preset as KeyOfType<typeof presets>].primitive;
    const colors = [
      ATLANTIS_THEME_VALUES.primary,
      'green',
      'lime',
      'orange',
      'amber',
      'yellow',
      'teal',
      'cyan',
      'sky',
      'blue',
      'indigo',
      'violet',
      'purple',
      'fuchsia',
      'pink',
      'rose',
    ];
    const palettes: SurfacesType[] = [{ name: 'noir', palette: {} }];

    colors.forEach((color) => {
      palettes.push({
        name: color,
        palette:
          (presetPalette?.[color as KeyOfType<typeof presetPalette>] as SurfacesType['palette']) ||
          (color === ATLANTIS_THEME_VALUES.primary ? { ...ATLANTIS_THEME_VALUES.primaryPalette } : undefined),
      });
    });

    return palettes;
  });

  /**
   * Current menu theme strategy from the shared layout configuration.
   */
  menuTheme = computed(() => this.layoutService.layoutConfig().menuTheme);

  /**
   * Builds the PrimeNG preset extension for noir and colored primary palettes.
   */
  getPresetExt() {
    const color: SurfacesType = this.primaryColors().find((c) => c.name === this.selectedPrimaryColor()) ?? {
      name: 'noir',
      palette: {},
    };

    if (color.name === 'noir') {
      return {
        semantic: {
          primary: {
            50: '{surface.50}',
            100: '{surface.100}',
            200: '{surface.200}',
            300: '{surface.300}',
            400: '{surface.400}',
            500: '{surface.500}',
            600: '{surface.600}',
            700: '{surface.700}',
            800: '{surface.800}',
            900: '{surface.900}',
            950: '{surface.950}',
          },
          colorScheme: {
            light: {
              primary: {
                color: '{primary.950}',
                contrastColor: '#ffffff',
                hoverColor: '{primary.800}',
                activeColor: '{primary.700}',
              },
              highlight: {
                background: '{primary.950}',
                focusBackground: '{primary.700}',
                color: '#ffffff',
                focusColor: '#ffffff',
              },
            },
            dark: {
              primary: {
                color: '{primary.50}',
                contrastColor: '{primary.950}',
                hoverColor: '{primary.200}',
                activeColor: '{primary.300}',
              },
              highlight: {
                background: '{primary.50}',
                focusBackground: '{primary.300}',
                color: '{primary.950}',
                focusColor: '{primary.950}',
              },
            },
          },
        },
      };
    } else {
      return {
        semantic: {
          primary: color.palette,
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
      };
    }
  }

  /**
   * Updates the selected palette in layout state and applies the matching theme change.
   */
  updateColors(event: Event, type: 'primary' | 'surface', color: SurfacesType) {
    if (type === 'primary') {
      this.layoutService.layoutConfig.update((state) => ({
        ...state,
        primary: color.name,
      }));
    } else if (type === 'surface') {
      this.layoutService.layoutConfig.update((state) => ({
        ...state,
        surface: color.name,
      }));
    }
    this.applyTheme(type, color);

    event.stopPropagation();
  }

  /**
   * Applies primary preset or surface palette updates through the PrimeUI theme runtime.
   */
  applyTheme(type: 'primary' | 'surface', color: SurfacesType) {
    if (type === 'primary') {
      updatePreset(this.getPresetExt());
    } else if (color.palette) {
      updateSurfacePalette(color.palette);
    }
  }

  /**
   * Switches PrimeNG presets while preserving the selected primary and surface palettes.
   */
  onPresetChange(event: KeyOfType<typeof presets>) {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      preset: event,
    }));
    const preset = presets[event as KeyOfType<typeof presets>];
    const surfacePalette = this.surfaces.find((s) => s.name === this.selectedSurfaceColor())?.palette;
    $t().preset(preset).preset(this.getPresetExt()).surfacePalette(surfacePalette).use({ useDefaultOptions: true });
  }

  /**
   * Synchronizes the shared layout state after the settings drawer closes.
   */
  onDrawerHide() {
    this.layoutService.layoutState.update((prev) => ({
      ...prev,
      configSidebarVisible: false,
    }));
  }

  /**
   * Updates the menu mode and resets incompatible transparent menu themes.
   */
  setMenuMode(mode: string) {
    const nonTransparentModes = ['reveal', 'drawer', 'overlay'];
    const currentMenuTheme = this.menuTheme();

    if (nonTransparentModes.includes(mode)) {
      const theme = currentMenuTheme === 'colorScheme' || currentMenuTheme === 'primaryColor' ? currentMenuTheme : 'colorScheme';

      this.setMenuTheme(theme);
    }
    this.layoutService.layoutConfig.update((prev) => ({
      ...prev,
      menuMode: mode,
    }));

    if (this.layoutService.layoutConfig().menuMode === 'static') {
      this.layoutService.layoutState.update((prev) => ({
        ...prev,
        staticMenuInactive: false,
      }));
    }
  }

  /**
   * Sets the application-wide dark-mode preference.
   */
  setDarkMode(enabled: boolean): void {
    this.darkModeService.setDarkMode(enabled);
  }

  /**
   * Toggles the settings drawer visibility in shared layout state.
   */
  toggleConfigSidebar() {
    this.layoutService.layoutState.update((prev) => ({
      ...prev,
      configSidebarVisible: !prev.configSidebarVisible,
    }));
  }

  /**
   * Updates the active menu theme strategy in shared layout state.
   */
  setMenuTheme(theme: string) {
    this.layoutService.layoutConfig.update((prev) => ({
      ...prev,
      menuTheme: theme,
    }));
  }

  /**
   * Returns whether the transparent menu theme is unavailable for the active mode.
   */
  isTransparentThemeOptionDisabled() {
    const menuMode = this.menuMode();
    return ['reveal', 'overlay', 'drawer'].includes(menuMode as string);
  }
}
