import type { Difficulty } from './types'

export const pct = (value: number): number => Math.round(Math.max(0, Math.min(1, value)) * 100)

export function formatClock(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('el-GR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function greeting(date: Date = new Date()): string {
  return date.getHours() < 13 ? 'Καλημέρα' : 'Καλησπέρα'
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: 'Εύκολο', 2: 'Μέτριο', 3: 'Δύσκολο' }

export const OPTION_LETTERS = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'] as const

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export const mistakesLabel = (n: number): string => plural(n, 'λάθος', 'λάθη')
