// Visual smoke run: walks every screen at phone size in light and dark mode and saves screenshots.
// Usage: node tests/e2e/screenshots.mjs <out-dir> [baseUrl]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const OUT = process.argv[2] ?? 'shots'
const BASE = process.argv[3] ?? 'http://localhost:4173/'
mkdirSync(OUT, { recursive: true })

const errors = []

async function run(scheme) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme })
  page.on('pageerror', (e) => errors.push(`[${scheme}] pageerror: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${scheme}] console: ${m.text()}`))
  const shot = async (name) => {
    await page.waitForTimeout(650)
    await page.screenshot({ path: join(OUT, `${scheme}-${name}.png`) })
  }
  const tab = (label) => page.locator('.tabbar__item', { hasText: label }).click()
  const top = '.tab-layer:not(.tab-layer--hidden) .screen-host:not(.screen-host--covered)'

  await page.goto(BASE)
  await shot('01-home')

  await tab('Σήματα')
  await shot('02-signs')
  await page.locator(`${top} .row`).first().click()
  await shot('03-section')
  await page.locator(`${top} .sign-tile`).first().click()
  await shot('04-sign-sheet')
  await page.keyboard.press('Escape')

  await page.locator(`${top} .btn--primary`).first().click()
  await shot('05-question')
  for (let i = 0; i < 40; i++) {
    if (await page.locator('.results-hero').count()) break
    await page.locator('.option').nth(i % 2).click()
    await page.locator('.quiz__next').click()
    await page.waitForTimeout(60)
  }
  await shot('06-results')
  await page.locator('.quiz__scroll').evaluate((el) => el.scrollTo(0, 700))
  await shot('07-results-mistakes')
  await page.locator('.btn', { hasText: 'Τέλος' }).click()

  await tab('Τεστ')
  await shot('08-tests')
  await page.locator(`${top} .btn--on-tint`).first().click()
  await shot('09-exam')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await tab('Οδήγηση')
  await shot('10-driving')
  await page.locator(`${top} .row`).first().click()
  await shot('11-lesson')

  await tab('Ρυθμίσεις')
  await shot('12-settings')
  await browser.close()
}

async function sections(scheme) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme })
  page.on('pageerror', (e) => errors.push(`[${scheme}] pageerror: ${e.message}`))
  const top = '.tab-layer:not(.tab-layer--hidden) .screen-host:not(.screen-host--covered)'
  await page.goto(BASE)
  await page.locator('.tabbar__item', { hasText: 'Σήματα' }).click()
  for (const index of [4, 5, 6, 7, 8, 9]) {
    await page.locator(`${top} .row`).nth(index).click()
    await page.waitForTimeout(500)
    await page.locator(`${top} .screen__scroll`).evaluate((el) => el.scrollTo(0, 330))
    await page.waitForTimeout(700)
    await page.screenshot({ path: join(OUT, `${scheme}-section-${index}.png`) })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }
  await browser.close()
}

if (process.argv.includes('--sections')) {
  await sections('light')
} else {
  await run('light')
  await run('dark')
}
console.log(errors.length ? errors.join('\n') : 'no page errors')
