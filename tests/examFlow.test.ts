import { describe, expect, it } from 'vitest'
import { nextUnanswered } from '../src/lib/examFlow'

const IDS = ['q1', 'q2', 'q3', 'q4']

describe('nextUnanswered', () => {
  it('moves to the next question that has no answer', () => {
    expect(nextUnanswered(IDS, {}, 0)).toBe(1)
    expect(nextUnanswered(IDS, { q2: 'a' }, 0)).toBe(2)
  })

  it('wraps around to skipped questions after the last one', () => {
    expect(nextUnanswered(IDS, { q2: 'a', q3: 'b', q4: 'c' }, 3)).toBe(0)
  })

  it('stays on the only question left unanswered', () => {
    expect(nextUnanswered(IDS, { q1: 'a', q2: 'a', q4: 'c' }, 2)).toBe(2)
  })

  it('returns -1 once every question is answered', () => {
    expect(nextUnanswered(IDS, { q1: 'a', q2: 'a', q3: 'b', q4: 'c' }, 1)).toBe(-1)
  })
})
