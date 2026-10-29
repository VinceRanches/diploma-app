import { type Rng, shuffle } from './random'
import type { BankQuestion, Difficulty, Question, QuizOption, TheoryQuestion } from './types'

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f'] as const
const LONG_TEXT = 220

/** Resolves a chapter id (e.g. «ΣΗΜΑΝΣΗ») to the book's chapter title. */
export type TitleOf = (chapterId: string) => string

const optionId = (index: number): string => OPTION_IDS[index] ?? `o${index}`

function shuffledOptions(labels: readonly string[], answer: number, rng: Rng): { options: QuizOption[]; correctId: string } {
  const order = shuffle(
    labels.map((label, index) => ({ label, index })),
    rng,
  )
  return {
    options: order.map((o, i) => ({ id: optionId(i), label: o.label })),
    correctId: optionId(order.findIndex((o) => o.index === answer)),
  }
}

/** Official question as shown in the exam: same text and picture, answers in random order. */
export function officialQuestion(b: BankQuestion, rng: Rng, titleOf: TitleOf): Question {
  const { options, correctId } = shuffledOptions(b.options, b.answer, rng)
  const title = titleOf(b.chapter)
  return {
    id: `official:${b.id}`,
    kind: 'official',
    prompt: b.q,
    image: b.image,
    options,
    correctId,
    explain: '',
    source: b.number === null ? title : `${title} · ερώτηση ${b.number}`,
    ref: b.id,
  }
}

const dupKey = (b: BankQuestion): string => b.dup ?? b.id

/** Random questions from the pool, at most one per sign (questions sharing a `dup` key). */
function sampleDistinct(pool: readonly BankQuestion[], count: number, rng: Rng): BankQuestion[] {
  const used = new Set<string>()
  return shuffle(pool, rng).filter((b) => {
    if (used.size >= count || used.has(dupKey(b))) return false
    used.add(dupKey(b))
    return true
  })
}

/**
 * The real exam: one random question from every group of the official questionnaire, in group order.
 * A sign already asked in an earlier group is skipped when that group has another question.
 */
export function buildOfficialExam(bank: readonly BankQuestion[], rng: Rng, groups: readonly number[], titleOf: TitleOf): Question[] {
  const used = new Set<string>()
  return groups.flatMap((group) => {
    const candidates = shuffle(
      bank.filter((b) => b.group === group),
      rng,
    )
    const pick = candidates.find((b) => !used.has(dupKey(b))) ?? candidates[0]
    if (!pick) return []
    used.add(dupKey(pick))
    return [officialQuestion(pick, rng, titleOf)]
  })
}

const sampleQuestions = (pool: readonly BankQuestion[], count: number, rng: Rng, titleOf: TitleOf): Question[] =>
  sampleDistinct(pool, count, rng).map((b) => officialQuestion(b, rng, titleOf))

export function buildChapterQuiz(chapterId: string, bank: readonly BankQuestion[], rng: Rng, count: number, titleOf: TitleOf): Question[] {
  return sampleQuestions(
    bank.filter((b) => b.chapter === chapterId),
    count,
    rng,
    titleOf,
  )
}

export function buildSectionQuiz(sectionId: string, bank: readonly BankQuestion[], rng: Rng, count: number, titleOf: TitleOf): Question[] {
  return sampleQuestions(
    bank.filter((b) => b.sectionId === sectionId),
    count,
    rng,
    titleOf,
  )
}

/**
 * The bank has no official difficulty, so this is the app's estimate: yes/no and two-option questions are easy,
 * long questions and picture scenarios outside the signs chapter are hard, the rest medium.
 */
export function bankDifficulty(b: BankQuestion): Difficulty {
  if (b.options.length <= 2) return 1
  const length = b.q.length + b.options.reduce((sum, o) => sum + o.length, 0)
  const scenario = b.image !== null && b.chapter !== 'ΣΗΜΑΝΣΗ'
  return length > LONG_TEXT || scenario ? 3 : 2
}

export function buildDifficultyQuiz(level: Difficulty, bank: readonly BankQuestion[], rng: Rng, count: number, titleOf: TitleOf): Question[] {
  return sampleQuestions(
    bank.filter((b) => bankDifficulty(b) === level),
    count,
    rng,
    titleOf,
  )
}

export function buildReviewQuiz(refs: readonly string[], bank: readonly BankQuestion[], rng: Rng, titleOf: TitleOf): Question[] {
  const byId = new Map(bank.map((b) => [b.id, b]))
  const questions = refs.flatMap((ref) => {
    const b = byId.get(ref)
    return b ? [officialQuestion(b, rng, titleOf)] : []
  })
  return shuffle(questions, rng)
}

/** Part 2 lesson practice (not official): keeps the lesson's own explanation. */
export function buildLessonQuiz(theory: readonly TheoryQuestion[], rng: Rng): Question[] {
  return shuffle(theory, rng).map((t) => {
    const { options, correctId } = shuffledOptions(t.options, t.answer, rng)
    return {
      id: `lesson:${t.id}`,
      kind: 'lesson',
      prompt: t.q,
      image: null,
      options,
      correctId,
      explain: t.explain,
      source: '',
      ref: t.id,
    }
  })
}
