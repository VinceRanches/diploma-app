export type SignGroup =
  | 'danger'
  | 'priority'
  | 'prohibitory'
  | 'mandatory'
  | 'informative'
  | 'supplementary'
  | 'roadworks'
  | 'marking'
  | 'signal'
  | 'police'
  | 'other'

export type Difficulty = 1 | 2 | 3

/** A sign (or a figure for markings, lights and police signals) as printed in the official book. */
export interface Sign {
  readonly code: string
  readonly label: string
  readonly kind: 'sign' | 'figure'
  readonly slug: string
  readonly group: SignGroup
  readonly sectionId: string
  /** The book's caption, verbatim. */
  readonly name: string
  readonly shape: string
  readonly image: string | null
  readonly page: number
  readonly similar: readonly string[]
}

export interface SignSection {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly group: SignGroup
  readonly codes: readonly string[]
}

/** A question of the official exam bank (ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ 1, κατηγορία Β), text and picture verbatim. */
export interface BankQuestion {
  readonly id: string
  readonly group: number
  readonly chapter: string
  readonly number: number | null
  readonly q: string
  readonly options: readonly string[]
  readonly answer: number
  readonly image: string | null
  readonly sectionId?: string
  /** Shared by questions whose picture shows the same sign; a test never shows two of them. */
  readonly dup?: string
}

export interface Chapter {
  readonly id: string
  readonly title: string
  readonly count: number
}

/** Practice question written for a Part 2 lesson (not part of the official bank). */
export interface TheoryQuestion {
  readonly id: string
  readonly q: string
  readonly options: readonly string[]
  readonly answer: number
  readonly explain: string
  readonly difficulty: Difficulty
}

export type LessonModule = 'car' | 'driving' | 'rules'

export interface LessonSection {
  readonly heading: string
  readonly body: string
  readonly bullets?: readonly string[]
  readonly tip?: string
}

export interface Lesson {
  readonly id: string
  readonly module: LessonModule
  readonly title: string
  readonly icon: string
  readonly summary: string
  readonly sections: readonly LessonSection[]
  readonly quiz: readonly TheoryQuestion[]
}

export interface QuizOption {
  readonly id: string
  readonly label: string
}

export type QuestionKind = 'official' | 'lesson'

export interface Question {
  readonly id: string
  readonly kind: QuestionKind
  readonly prompt: string
  readonly image: string | null
  readonly options: readonly QuizOption[]
  readonly correctId: string
  readonly explain: string
  /** Where the question comes from, e.g. «Η σήμανση · ερώτηση 25». */
  readonly source: string
  readonly ref: string
}

export type Answers = Readonly<Record<string, string | null>>

export interface Mistake {
  readonly question: Question
  readonly chosenId: string | null
}

export interface QuizResult {
  readonly total: number
  readonly correct: number
  readonly mistakes: readonly Mistake[]
  readonly correctRefs: readonly string[]
  readonly passed: boolean | null
}

export interface ExamFormat {
  readonly questionCount: number
  readonly maxMistakes: number
  readonly minutes: number
}

export type QuizMode =
  | { readonly type: 'exam' }
  | { readonly type: 'chapter'; readonly chapterId: string }
  | { readonly type: 'section'; readonly sectionId: string }
  | { readonly type: 'difficulty'; readonly level: Difficulty }
  | { readonly type: 'lesson'; readonly lessonId: string }
  | { readonly type: 'review' }
