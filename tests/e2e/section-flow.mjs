// End-to-end check of a sign section: next/previous in the sign sheet, back-to-top, floating test button,
// and section tests without two questions of the same sign.
// Usage: node tests/e2e/section-flow.mjs <out-dir> [baseUrl]
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const OUT = process.argv[2] ?? '.'
const BASE = process.argv[3] ?? 'http://localhost:4173/'
const bank = JSON.parse(readFileSync(new URL('../../src/data/bank.json', import.meta.url), 'utf8'))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const fail = (msg) => {
  console.error(`✗ ${msg}`)
  process.exitCode = 1
}
const top = '.tab-layer:not(.tab-layer--hidden) .screen-host:not(.screen-host--covered)'

async function openSection(title) {
  await page.locator('.tabbar__item', { hasText: 'Σήματα' }).click()
  await page.locator(`${top} .row`, { hasText: title }).click()
  await page.waitForTimeout(500)
}

/** Answers a section test to the end and returns the question prompts' picture sources. */
async function runSectionTest() {
  await page.waitForSelector('.question')
  const count = await page.locator('.quiz__count').textContent()
  const total = Number(count?.match(/από (\d+)/)?.[1])
  const pictures = []
  for (let i = 0; i < total; i++) {
    pictures.push(await page.locator('.question__image').getAttribute('src').catch(() => null))
    await page.locator('.option').first().click()
    await page.locator('.quiz__next').click()
    await page.waitForTimeout(80)
  }
  await page.waitForSelector('.results-hero')
  await page.locator('.quiz__footer .btn', { hasText: 'Τέλος' }).click()
  await page.waitForTimeout(300)
  return { total, pictures }
}

await page.goto(BASE)

// 1. Sign sheet: next / previous.
await openSection('Απαγορεύσεις')
await page.locator(`${top} .sign-tile`).first().click()
await page.waitForSelector('.sheet-nav')
const firstName = await page.locator('.sign-detail__name').textContent()
await page.locator('.sheet-nav .btn', { hasText: 'Επόμενο' }).click()
await page.locator('.sheet-nav .btn', { hasText: 'Επόμενο' }).click()
const counter = (await page.locator('.sheet-nav__count').textContent())?.replace(/\s/g, '')
if (!counter?.startsWith('3/')) fail(`after two "next" the counter is ${counter}`)
await page.screenshot({ path: `${OUT}/sheet-next.png` })
await page.locator('.sheet-nav .btn', { hasText: 'Προηγούμενο' }).click()
await page.locator('.sheet-nav .btn', { hasText: 'Προηγούμενο' }).click()
if ((await page.locator('.sign-detail__name').textContent()) !== firstName) fail('"previous" did not return to the first sign')
if (!(await page.locator('.sheet-nav .btn', { hasText: 'Προηγούμενο' }).isDisabled())) fail('"previous" should be disabled on the first sign')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

// 2. Floating bar: back to top + start test.
const scroller = page.locator(`${top} .screen__scroll`)
if (await page.locator(`${top} .floating-bar--visible`).count()) fail('floating bar visible before scrolling')
await scroller.evaluate((el) => el.scrollTo(0, 2500))
await page.waitForTimeout(600)
if (!(await page.locator(`${top} .floating-bar--visible`).count())) fail('floating bar did not appear after scrolling')
await page.screenshot({ path: `${OUT}/floating-bar.png` })
await page.locator(`${top} .floating-bar [aria-label="Στην αρχή της σελίδας"]`).click()
await page.waitForTimeout(900)
const afterTop = await scroller.evaluate((el) => el.scrollTop)
if (afterTop > 5) fail(`back-to-top left scrollTop at ${afterTop}`)
await scroller.evaluate((el) => el.scrollTo(0, 2500))
await page.waitForTimeout(600)
await page.locator(`${top} .floating-bar .btn`, { hasText: 'Τεστ ενότητας' }).click()

// 3. Section tests: no repeated sign, and Πινακίδες προτεραιότητας has a real test.
const dupOf = new Map(bank.filter((b) => b.image).map((b) => [b.image, b.dup ?? b.id]))
for (let run = 0; run < 3; run++) {
  if (run > 0) {
    await page.locator(`${top} .section-card .btn--primary`).click()
  }
  const { total, pictures } = await runSectionTest()
  const keys = pictures.filter(Boolean).map((src) => dupOf.get(src.replace(/^\.?\//, '')) ?? src)
  if (new Set(keys).size !== keys.length) fail(`Απαγορεύσεις test ${run + 1} repeats a sign (${total} questions)`)
  else console.log(`Απαγορεύσεις test ${run + 1}: ${total} questions, no sign repeated`)
}
await page.locator(`${top} [aria-label="Πίσω"]`).click()
await page.waitForTimeout(400)
await page.locator(`${top} .row`, { hasText: 'προτεραιότητας' }).click()
await page.waitForTimeout(400)
const label = await page.locator(`${top} .section-card .btn--primary`).textContent()
await page.locator(`${top} .section-card .btn--primary`).click()
const { total: priorityTotal } = await runSectionTest()
console.log(`Πινακίδες προτεραιότητας: button «${label?.trim()}», test with ${priorityTotal} questions`)
if (priorityTotal < 6) fail(`Πινακίδες προτεραιότητας test has only ${priorityTotal} questions`)

await browser.close()
console.log(errors.length ? errors.join('\n') : 'no page errors')
if (!process.exitCode) console.log('✓ section flow works')
