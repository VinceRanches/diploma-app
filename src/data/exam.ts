import type { ExamFormat } from '../lib/types'

/**
 * Category B theory exam, as defined in the exam database itself (Kateg 1: ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ 1, 35 minutes,
 * one question from each of 30 groups) and in ΥΑ 50984/7947/2013 άρθρο 22 (pass with at most 1 wrong answer).
 * Kept configurable: the Ministry may re-set these when the new exam system goes national.
 */
export const EXAM_FORMAT: ExamFormat = {
  questionCount: 30,
  maxMistakes: 1,
  minutes: 35,
}

export const PRACTICE_QUIZ_SIZE = 20
export const REVIEW_QUIZ_SIZE = 30
export const MASTERY = 0.9
