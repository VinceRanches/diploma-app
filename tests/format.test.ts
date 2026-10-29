import { describe, expect, it } from 'vitest'
import { cx } from '../src/lib/cx'
import { formatClock, formatDate, greeting, mistakesLabel, pct, plural } from '../src/lib/format'
import { readiness } from '../src/lib/progress'
import { EMPTY_PROGRESS } from '../src/lib/progress'
import { scorePercent } from '../src/lib/scoring'

describe('format helpers', () => {
  it('pct clamps to 0..100', () => {
    expect(pct(0.456)).toBe(46)
    expect(pct(-1)).toBe(0)
    expect(pct(3)).toBe(100)
  })

  it('formatClock renders m:ss and never goes negative', () => {
    expect(formatClock(35 * 60)).toBe('35:00')
    expect(formatClock(61.9)).toBe('1:01')
    expect(formatClock(-5)).toBe('0:00')
  })

  it('greeting switches to Καλησπέρα in the afternoon', () => {
    expect(greeting(new Date(2026, 9, 24, 9))).toBe('Καλημέρα')
    expect(greeting(new Date(2026, 9, 24, 17))).toBe('Καλησπέρα')
  })

  it('uses the Greek singular for one mistake', () => {
    expect(mistakesLabel(1)).toBe('1 λάθος')
    expect(mistakesLabel(3)).toBe('3 λάθη')
    expect(plural(1, 'σήμα', 'σήματα')).toBe('1 σήμα')
  })

  it('formatDate produces a Greek date string', () => {
    expect(formatDate(new Date(2026, 9, 24, 17, 5).getTime())).toMatch(/24/)
  })

  it('cx joins truthy class names only', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b')
  })
})

describe('scorePercent / readiness', () => {
  it('scorePercent handles empty quizzes', () => {
    expect(scorePercent({ correct: 0, total: 0 })).toBe(0)
    expect(scorePercent({ correct: 29, total: 30 })).toBe(97)
  })

  it('readiness is the share of official questions last answered correctly', () => {
    expect(readiness({ ...EMPTY_PROGRESS, lastResult: { a: 1, b: 0, c: 1 } }, ['a', 'b', 'c', 'd'])).toBe(0.5)
    expect(readiness(EMPTY_PROGRESS, [])).toBe(0)
  })
})
