import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { NavigatorProvider, useBackHandler, useNav } from '../src/nav/navigator'

const wrapper = ({ children }: { children: ReactNode }) => <NavigatorProvider>{children}</NavigatorProvider>

describe('Android back button handling', () => {
  it('pops pushed screens, then returns to Home, then lets the app exit', () => {
    const { result } = renderHook(() => useNav(), { wrapper })
    act(() => result.current.setTab('signs'))
    act(() => result.current.push({ name: 'section', sectionId: 's1' }))

    let handled = false
    act(() => {
      handled = result.current.handleBack()
    })
    expect(handled).toBe(true)
    expect(result.current.state.stacks.signs).toHaveLength(1)

    act(() => {
      handled = result.current.handleBack()
    })
    expect(handled).toBe(true)
    expect(result.current.state.tab).toBe('home')

    act(() => {
      handled = result.current.handleBack()
    })
    expect(handled).toBe(false)
  })

  it('closes an open quiz first', () => {
    const { result } = renderHook(() => useNav(), { wrapper })
    act(() => result.current.openQuiz({ mode: { type: 'exam' }, seed: 1, title: 'x' }))
    act(() => {
      result.current.handleBack()
    })
    expect(result.current.state.modal).toBeNull()
    act(() => result.current.openQuiz({ mode: { type: 'exam' }, seed: 2, title: 'x' }))
    act(() => result.current.closeQuiz())
    expect(result.current.state.modal).toBeNull()
  })

  it('lets the newest registered handler intercept back (e.g. an open sheet)', () => {
    let calls = 0
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) => {
        useBackHandler(
          active
            ? () => {
                calls += 1
                return true
              }
            : null,
        )
        return useNav()
      },
      { wrapper, initialProps: { active: true } },
    )
    act(() => result.current.push({ name: 'lesson', lessonId: 'l1' }))

    act(() => {
      result.current.handleBack()
    })
    expect(calls).toBe(1)
    expect(result.current.state.stacks.home).toHaveLength(2)

    rerender({ active: false })
    act(() => {
      result.current.handleBack()
    })
    expect(calls).toBe(1)
    expect(result.current.state.stacks.home).toHaveLength(1)
    act(() => result.current.pop())
    expect(result.current.state.stacks.home).toHaveLength(1)
  })

  it('throws a clear error outside the provider', () => {
    expect(() => renderHook(() => useNav())).toThrow(/NavigatorProvider/)
  })
})
