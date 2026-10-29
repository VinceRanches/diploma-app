import type { CSSProperties, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { pct } from '../../lib/format'
import type { Sign } from '../../lib/types'
import { Icon, type IconName } from './Icon'

type IconTileProps = { readonly icon: IconName; readonly tint: string; readonly size?: 'md' | 'lg' }

export function IconTile({ icon, tint, size = 'md' }: IconTileProps) {
  return (
    <span className={cx('icon-tile', size === 'lg' && 'icon-tile--lg')} style={{ '--tint': tint } as CSSProperties}>
      <Icon name={icon} size={size === 'lg' ? 26 : 21} strokeWidth={2} />
    </span>
  )
}

type RingProps = {
  readonly value: number
  readonly size?: number
  readonly stroke?: number
  readonly tint?: string
  readonly track?: string
  readonly children?: ReactNode
}

export function ProgressRing({ value, size = 64, stroke = 7, tint = 'var(--c-blue)', track = 'var(--c-fill-2)', children }: RingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct(value) / 100)
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          className="ring__value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tint}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring__label">{children}</div>
    </div>
  )
}

type BarProps = { readonly value: number; readonly label: string; readonly tint?: string }

export function ProgressBar({ value, label, tint = 'var(--c-blue)' }: BarProps) {
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct(value)}>
      <div className="bar__fill" style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})`, background: tint }} />
    </div>
  )
}

type ScorePillProps = { readonly value: number | undefined }

export function ScorePill({ value }: ScorePillProps) {
  if (value === undefined) return <span className="pill">Νέο</span>
  const tone = value >= 0.9 ? 'good' : value >= 0.6 ? 'mid' : 'low'
  return <span className={cx('pill', `pill--${tone}`)}>{pct(value)}%</span>
}

type SignImageProps = {
  readonly sign: Pick<Sign, 'image' | 'code' | 'name'> & Partial<Pick<Sign, 'kind'>>
  readonly className?: string
  readonly alt?: string
  readonly eager?: boolean
}

/** Book pictures are shown whole (object-fit: contain) — never cropped. Figures are photos, so they get a wider frame. */
export function SignImage({ sign, className, alt, eager = false }: SignImageProps) {
  return (
    <div className={cx('sign-plate', sign.kind === 'figure' && 'sign-plate--photo', className)}>
      {sign.image ? (
        <img
          src={sign.image}
          alt={alt ?? sign.name}
          width={200}
          height={200}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
        />
      ) : (
        <span className="sign-plate__fallback">{sign.code}</span>
      )}
    </div>
  )
}

type StatProps = { readonly value: string; readonly label: string }

export function Stat({ value, label }: StatProps) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}
