import type { Answers, Question, QuizResult } from './types'

export interface PassRule {
  readonly maxMistakes: number
}

export function gradeQuiz(questions: readonly Question[], answers: Answers, rule?: PassRule): QuizResult {
  const isRight = (q: Question): boolean => answers[q.id] === q.correctId
  const mistakes = questions.filter((q) => !isRight(q)).map((q) => ({ question: q, chosenId: answers[q.id] ?? null }))
  const correctRefs = questions.filter(isRight).map((q) => q.ref)
  return {
    total: questions.length,
    correct: correctRefs.length,
    mistakes,
    correctRefs,
    passed: rule ? mistakes.length <= rule.maxMistakes : null,
  }
}

export function scorePercent(result: Pick<QuizResult, 'correct' | 'total'>): number {
  return result.total === 0 ? 0 : Math.round((result.correct / result.total) * 100)
}
