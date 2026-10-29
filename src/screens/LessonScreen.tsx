import { useEffect, useRef } from 'react'
import { Icon } from '../components/ui/Icon'
import { Screen } from '../components/ui/Screen'
import { LESSON_BY_ID, MODULES } from '../data'
import { lessonRequest } from '../data/quizzes'
import { useProgress } from '../hooks/useProgress'
import { plural } from '../lib/format'
import { markLessonRead } from '../lib/progress'
import { useNav } from '../nav/navigator'

type Props = { readonly lessonId: string }

export function LessonScreen({ lessonId }: Props) {
  const nav = useNav()
  const { update } = useProgress()
  const endRef = useRef<HTMLDivElement>(null)
  const lesson = LESSON_BY_ID.get(lessonId)

  // Reaching the end of the lesson counts as reading it.
  useEffect(() => {
    const el = endRef.current
    if (!el || !lesson) return undefined
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) update((p) => markLessonRead(p, lesson.id))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [lesson, update])

  if (!lesson) {
    return (
      <Screen title="Μάθημα" hasBack>
        <p className="empty">Το μάθημα δεν βρέθηκε.</p>
      </Screen>
    )
  }

  const module = MODULES.find((m) => m.id === lesson.module)

  return (
    <Screen title={lesson.title} hasBack>
      {module && <p className="lesson-eyebrow">{module.title}</p>}
      <p className="lesson-summary selectable">{lesson.summary}</p>
      <div className="stagger">
        {lesson.sections.map((section, i) => (
          <article key={`${lesson.id}-${i}`} className="lesson-card surface">
            <h2 className="lesson-card__title">{section.heading}</h2>
            <p className="lesson-card__body selectable">{section.body}</p>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="lesson-card__bullets selectable">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {section.tip && (
              <aside className="tip">
                <Icon name="sparkle" size={18} />
                <p className="selectable">{section.tip}</p>
              </aside>
            )}
          </article>
        ))}
      </div>
      <div ref={endRef} aria-hidden="true" />
      {lesson.quiz.length > 0 && (
        <button type="button" className="btn btn--primary btn--block lesson-quiz" onClick={() => nav.openQuiz(lessonRequest(lesson))}>
          <Icon name="play" size={18} />
          Κουίζ μαθήματος · {plural(lesson.quiz.length, 'ερώτηση', 'ερωτήσεις')}
        </button>
      )}
    </Screen>
  )
}
