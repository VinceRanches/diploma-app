import type { CSSProperties } from 'react'
import { Icon } from '../ui/Icon'
import { ProgressRing, Stat } from '../ui/Primitives'
import { cx } from '../../lib/cx'
import { formatClock, mistakesLabel, OPTION_LETTERS } from '../../lib/format'
import { scorePercent } from '../../lib/scoring'
import type { Answers, Question, QuizResult } from '../../lib/types'

type Props = {
  readonly result: QuizResult
  readonly questions: readonly Question[]
  readonly answers: Answers
  readonly durationSec: number
  readonly maxMistakes: number | null
}

function headline(result: QuizResult): string {
  if (result.passed === true) return 'Επιτυχία!'
  if (result.passed === false) return 'Αποτυχία'
  const score = scorePercent(result)
  if (score === 100) return 'Τέλεια!'
  if (score >= 80) return 'Πολύ καλά!'
  if (score >= 50) return 'Καλή προσπάθεια'
  return 'Χρειάζεται επανάληψη'
}

export function QuizResults({ result, questions, answers, durationSec, maxMistakes }: Props) {
  const score = scorePercent(result)
  const isExam = result.passed !== null
  const tint = result.passed === false || score < 50 ? 'var(--c-red)' : score < 80 ? 'var(--c-orange)' : 'var(--c-green)'
  const shown = isExam ? questions : result.mistakes.map((m) => m.question)

  return (
    <div className="results stagger">
      <section className="results-hero glass" style={{ '--tint': tint } as CSSProperties} aria-label="Αποτέλεσμα">
        <ProgressRing value={score / 100} size={132} stroke={12} tint={tint}>
          <strong className="results-hero__pct">
            {result.correct}/{result.total}
          </strong>
        </ProgressRing>
        <h2 className="results-hero__title">{headline(result)}</h2>
        {isExam && (
          <span className={cx('verdict verdict--lg', result.passed ? 'verdict--pass' : 'verdict--fail')}>
            {result.passed ? 'ΕΠΙΤΥΧΩΝ — θα περνούσες την εξέταση' : `ΑΠΟΤΥΧΩΝ — πάνω από ${mistakesLabel(maxMistakes ?? 0)}`}
          </span>
        )}
        <div className="stats">
          <Stat value={`${result.correct}`} label="σωστές" />
          <Stat value={`${result.mistakes.length}`} label="λάθη" />
          <Stat value={formatClock(durationSec)} label="χρόνος" />
        </div>
      </section>

      {shown.length === 0 ? (
        <p className="results__perfect">
          <Icon name="trophy" size={22} /> Καμία λάθος απάντηση — μπράβο!
        </p>
      ) : (
        <>
          <h2 className="group-title">
            {isExam ? 'Αναλυτικά αποτελέσματα' : 'Τα λάθη σου'}
            <span className="group-title__meta">{isExam ? 'όπως στο πρακτικό της εξέτασης' : 'με τη σωστή απάντηση'}</span>
          </h2>
          <ol className="list">
            {shown.map((q) => (
              <li key={q.id}>
                <AnswerCard question={q} chosenId={answers[q.id] ?? null} index={questions.indexOf(q) + 1} />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

function optionLine(q: Question, id: string | null): string | null {
  const index = q.options.findIndex((o) => o.id === id)
  if (index < 0) return null
  return `${OPTION_LETTERS[index] ?? index + 1}. ${q.options[index].label}`
}

function AnswerLine({ tone, title, text }: { tone: 'wrong' | 'right'; title: string; text: string | null }) {
  return (
    <div className={cx('answer-line', `answer-line--${tone}`)}>
      <span className="answer-line__icon" aria-hidden="true">
        <Icon name={tone === 'right' ? 'check' : 'close'} size={14} strokeWidth={3} />
      </span>
      <div className="answer-line__body">
        <span className="answer-line__title">{title}</span>
        <span className="answer-line__value">{text ?? 'Δεν απαντήθηκε'}</span>
      </div>
    </div>
  )
}

function AnswerCard({ question: q, chosenId, index }: { readonly question: Question; readonly chosenId: string | null; readonly index: number }) {
  const isRight = chosenId === q.correctId
  return (
    <article className={cx('mistake surface', isRight && 'mistake--right')}>
      <div className="mistake__head">
        {q.image && <img className="mistake__thumb" src={q.image} alt="Η εικόνα της ερώτησης" loading="lazy" decoding="async" />}
        <div>
          <span className="mistake__index">
            Ερώτηση {index} · {isRight ? 'Σωστή' : 'Λάθος'}
          </span>
          <p className="mistake__prompt selectable">{q.prompt}</p>
        </div>
      </div>
      {isRight ? (
        <AnswerLine tone="right" title="Η απάντησή σου" text={optionLine(q, chosenId)} />
      ) : (
        <>
          <AnswerLine tone="wrong" title="Η απάντησή σου" text={optionLine(q, chosenId)} />
          <AnswerLine tone="right" title="Σωστή απάντηση" text={optionLine(q, q.correctId)} />
        </>
      )}
      {q.explain && <p className="mistake__explain selectable">{q.explain}</p>}
      {q.source && <p className="mistake__source">Βιβλίο: {q.source}</p>}
    </article>
  )
}
