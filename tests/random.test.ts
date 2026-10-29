import { describe, expect, it } from 'vitest'
import { createRng, sample, shuffle } from '../src/lib/random'

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('returns values in [0, 1)', () => {
    const rng = createRng(7)
    const values = Array.from({ length: 500 }, () => rng())
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
  })
})

describe('shuffle', () => {
  it('returns a new array with the same items and leaves the input untouched', () => {
    const input = [1, 2, 3, 4, 5, 6]
    const copy = [...input]
    const out = shuffle(input, createRng(1))
    expect(out).not.toBe(input)
    expect([...out].sort()).toEqual(copy)
    expect(input).toEqual(copy)
  })
})

describe('sample', () => {
  it('returns n unique items', () => {
    const out = sample([1, 2, 3, 4, 5, 6, 7, 8], 4, createRng(3))
    expect(out).toHaveLength(4)
    expect(new Set(out).size).toBe(4)
  })

  it('caps n at the pool size', () => {
    expect(sample([1, 2], 5, createRng(3))).toHaveLength(2)
  })
})
