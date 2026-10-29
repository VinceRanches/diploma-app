import { DIFFICULTY_LABEL } from '../lib/format'
import { buildChapterQuiz, buildDifficultyQuiz, buildLessonQuiz, buildOfficialExam, buildReviewQuiz, buildSectionQuiz } from '../lib/quiz'
import { createRng, newSeed } from '../lib/random'
import type { Chapter, Difficulty, Lesson, Question, SignSection } from '../lib/types'
import type { QuizRequest } from '../nav/navigator'
import { PRACTICE_QUIZ_SIZE, REVIEW_QUIZ_SIZE } from './exam'
import { BANK, BANK_IDS, chapterTitle, EXAM_GROUPS, LESSON_BY_ID } from './index'

export function buildQuestions(request: QuizRequest): Question[] {
  const rng = createRng(request.seed)
  const mode = request.mode
  switch (mode.type) {
    case 'exam':
      return buildOfficialExam(BANK, rng, EXAM_GROUPS, chapterTitle)
    case 'chapter':
      return buildChapterQuiz(mode.chapterId, BANK, rng, PRACTICE_QUIZ_SIZE, chapterTitle)
    case 'section':
      return buildSectionQuiz(mode.sectionId, BANK, rng, PRACTICE_QUIZ_SIZE, chapterTitle)
    case 'difficulty':
      return buildDifficultyQuiz(mode.level, BANK, rng, PRACTICE_QUIZ_SIZE, chapterTitle)
    case 'review':
      return buildReviewQuiz(request.refs ?? [], BANK, rng, chapterTitle)
    case 'lesson':
      return buildLessonQuiz(LESSON_BY_ID.get(mode.lessonId)?.quiz ?? [], rng)
  }
}

export const examRequest = (): QuizRequest => ({ mode: { type: 'exam' }, seed: newSeed(), title: 'Προσομοίωση εξέτασης' })

export const chapterRequest = (chapter: Chapter): QuizRequest => ({
  mode: { type: 'chapter', chapterId: chapter.id },
  seed: newSeed(),
  title: chapter.title,
})

export const sectionRequest = (section: SignSection): QuizRequest => ({
  mode: { type: 'section', sectionId: section.id },
  seed: newSeed(),
  title: section.title,
})

export const difficultyRequest = (level: Difficulty): QuizRequest => ({
  mode: { type: 'difficulty', level },
  seed: newSeed(),
  title: `Τεστ · ${DIFFICULTY_LABEL[level]}`,
})

export const lessonRequest = (lesson: Lesson): QuizRequest => ({
  mode: { type: 'lesson', lessonId: lesson.id },
  seed: newSeed(),
  title: lesson.title,
})

export const reviewRequest = (refs: readonly string[], title = 'Τα λάθη μου'): QuizRequest => ({
  mode: { type: 'review' },
  seed: newSeed(),
  title,
  refs,
})

/** Official questions answered wrong, most-missed first. */
export const mistakeRefs = (mistakes: Readonly<Record<string, number>>): string[] =>
  Object.entries(mistakes)
    .filter(([ref]) => BANK_IDS.has(ref))
    .sort((a, b) => b[1] - a[1])
    .slice(0, REVIEW_QUIZ_SIZE)
    .map(([ref]) => ref)
