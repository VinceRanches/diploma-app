import type { CSSProperties, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useBackHandler } from '../../nav/navigator'

type Props = {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly label: string
  readonly children: ReactNode
}

export function Sheet({ isOpen, onClose, label, children }: Props) {
  useBackHandler(
    isOpen
      ? () => {
          onClose()
          return true
        }
      : null,
  )

  if (!isOpen) return null
  return createPortal(
    <div className="sheet-root" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" className="sheet-scrim" aria-label="Κλείσιμο" onClick={onClose} />
      <div className="sheet glass glass--strong">
        <span className="sheet__grabber" aria-hidden="true" />
        {children}
      </div>
    </div>,
    document.body,
  )
}

type ConfirmProps = {
  readonly isOpen: boolean
  readonly title: string
  readonly message: string
  readonly confirmLabel: string
  readonly cancelLabel: string
  readonly isDestructive?: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

export function ConfirmSheet({ isOpen, title, message, confirmLabel, cancelLabel, isDestructive, onConfirm, onCancel }: ConfirmProps) {
  return (
    <Sheet isOpen={isOpen} onClose={onCancel} label={title}>
      <div className="confirm">
        <h2 className="confirm__title">{title}</h2>
        <p className="confirm__text">{message}</p>
        <button
          type="button"
          className="btn btn--primary btn--block"
          style={isDestructive ? ({ '--tint': 'var(--c-red)' } as CSSProperties) : undefined}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
        <button type="button" className="btn btn--glass btn--block" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </Sheet>
  )
}
