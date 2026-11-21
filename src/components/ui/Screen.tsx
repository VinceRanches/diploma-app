import { useRef, useState, type ReactNode, type UIEvent } from 'react'
import { cx } from '../../lib/cx'
import { useNav } from '../../nav/navigator'
import { Icon } from './Icon'

const COLLAPSE_AT = 40
const FLOATING_AT = 360

type Props = {
  readonly title: string
  readonly subtitle?: string
  readonly hasBack?: boolean
  readonly trailing?: ReactNode
  /** Actions shown in a floating bar (next to a "back to top" button) once the page is scrolled down. */
  readonly floating?: ReactNode
  readonly children: ReactNode
}

/** iOS-style page: large title that hands over to a glass nav bar once you scroll. */
export function Screen({ title, subtitle, hasBack = false, trailing, floating, children }: Props) {
  const nav = useNav()
  const scrollRef = useRef<HTMLElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isFar, setIsFar] = useState(false)

  const handleScroll = (e: UIEvent<HTMLElement>) => {
    const top = e.currentTarget.scrollTop
    setIsScrolled(top > COLLAPSE_AT)
    setIsFar(top > FLOATING_AT)
  }

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="screen">
      <header className={cx('navbar', isScrolled && 'navbar--scrolled')}>
        <div className="navbar__side">
          {hasBack && (
            <button type="button" className="nav-circle" onClick={nav.pop} aria-label="Πίσω">
              <Icon name="chevronLeft" size={22} strokeWidth={2.4} />
            </button>
          )}
        </div>
        <div className="navbar__title" aria-hidden={!isScrolled}>
          {title}
        </div>
        <div className="navbar__side navbar__side--end">{trailing}</div>
      </header>
      <section className="screen__scroll" ref={scrollRef} onScroll={handleScroll} aria-label={title}>
        <div className="screen__content">
          <h1 className="large-title">{title}</h1>
          {subtitle && <p className="large-subtitle">{subtitle}</p>}
          {children}
        </div>
      </section>
      {floating !== undefined && (
        <div className={cx('floating-bar', isFar && 'floating-bar--visible')} inert={!isFar}>
          <button type="button" className="nav-circle nav-circle--lg" onClick={scrollToTop} aria-label="Στην αρχή της σελίδας">
            <Icon name="arrowUp" size={22} strokeWidth={2.4} />
          </button>
          {floating}
        </div>
      )}
    </div>
  )
}
