import type { IconName } from '../components/ui/Icon'
import type { BankQuestion, Chapter, Lesson, LessonModule, Sign, SignGroup, SignSection } from '../lib/types'
import bankJson from './bank.json'
import chaptersJson from './chapters.json'
import lessonsJson from './lessons.json'
import sectionsJson from './sections.json'
import signsJson from './signs.json'

// Generated and validated by scripts/official/*.py and scripts/build-data.mjs.
/** Signs and figures exactly as printed in the official book. */
export const SIGNS = signsJson as unknown as readonly Sign[]
export const SECTIONS = sectionsJson as unknown as readonly SignSection[]
/** The official exam question bank (ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ 1, κατηγορία Β), text and pictures as in the exam. */
export const BANK = bankJson as unknown as readonly BankQuestion[]
export const CHAPTERS = chaptersJson as unknown as readonly Chapter[]
export const LESSONS = lessonsJson as unknown as readonly Lesson[]

export const SIGN_BY_CODE: ReadonlyMap<string, Sign> = new Map(SIGNS.map((s) => [s.code, s]))
export const SECTION_BY_ID: ReadonlyMap<string, SignSection> = new Map(SECTIONS.map((s) => [s.id, s]))
export const CHAPTER_BY_ID: ReadonlyMap<string, Chapter> = new Map(CHAPTERS.map((c) => [c.id, c]))
export const LESSON_BY_ID: ReadonlyMap<string, Lesson> = new Map(LESSONS.map((l) => [l.id, l]))
export const BANK_BY_ID: ReadonlyMap<string, BankQuestion> = new Map(BANK.map((b) => [b.id, b]))
export const BANK_IDS: ReadonlySet<string> = new Set(BANK_BY_ID.keys())

/** The questionnaire draws one question from each of these groups (Numbs table of the exam database). */
export const EXAM_GROUPS: readonly number[] = Array.from({ length: 30 }, (_, i) => i + 1)

export const chapterTitle = (id: string): string => CHAPTER_BY_ID.get(id)?.title ?? id

export const bankIdsOf = (filter: (b: BankQuestion) => boolean): string[] => BANK.filter(filter).map((b) => b.id)

export const signsOf = (section: SignSection): Sign[] =>
  section.codes.flatMap((code) => {
    const sign = SIGN_BY_CODE.get(code)
    return sign ? [sign] : []
  })

export interface ModuleInfo {
  readonly id: LessonModule
  readonly title: string
  readonly subtitle: string
  readonly icon: IconName
  readonly tint: string
}

export const MODULES: readonly ModuleInfo[] = [
  { id: 'car', title: 'Γνώρισε το αυτοκίνητο', subtitle: 'Χειριστήρια, ενδείξεις, έλεγχοι, συντήρηση', icon: 'car', tint: 'var(--c-indigo)' },
  { id: 'driving', title: 'Πώς οδηγώ', subtitle: 'Τεχνική οδήγησης βήμα-βήμα και πρακτική εξέταση', icon: 'steering', tint: 'var(--c-teal)' },
  { id: 'rules', title: 'Κανόνες Κ.Ο.Κ.', subtitle: 'Όρια ταχύτητας, προτεραιότητα, αλκοόλ, πρόστιμα', icon: 'law', tint: 'var(--c-orange)' },
]

export const lessonsOf = (module: LessonModule): Lesson[] => LESSONS.filter((l) => l.module === module)

export const GROUP_LABEL: Record<SignGroup, string> = {
  danger: 'Πινακίδα κινδύνου',
  priority: 'Πινακίδα προτεραιότητας',
  prohibitory: 'Απαγορευτική πινακίδα',
  mandatory: 'Υποχρεωτική πινακίδα',
  informative: 'Πληροφοριακή πινακίδα',
  supplementary: 'Πρόσθετη πινακίδα',
  roadworks: 'Σήμανση έργων',
  marking: 'Οριζόντια σήμανση',
  signal: 'Φωτεινή σηματοδότηση',
  police: 'Σήμα τροχονόμου',
  other: 'Σήμα',
}

export const GROUP_TINT: Record<SignGroup, string> = {
  danger: 'var(--c-red)',
  priority: 'var(--c-red)',
  prohibitory: 'var(--c-red)',
  mandatory: 'var(--c-blue)',
  informative: 'var(--c-blue)',
  supplementary: 'var(--c-indigo)',
  roadworks: 'var(--c-orange)',
  marking: 'var(--c-teal)',
  signal: 'var(--c-green)',
  police: 'var(--c-indigo)',
  other: 'var(--c-purple)',
}
