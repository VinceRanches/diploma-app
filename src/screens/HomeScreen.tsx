import type { CSSProperties } from 'react'
import { Icon } from '../components/ui/Icon'
import { IconTile, ProgressRing, SignImage } from '../components/ui/Primitives'
import { Screen } from '../components/ui/Screen'
import { BANK, bankIdsOf, CHAPTERS, LESSON_BY_ID, LESSONS, SIGNS } from '../data'
import { EXAM_FORMAT, MASTERY } from '../data/exam'
import { chapterRequest, examRequest, mistakeRefs, reviewRequest } from '../data/quizzes'
import { useProgress } from '../hooks/useProgress'
import { greeting, mistakesLabel, pct } from '../lib/format'
import { mastered, readiness } from '../lib/progress'
import type { Sign } from '../lib/types'
import { useNav } from '../nav/navigator'
import { ExamHistoryRow } from './TestsScreen'

const DAY_MS = 86_400_000
const ALL_IDS = BANK.map((b) => b.id)

function signOfTheDay(signs: readonly Sign[], now: number): Sign | undefined {
  const plates = signs.filter((s) => s.kind === 'sign' && s.image)
  return plates.length ? plates[Math.floor(now / DAY_MS) % plates.length] : undefined
}

function readinessTitle(value: number): string {
  if (value >= MASTERY) return 'Είσαι έτοιμος για εξετάσεις'
  if (value >= 0.6) return 'Πολύ καλή πορεία'
  if (value > 0) return 'Συνέχισε έτσι'
  return 'Ξεκίνα από το πρώτο κεφάλαιο'
}

export function HomeScreen() {
  const nav = useNav()
  const { progress } = useProgress()

  const ready = readiness(progress, ALL_IDS)
  const correctCount = mastered(progress, ALL_IDS)
  const nextChapter =
    CHAPTERS.find((c) => readiness(progress, bankIdsOf((b) => b.chapter === c.id)) < MASTERY) ?? CHAPTERS[0]
  const reviewRefs = mistakeRefs(progress.mistakes)
  const lessonsDone = progress.lessonsRead.filter((id) => LESSON_BY_ID.has(id)).length
  const daily = signOfTheDay(SIGNS, Date.now())
  const lastExam = progress.exams[0]

  const openSection = (sectionId: string) => {
    nav.setTab('signs')
    nav.push({ name: 'section', sectionId })
  }

  return (
    <Screen title="Δίπλωμα" subtitle={`${greeting()}! Συνέχισε από εκεί που σταμάτησες.`}>
      <div className="stagger">
        <section className="hero glass glass--tint" style={{ '--tint': 'var(--c-blue)' } as CSSProperties} aria-label="Ετοιμότητα">
          <ProgressRing value={ready} size={96} stroke={9} tint="#fff" track="rgba(255, 255, 255, 0.24)">
            <strong className="hero__pct">{pct(ready)}%</strong>
          </ProgressRing>
          <div className="hero__body">
            <p className="hero__eyebrow">Ετοιμότητα</p>
            <h2 className="hero__title">{readinessTitle(ready)}</h2>
            <p className="hero__meta">
              {correctCount} από {ALL_IDS.length} επίσημες ερωτήσεις σωστές
            </p>
          </div>
          {nextChapter && (
            <button type="button" className="btn btn--on-tint btn--block hero__action" onClick={() => nav.openQuiz(chapterRequest(nextChapter))}>
              <Icon name="play" size={18} />
              <span className="hero__action-label">Εξάσκηση · {nextChapter.title}</span>
            </button>
          )}
        </section>

        <div className="bento">
          <button type="button" className="tile tile--wide surface" onClick={() => nav.openQuiz(examRequest())}>
            <IconTile icon="exam" tint="var(--c-blue)" size="lg" />
            <div className="tile__body">
              <h3 className="tile__title">Προσομοίωση εξέτασης</h3>
              <p className="tile__meta">
                {EXAM_FORMAT.questionCount} επίσημες ερωτήσεις · {EXAM_FORMAT.minutes}′ · έως {mistakesLabel(EXAM_FORMAT.maxMistakes)}
              </p>
            </div>
            <Icon name="chevronRight" className="tile__chev" />
          </button>
          <button type="button" className="tile surface" onClick={() => nav.setTab('signs')}>
            <IconTile icon="signs" tint="var(--c-red)" />
            <div>
              <h3 className="tile__title">Σήματα</h3>
              <p className="tile__meta">Από το επίσημο βιβλίο</p>
            </div>
          </button>
          <button type="button" className="tile surface" onClick={() => nav.setTab('tests')}>
            <IconTile icon="book" tint="var(--c-purple)" />
            <div>
              <h3 className="tile__title">Κεφάλαια</h3>
              <p className="tile__meta">{CHAPTERS.length} κεφάλαια του βιβλίου</p>
            </div>
          </button>
          <button
            type="button"
            className="tile surface"
            disabled={reviewRefs.length === 0}
            onClick={() => nav.openQuiz(reviewRequest(reviewRefs))}
          >
            <IconTile icon="refresh" tint="var(--c-orange)" />
            <div>
              <h3 className="tile__title">Τα λάθη μου</h3>
              <p className="tile__meta">{reviewRefs.length ? `${reviewRefs.length} για επανάληψη` : 'Κανένα ακόμα'}</p>
            </div>
          </button>
          <button type="button" className="tile surface" onClick={() => nav.setTab('driving')}>
            <IconTile icon="steering" tint="var(--c-teal)" />
            <div>
              <h3 className="tile__title">Οδήγηση</h3>
              <p className="tile__meta">
                {lessonsDone}/{LESSONS.length} μαθήματα
              </p>
            </div>
          </button>
        </div>

        {daily && (
          <section aria-labelledby="daily-title">
            <h2 className="group-title" id="daily-title">
              Σήμα της ημέρας
            </h2>
            <button type="button" className="daily surface" onClick={() => openSection(daily.sectionId)}>
              <SignImage sign={daily} className="daily__plate" />
              <div className="daily__body">
                <span className="code-chip">{daily.label}</span>
                <p className="daily__name">{daily.name}</p>
                <p className="daily__text">Βιβλίο, σελ. {daily.page}</p>
              </div>
            </button>
          </section>
        )}

        {lastExam && (
          <section aria-labelledby="last-exam-title">
            <h2 className="group-title" id="last-exam-title">
              Τελευταία προσομοίωση
            </h2>
            <ExamHistoryRow record={lastExam} />
          </section>
        )}
      </div>
    </Screen>
  )
}
