// Captures key screens for a visual check. Not part of the pass/fail playthrough.
import { test, type Page } from '@playwright/test'

const ring = (page: Page, name: string) => page.locator(`button[aria-pressed][aria-label="${name}"]`)

async function closeUpShot(page: Page, name: string, file: string) {
  await ring(page, name).click()
  await page.getByRole('button', { name: 'Inspect', exact: true }).click()
  const dlg = page.getByRole('dialog', { name: `Close-up: ${name}` })
  await dlg.waitFor()
  await page.waitForTimeout(700)
  await page.screenshot({ path: `test-results/screens/${file}` })
  await dlg.getByRole('button', { name: 'Return to the study' }).click()
  await dlg.waitFor({ state: 'hidden' })
}

test('screens', async ({ page }) => {
  await page.goto('/')
  await page.screenshot({ path: 'test-results/screens/1-title.png' })
  await page.getByRole('button', { name: 'BEGIN INVESTIGATION' }).click()
  await page.getByLabel('Your name').fill('Ada')
  await page.getByRole('button', { name: 'Begin', exact: true }).click()
  await page.waitForURL(/\/hq$/)
  await page.screenshot({ path: 'test-results/screens/2-hq.png' })
  await page.goto('/case/001/scene')
  await ring(page, 'Rotary Telephone').hover()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'test-results/screens/3a-scene-hover.png' })

  await closeUpShot(page, 'Newspaper Clippings', '5-closeup-clippings.png')
  await closeUpShot(page, "Clara's Diary", '6-closeup-diary.png')
  await closeUpShot(page, 'Torn Family Photograph', '7-closeup-photo.png')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'test-results/screens/4-scene-phone.png' })
})
