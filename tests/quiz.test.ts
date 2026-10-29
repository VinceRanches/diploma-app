import { describe, expect, it } from 'vitest'
import { createRng } from '../src/lib/random'
import {
  bankDifficulty,
  buildChapterQuiz,
  buildDifficultyQuiz,
  buildLessonQuiz,
  buildOfficialExam,
  buildReviewQuiz,
  buildSectionQuiz,
  officialQuestion,
} from '../src/lib/quiz'
import { BANK, makeBank, makeTheory } from './fixtures'

const GROUPS = Array.from({ length: 30 }, (_, i) => i + 1)
const titleOf = (id: string) => (id === 'ΣΗΜΑΝΣΗ' ? 'Η σήμανση' : id)

describe('officialQuestion', () => {
  it('keeps the official text verbatim, shuffles the answers and still marks the right one', () => {
    const b = makeBank('b7', 3, { image: 'bank/C001.webp', number: 25 })
    const q = officialQuestion(b, createRng(4), titleOf)
    expect(q.prompt).toBe(b.q)
    expect(q.image).toBe('bank/C001.webp')
    expect(q.kind).toBe('official')
    expect(q.ref).toBe('b7')
    expect([...q.options.map((o) => o.label)].sort()).toEqual([...b.options].sort())
    expect(q.options.find((o) => o.id === q.correctId)?.label).toBe(b.options[b.answer])
    expect(q.source).toBe('Η σήμανση · ερώτηση 25')
  })
})

describe('buildOfficialExam', () => {
  it('draws exactly one question from each official group, in group order', () => {
    const exam = buildOfficialExam(BANK, createRng(9), GROUPS, titleOf)
    expect(exam).toHaveLength(30)
    const groups = exam.map((q) => BANK.find((b) => b.id === q.ref)?.group)
    expect(groups).toEqual(GROUPS)
  })

  it('never uses questions outside the exam groups', () => {
    for (let seed = 0; seed < 20; seed++) {
      const refs = buildOfficialExam(BANK, createRng(seed), GROUPS, titleOf).map((q) => q.ref)
      expect(refs).not.toContain('b200-0')
      expect(refs).not.toContain('b201-0')
    }
  })

  it('varies between seeds but is reproducible for the same seed', () => {
    const a = buildOfficialExam(BANK, createRng(1), GROUPS, titleOf).map((q) => q.ref)
    const b = buildOfficialExam(BANK, createRng(1), GROUPS, titleOf).map((q) => q.ref)
    const c = buildOfficialExam(BANK, createRng(2), GROUPS, titleOf).map((q) => q.ref)
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })
})

describe('buildChapterQuiz / buildSectionQuiz', () => {
  it('only uses questions of the chapter, each once, capped at count', () => {
    const quiz = buildChapterQuiz('ΤΑΧΥΤΗΤΑ', BANK, createRng(3), 20, titleOf)
    expect(quiz).toHaveLength(20)
    expect(new Set(quiz.map((q) => q.ref)).size).toBe(20)
    expect(quiz.every((q) => BANK.find((b) => b.id === q.ref)?.chapter === 'ΤΑΧΥΤΗΤΑ')).toBe(true)
  })

  it('section quizzes use the questions linked to that section', () => {
    const bank = [makeBank('s1', 3, { sectionId: 'kindynou' }), makeBank('s2', 3, { sectionId: 'kindynou' }), makeBank('s3', 4)]
    const quiz = buildSectionQuiz('kindynou', bank, createRng(1), 20, titleOf)
    expect(quiz.map((q) => q.ref).sort()).toEqual(['s1', 's2'])
  })
})

describe('questions showing the same sign (dup)', () => {
  const pairs = [
    makeBank('p1', 6, { sectionId: 'apagoreyseis', dup: 'sign:Ρ-46' }),
    makeBank('p2', 7, { sectionId: 'apagoreyseis', dup: 'sign:Ρ-46' }),
    makeBank('p3', 6, { sectionId: 'apagoreyseis', dup: 'sign:Ρ-64' }),
    makeBank('p4', 201, { sectionId: 'apagoreyseis', dup: 'sign:Ρ-64' }),
    makeBank('p5', 8, { sectionId: 'apagoreyseis' }),
  ]

  it('a practice test never shows two questions of the same sign', () => {
    for (let seed = 0; seed < 30; seed++) {
      const quiz = buildSectionQuiz('apagoreyseis', pairs, createRng(seed), 20, titleOf)
      const keys = quiz.map((q) => pairs.find((b) => b.id === q.ref)?.dup ?? q.ref)
      expect(new Set(keys).size).toBe(keys.length)
      expect(quiz).toHaveLength(3)
    }
  })

  it('every question of a pair still gets its turn across attempts', () => {
    const seen = new Set<string>()
    for (let seed = 0; seed < 40; seed++) buildSectionQuiz('apagoreyseis', pairs, createRng(seed), 20, titleOf).forEach((q) => seen.add(q.ref))
    expect([...seen].sort()).toEqual(['p1', 'p2', 'p3', 'p4', 'p5'])
  })

  it('the mock exam avoids repeating a sign across groups when another question is available', () => {
    const bank = [
      makeBank('a1', 1, { dup: 'sign:X' }),
      makeBank('a2', 2, { dup: 'sign:X' }),
      makeBank('a3', 2),
    ]
    for (let seed = 0; seed < 30; seed++) {
      const refs = buildOfficialExam(bank, createRng(seed), [1, 2], titleOf).map((q) => q.ref)
      expect(refs).toEqual(['a1', 'a3'])
    }
  })
})

describe('bankDifficulty / buildDifficultyQuiz', () => {
  it('rates two-option questions easy, long or scenario-picture questions hard', () => {
    expect(bankDifficulty(makeBank('d1', 1, { options: ['ΝΑΙ', 'ΟΧΙ'] }))).toBe(1)
    expect(bankDifficulty(makeBank('d2', 1))).toBe(2)
    expect(bankDifficulty(makeBank('d3', 1, { chapter: 'ΔΙΑΣΤΑΥΡΩΣΕΙΣ', image: 'bank/D002.webp' }))).toBe(3)
    expect(bankDifficulty(makeBank('d4', 1, { q: 'x'.repeat(260) }))).toBe(3)
  })

  it('only picks questions of the requested level', () => {
    const bank = [...BANK, makeBank('e1', 5, { options: ['ΝΑΙ', 'ΟΧΙ'] }), makeBank('e2', 6, { options: ['ΝΑΙ', 'ΟΧΙ'] })]
    const quiz = buildDifficultyQuiz(1, bank, createRng(2), 20, titleOf)
    expect(quiz.map((q) => q.ref).sort()).toEqual(['e1', 'e2'])
  })
})

describe('buildReviewQuiz', () => {
  it('rebuilds the official questions for the given refs and ignores unknown ones', () => {
    const quiz = buildReviewQuiz(['b1-0', 'b30-2', 'nope'], BANK, createRng(1), titleOf)
    expect(quiz.map((q) => q.ref).sort()).toEqual(['b1-0', 'b30-2'])
  })
})

describe('buildLessonQuiz', () => {
  it('turns lesson practice questions into shuffled questions with their explanation', () => {
    const quiz = buildLessonQuiz([makeTheory('t1'), makeTheory('t2')], createRng(5))
    expect(quiz).toHaveLength(2)
    const q = quiz.find((x) => x.ref === 't1')
    expect(q?.kind).toBe('lesson')
    expect(q?.explain).toBe('because t1')
    expect(q?.options.find((o) => o.id === q.correctId)?.label).toBe('t1 right')
  })
})
