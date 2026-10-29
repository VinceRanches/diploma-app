import type { QuizMode, QuizResult } from './types'

export const STORAGE_KEY = 'diploma.progress.v1'
const MAX_EXAMS = 20

export interface ExamRecord {
  readonly at: number
  readonly correct: number
  readonly total: number
  readonly passed: boolean
  readonly durationSec: number
}

export interface Progress {
  readonly sectionBest: Readonly<Record<string, number>>
  readonly lessonsRead: readonly string[]
  readonly signsStudied: readonly string[]
  readonly mistakes: Readonly<Record<string, number>>
  readonly exams: readonly ExamRecord[]
  /** Latest outcome per question ref: 1 = answered correctly, 0 = wrong or left unanswered. */
  readonly lastResult: Readonly<Record<string, number>>
}

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const EMPTY_PROGRESS: Progress = Object.freeze({
  sectionBest: Object.freeze({}),
  lessonsRead: Object.freeze([]),
  signsStudied: Object.freeze([]),
  mistakes: Object.freeze({}),
  exams: Object.freeze([]),
  lastResult: Object.freeze({}),
})

function updateMistakes(current: Progress['mistakes'], result: QuizResult): Record<string, number> {
  const cleared = new Set(result.correctRefs)
  const counts = result.mistakes.reduce<Record<string, number>>((acc, m) => {
    const ref = m.question.ref
    return { ...acc, [ref]: (acc[ref] ?? current[ref] ?? 0) + 1 }
  }, {})
  const kept = Object.entries(current).filter(([ref]) => !cleared.has(ref) && !(ref in counts))
  return Object.fromEntries([...kept, ...Object.entries(counts)])
}

export function recordQuiz(p: Progress, mode: QuizMode, result: QuizResult, at: number, durationSec: number): Progress {
  const pct = result.total === 0 ? 0 : result.correct / result.total
  const sectionBest =
    mode.type === 'section'
      ? { ...p.sectionBest, [mode.sectionId]: Math.max(p.sectionBest[mode.sectionId] ?? 0, pct) }
      : p.sectionBest
  const exams =
    mode.type === 'exam'
      ? [
          { at, correct: result.correct, total: result.total, passed: result.passed ?? false, durationSec },
          ...p.exams,
        ].slice(0, MAX_EXAMS)
      : p.exams
  const lastResult = {
    ...p.lastResult,
    ...Object.fromEntries(result.mistakes.map((m) => [m.question.ref, 0])),
    ...Object.fromEntries(result.correctRefs.map((ref) => [ref, 1])),
  }
  return { ...p, sectionBest, exams, lastResult, mistakes: updateMistakes(p.mistakes, result) }
}

const addUnique = (list: readonly string[], item: string): readonly string[] =>
  list.includes(item) ? list : [...list, item]

export function markLessonRead(p: Progress, lessonId: string): Progress {
  const lessonsRead = addUnique(p.lessonsRead, lessonId)
  return lessonsRead === p.lessonsRead ? p : { ...p, lessonsRead }
}

export function markSignStudied(p: Progress, code: string): Progress {
  const signsStudied = addUnique(p.signsStudied, code)
  return signsStudied === p.signsStudied ? p : { ...p, signsStudied }
}

/** How many of the given question refs were last answered correctly. */
export function mastered(p: Progress, refs: readonly string[]): number {
  return refs.reduce((n, ref) => n + (p.lastResult[ref] === 1 ? 1 : 0), 0)
}

/** Share (0..1) of the given questions last answered correctly. */
export function readiness(p: Progress, refs: readonly string[]): number {
  return refs.length === 0 ? 0 : mastered(p, refs) / refs.length
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNumberRecord = (v: unknown): v is Record<string, number> =>
  isObject(v) && Object.values(v).every((x) => typeof x === 'number' && Number.isFinite(x))
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isExamRecord = (v: unknown): v is ExamRecord =>
  isObject(v) &&
  typeof v.at === 'number' &&
  typeof v.correct === 'number' &&
  typeof v.total === 'number' &&
  typeof v.passed === 'boolean' &&
  typeof v.durationSec === 'number'

function normalize(raw: unknown): Progress {
  if (!isObject(raw)) return EMPTY_PROGRESS
  return {
    sectionBest: isNumberRecord(raw.sectionBest) ? raw.sectionBest : EMPTY_PROGRESS.sectionBest,
    lessonsRead: isStringArray(raw.lessonsRead) ? raw.lessonsRead : EMPTY_PROGRESS.lessonsRead,
    signsStudied: isStringArray(raw.signsStudied) ? raw.signsStudied : EMPTY_PROGRESS.signsStudied,
    mistakes: isNumberRecord(raw.mistakes) ? raw.mistakes : EMPTY_PROGRESS.mistakes,
    exams: Array.isArray(raw.exams) ? raw.exams.filter(isExamRecord).slice(0, MAX_EXAMS) : EMPTY_PROGRESS.exams,
    lastResult: isNumberRecord(raw.lastResult) ? raw.lastResult : EMPTY_PROGRESS.lastResult,
  }
}

export function loadProgress(storage: KeyValueStorage): Progress {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return raw ? normalize(JSON.parse(raw)) : EMPTY_PROGRESS
  } catch (error) {
    console.warn('[progress] could not load saved progress, starting fresh', error)
    return EMPTY_PROGRESS
  }
}

export function saveProgress(storage: KeyValueStorage, p: Progress): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(p))
    return true
  } catch (error) {
    console.warn('[progress] could not save progress', error)
    return false
  }
}
