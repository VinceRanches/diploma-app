import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXAM_FORMAT, PRACTICE_QUIZ_SIZE } from '../src/data/exam'
import { BANK, CHAPTERS, chapterTitle, EXAM_GROUPS, LESSONS, SECTIONS, SIGNS } from '../src/data/index'
import { buildChapterQuiz, buildDifficultyQuiz, buildOfficialExam, buildReviewQuiz, buildSectionQuiz } from '../src/lib/quiz'
import { createRng } from '../src/lib/random'
import { foldGreek } from '../src/lib/text'

/**
 * Guards the generated data itself, not a fixture: these are the duplicates a user meets in a test.
 * The official bank and the book signs are copyrighted and absent from a fresh clone (scripts/ensure-data.mjs
 * writes `[]`), so those suites skip — and say so with the sample size, because an empty sample is not a pass.
 */
const hasBank = BANK.length > 0
const hasSigns = SIGNS.length > 0

const groupBy = <T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> => {
  const out = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    out.set(k, [...(out.get(k) ?? []), item])
  }
  return out
}

const repeated = <T>(items: readonly T[], key: (item: T) => string): [string, T[]][] =>
  [...groupBy(items, key)].filter(([, list]) => list.length > 1)

describe('foldGreek', () => {
  it('folds diacritics and final sigma so the same words compare equal', () => {
    expect(foldGreek('ΝΤΟΜΆΤΑΣ')).toBe('ντοματασ')
    expect(foldGreek('ντομάτας')).toBe('ντοματασ')
  })

  it('ignores punctuation and spacing', () => {
    expect(foldGreek('  Πώς ενεργείτε;  ')).toBe(foldGreek('Πώς, ενεργείτε'))
  })
})

describe.skipIf(!hasBank)(`official bank (${BANK.length} questions)`, () => {
  it('numbers every question once inside its chapter', () => {
    const numbered = BANK.filter((b) => b.number !== null)
    expect(numbered.length).toBeGreaterThan(0)
    expect(repeated(numbered, (b) => `${b.chapter}#${b.number}`).map(([key, list]) => `${key}: ${list.map((b) => b.id).join(', ')}`)).toEqual([])
  })

  it('never asks one question twice: two rows on the same stem and picture answer differently', () => {
    // Sharing a stem is normal (ΑΛΚΟΟΛ 24, 30 and 33 do), and so is sharing a stem and a picture
    // (ΔΙΑΣΤΑΥΡΩΣΕΙΣ 9 and 10 both ask «Σε μια κυκλική διασταύρωση:» over one drawing). What would make
    // them one question stored twice is the same correct answer as well.
    const pictured = BANK.filter((b) => b.image !== null)
    expect(pictured.length).toBeGreaterThan(0)
    const sameAnswer = repeated(pictured, (b) => `${foldGreek(b.q)}|${b.image}`).filter(
      ([, list]) => new Set(list.map((b) => foldGreek(b.options[b.answer] ?? ''))).size < list.length,
    )
    expect(sameAnswer.map(([, list]) => list.map((b) => b.id).join(', '))).toEqual([])
  })

  it('gives every question a unique id, an answer in range and distinct options', () => {
    expect(repeated(BANK, (b) => b.id)).toEqual([])
    const broken = BANK.filter(
      (b) => b.options.length < 2 || b.answer < 0 || b.answer >= b.options.length || new Set(b.options.map(foldGreek)).size !== b.options.length,
    )
    expect(broken.map((b) => b.id)).toEqual([])
  })

  it('names each picture once: a drawing stored under two filenames would hide a repeat', () => {
    // scripts/build-data.mjs points every question at the first filename its picture content has, so two
    // questions over the same drawing compare equal and one test cannot ask both.
    const files = [...new Set(BANK.flatMap((b) => (b.image === null ? [] : [b.image])))]
    expect(files.length).toBeGreaterThan(0)
    const digests = new Map(
      files.map((image) => [image, createHash('sha256').update(readFileSync(join('public', image))).digest('hex')] as const),
    )
    const sharedContent = [...digests.entries()].filter(([image, digest]) =>
      [...digests.entries()].some(([other, otherDigest]) => other !== image && otherDigest === digest),
    )
    expect(sharedContent.map(([image]) => image)).toEqual([])
  })
})

