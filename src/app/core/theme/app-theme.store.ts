import { effect } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import {
  applyTailngTheme,
  atlasDarkThemePreset,
  atlasThemePreset,
  daybookClassicDarkThemePreset,
  daybookClassicThemePreset,
  defaultDarkThemePreset,
  defaultThemePreset,
  minimalDarkThemePreset,
  minimalThemePreset,
  nexusDarkThemePreset,
  nexusThemePreset,
  prismDarkThemePreset,
  prismThemePreset,
  slateDarkThemePreset,
  slateThemePreset,
  sterlingDarkThemePreset,
  sterlingThemePreset,
} from '@tailng-ui/theme';
import type { UserSession } from '../../components/features/management/data/user-session/user-session.model';

export type AppThemeName =
  | 'default'
  | 'minimal'
  | 'slate'
  | 'nexus'
  | 'prism'
  | 'atlas'
  | 'sterling'
  | 'daybook-classic';

export interface ThemeOption {
  value: AppThemeName;
  label: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Balanced spacing and expressive accents for general product interfaces.',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Compact and low-contrast when content density matters more than decoration.',
  },
  {
    value: 'slate',
    label: 'Slate',
    description: 'Quiet neutrals for polished dashboards and dense application shells.',
  },
  {
    value: 'nexus',
    label: 'Nexus',
    description: 'Modern accent balance suited to product surfaces with a little more energy.',
  },
  {
    value: 'prism',
    label: 'Prism',
    description: 'Sharper contrast and brighter accents for expressive product moments.',
  },
  {
    value: 'atlas',
    label: 'Atlas',
    description: 'Confident teal-led tones that feel grounded across operational tools.',
  },
  {
    value: 'sterling',
    label: 'Sterling',
    description: 'Premium contrast and refined accents for more editorial or branded experiences.',
  },
  {
    value: 'daybook-classic',
    label: 'Daybook Classic',
    description: 'Ledger-toned paper, navy, and signal colors for dense finance workflows.',
  },
];

const VALID_THEME_NAMES = new Set<AppThemeName>([
  'default',
  'minimal',
  'slate',
  'nexus',
  'prism',
  'atlas',
  'sterling',
  'daybook-classic',
]);

function resolveThemeName(raw: unknown): AppThemeName {
  return typeof raw === 'string' && VALID_THEME_NAMES.has(raw as AppThemeName)
    ? (raw as AppThemeName)
    : 'daybook-classic';
}

function resolveDarkMode(raw: unknown): boolean {
  return raw === 'dark';
}

// ── localStorage persistence ──────────────────────────────────────────────────

const THEME_STORAGE_KEY = 'daybook:theme';

type PersistedTheme = { darkMode: boolean; themeName: AppThemeName };

function loadPersistedTheme(): PersistedTheme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return { darkMode: false, themeName: 'default' };
    const parsed = JSON.parse(raw) as Partial<PersistedTheme>;
    return {
      darkMode: typeof parsed.darkMode === 'boolean' ? parsed.darkMode : false,
      themeName: resolveThemeName(parsed.themeName),
    };
  } catch {
    return { darkMode: false, themeName: 'default' };
  }
}

function persistTheme(darkMode: boolean, themeName: AppThemeName): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ darkMode, themeName }));
  } catch {
    // localStorage may be unavailable (private browsing, storage quota, etc.)
  }
}

const THEME_PRESETS: Record<AppThemeName, { light: object; dark: object }> = {
  default: { light: defaultThemePreset, dark: defaultDarkThemePreset },
  minimal: { light: minimalThemePreset, dark: minimalDarkThemePreset },
  slate: { light: slateThemePreset, dark: slateDarkThemePreset },
  nexus: { light: nexusThemePreset, dark: nexusDarkThemePreset },
  prism: { light: prismThemePreset, dark: prismDarkThemePreset },
  atlas: { light: atlasThemePreset, dark: atlasDarkThemePreset },
  sterling: { light: sterlingThemePreset, dark: sterlingDarkThemePreset },
  'daybook-classic': { light: daybookClassicThemePreset, dark: daybookClassicDarkThemePreset },
};

export const AppThemeStore = signalStore(
  { providedIn: 'root' },
  withState(() => {
    // Read from localStorage so the correct theme is applied on the very first
    // paint — before any async session/config calls complete. Falls back to
    // default when nothing is stored yet (first-time visitor).
    const persisted = loadPersistedTheme();
    return { darkMode: persisted.darkMode, themeName: persisted.themeName };
  }),
  withMethods((store) => ({
    /** Preview only — updates the live theme without touching localStorage. */
    setDarkMode(isDark: boolean): void {
      patchState(store, { darkMode: isDark });
    },
    /** Preview only — updates the live theme without touching localStorage. */
    setThemeName(name: AppThemeName): void {
      patchState(store, { themeName: name });
    },
    /**
     * Called once after a session is established. Reads props.mode / props.theme
     * and persists the server-authoritative values to localStorage so they
     * survive the next page load or logout redirect.
     */
    initFromSession(session: UserSession): void {
      const darkMode = resolveDarkMode(session.props?.mode);
      const themeName = resolveThemeName(session.props?.theme);
      patchState(store, { darkMode, themeName });
      persistTheme(darkMode, themeName);
    },
    /**
     * Called after the user explicitly saves their appearance settings via the
     * profile form. Persists the current in-memory state to localStorage so the
     * updated theme survives the next page load.
     */
    commitTheme(): void {
      persistTheme(store.darkMode(), store.themeName());
    },
  })),
  withHooks({
    onInit(store) {
      effect(() => {
        const presets = THEME_PRESETS[store.themeName()];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applyTailngTheme((store.darkMode() ? presets.dark : presets.light) as any);
      });
    },
  }),
);
