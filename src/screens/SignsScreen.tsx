import type { CSSProperties } from 'react'
import { GroupGlyph } from '../components/ui/GroupGlyph'
import { Icon } from '../components/ui/Icon'
import { ProgressBar, ScorePill } from '../components/ui/Primitives'
import { Screen } from '../components/ui/Screen'
import { BANK, GROUP_TINT, SECTIONS, SIGN_BY_CODE, SIGNS, signsOf } from '../data'

const officialBySection = BANK.reduce((map, b) => (b.sectionId ? map.set(b.sectionId, (map.get(b.sectionId) ?? 0) + 1) : map), new Map<string, number>())
import { useProgress } from '../hooks/useProgress'
import { plural } from '../lib/format'
import { useNav } from '../nav/navigator'

export function SignsScreen() {
  const nav = useNav()
  const { progress } = useProgress()
  const studied = progress.signsStudied.filter((code) => SIGN_BY_CODE.has(code)).length

  return (
    <Screen title="Σήματα" subtitle="Κεφάλαιο 2 του επίσημου βιβλίου, με τις εικόνες και τις περιγραφές του βιβλίου.">
      <div className="signs-summary surface">
        <div>
          <p className="signs-summary__value">
            {studied}
            <span>/{SIGNS.length}</span>
          </p>
          <p className="signs-summary__label">σήματα μελετήθηκαν</p>
        </div>
        <ProgressBar value={SIGNS.length ? studied / SIGNS.length : 0} label="Σήματα που μελετήθηκαν" />
      </div>

      <ol className="list stagger" aria-label="Ενότητες">
        {SECTIONS.map((section, i) => {
          const count = signsOf(section).length
          const best = progress.sectionBest[section.id]
          return (
            <li key={section.id}>
              <button
                type="button"
                className="row surface"
                onClick={() => nav.push({ name: 'section', sectionId: section.id })}
                style={{ '--tint': GROUP_TINT[section.group] } as CSSProperties}
              >
                <GroupGlyph group={section.group} />
                <span className="row__body">
                  <span className="row__eyebrow">Ενότητα {i + 1}</span>
                  <span className="row__title">{section.title}</span>
                  <span className="row__subtitle">
                    {plural(count, 'εικόνα', 'εικόνες')} · {plural(officialBySection.get(section.id) ?? 0, 'επίσημη ερώτηση', 'επίσημες ερωτήσεις')}
                  </span>
                </span>
                <span className="row__trailing">
                  <ScorePill value={best} />
                  <Icon name="chevronRight" size={18} />
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {SECTIONS.length === 0 && <p className="empty">Δεν υπάρχουν ακόμα ενότητες.</p>}
    </Screen>
  )
}