describe.skipIf(!hasSigns)(`book signs (${SIGNS.length} entries)`, () => {
  it('lists every sign code and every picture once', () => {
    expect(repeated(SIGNS, (s) => s.code)).toEqual([])
    expect(repeated(SIGNS, (s) => s.image ?? '').map(([image]) => image)).toEqual([])
  })

  it('puts each sign in exactly one section and lists it once there', () => {
    const codes = new Set(SIGNS.map((s) => s.code))
    for (const section of SECTIONS) {
      expect(repeated(section.codes, (c) => c).map(([code]) => `${section.id}: ${code}`)).toEqual([])
      expect(section.codes.filter((c) => !codes.has(c))).toEqual([])
    }
    const placements = SECTIONS.flatMap((s) => s.codes)
    expect(repeated(placements, (c) => c).map(([code]) => code)).toEqual([])
  })

  it('never points a sign at itself or at a missing code in its look-alikes', () => {
    const codes = new Set(SIGNS.map((s) => s.code))
    const broken = SIGNS.filter((s) => s.similar.includes(s.code) || new Set(s.similar).size !== s.similar.length || s.similar.some((c) => !codes.has(c)))
    expect(broken.map((s) => s.code)).toEqual([])
  })

  it('names every chapter once', () => {
    expect(repeated(CHAPTERS, (c) => c.id)).toEqual([])
    expect(repeated(CHAPTERS, (c) => foldGreek(c.title)).map(([title]) => title)).toEqual([])
  })

  it('counts each chapter as many questions as the bank holds (the tests screen prints this)', () => {
    const wrong = CHAPTERS.filter((c) => c.count !== BANK.filter((b) => b.chapter === c.id).length)
    expect(wrong.map((c) => `${c.id}: says ${c.count}, bank has ${BANK.filter((b) => b.chapter === c.id).length}`)).toEqual([])
    expect(CHAPTERS.reduce((sum, c) => sum + c.count, 0)).toBe(BANK.length)
  })
})

describe(`part 2 lessons (${LESSONS.length} lessons)`, () => {
  const quiz = LESSONS.flatMap((lesson) => lesson.quiz.map((question) => ({ lesson: lesson.id, question })))

  it('has lessons with practice questions to check', () => {
    expect(LESSONS.length).toBeGreaterThan(0)
    expect(quiz.length).toBeGreaterThan(0)
  })

  it('asks each practice question in one lesson only', () => {
    expect(
      repeated(quiz, (q) => foldGreek(q.question.q)).map(([, list]) => list.map((q) => `${q.lesson}/${q.question.id}`).join(', ')),
    ).toEqual([])
  })

  it('gives every lesson and every practice question a unique id', () => {
    expect(repeated(LESSONS, (l) => l.id)).toEqual([])
    expect(repeated(quiz, (q) => q.question.id)).toEqual([])
    expect(quiz.filter((q) => q.question.id.endsWith('x')).map((q) => q.question.id)).toEqual([])
  })
})

describe.skipIf(!hasBank)(`every test built from the real bank (${BANK.length} questions)`, () => {
  const promptKey = (q: { prompt: string; image: string | null }): string => `${foldGreek(q.prompt)}|${q.image ?? ''}`
  const noRepeat = (questions: readonly { id: string; prompt: string; image: string | null; ref: string }[], where: string): void => {
    const twice = repeated(questions, promptKey)
    expect(`${where}: ${twice.map(([, list]) => list.map((q) => q.ref).join('+')).join(' / ')}`).toBe(`${where}: `)
    // One question id twice would make gradeQuiz count one answer twice and collide the React keys.
    expect(repeated(questions, (q) => q.id).map(([id]) => `${where}: ${id}`)).toEqual([])
  }

  it('asks each chapter practice question once', () => {
    const chapters = [...new Set(BANK.map((b) => b.chapter))]
    expect(chapters.length).toBeGreaterThan(0)
    for (const chapter of chapters) {
      for (let seed = 0; seed < 25; seed++) {
        noRepeat(buildChapterQuiz(chapter, BANK, createRng(seed), PRACTICE_QUIZ_SIZE, chapterTitle), `${chapter}/${seed}`)
      }
    }
  })

  it('asks each sign-section practice question once', () => {
    expect(SECTIONS.length).toBeGreaterThan(0)
    for (const section of SECTIONS) {
      for (let seed = 0; seed < 25; seed++) {
        noRepeat(buildSectionQuiz(section.id, BANK, createRng(seed), PRACTICE_QUIZ_SIZE, chapterTitle), `${section.id}/${seed}`)
      }
    }
  })

  it('asks each question of a difficulty test once', () => {
    for (const level of [1, 2, 3] as const) {
      for (let seed = 0; seed < 25; seed++) {
        noRepeat(buildDifficultyQuiz(level, BANK, createRng(seed), PRACTICE_QUIZ_SIZE, chapterTitle), `level ${level}/${seed}`)
      }
    }
  })

  it('asks each mistake of «Τα λάθη μου» once, even when two of them are one question', () => {
    // The worst case: every question in the bank answered wrong, so the review holds the whole bank.
    const everything = BANK.map((b) => b.id)
    for (let seed = 0; seed < 10; seed++) {
      noRepeat(buildReviewQuiz(everything, BANK, createRng(seed), chapterTitle), `review/${seed}`)
    }
    const refs = buildReviewQuiz(everything, BANK, createRng(1), chapterTitle).map((q) => q.ref)
    expect(refs.length).toBeGreaterThan(BANK.length - 40)
    expect(buildReviewQuiz(['nope', ...everything.slice(0, 5)], BANK, createRng(1), chapterTitle)).toHaveLength(5)
  })

  it('asks each question of the mock exam once, over 200 draws', () => {
    for (let seed = 0; seed < 200; seed++) {
      const exam = buildOfficialExam(BANK, createRng(seed), EXAM_GROUPS, chapterTitle)
      expect(exam).toHaveLength(EXAM_FORMAT.questionCount)
      noRepeat(exam, `exam/${seed}`)
      expect(new Set(exam.map((q) => q.ref)).size).toBe(exam.length)
    }
  })
})
