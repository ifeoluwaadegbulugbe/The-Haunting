// Captures key screens for a visual check. Not part of the pass/fail playthrough.
import { test, type Page } from '@playwright/test'
import { handleInterruptions } from './helpers'

const shot = (page: Page, name: string) => page.screenshot({ path: `test-results/screens/${name}.png` })
const ring = (page: Page, name: string) => page.locator(`button[aria-pressed][aria-label="${name}"]`)

async function closeUp(page: Page, name: string, file: string, act?: (p: Page) => Promise<void>) {
  await ring(page, name).click()
  await page.getByRole('button', { name: 'Inspect', exact: true }).click()
  const dlg = page.getByRole('dialog', { name: `Close-up: ${name}` })
  await dlg.waitFor()
  await page.waitForTimeout(800)
  if (act) { await act(page); await page.waitForTimeout(1300) }
  await shot(page, file)
  await dlg.getByRole('button', { name: 'Return to the study' }).click()
  await dlg.waitFor({ state: 'hidden' })
  await page.waitForTimeout(1300)
}

test('screens', async ({ page }) => {
  await handleInterruptions(page)
  test.setTimeout(180_000)
  await page.goto('/')
  await page.waitForTimeout(800)
  await shot(page, '01-gate')
  await page.getByRole('button', { name: 'Enter the archive' }).click()
  await page.waitForTimeout(2500)
  await shot(page, '02-title')
  await page.getByRole('button', { name: 'BEGIN INVESTIGATION' }).click()
  await page.getByLabel('Your name').fill('Ada')
  await page.getByRole('button', { name: 'Begin', exact: true }).click()
  await page.waitForURL(/\/hq$/)
  await page.waitForTimeout(2500)
  await shot(page, '03-hq-room')
  await ring(page, 'Case Cabinet').click()
  await page.waitForTimeout(900)
  await shot(page, '04-hq-archive')
  await page.keyboard.press('Escape')

  await page.goto('/case/001/scene')
  await page.waitForTimeout(2500)
  await shot(page, '05-scene')
  await closeUp(page, 'Newspaper Clippings', '06-clippings', async (p) => { await p.getByRole('button', { name: 'Turn it over' }).click() })
  await closeUp(page, "Clara's Diary", '07-diary-closed')
  await closeUp(page, 'Torn Family Photograph', '08-photo-magnified', async (p) => {
    await p.getByRole('button', { name: 'Magnify more' }).click()
    await p.getByRole('button', { name: 'Magnify more' }).click()
  })
  await closeUp(page, 'Rotary Telephone', '09-telephone')
  await page.waitForTimeout(4500) // the phone rings once (ER-01) before the close-up
  await closeUp(page, 'Study Recorder', '10-tape', async (p) => {
    await p.getByRole('button', { name: 'Play the tape' }).click()
    await p.waitForTimeout(4000)
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  await shot(page, '11-scene-phone')
})
