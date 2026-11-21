import type { Answers } from './types'

/**
 * Exam-room navigation (Μ.Σ.Θ.Ε.Υ.Ο.): after answering or skipping, go to the next unanswered question,
 * wrapping back to the skipped ones after the last. Returns -1 when everything is answered.
 */
export function nextUnanswered(ids: readonly string[], answers: Answers, from: number): number {
  for (let step = 1; step <= ids.length; step++) {
    const i = (from + step) % ids.length
    if (!answers[ids[i]]) return i
  }
  return -1
}
