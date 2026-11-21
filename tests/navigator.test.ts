import { describe, expect, it } from 'vitest'
import { INITIAL_NAV, navReducer } from '../src/nav/navigator'

describe('navReducer', () => {
  it('pushes onto and pops from the active tab stack only', () => {
    const pushed = navReducer(INITIAL_NAV, { type: 'push', route: { name: 'section', sectionId: 's1' } })
    expect(pushed.stacks.home).toHaveLength(2)
    expect(pushed.stacks.signs).toHaveLength(1)
    expect(pushed.transition).toBe('push')
    const popped = navReducer(pushed, { type: 'pop' })
    expect(popped.stacks.home).toHaveLength(1)
    expect(popped.transition).toBe('pop')
  })

  it('never pops the root screen', () => {
    expect(navReducer(INITIAL_NAV, { type: 'pop' })).toBe(INITIAL_NAV)
  })

  it('switching tabs keeps each stack; tapping the active tab pops to its root', () => {
    const inSigns = navReducer(navReducer(INITIAL_NAV, { type: 'tab', tab: 'signs' }), {
      type: 'push',
      route: { name: 'section', sectionId: 's1' },
    })
    const away = navReducer(inSigns, { type: 'tab', tab: 'home' })
    expect(away.stacks.signs).toHaveLength(2)
    const back = navReducer(navReducer(away, { type: 'tab', tab: 'signs' }), { type: 'tab', tab: 'signs' })
    expect(back.stacks.signs).toHaveLength(1)
  })

  it('opens and closes the quiz modal without touching stacks', () => {
    const open = navReducer(INITIAL_NAV, { type: 'openQuiz', request: { mode: { type: 'exam' }, seed: 1, title: 'x' } })
    expect(open.modal?.seed).toBe(1)
    expect(open.stacks).toBe(INITIAL_NAV.stacks)
    expect(navReducer(open, { type: 'closeQuiz' }).modal).toBeNull()
  })
})
