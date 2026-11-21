import type { ReactNode } from 'react'

const PATHS = {
  home: <path d="M3.5 10.6 12 3.5l8.5 7.1V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.2v5.8H5A1.5 1.5 0 0 1 3.5 19z" />,
  signs: (
    <>
      <path d="M10.3 4.4a2 2 0 0 1 3.4 0l7.6 13.1a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3z" />
      <path d="M12 9.5v4.2M12 16.8v.1" />
    </>
  ),
  steering: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="2.3" />
      <path d="M3.6 10.6c2.6-.9 5.4-1.3 8.4-1.3s5.8.4 8.4 1.3M10 13.4l-4.6 5M14 13.4l4.6 5" />
    </>
  ),
  tests: (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="3.2" />
      <path d="m8 8.6 1.5 1.5 2.8-2.9M14.6 9h1.8M8 14.6l1.5 1.5 2.8-2.9M14.6 15h1.8" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7.5h9M18 7.5h2M4 16.5h3M11 16.5h9" />
      <circle cx="15.5" cy="7.5" r="2.4" />
      <circle cx="8.5" cy="16.5" r="2.4" />
    </>
  ),
  chevronRight: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  chevronLeft: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  check: <path d="m5 12.6 4.4 4.4L19 7.4" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3 2" />
    </>
  ),
  car: (
    <>
      <path d="M5 15.5V12l1.7-4.4A2 2 0 0 1 8.6 6.3h6.8a2 2 0 0 1 1.9 1.3L19 12v3.5" />
      <path d="M3.5 12h17v5a1 1 0 0 1-1 1H18v1.2a1 1 0 0 1-1 1h-1.2a1 1 0 0 1-1-1V18H9.2v1.2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V18H4.5a1 1 0 0 1-1-1z" />
      <path d="M7 15h1.5M15.5 15H17" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.2 17.5a8.6 8.6 0 1 1 15.6 0" />
      <path d="m12 13.4 3.6-4.2" />
      <circle cx="12" cy="13.6" r="1.4" />
    </>
  ),
  wrench: (
    <path d="M14.7 4.2a4.6 4.6 0 0 0-5.5 6L3.9 15.5a2.2 2.2 0 0 0 3.1 3.1l5.3-5.3a4.6 4.6 0 0 0 6-5.5l-2.8 2.8-2.6-.5-.5-2.6z" />
  ),
  road: <path d="M8.5 3.5 4 20.5M15.5 3.5l4.5 17M12 4.5v2.6M12 10.7v2.6M12 16.9v2.6" />,
  traffic: (
    <>
      <rect x="7.5" y="2.8" width="9" height="18.4" rx="3.6" />
      <circle cx="12" cy="7.2" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="16.8" r="1.5" />
    </>
  ),
  parking: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.2" />
      <path d="M10 16.5v-9h2.9a2.7 2.7 0 0 1 0 5.4H10" />
    </>
  ),
  weather: (
    <>
      <path d="M7.3 15a4 4 0 1 1 .8-7.9 5 5 0 0 1 9.5 1.8A3.1 3.1 0 0 1 17 15z" />
      <path d="m9 18-1 2.4M13 18l-1 2.4M17 18l-1 2.4" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 4.4a2 2 0 0 1 3.4 0l7.6 13.1a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3z" />
      <path d="M12 9.5v4.2M12 16.8v.1" />
    </>
  ),
  law: (
    <path d="M12 4v16M7.5 20h9M5 7h14M5 7l-2.6 6.2a2.6 2.6 0 0 0 5.2 0zM19 7l-2.6 6.2a2.6 2.6 0 0 0 5.2 0z" />
  ),
  firstaid: (
    <>
      <rect x="3.5" y="6.5" width="17" height="13" rx="3" />
      <path d="M9 6.5V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5M12 10v6M9 13h6" />
    </>
  ),
  exam: (
    <>
      <path d="M7 3h6.8L19 8.2V19.5A1.5 1.5 0 0 1 17.5 21h-10.5A1.5 1.5 0 0 1 5.5 19.5V4.5A1.5 1.5 0 0 1 7 3z" />
      <path d="M13.5 3v5.4H19M9 13h6M9 16.6h4" />
    </>
  ),
  fuel: (
    <path d="M5.5 20V5.2A1.7 1.7 0 0 1 7.2 3.5h5.6a1.7 1.7 0 0 1 1.7 1.7V20M4 20h12M5.5 10.5h9M14.5 9l3 2.4v6.1a1.4 1.4 0 0 0 2.8 0V9.2L18 6.8" />
  ),
  tyre: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3.4v5M12 15.6v5M3.4 12h5M15.6 12h5" />
    </>
  ),
  light: (
    <path d="M9.3 18h5.4M10.2 21h3.6M12 3a6 6 0 0 0-3.6 10.8c.7.5 1 1.3 1 2.2h5.2c0-.9.3-1.7 1-2.2A6 6 0 0 0 12 3z" />
  ),
  sparkle: <path d="m12 3.5 1.8 5.1 5.2 1.9-5.2 1.9L12 17.5l-1.8-5.1L5 10.5l5.2-1.9z" />,
  refresh: <path d="M19.5 12a7.5 7.5 0 1 1-2.3-5.4M19.6 4.3v4.2h-4.2" />,
  book: <path d="M5 5A1.5 1.5 0 0 1 6.5 3.5H19v14H6.5A1.5 1.5 0 0 0 5 19zM5 19a1.5 1.5 0 0 0 1.5 1.5H19" />,
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 5.6H5.2A3 3 0 0 0 8 9.5M16 5.6h2.8A3 3 0 0 1 16 9.5M12 13v3.6M8.6 20.3h6.8M10 16.6h4v3.7h-4z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M5.4 18.6l1.4-1.4M17.2 6.8l1.4-1.4" />
    </>
  ),
  moon: <path d="M19.6 14.6A8 8 0 1 1 9.4 4.4a6.4 6.4 0 0 0 10.2 10.2z" />,
  auto: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 3.6a8.4 8.4 0 0 1 0 16.8z" fill="currentColor" />
    </>
  ),
  trash: <path d="M4.5 7h15M9.5 7V4.8h5V7M6.6 7l.9 12.4a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4L17.4 7" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.4M12 7.9v.1" />
    </>
  ),
  play: <path d="M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l9.7-6.2a.8.8 0 0 0 0-1.4L9.7 5.1a.8.8 0 0 0-1.2.7z" fill="currentColor" />,
  arrowRight: <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />,
  arrowUp: <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />,
  layers: <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8zM3.5 12.2l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

export const isIconName = (name: string): name is IconName => name in PATHS

type Props = {
  readonly name: IconName
  readonly size?: number
  readonly strokeWidth?: number
  readonly className?: string
}

export function Icon({ name, size = 22, strokeWidth = 1.8, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
