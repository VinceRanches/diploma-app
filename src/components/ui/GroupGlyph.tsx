import type { SignGroup } from '../../lib/types'

const RED = '#d7141a'
const BLUE = '#1f5fbf'
const INK = '#1c1c1e'

/** A miniature of the sign family, drawn to the Greek sign colours — used as the section badge. */
function Shape({ group }: { readonly group: SignGroup }) {
  switch (group) {
    case 'danger':
      return (
        <>
          <path d="M16 4.5 28 25.5H4z" fill="#fff" stroke={RED} strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M16 12v6.5M16 21.6v.2" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )
    case 'roadworks':
      return (
        <>
          <path d="M16 4.5 28 25.5H4z" fill="#ffd200" stroke={RED} strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M12.5 21.5h7M14 21.5l2-6 2 6M15 13.6h2" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )
    case 'priority':
      return <path d="M4 6.5h24L16 27.5z" fill="#fff" stroke={RED} strokeWidth="3.2" strokeLinejoin="round" />
    case 'prohibitory':
      return (
        <>
          <circle cx="16" cy="16" r="11.5" fill="#fff" stroke={RED} strokeWidth="3.6" />
          <path d="M9 23 23 9" stroke={RED} strokeWidth="3" />
        </>
      )
    case 'mandatory':
      return (
        <>
          <circle cx="16" cy="16" r="12.5" fill={BLUE} />
          <path d="M16 23V10M11 14.5l5-5 5 5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )
    case 'informative':
      return (
        <>
          <rect x="4" y="4" width="24" height="24" rx="4" fill={BLUE} />
          <path d="M13 23V9.5h4.2a4 4 0 0 1 0 8H13" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )
    case 'supplementary':
      return (
        <>
          <rect x="3.5" y="9" width="25" height="14" rx="2.5" fill="#fff" stroke={INK} strokeWidth="2" />
          <path d="M9 16h14" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </>
      )
    case 'marking':
      return (
        <>
          <rect x="5" y="3" width="22" height="26" rx="4" fill="#3a3a3c" />
          <path d="M16 6v4.5M16 14v4.5M16 22v4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M8.5 5v22M23.5 5v22" stroke="#ffd60a" strokeWidth="1.6" />
        </>
      )
    case 'signal':
      return (
        <>
          <rect x="10" y="2.5" width="12" height="27" rx="4.5" fill={INK} />
          <circle cx="16" cy="9" r="2.6" fill="#ff453a" />
          <circle cx="16" cy="16" r="2.6" fill="#ffd60a" />
          <circle cx="16" cy="23" r="2.6" fill="#30d158" />
        </>
      )
    case 'police':
      return (
        <>
          <circle cx="16" cy="7.5" r="3.4" fill={BLUE} />
          <path d="M4 14.5h24M16 12v9M16 21l-4 7M16 21l4 7" stroke={BLUE} strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      )
    case 'other':
      return <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="2.4" />
  }
}

export function GroupGlyph({ group }: { readonly group: SignGroup }) {
  return (
    <span className="glyph" aria-hidden="true">
      <svg width="30" height="30" viewBox="0 0 32 32">
        <Shape group={group} />
      </svg>
    </span>
  )
}
