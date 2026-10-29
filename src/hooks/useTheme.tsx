import { App as CapApp } from '@capacitor/app'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { parseThemePref, resolveTheme, THEME_STORAGE_KEY, type ResolvedTheme, type ThemePref } from '../lib/theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#f2f2f7', dark: '#000000' }

const systemPrefersDark = (): boolean => window.matchMedia?.(DARK_QUERY).matches === true

function readPref(): ThemePref {
  try {
    return parseThemePref(window.localStorage.getItem(THEME_STORAGE_KEY))
  } catch (error) {
    console.warn('[theme] could not read preference', error)
    return 'auto'
  }
}

function writePref(pref: ThemePref): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, pref)
  } catch (error) {
    console.warn('[theme] could not save preference', error)
  }
}

export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  if (Capacitor.isNativePlatform()) {
    // DARK = light status-bar icons on a dark background.
    SystemBars.setStyle({ style: theme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch((error: unknown) =>
      console.warn('[theme] system bars', error),
    )
  }
}

/** Runs before the first render so the app never flashes the wrong theme. */
export function bootTheme(): void {
  applyTheme(resolveTheme(readPref(), systemPrefersDark()))
}

interface ThemeContextValue {
  readonly pref: ThemePref
  readonly resolved: ResolvedTheme
  setPref(pref: ThemePref): void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readPref)
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark)

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY)
    const sync = () => setSystemDark(mq.matches)
    mq.addEventListener('change', sync)
    // Android can skip the change event while the app is backgrounded.
    const resume = Capacitor.isNativePlatform() ? CapApp.addListener('resume', sync) : null
    return () => {
      mq.removeEventListener('change', sync)
      resume?.then((h) => h.remove()).catch((error: unknown) => console.warn('[theme] listener cleanup', error))
    }
  }, [])

  const resolved = resolveTheme(pref, systemDark)

  useLayoutEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next)
    writePref(next)
  }, [])

  const value = useMemo(() => ({ pref, resolved, setPref }), [pref, resolved, setPref])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
