// Renders the app icon and splash sources into assets/ (consumed by `npx capacitor-assets generate`).
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const OUT = join(process.cwd(), 'assets')
mkdirSync(OUT, { recursive: true })

const DEFS = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f9bff"/><stop offset="1" stop-color="#4a3fe0"/></linearGradient>
  <radialGradient id="sheen" cx=".28" cy=".18" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>
  <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#1a1060" flood-opacity=".35"/></filter>`

const BACKGROUND = '<rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#sheen)"/>'

// Glass disc carrying a Greek danger sign; kept inside the adaptive-icon safe zone.
const FOREGROUND = `
  <circle cx="512" cy="512" r="300" fill="url(#glass)"/>
  <circle cx="512" cy="512" r="299" fill="none" stroke="url(#rim)" stroke-width="5"/>
  <g filter="url(#shadow)">
    <path d="M512 318c14 0 27 7 34 20l158 274c15 26-4 58-34 58H354c-30 0-49-32-34-58l158-274c7-13 20-20 34-20z" fill="#fff"/>
    <path d="M512 318c14 0 27 7 34 20l158 274c15 26-4 58-34 58H354c-30 0-49-32-34-58l158-274c7-13 20-20 34-20z" fill="none" stroke="#e1131c" stroke-width="40" stroke-linejoin="round"/>
    <rect x="494" y="432" width="36" height="128" rx="18" fill="#1c1c1e"/>
    <circle cx="512" cy="606" r="22" fill="#1c1c1e"/>
  </g>`

const svg = (body, size = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024"><defs>${DEFS}</defs>${body}</svg>`

const splash = (bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732"><rect width="2732" height="2732" fill="${bg}"/>` +
  `<g transform="translate(1110 1110) scale(.5)"><defs>${DEFS}<clipPath id="c"><rect width="1024" height="1024" rx="230"/></clipPath></defs><g clip-path="url(#c)">${BACKGROUND}${FOREGROUND}</g></g></svg>`

const FILES = [
  { name: 'icon-only.png', markup: svg(BACKGROUND + FOREGROUND), size: 1024 },
  { name: 'icon-foreground.png', markup: svg(FOREGROUND), size: 1024 },
  { name: 'icon-background.png', markup: svg(BACKGROUND), size: 1024 },
  { name: 'splash.png', markup: splash('#f2f2f7'), size: 2732 },
  { name: 'splash-dark.png', markup: splash('#000000'), size: 2732 },
]

const browser = await chromium.launch()
for (const file of FILES) {
  const page = await browser.newPage({ viewport: { width: file.size, height: file.size } })
  await page.setContent(`<html><body style="margin:0;background:transparent">${file.markup}</body></html>`)
  await page.screenshot({ path: join(OUT, file.name), omitBackground: true, clip: { x: 0, y: 0, width: file.size, height: file.size } })
  await page.close()
}
await browser.close()
console.log(`rendered ${FILES.length} files into ${OUT}`)
