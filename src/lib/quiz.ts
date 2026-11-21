import { type Rng, shuffle } from './random'
import { foldGreek } from './text'
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

/**
 * What counts as «the same question» inside one test. Three keys, and a candidate is skipped when any one
 * of them is already taken:
 *   `sign:…` — the sign its picture shows, matched against the book (the `dup` field);
 *   `text:…` — its own content, the question text together with its picture;
 *   `number:…` — its place in the book, the chapter and the question number.
 * The text key is what the bank needs: the official questionnaire asks the same thing more than once with
 * a different set of answers (ΑΛΚΟΟΛ 24, 30 and 33 all read «Η κατανάλωση αλκοόλ μπορεί να προκαλέσει
 * κατά την οδήγηση:»). Each of those is a real exam question and stays in the bank, but one test shows
 * only one of them. The picture is part of that key on purpose: «Πώς ενεργείτε βλέποντας το σήμα αυτό:»
 * asks about a different sign each time, so those stay separate questions.
 * The number key catches a reworded revision of one question, which the text key cannot see — ΑΥΤΟΚΙΝΗΤΟΔΡΟΜΟΣ
 * 43 was once stored twice, as «συνιστάται» and «επιτρέπεται να χρησιμοποιείται». A chapter numbers each
 * question once, so on clean data this key merges nothing; it is what keeps a re-import from showing a
 * question twice before anyone reads the build warnings.
 */
const contentKeys = (b: BankQuestion): string[] => [
  `text:${foldGreek(b.q)}|${b.image ?? ''}`,
  // Only when the book numbers it: an unnumbered question shares nothing with another unnumbered one.
  ...(b.number === null ? [] : [`number:${b.chapter}#${b.number}`]),
]

const sameQuestionKeys = (b: BankQuestion): string[] => (b.dup ? [...contentKeys(b), `sign:${b.dup}`] : contentKeys(b))

type KeysOf = (b: BankQuestion) => string[]

/** Random questions from the pool, never two of the same question (see `sameQuestionKeys`). */
function sampleDistinct(pool: readonly BankQuestion[], count: number, rng: Rng, keysOf: KeysOf = sameQuestionKeys): BankQuestion[] {
  const used = new Set<string>()
  const picked: BankQuestion[] = []
  for (const b of shuffle(pool, rng)) {
    if (picked.length >= count) break
    const keys = keysOf(b)
    if (keys.some((key) => used.has(key))) continue
    for (const key of keys) used.add(key)
    picked.push(b)
  }
  return picked
}

/**
 * The real exam: one random question from every group of the official questionnaire, in group order.
 * A question already asked in an earlier group is skipped when that group has another one.
 */
export function buildOfficialExam(bank: readonly BankQuestion[], rng: Rng, groups: readonly number[], titleOf: TitleOf): Question[] {
  const used = new Set<string>()
  return groups.flatMap((group) => {
    const candidates = shuffle(
      bank.filter((b) => b.group === group),
      rng,
    )
    const pick = candidates.find((b) => sameQuestionKeys(b).every((key) => !used.has(key))) ?? candidates[0]
    if (!pick) return []
    for (const key of sameQuestionKeys(pick)) used.add(key)
    return [officialQuestion(pick, rng, titleOf)]
  })
}

const sampleQuestions = (pool: readonly BankQuestion[], count: number, rng: Rng, titleOf: TitleOf, keysOf?: KeysOf): Question[] =>
  sampleDistinct(pool, count, rng, keysOf).map((b) => officialQuestion(b, rng, titleOf))

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

/**
 * «Τα λάθη μου»: the questions answered wrong, each asked once even when two of them are one question.
 * Deduplicated on content only, never on the sign: two different questions about one sign are two
 * mistakes, and a mistake clears from the progress only when its own question is answered right
 * (`updateMistakes`), so hiding one here would leave it in the list for good.
 */
export function buildReviewQuiz(refs: readonly string[], bank: readonly BankQuestion[], rng: Rng, titleOf: TitleOf): Question[] {
  const byId = new Map(bank.map((b) => [b.id, b]))
  const rows = refs.flatMap((ref) => {
    const b = byId.get(ref)
    return b ? [b] : []
  })
  return sampleQuestions(rows, rows.length, rng, titleOf, contentKeys)
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
