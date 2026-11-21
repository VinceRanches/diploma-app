import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QuestionView } from '../components/quiz/QuestionView'
import { QuizResults } from '../components/quiz/QuizResults'
import { Icon } from '../components/ui/Icon'
import { ProgressBar } from '../components/ui/Primitives'
import { ConfirmSheet } from '../components/ui/Sheet'
import { EXAM_FORMAT } from '../data/exam'
import { buildQuestions, reviewRequest } from '../data/quizzes'
import { useProgress } from '../hooks/useProgress'
import { cx } from '../lib/cx'
import { nextUnanswered } from '../lib/examFlow'
import { formatClock } from '../lib/format'
import { resultHaptic, tapHaptic } from '../lib/haptics'
import { recordQuiz } from '../lib/progress'
import { newSeed } from '../lib/random'
import { gradeQuiz } from '../lib/scoring'
import type { Answers, QuizResult } from '../lib/types'
import { useBackHandler, useNav, type QuizRequest } from '../nav/navigator'

const LOW_TIME_SEC = 5 * 60
const AUTO_ADVANCE_MS = 450

function useNow(isTicking: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!isTicking) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [isTicking])
  return now
}

type Props = { readonly request: QuizRequest }

export function QuizScreen({ request }: Props) {
  const nav = useNav()
  const { update } = useProgress()
  const questions = useMemo(() => buildQuestions(request), [request])
  const ids = useMemo(() => questions.map((q) => q.id), [questions])
  const isExam = request.mode.type === 'exam'

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [isConfirmingExit, setIsConfirmingExit] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const advanceTimer = useRef<number | undefined>(undefined)

  const now = useNow(isExam && result === null)
  const elapsedSec = Math.floor(((finishedAt ?? now) - startedAt) / 1000)
  const remainingSec = Math.max(0, EXAM_FORMAT.minutes * 60 - elapsedSec)
  const answeredCount = Object.keys(answers).length
  const question = questions[index]
  const chosenId = question ? (answers[question.id] ?? null) : null

  const finish = useCallback(
    (final: Answers) => {
      if (result) return
      window.clearTimeout(advanceTimer.current)
      const graded = gradeQuiz(questions, final, isExam ? { maxMistakes: EXAM_FORMAT.maxMistakes } : undefined)
      const end = Date.now()
      setResult(graded)
      setFinishedAt(end)
      update((p) => recordQuiz(p, request.mode, graded, end, Math.round((end - startedAt) / 1000)))
      resultHaptic(graded.passed ?? graded.mistakes.length === 0)
      scrollRef.current?.scrollTo({ top: 0 })
    },
    [result, questions, isExam, update, request.mode, startedAt],
  )

  // Time is up: unanswered questions count as wrong.
  useEffect(() => {
    if (isExam && result === null && remainingSec === 0) finish(answers)
  }, [isExam, result, remainingSec, finish, answers])

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  useBackHandler(() => {
    if (isConfirmingExit) {
      setIsConfirmingExit(false)
      return true
    }
    if (result === null && answeredCount > 0) {
      setIsConfirmingExit(true)
      return true
    }
    return false
  })

  const goTo = (next: number) => {
    window.clearTimeout(advanceTimer.current)
    setIndex(next)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClose = () => {
    if (result === null && answeredCount > 0) setIsConfirmingExit(true)
    else nav.closeQuiz()
  }

  const handleChoose = (optionId: string) => {
    if (!question) return
    tapHaptic()
    if (!isExam) {
      setAnswers((a) => ({ ...a, [question.id]: optionId }))
      return
    }
    // Exam room: the answer is final and the next unanswered question appears by itself.
    if (chosenId) return
    const next = { ...answers, [question.id]: optionId }
    setAnswers(next)
    const target = nextUnanswered(ids, next, index)
    advanceTimer.current = window.setTimeout(() => (target === -1 ? finish(next) : goTo(target)), AUTO_ADVANCE_MS)
  }

  const handleSkip = () => {
    const target = nextUnanswered(ids, answers, index)
    if (target !== -1 && target !== index) goTo(target)
  }

  const handleNext = () => {
    if (index < questions.length - 1) goTo(index + 1)
    else finish(answers)
  }

  const handleRetryMistakes = () => {
    if (!result) return
    nav.openQuiz(reviewRequest(result.mistakes.map((m) => m.question.ref), 'Επανάληψη λαθών'))
  }

  const isLast = index === questions.length - 1
  const canSkip = isExam && !chosenId && nextUnanswered(ids, answers, index) !== index
  const progress = isExam ? answeredCount / Math.max(1, questions.length) : (index + (chosenId ? 1 : 0)) / Math.max(1, questions.length)

  return (
    <div className="quiz">
      <header className="quiz__header">
        <div className="quiz__toprow">
          <button type="button" className="nav-circle" onClick={handleClose} aria-label="Κλείσιμο τεστ">
            <Icon name="close" size={20} strokeWidth={2.4} />
          </button>
          <div className="quiz__heading">
            <span className="quiz__title">{result ? (isExam ? 'Τέλος εξέτασης' : 'Αποτελέσματα') : request.title}</span>
            {!result && questions.length > 0 && (
              <span className="quiz__count">
                {isExam ? `Ερώτηση ${index + 1}/${questions.length} · ${answeredCount} απαντήσεις` : `Ερώτηση ${index + 1} από ${questions.length}`}
              </span>
            )}
          </div>
          {isExam && !result ? (
            <span className={cx('timer', remainingSec <= LOW_TIME_SEC && 'timer--low')} aria-label="Υπόλοιπος χρόνος">
              <Icon name="clock" size={16} strokeWidth={2.2} />
              {formatClock(remainingSec)}
            </span>
          ) : (
            <span className="quiz__spacer" />
          )}
        </div>
        {!result && questions.length > 0 && <ProgressBar value={progress} label="Πρόοδος τεστ" />}
      </header>

      <main className="quiz__scroll" ref={scrollRef}>
        <div className="quiz__content">
          {questions.length === 0 && <p className="empty">Δεν υπάρχουν επίσημες ερωτήσεις για αυτό το τεστ.</p>}
          {result ? (
            <QuizResults
              result={result}
              questions={questions}
              answers={answers}
              durationSec={elapsedSec}
              maxMistakes={isExam ? EXAM_FORMAT.maxMistakes : null}
            />
          ) : (
            question && <QuestionView question={question} chosenId={chosenId} isLocked={isExam && chosenId !== null} onChoose={handleChoose} />
          )}
        </div>
      </main>

      <footer className="quiz__footer">
        <div className="quiz__actions">
          {result ? (
            <>
              {result.mistakes.length > 0 && (
                <button type="button" className="btn btn--primary btn--block" onClick={handleRetryMistakes}>
                  <Icon name="refresh" size={18} /> Επανάληψη λαθών
                </button>
              )}
              <div className="quiz__row">
                <button type="button" className="btn btn--glass" onClick={() => nav.openQuiz({ ...request, seed: newSeed() })}>
                  {isExam ? 'Νέα εξέταση' : 'Νέο τεστ'}
                </button>
                <button type="button" className="btn btn--glass" onClick={nav.closeQuiz}>
                  Τέλος
                </button>
              </div>
            </>
          ) : isExam ? (
            questions.length > 0 && (
              <button type="button" className="btn btn--glass btn--block" disabled={!canSkip} onClick={handleSkip}>
                {chosenId ? 'Η απάντηση καταχωρήθηκε' : 'Παράλειψη'}
                {!chosenId && <Icon name="arrowRight" size={18} strokeWidth={2.4} />}
              </button>
            )
          ) : (
            questions.length > 0 && (
              <div className="quiz__row">
                {index > 0 && (
                  <button type="button" className="nav-circle nav-circle--lg" onClick={() => goTo(index - 1)} aria-label="Προηγούμενη ερώτηση">
                    <Icon name="chevronLeft" size={22} strokeWidth={2.4} />
                  </button>
                )}
                <button type="button" className="btn btn--primary quiz__next" disabled={!chosenId} onClick={handleNext}>
                  {isLast ? 'Ολοκλήρωση' : 'Επόμενη'}
                  <Icon name={isLast ? 'check' : 'arrowRight'} size={18} strokeWidth={2.4} />
                </button>
              </div>
            )
          )}
        </div>
      </footer>

      <ConfirmSheet
        isOpen={isConfirmingExit}
        title={isExam ? 'Διακοπή εξέτασης;' : 'Διακοπή τεστ;'}
        message="Οι απαντήσεις αυτού του τεστ δεν θα αποθηκευτούν."
        confirmLabel="Έξοδος"
        cancelLabel="Συνέχεια"
        isDestructive
        onConfirm={nav.closeQuiz}
        onCancel={() => setIsConfirmingExit(false)}
      />
    </div>
  )
}
