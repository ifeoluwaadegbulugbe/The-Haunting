// Captures key screens for a visual check. Not part of the pass/fail playthrough.
import { test } from '@playwright/test'

test('screens', async ({ page }) => {
  await page.goto('/')
  await page.screenshot({ path: 'test-results/screens/1-title.png' })
  await page.getByRole('button', { name: 'BEGIN INVESTIGATION' }).click()
  await page.getByLabel('Your name').fill('Ada')
  await page.getByRole('button', { name: 'Begin', exact: true }).click()
  await page.waitForURL(/\/hq$/)
  await page.screenshot({ path: 'test-results/screens/2-hq.png' })
  await page.goto('/case/001/scene')
  await page.locator('button[aria-pressed][aria-label="Rotary Telephone"]').hover()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'test-results/screens/3a-scene-hover.png' })
  await page.locator('button[aria-pressed][aria-label="Torn Family Photograph"]').click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'test-results/screens/3-scene-panel.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'test-results/screens/4-scene-phone.png' })
})
