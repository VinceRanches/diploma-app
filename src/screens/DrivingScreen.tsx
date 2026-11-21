import type { CSSProperties } from 'react'
import { Icon, isIconName } from '../components/ui/Icon'
import { IconTile } from '../components/ui/Primitives'
import { Screen } from '../components/ui/Screen'
import { lessonsOf, MODULES } from '../data'
import { useProgress } from '../hooks/useProgress'
import { useNav } from '../nav/navigator'

export function DrivingScreen() {
  const nav = useNav()
  const { progress } = useProgress()

  return (
    <Screen title="Οδήγηση" subtitle="Γνώρισε το αυτοκίνητο, μάθε να οδηγείς και τους κανόνες.">
      <div className="stagger">
        {MODULES.map((module) => {
          const lessons = lessonsOf(module.id)
          const done = lessons.filter((l) => progress.lessonsRead.includes(l.id)).length
          return (
            <section key={module.id} className="module" aria-labelledby={`module-${module.id}`}>
              <div className="module__head glass glass--tint" style={{ '--tint': module.tint } as CSSProperties}>
                <Icon name={module.icon} size={30} />
                <div className="module__body">
                  <h2 className="module__title" id={`module-${module.id}`}>
                    {module.title}
                  </h2>
                  <p className="module__subtitle">{module.subtitle}</p>
                </div>
                <span className="module__count">
                  {done}/{lessons.length}
                </span>
              </div>
              <ul className="list">
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <button type="button" className="row surface" onClick={() => nav.push({ name: 'lesson', lessonId: lesson.id })}>
                      <IconTile icon={isIconName(lesson.icon) ? lesson.icon : 'book'} tint={module.tint} />
                      <span className="row__body">
                        <span className="row__title">{lesson.title}</span>
                        <span className="row__subtitle">{lesson.summary}</span>
                      </span>
                      <span className="row__trailing">
                        {progress.lessonsRead.includes(lesson.id) ? (
                          <span className="row__done" aria-label="Ολοκληρώθηκε">
                            <Icon name="check" size={16} strokeWidth={2.8} />
                          </span>
                        ) : (
                          <Icon name="chevronRight" size={18} />
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {lessons.length === 0 && <p className="empty">Τα μαθήματα έρχονται σύντομα.</p>}
            </section>
          )
        })}
      </div>
    </Screen>
  )
}
