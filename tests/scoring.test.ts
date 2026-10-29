import { describe, expect, it } from 'vitest'
import { gradeQuiz } from '../src/lib/scoring'
import type { Question } from '../src/lib/types'

const q = (id: string, correctId = 'a'): Question => ({
  id,
  kind: 'official',
  prompt: `prompt ${id}`,
  image: null,
  options: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ],
  correctId,
  explain: '',
  source: '',
  ref: `ref-${id}`,
})

describe('gradeQuiz', () => {
  const questions = [q('1'), q('2'), q('3', 'b'), q('4')]

  it('counts correct answers and lists mistakes with what was chosen', () => {
    const result = gradeQuiz(questions, { '1': 'a', '2': 'b', '3': 'b' })
    expect(result.total).toBe(4)
    expect(result.correct).toBe(2)
    expect(result.mistakes.map((m) => [m.question.id, m.chosenId])).toEqual([
      ['2', 'b'],
      ['4', null],
    ])
    expect(result.correctRefs).toEqual(['ref-1', 'ref-3'])
    expect(result.passed).toBeNull()
  })

  it('passes when mistakes stay within the allowed maximum', () => {
    expect(gradeQuiz(questions, { '1': 'a', '2': 'a', '3': 'b' }, { maxMistakes: 1 }).passed).toBe(true)
    expect(gradeQuiz(questions, { '1': 'a', '3': 'b' }, { maxMistakes: 1 }).passed).toBe(false)
  })
})
