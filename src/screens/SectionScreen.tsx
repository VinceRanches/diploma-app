import { useRef, useState, type TouchEvent } from 'react'
import { Icon } from '../components/ui/Icon'
import { SignImage, Stat } from '../components/ui/Primitives'
import { Screen } from '../components/ui/Screen'
import { Sheet } from '../components/ui/Sheet'
import { BANK, GROUP_LABEL, SECTION_BY_ID, SIGN_BY_CODE, signsOf } from '../data'
import { PRACTICE_QUIZ_SIZE } from '../data/exam'
import { sectionRequest } from '../data/quizzes'
import { useProgress } from '../hooks/useProgress'
import { cx } from '../lib/cx'
import { pct, plural } from '../lib/format'
import { tapHaptic } from '../lib/haptics'
import { markSignStudied } from '../lib/progress'
import type { Sign } from '../lib/types'
import { useNav } from '../nav/navigator'

const SWIPE_PX = 50

type Props = { readonly sectionId: string }

export function SectionScreen({ sectionId }: Props) {
  const nav = useNav()
  const { progress, update } = useProgress()
  const [selected, setSelected] = useState<Sign | null>(null)
  const section = SECTION_BY_ID.get(sectionId)

  if (!section) {
    return (
      <Screen title="Ενότητα" hasBack>
        <p className="empty">Η ενότητα δεν βρέθηκε.</p>
      </Screen>
    )
  }

  const signs = signsOf(section)
  const best = progress.sectionBest[section.id]
  const studied = signs.filter((s) => progress.signsStudied.includes(s.code)).length
  const sectionQuestions = BANK.filter((b) => b.sectionId === section.id)
  // Questions showing the same sign count once: a test never asks the same sign twice.
  const testLength = Math.min(PRACTICE_QUIZ_SIZE, new Set(sectionQuestions.map((b) => b.dup ?? b.id)).size)
  const startTest = () => nav.openQuiz(sectionRequest(section))

  const handleOpen = (sign: Sign) => {
    setSelected(sign)
    update((p) => markSignStudied(p, sign.code))
  }

  const testButton = (
    <button type="button" className="btn btn--primary floating-bar__main" disabled={testLength === 0} onClick={startTest}>
      <Icon name="play" size={18} />
      Τεστ ενότητας
    </button>
  )

  return (
    <Screen title={section.title} subtitle={section.subtitle} hasBack floating={testButton}>
      <div className="section-card glass">
        <div className="stats">
          <Stat value={`${signs.length}`} label={section.group === 'marking' || section.group === 'signal' || section.group === 'police' ? 'εικόνες' : 'σήματα'} />
          <Stat value={`${studied}`} label="μελετήθηκαν" />
          <Stat value={best === undefined ? '—' : `${pct(best)}%`} label="καλύτερο τεστ" />
        </div>
        <button type="button" className="btn btn--primary btn--block" disabled={testLength === 0} onClick={startTest}>
          <Icon name="play" size={18} />
          {testLength === 0 ? 'Χωρίς επίσημες ερωτήσεις ενότητας' : `Επίσημο τεστ · ${plural(testLength, 'ερώτηση', 'ερωτήσεις')}`}
        </button>
      </div>

      <ul className={cx('sign-grid', signs.some((s) => s.kind === 'figure') && 'sign-grid--photos')} aria-label="Σήματα ενότητας">
        {signs.map((sign) => (
          <li key={sign.code}>
            <button type="button" className="sign-tile surface" onClick={() => handleOpen(sign)}>
              <SignImage sign={sign} />
              <span className="sign-tile__meta">
                <span className="code-chip">{sign.label}</span>
                {progress.signsStudied.includes(sign.code) && <Icon name="check" size={16} className="sign-tile__seen" strokeWidth={2.6} />}
              </span>
              <span className="sign-tile__name">{sign.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <SignSheet sign={selected} signs={signs} onClose={() => setSelected(null)} onSelect={handleOpen} />
    </Screen>
  )
}

type SheetProps = {
  readonly sign: Sign | null
  readonly signs: readonly Sign[]
  readonly onClose: () => void
  readonly onSelect: (sign: Sign) => void
}

function SignSheet({ sign, signs, onClose, onSelect }: SheetProps) {
  const touchStartX = useRef<number | null>(null)
  const index = sign ? signs.findIndex((s) => s.code === sign.code) : -1
  const prev = index > 0 ? signs[index - 1] : null
  const next = index >= 0 && index < signs.length - 1 ? signs[index + 1] : null
  const similar = (sign?.similar ?? []).flatMap((code) => {
    const s = SIGN_BY_CODE.get(code)
    return s ? [s] : []
  })

  const go = (target: Sign | null) => {
    if (!target) return
    tapHaptic()
    onSelect(target)
  }

  // Swipe left/right on the picture to move through the section.
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  const handleTouchEnd = (e: TouchEvent) => {
    const start = touchStartX.current
    const end = e.changedTouches[0]?.clientX
    touchStartX.current = null
    if (start === null || end === undefined || Math.abs(end - start) < SWIPE_PX) return
    go(end < start ? next : prev)
  }

  return (
    <Sheet isOpen={sign !== null} onClose={onClose} label={sign?.name ?? 'Σήμα'}>
      {sign && (
        <div className="sign-detail" key={sign.code}>
          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <SignImage sign={sign} className="sign-detail__plate" eager />
          </div>
          <div className="sign-detail__meta">
            <span className="code-chip">{sign.label}</span>
            <span className="sign-detail__group">
              {GROUP_LABEL[sign.group]} · βιβλίο σελ. {sign.page}
            </span>
          </div>
          <h2 className="sign-detail__name selectable">{sign.name}</h2>
          {similar.length > 0 && (
            <>
              <h3 className="sign-detail__sub">Μην το μπερδέψεις με</h3>
              <div className="similar-row">
                {similar.map((s) => (
                  <button type="button" key={s.code} className={cx('similar-chip surface')} onClick={() => onSelect(s)}>
                    <SignImage sign={s} />
                    <span className="code-chip">{s.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {index >= 0 && (
            <div className="sheet-nav">
              <button type="button" className="btn btn--glass sheet-nav__btn" disabled={!prev} onClick={() => go(prev)} aria-label="Προηγούμενο σήμα">
                <Icon name="chevronLeft" size={20} strokeWidth={2.4} />
                Προηγούμενο
              </button>
              <span className="sheet-nav__count" aria-live="polite">
                {index + 1} / {signs.length}
              </span>
              <button type="button" className="btn btn--primary sheet-nav__btn" disabled={!next} onClick={() => go(next)} aria-label="Επόμενο σήμα">
                Επόμενο
                <Icon name="chevronRight" size={20} strokeWidth={2.4} />
              </button>
            </div>
          )}
          <button type="button" className="btn btn--glass btn--block" onClick={onClose}>
            Κλείσιμο
          </button>
        </div>
      )}
    </Sheet>
  )
}
