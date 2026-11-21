import { cx } from '../../lib/cx'
import { tapHaptic } from '../../lib/haptics'
import { useNav, type TabId } from '../../nav/navigator'
import { Icon, type IconName } from './Icon'

const TABS: readonly { readonly id: TabId; readonly label: string; readonly icon: IconName }[] = [
  { id: 'home', label: 'Αρχική', icon: 'home' },
  { id: 'signs', label: 'Σήματα', icon: 'signs' },
  { id: 'tests', label: 'Τεστ', icon: 'tests' },
  { id: 'driving', label: 'Οδήγηση', icon: 'steering' },
  { id: 'settings', label: 'Ρυθμίσεις', icon: 'settings' },
]

type Props = { readonly isHidden: boolean }

export function TabBar({ isHidden }: Props) {
  const nav = useNav()
  const index = TABS.findIndex((t) => t.id === nav.state.tab)

  const handleSelect = (tab: TabId) => {
    tapHaptic()
    nav.setTab(tab)
  }

  return (
    <nav className={cx('tabbar glass', isHidden && 'tabbar--hidden')} aria-label="Κύρια πλοήγηση" inert={isHidden}>
      <span className="tabbar__lens" aria-hidden="true" style={{ transform: `translateX(${index * 100}%)` }} />
      {TABS.map((t) => {
        const isActive = t.id === nav.state.tab
        return (
          <button
            key={t.id}
            type="button"
            className={cx('tabbar__item', isActive && 'is-active')}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => handleSelect(t.id)}
          >
            <Icon name={t.icon} size={24} strokeWidth={isActive ? 2.1 : 1.8} />
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
