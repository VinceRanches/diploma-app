import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import type { QuizMode } from '../lib/types'

export type TabId = 'home' | 'signs' | 'tests' | 'driving' | 'settings'
export const TAB_IDS: readonly TabId[] = ['home', 'signs', 'tests', 'driving', 'settings']

export interface QuizRequest {
  readonly mode: QuizMode
  readonly seed: number
  readonly title: string
  readonly refs?: readonly string[]
}

export type Route =
  | { readonly name: TabId }
  | { readonly name: 'section'; readonly sectionId: string }
  | { readonly name: 'lesson'; readonly lessonId: string }

export type Transition = 'push' | 'pop' | 'tab' | 'modal' | 'none'

export interface NavState {
  readonly tab: TabId
  readonly stacks: Readonly<Record<TabId, readonly Route[]>>
  readonly modal: QuizRequest | null
  readonly transition: Transition
}

export type NavAction =
  | { readonly type: 'push'; readonly route: Route }
  | { readonly type: 'pop' }
  | { readonly type: 'tab'; readonly tab: TabId }
  | { readonly type: 'openQuiz'; readonly request: QuizRequest }
  | { readonly type: 'closeQuiz' }

export const INITIAL_NAV: NavState = {
  tab: 'home',
  stacks: {
    home: [{ name: 'home' }],
    signs: [{ name: 'signs' }],
    tests: [{ name: 'tests' }],
    driving: [{ name: 'driving' }],
    settings: [{ name: 'settings' }],
  },
  modal: null,
  transition: 'none',
}

const withStack = (state: NavState, stack: readonly Route[], transition: Transition): NavState => ({
  ...state,
  stacks: { ...state.stacks, [state.tab]: stack },
  transition,
})

export function navReducer(state: NavState, action: NavAction): NavState {
  const stack = state.stacks[state.tab]
  switch (action.type) {
    case 'push':
      return withStack(state, [...stack, action.route], 'push')
    case 'pop':
      return stack.length <= 1 ? state : withStack(state, stack.slice(0, -1), 'pop')
    case 'tab':
      if (action.tab !== state.tab) return { ...state, tab: action.tab, transition: 'tab' }
      return stack.length <= 1 ? state : withStack(state, stack.slice(0, 1), 'pop')
    case 'openQuiz':
      return { ...state, modal: action.request, transition: 'modal' }
    case 'closeQuiz':
      return { ...state, modal: null, transition: 'none' }
  }
}

/** Returns true when it consumed the back gesture. */
export type BackHandler = () => boolean

interface NavContextValue {
  readonly state: NavState
  push(route: Route): void
  pop(): void
  setTab(tab: TabId): void
  openQuiz(request: QuizRequest): void
  closeQuiz(): void
  handleBack(): boolean
  registerBackHandler(handler: BackHandler): () => void
}

const NavContext = createContext<NavContextValue | null>(null)

export function NavigatorProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(navReducer, INITIAL_NAV)
  const stateRef = useRef(state)
  const handlers = useRef<readonly BackHandler[]>([])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const registerBackHandler = useCallback((handler: BackHandler) => {
    handlers.current = [...handlers.current, handler]
    return () => {
      handlers.current = handlers.current.filter((h) => h !== handler)
    }
  }, [])

  const handleBack = useCallback((): boolean => {
    const top = handlers.current[handlers.current.length - 1]
    if (top?.()) return true
    const s = stateRef.current
    if (s.modal) {
      dispatch({ type: 'closeQuiz' })
      return true
    }
    if (s.stacks[s.tab].length > 1) {
      dispatch({ type: 'pop' })
      return true
    }
    if (s.tab !== 'home') {
      dispatch({ type: 'tab', tab: 'home' })
      return true
    }
    return false
  }, [])

  const value = useMemo<NavContextValue>(
    () => ({
      state,
      push: (route) => dispatch({ type: 'push', route }),
      pop: () => dispatch({ type: 'pop' }),
      setTab: (tab) => dispatch({ type: 'tab', tab }),
      openQuiz: (request) => dispatch({ type: 'openQuiz', request }),
      closeQuiz: () => dispatch({ type: 'closeQuiz' }),
      handleBack,
      registerBackHandler,
    }),
    [state, handleBack, registerBackHandler],
  )

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used inside <NavigatorProvider>')
  return ctx
}

/** Intercepts the Android back button (and Escape on web) while `handler` is non-null. */
export function useBackHandler(handler: BackHandler | null): void {
  const { registerBackHandler } = useNav()
  const ref = useRef(handler)
  const active = handler !== null

  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => {
    if (!active) return undefined
    return registerBackHandler(() => ref.current?.() ?? false)
  }, [active, registerBackHandler])
}
