import { describe, expect, it } from 'vitest'
import { parseThemePref, resolveTheme } from '../src/lib/theme'

describe('resolveTheme', () => {
  it('honours an explicit choice regardless of the device', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('follows the device in auto mode', () => {
    expect(resolveTheme('auto', true)).toBe('dark')
    expect(resolveTheme('auto', false)).toBe('light')
  })
})

describe('parseThemePref', () => {
  it('accepts the three known values', () => {
    expect(parseThemePref('light')).toBe('light')
    expect(parseThemePref('dark')).toBe('dark')
    expect(parseThemePref('auto')).toBe('auto')
  })

  it('defaults to auto for anything else', () => {
    expect(parseThemePref(null)).toBe('auto')
    expect(parseThemePref('purple')).toBe('auto')
    expect(parseThemePref(3)).toBe('auto')
  })
})
