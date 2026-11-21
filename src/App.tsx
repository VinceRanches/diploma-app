import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'
import { TabBar } from './components/ui/TabBar'
import { ProgressProvider } from './hooks/useProgress'
import { ThemeProvider } from './hooks/useTheme'
import { cx } from './lib/cx'
import { NavigatorProvider, TAB_IDS, useNav, type Route, type TabId, type Transition } from './nav/navigator'
import { DrivingScreen } from './screens/DrivingScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LessonScreen } from './screens/LessonScreen'
import { QuizScreen } from './screens/QuizScreen'
import { SectionScreen } from './screens/SectionScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SignsScreen } from './screens/SignsScreen'
import { TestsScreen } from './screens/TestsScreen'

function RouteView({ route }: { readonly route: Route }) {
  switch (route.name) {
    case 'home':
      return <HomeScreen />
    case 'signs':
      return <SignsScreen />
    case 'tests':
      return <TestsScreen />
    case 'driving':
      return <DrivingScreen />
    case 'settings':
      return <SettingsScreen />
    case 'section':
      return <SectionScreen sectionId={route.sectionId} />
    case 'lesson':
      return <LessonScreen lessonId={route.lessonId} />
  }
}

const routeKey = (route: Route, depth: number): string => {
  if (route.name === 'section') return `${depth}:section:${route.sectionId}`
  if (route.name === 'lesson') return `${depth}:lesson:${route.lessonId}`
  return `${depth}:${route.name}`
}

const ENTER_CLASS: Partial<Record<Transition, string>> = { push: 'enter-push', pop: 'enter-reveal', tab: 'enter-fade' }

/** Every tab keeps its own mounted stack, so scroll position survives tab switches and back navigation. */
function TabLayer({ tab }: { readonly tab: TabId }) {
  const { state } = useNav()
  const stack = state.stacks[tab]
  const isVisible = state.tab === tab && state.modal === null

  return (
    <div className={cx('tab-layer', !isVisible && 'tab-layer--hidden')} inert={!isVisible}>
      {stack.map((route, depth) => {
        const isTop = depth === stack.length - 1
        const enter = isTop && state.tab === tab ? ENTER_CLASS[state.transition] : undefined
        return (
          <div key={routeKey(route, depth)} className={cx('screen-host', !isTop && 'screen-host--covered', enter)} inert={!isTop}>
            <RouteView route={route} />
          </div>
        )
      })}
    </div>
  )
}

function useHardwareBack() {
  const { handleBack } = useNav()
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const listener = CapApp.addListener('backButton', () => {
        if (!handleBack()) CapApp.exitApp().catch((error: unknown) => console.warn('[back] exit failed', error))
      })
      return () => {
        listener.then((h) => h.remove()).catch((error: unknown) => console.warn('[back] cleanup failed', error))
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleBack])
}

function Shell() {
  const { state } = useNav()
  useHardwareBack()

  return (
    <div className="app">
      <div className="backdrop" aria-hidden="true" />
      {TAB_IDS.map((tab) => (
        <TabLayer key={tab} tab={tab} />
      ))}
      {state.modal && (
        <div key={state.modal.seed} className="modal-layer enter-modal">
          <QuizScreen request={state.modal} />
        </div>
      )}
      <TabBar isHidden={state.modal !== null} />
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <NavigatorProvider>
          <Shell />
        </NavigatorProvider>
      </ProgressProvider>
    </ThemeProvider>
  )
}
