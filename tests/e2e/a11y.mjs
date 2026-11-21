// Automated accessibility audit (axe) of the main screens in both themes.
// Usage: node tests/e2e/a11y.mjs [baseUrl]
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://localhost:4173/'
const browser = await chromium.launch()
const report = []

for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme })
  const page = await context.newPage()
  await page.goto(BASE)
  const audit = async (name) => {
    await page.waitForTimeout(700)
    const { violations } = await new AxeBuilder({ page }).exclude('.tab-layer--hidden').exclude('.screen-host--covered').analyze()
    for (const v of violations) report.push(`[${scheme}] ${name}: ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.nodes[0]?.target.join(' ')}`)
  }
  await audit('home')
  for (const tab of ['Σήματα', 'Τεστ', 'Οδήγηση', 'Ρυθμίσεις']) {
    await page.locator('.tabbar__item', { hasText: tab }).click()
    await audit(tab)
  }
  await page.locator('.tabbar__item', { hasText: 'Τεστ' }).click()
  await page.locator('.tab-layer:not(.tab-layer--hidden) .btn--on-tint').first().click()
  await audit('exam')
  await context.close()
}
await browser.close()
console.log(report.length ? report.join('\n') : 'no axe violations')
