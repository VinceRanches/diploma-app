// End-to-end check of the mock exam behaving like the exam room: skip, auto-advance, loop back, full printout.
// Usage: node tests/e2e/exam-flow.mjs <out-dir> [baseUrl]
import { chromium } from '@playwright/test'

const OUT = process.argv[2] ?? '.'
const BASE = process.argv[3] ?? 'http://localhost:4173/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const fail = (msg) => {
  console.error(`✗ ${msg}`)
  process.exitCode = 1
}

await page.goto(BASE)
await page.locator('.tabbar__item', { hasText: 'Τεστ' }).click()
await page.locator('.tab-layer:not(.tab-layer--hidden) .btn--on-tint').first().click()
await page.waitForSelector('.question')
const count = async () => (await page.locator('.quiz__count').textContent())?.trim()

if (!(await count())?.startsWith('Ερώτηση 1/30')) fail(`unexpected start: ${await count()}`)
const firstPrompt = await page.locator('.question__prompt').textContent()
await page.locator('.quiz__footer .btn', { hasText: 'Παράλειψη' }).click()
await page.waitForTimeout(300)
if (!(await count())?.startsWith('Ερώτηση 2/30')) fail(`skip did not advance: ${await count()}`)

let sawLoopBack = false
for (let i = 0; i < 40; i++) {
  if (await page.locator('.results-hero').count()) break
  const prompt = await page.locator('.question__prompt').textContent()
  if (i > 0 && prompt === firstPrompt) sawLoopBack = true
  await page.locator('.option').first().click()
  // A locked exam answer cannot be changed.
  await page.locator('.option').nth(1).click({ force: true }).catch(() => {})
  await page.waitForTimeout(650)
}
if (!sawLoopBack) fail('skipped question 1 was not shown again at the end')
const rows = await page.locator('.results .mistake').count()
if (rows !== 30) fail(`printout lists ${rows} questions, expected 30`)
const verdict = await page.locator('.verdict').first().textContent()
console.log(`printout rows: ${rows}; verdict: ${verdict?.trim()}`)
await page.screenshot({ path: `${OUT}/exam-results.png` })
await page.locator('.quiz__scroll').evaluate((el) => el.scrollTo(0, 900))
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/exam-printout.png` })
await browser.close()
console.log(errors.length ? errors.join('\n') : 'no page errors')
if (!process.exitCode) console.log('✓ exam flow behaves like the exam room')
