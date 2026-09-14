/**
 * Theme registry.
 *
 * To add a palette later:
 * 1. Extend ThemeId and THEMES below
 * 2. Add a matching [data-theme="id"] block in src/index.css
 *
 * Components should use tokens from `./ui.ts`, not raw zinc/indigo colors.
 */
export const THEME_STORAGE_KEY = 'organizapp.theme';

export const THEME_IDS = ['light', 'dark', 'navy', 'beige'] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ColorScheme = 'light' | 'dark';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  scheme: ColorScheme;
}

export const THEMES: ThemeDefinition[] = [
  { id: 'light', label: 'Light', scheme: 'light' },
  { id: 'dark', label: 'Dark', scheme: 'dark' },
  { id: 'navy', label: 'Dark blue', scheme: 'dark' },
  { id: 'beige', label: 'Beige', scheme: 'light' },
];

export const DEFAULT_THEME: ThemeId = 'light';

export function isThemeId(value: string | null): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    /* private mode / SSR */
  }
  return DEFAULT_THEME;
}

export function applyTheme(id: ThemeId): void {
  const def = THEMES.find((t) => t.id === id) ?? THEMES[0];
  const root = document.documentElement;
  root.setAttribute('data-theme', def.id);
  root.style.colorScheme = def.scheme;
}
