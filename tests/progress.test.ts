import { describe, expect, it } from 'vitest'
import {
  EMPTY_PROGRESS,
  loadProgress,
  markLessonRead,
  markSignStudied,
  mastered,
  recordQuiz,
  saveProgress,
  type KeyValueStorage,
} from '../src/lib/progress'
import type { QuizResult } from '../src/lib/types'

const result = (correct: number, total: number, mistakeRefs: string[], correctRefs: string[] = [], passed: boolean | null = null): QuizResult => ({
  total,
  correct,
  correctRefs,
  passed,
  mistakes: mistakeRefs.map((ref) => ({
    chosenId: null,
    question: {
      id: ref,
      kind: 'official',
      prompt: '',
      image: null,
      options: [],
      correctId: 'a',
      explain: '',
      source: '',
      ref,
    },
  })),
})

const memoryStorage = (initial: Record<string, string> = {}): KeyValueStorage => {
  const data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v
    },
  }
}

describe('recordQuiz', () => {
  it('keeps the best section score without mutating the input', () => {
    const first = recordQuiz(EMPTY_PROGRESS, { type: 'section', sectionId: 's1' }, result(8, 10, []), 1, 60)
    const worse = recordQuiz(first, { type: 'section', sectionId: 's1' }, result(5, 10, []), 2, 60)
    expect(first.sectionBest.s1).toBe(0.8)
    expect(worse.sectionBest.s1).toBe(0.8)
    expect(EMPTY_PROGRESS.sectionBest).toEqual({})
  })

  it('counts mistakes and clears them once answered correctly', () => {
    const p1 = recordQuiz(EMPTY_PROGRESS, { type: 'review' }, result(0, 2, ['K1', 'K2']), 1, 10)
    const p2 = recordQuiz(p1, { type: 'review' }, result(1, 2, ['K2'], ['K1']), 2, 10)
    expect(p1.mistakes).toEqual({ K1: 1, K2: 1 })
    expect(p2.mistakes).toEqual({ K2: 2 })
  })

  it('appends exam records, newest first, capped at 20', () => {
    let p = EMPTY_PROGRESS
    for (let i = 0; i < 25; i++) {
      p = recordQuiz(p, { type: 'exam' }, result(28, 30, [], [], true), i, 600)
    }
    expect(p.exams).toHaveLength(20)
    expect(p.exams[0].at).toBe(24)
    expect(p.exams[0]).toMatchObject({ correct: 28, total: 30, passed: true, durationSec: 600 })
  })
})

describe('lastResult / mastery', () => {
  it('remembers the latest outcome of every answered question', () => {
    const p1 = recordQuiz(EMPTY_PROGRESS, { type: 'exam' }, result(1, 2, ['b2'], ['b1'], false), 1, 10)
    expect(p1.lastResult).toEqual({ b1: 1, b2: 0 })
    const p2 = recordQuiz(p1, { type: 'review' }, result(1, 1, [], ['b2']), 2, 10)
    expect(p2.lastResult).toEqual({ b1: 1, b2: 1 })
    expect(mastered(p2, ['b1', 'b2', 'b3'])).toBe(2)
  })
})

describe('markLessonRead / markSignStudied', () => {
  it('are idempotent and immutable', () => {
    const p1 = markLessonRead(EMPTY_PROGRESS, 'l1')
    const p2 = markLessonRead(p1, 'l1')
    expect(p2.lessonsRead).toEqual(['l1'])
    expect(EMPTY_PROGRESS.lessonsRead).toEqual([])
    expect(markSignStudied(markSignStudied(EMPTY_PROGRESS, 'K1'), 'K1').signsStudied).toEqual(['K1'])
  })
})

describe('loadProgress / saveProgress', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage()
    const p = markLessonRead(EMPTY_PROGRESS, 'l1')
    expect(saveProgress(storage, p)).toBe(true)
    expect(loadProgress(storage)).toEqual(p)
  })

  it('falls back to empty progress on corrupt data or a throwing storage', () => {
    expect(loadProgress(memoryStorage({ 'diploma.progress.v1': '{oops' }))).toEqual(EMPTY_PROGRESS)
    const throwing: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadProgress(throwing)).toEqual(EMPTY_PROGRESS)
    expect(saveProgress(throwing, EMPTY_PROGRESS)).toBe(false)
  })

  it('fills missing fields from older saved shapes', () => {
    const storage = memoryStorage({ 'diploma.progress.v1': JSON.stringify({ lessonsRead: ['x'] }) })
    expect(loadProgress(storage)).toEqual({ ...EMPTY_PROGRESS, lessonsRead: ['x'] })
  })
})
