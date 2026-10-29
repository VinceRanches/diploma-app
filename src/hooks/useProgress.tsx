import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { EMPTY_PROGRESS, loadProgress, saveProgress, type KeyValueStorage, type Progress } from '../lib/progress'

// Accessing localStorage can throw (blocked storage); loadProgress/saveProgress catch it.
const storage: KeyValueStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
}

interface ProgressContextValue {
  readonly progress: Progress
  update(fn: (p: Progress) => Progress): void
  reset(): void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { readonly children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress(storage))

  useEffect(() => {
    saveProgress(storage, progress)
  }, [progress])

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress(fn), [])
  const reset = useCallback(() => setProgress(EMPTY_PROGRESS), [])

  const value = useMemo(() => ({ progress, update, reset }), [progress, update, reset])
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
