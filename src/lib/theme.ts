export type ThemePref = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_PREFS: readonly ThemePref[] = ['light', 'dark', 'auto']
export const THEME_STORAGE_KEY = 'diploma.theme'

export function resolveTheme(pref: ThemePref, systemPrefersDark: boolean): ResolvedTheme {
  if (pref === 'auto') return systemPrefersDark ? 'dark' : 'light'
  return pref
}

export function parseThemePref(raw: unknown): ThemePref {
  return THEME_PREFS.find((p) => p === raw) ?? 'auto'
}
