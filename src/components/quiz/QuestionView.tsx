import { cx } from '../../lib/cx'
import { OPTION_LETTERS } from '../../lib/format'
import type { Question } from '../../lib/types'

type Props = {
  readonly question: Question
  readonly chosenId: string | null
  readonly isLocked: boolean
  readonly onChoose: (optionId: string) => void
}

export function QuestionView({ question, chosenId, isLocked, onChoose }: Props) {
  return (
    <div className="question" key={question.id}>
      {question.image && (
        <figure className="question__figure">
          <img className="question__image" src={question.image} alt="Η εικόνα της ερώτησης" decoding="async" draggable={false} />
        </figure>
      )}
      <h2 className="question__prompt selectable">{question.prompt}</h2>
      <div className="options" role="radiogroup" aria-label="Απαντήσεις">
        {question.options.map((option, i) => {
          const isChosen = option.id === chosenId
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isChosen}
              aria-disabled={isLocked && !isChosen}
              className={cx('option surface', isChosen && 'is-chosen', isLocked && !isChosen && 'is-locked')}
              onClick={() => !isLocked && onChoose(option.id)}
            >
              <span className="option__letter">{OPTION_LETTERS[i] ?? i + 1}</span>
              <span className="option__label">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
