import type { CSSProperties } from 'react'
import { Icon } from '../components/ui/Icon'
import { ScorePill } from '../components/ui/Primitives'
import { Screen } from '../components/ui/Screen'
import { BANK, bankIdsOf, CHAPTERS } from '../data'
import { EXAM_FORMAT } from '../data/exam'
import { chapterRequest, difficultyRequest, examRequest, mistakeRefs, reviewRequest } from '../data/quizzes'
import { useProgress } from '../hooks/useProgress'
import { cx } from '../lib/cx'
import { DIFFICULTY_LABEL, formatClock, formatDate, mistakesLabel, plural } from '../lib/format'
import { readiness, type ExamRecord } from '../lib/progress'
import { bankDifficulty } from '../lib/quiz'
import type { Difficulty } from '../lib/types'
import { useNav } from '../nav/navigator'

const LEVELS: readonly { readonly level: Difficulty; readonly tint: string; readonly text: string }[] = [
  { level: 1, tint: 'var(--c-green)', text: 'Ερωτήσεις με δύο επιλογές (π.χ. ΝΑΙ / ΟΧΙ)' },
  { level: 2, tint: 'var(--c-orange)', text: 'Σύντομες ερωτήσεις με τρεις επιλογές' },
  { level: 3, tint: 'var(--c-red)', text: 'Μεγάλες ερωτήσεις και σενάρια με εικόνα' },
]

const LEVEL_COUNT: Record<Difficulty, number> = {
  1: BANK.filter((b) => bankDifficulty(b) === 1).length,
  2: BANK.filter((b) => bankDifficulty(b) === 2).length,
  3: BANK.filter((b) => bankDifficulty(b) === 3).length,
}

export function ExamHistoryRow({ record }: { readonly record: ExamRecord }) {
  return (
    <div className="history-row surface">
      <div>
        <p className="history-row__score">
          {record.correct}/{record.total}
        </p>
        <p className="history-row__meta">
          {formatDate(record.at)} · {formatClock(record.durationSec)}
        </p>
      </div>
      <span className={cx('verdict', record.passed ? 'verdict--pass' : 'verdict--fail')}>{record.passed ? 'Επιτυχία' : 'Αποτυχία'}</span>
    </div>
  )
}

export function TestsScreen() {
  const nav = useNav()
  const { progress } = useProgress()
  const reviewRefs = mistakeRefs(progress.mistakes)

  return (
    <Screen title="Τεστ" subtitle={`Μόνο επίσημες ερωτήσεις — ${BANK.length} από την τράπεζα θεμάτων της εξέτασης.`}>
      <div className="stagger">
        <section className="exam-hero glass glass--tint" style={{ '--tint': 'var(--c-indigo)' } as CSSProperties} aria-label="Προσομοίωση">
          <div className="exam-hero__head">
            <Icon name="exam" size={30} />
            <h2 className="exam-hero__title">Προσομοίωση εξέτασης</h2>
          </div>
          <p className="exam-hero__text">
            Όπως στην αίθουσα εξετάσεων: μία ερώτηση από κάθε μία από τις 30 ομάδες του Ερωτηματολογίου, με τις επίσημες εικόνες. Η απάντηση
            καταχωρείται αμέσως και όσες παραλείψεις έρχονται ξανά στο τέλος.
          </p>
          <div className="chips">
            <span className="chip">{EXAM_FORMAT.questionCount} ερωτήσεις</span>
            <span className="chip">{EXAM_FORMAT.minutes} λεπτά</span>
            <span className="chip">έως {mistakesLabel(EXAM_FORMAT.maxMistakes)}</span>
          </div>
          <button type="button" className="btn btn--on-tint btn--block" onClick={() => nav.openQuiz(examRequest())}>
            <Icon name="play" size={18} /> Έναρξη
          </button>
        </section>

        <h2 className="group-title">Επανάληψη</h2>
        <button type="button" className="row surface" disabled={reviewRefs.length === 0} onClick={() => nav.openQuiz(reviewRequest(reviewRefs))}>
          <span className="icon-tile" style={{ '--tint': 'var(--c-orange)' } as CSSProperties}>
            <Icon name="refresh" size={21} strokeWidth={2} />
          </span>
          <span className="row__body">
            <span className="row__title">Τα λάθη μου</span>
            <span className="row__subtitle">
              {reviewRefs.length ? `${plural(reviewRefs.length, 'ερώτηση', 'ερωτήσεις')} που απάντησες λάθος` : 'Όταν κάνεις λάθη, θα εμφανίζονται εδώ'}
            </span>
          </span>
          <span className="row__trailing">
            <Icon name="chevronRight" size={18} />
          </span>
        </button>

        <h2 className="group-title">
          Κεφάλαια του βιβλίου
          <span className="group-title__meta">20 τυχαίες</span>
        </h2>
        <ol className="list">
          {CHAPTERS.map((chapter, i) => {
            const done = readiness(progress, bankIdsOf((b) => b.chapter === chapter.id))
            return (
              <li key={chapter.id}>
                <button type="button" className="row row--compact surface" onClick={() => nav.openQuiz(chapterRequest(chapter))}>
                  <span className="chapter-num">{i + 1}</span>
                  <span className="row__body">
                    <span className="row__title">{chapter.title}</span>
                    <span className="row__subtitle">{plural(chapter.count, 'ερώτηση', 'ερωτήσεις')}</span>
                  </span>
                  <span className="row__trailing">
                    <ScorePill value={done > 0 ? done : undefined} />
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <h2 className="group-title">
          Ανά δυσκολία
          <span className="group-title__meta">εκτίμηση της εφαρμογής</span>
        </h2>
        <div className="diff-grid">
          {LEVELS.map(({ level, tint, text }) => (
            <button
              type="button"
              key={level}
              className="diff surface"
              style={{ '--tint': tint } as CSSProperties}
              onClick={() => nav.openQuiz(difficultyRequest(level))}
            >
              <span className="diff__dots" aria-hidden="true">
                {[1, 2, 3].map((d) => (
                  <span key={d} className={cx('diff__dot', d <= level && 'is-on')} />
                ))}
              </span>
              <span className="diff__title">{DIFFICULTY_LABEL[level]}</span>
              <span className="diff__text">{text}</span>
              <span className="diff__count">{LEVEL_COUNT[level]} ερωτήσεις</span>
            </button>
          ))}
        </div>

        {progress.exams.length > 0 && (
          <>
            <h2 className="group-title">
              Ιστορικό εξετάσεων
              <span className="group-title__meta">
                {progress.exams.filter((e) => e.passed).length}/{progress.exams.length} επιτυχίες
              </span>
            </h2>
            <div className="list">
              {progress.exams.map((record) => (
                <ExamHistoryRow key={record.at} record={record} />
              ))}
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
