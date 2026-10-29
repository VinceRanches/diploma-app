import type { BankQuestion, TheoryQuestion } from '../src/lib/types'

export const makeBank = (id: string, group: number, overrides: Partial<BankQuestion> = {}): BankQuestion => ({
  id,
  group,
  chapter: 'ΣΗΜΑΝΣΗ',
  number: Number(id.replace(/\D/g, '')) || 1,
  q: `question ${id}`,
  options: [`${id} right`, `${id} wrong a`, `${id} wrong b`],
  answer: 0,
  image: null,
  ...overrides,
})

/** Three questions in each of the groups 1..30, plus two outside the exam groups. */
export const BANK: readonly BankQuestion[] = [
  ...Array.from({ length: 30 }, (_, g) =>
    [0, 1, 2].map((i) => makeBank(`b${g + 1}-${i}`, g + 1, { chapter: g < 10 ? 'ΣΗΜΑΝΣΗ' : 'ΤΑΧΥΤΗΤΑ' })),
  ).flat(),
  makeBank('b200-0', 200, { chapter: 'ΑΛΚΟΟΛ' }),
  makeBank('b201-0', 201, { chapter: 'ΑΛΚΟΟΛ' }),
]

export const makeTheory = (id: string, difficulty: 1 | 2 | 3 = 1): TheoryQuestion => ({
  id,
  q: `question ${id}`,
  options: [`${id} right`, `${id} wrong a`, `${id} wrong b`],
  answer: 0,
  explain: `because ${id}`,
  difficulty,
})
