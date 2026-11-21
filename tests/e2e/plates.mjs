// Every sign picture must fit its card: the card keeps its own ratio and the picture scales inside it.
// Checks all section grids and every sign sheet (main picture + «Μην το μπερδέψεις με» cards).
// Usage: node tests/e2e/plates.mjs <out-dir> [baseUrl]
import { chromium } from '@playwright/test'

const OUT = process.argv[2] ?? '.'
const BASE = process.argv[3] ?? 'http://127.0.0.1:4173/'
const TOLERANCE = 1.5 // px

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 393, height: 873 }, deviceScaleFactor: 2, colorScheme: 'dark' })
const top = '.tab-layer:not(.tab-layer--hidden) .screen-host:not(.screen-host--covered)'
const problems = []

/** Plates whose box breaks its ratio or leaves its parent card, and images that leave their plate. */
const measure = (scope) =>
  page.evaluate((scope) => {
    const out = []
    const rect = (el) => el.getBoundingClientRect()
    for (const plate of document.querySelectorAll(`${scope} .sign-plate`)) {
      const p = rect(plate)
      if (p.width === 0) continue
      const ratio = plate.classList.contains('sign-plate--photo') ? 4 / 3 : 1
      if (Math.abs(p.width / p.height - ratio) > 0.02) out.push(`plate ratio ${(p.width / p.height).toFixed(2)} (want ${ratio.toFixed(2)})`)
      const card = plate.closest('.similar-chip, .sign-tile')
      if (card) {
        const c = rect(card)
        if (p.left < c.left - 1.5 || p.right > c.right + 1.5 || p.top < c.top - 1.5 || p.bottom > c.bottom + 1.5) out.push('plate overflows its card')
      }
      const img = plate.querySelector('img')
      if (img) {
        const i = rect(img)
        if (i.left < p.left - 1.5 || i.right > p.right + 1.5 || i.top < p.top - 1.5 || i.bottom > p.bottom + 1.5) out.push('picture overflows its plate')
      }
    }
    return out
  }, scope)

await page.goto(BASE)
await page.locator('.tabbar__item', { hasText: 'Σήματα' }).click()
const sections = await page.locator(`${top} .row`).count()
let sheetsChecked = 0
for (let s = 0; s < sections; s++) {
  await page.locator(`${top} .row`).nth(s).click()
  await page.waitForTimeout(400)
  const title = (await page.locator(`${top} .large-title`).textContent())?.trim()
  // Every tile of the grid (images load lazily, so scroll through first).
  await page.locator(`${top} .screen__scroll`).evaluate(async (el) => {
    for (let y = 0; y < el.scrollHeight; y += 600) {
      el.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
  })
  await page.waitForTimeout(300)
  for (const p of await measure(top)) problems.push(`${title} grid: ${p}`)
  // Every sign sheet, walking with «Επόμενο».
  await page.locator(`${top} .sign-tile`).first().click()
  await page.waitForSelector('.sheet-nav')
  for (;;) {
    await page.waitForFunction(() => [...document.querySelectorAll('.sheet img')].every((i) => i.complete))
    const code = (await page.locator('.sign-detail__meta .code-chip').textContent())?.trim()
    for (const p of await measure('.sheet')) problems.push(`${title} ${code}: ${p}`)
    sheetsChecked++
    if (code === 'Π-10') await page.screenshot({ path: `${OUT}/plates-P10.png` })
    const next = page.locator('.sheet-nav .btn', { hasText: 'Επόμενο' })
    if (await next.isDisabled()) break
    await next.click()
    await page.waitForTimeout(80)
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  await page.locator(`${top} [aria-label="Πίσω"]`).click()
  await page.waitForTimeout(300)
}
await browser.close()
const unique = [...new Set(problems)]
console.log(`${sheetsChecked} sign sheets and ${sections} section grids checked`)
console.log(unique.length ? `✗ ${unique.length} problems:\n  ${unique.slice(0, 40).join('\n  ')}` : '✓ every picture fits its card')
if (unique.length) process.exitCode = 1
