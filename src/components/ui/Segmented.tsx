import { cx } from '../../lib/cx'
import { Icon, type IconName } from './Icon'

type Option<T extends string> = { readonly value: T; readonly label: string; readonly icon?: IconName }

type Props<T extends string> = {
  readonly options: readonly Option<T>[]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly ariaLabel: string
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      <span
        className="segmented__thumb"
        aria-hidden="true"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={cx('segmented__item', o.value === value && 'is-active')}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <Icon name={o.icon} size={20} />}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  )
}
