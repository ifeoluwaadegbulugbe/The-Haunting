import { test, type Page } from '@playwright/test'
import { handleInterruptions } from './helpers'

const shot = (page: Page, name: string) => page.screenshot({ path: `test-results/screens/${name}.png` })

test('new screens', async ({ page }) => {
  await handleInterruptions(page)
  test.setTimeout(120_000)
  await page.goto('/')
  const ev = ['EV-01', 'EV-02', 'EV-03', 'EV-04', 'EV-05', 'EV-06', 'EV-07', 'EV-08', 'EV-09', 'EV-10', 'EV-11', 'EV-14', 'EV-15']
  await page.evaluate((ids) => {
    const collectedEvidence = Object.fromEntries(ids.map((id, i) => [id, { at: i + 1, flags: [] }]))
    localStorage.setItem('haunting-save-v1', JSON.stringify({
      state: {
        version: 2, investigator: { name: 'Ada', startedAt: 1 }, collectedEvidence, seenCinematics: ['assignment'],
        revealedFacts: ['J1', 'J2', 'J3', 'M1', 'M2'], calls: { 'CALL-1': 'answered' },
        links: [{ a: 'EV-01', b: 'EV-11', verdict: 'valid' }, { a: 'EV-02', b: 'EV-05', verdict: 'valid' }],
        timelinePlacement: { '0': 'TL-01', '1': 'TL-02' },
      }, version: 0
    }))
  }, ev)

  await page.goto('/case/001/lily-room')
  await page.waitForTimeout(1200)
  await page.mouse.move(700, 420)
  await page.waitForTimeout(400)
  await shot(page, '20-lily-room')
  await page.getByRole('button', { name: 'Light the lamp' }).click()
  await page.waitForTimeout(1000)
  await shot(page, '28-lily-lit')
  await page.getByRole('button', { name: 'Put out the lamp' }).click()
  await page.locator('button[aria-pressed][aria-label="Wardrobe"]').click()
  await page.getByRole('button', { name: 'Open the wardrobe' }).click()
  await page.waitForTimeout(1600)
  await shot(page, '21-lily-wardrobe')

  // A cut-out object in its close-up
  await page.goto('/case/001/scene')
  await page.waitForTimeout(1500)
  await page.locator('button[aria-pressed][aria-label="Rotary Telephone"]').click()
  await page.getByRole('button', { name: 'Examine', exact: true }).click()
  await page.waitForTimeout(2200)
  await shot(page, '29-telephone-cutout')

  await page.goto('/case/001/archive')
  await page.getByRole('button', { name: "Clara's Laptop", exact: true }).click()
  await page.waitForTimeout(600)
  await shot(page, '22-laptop-lock')
  await page.getByRole('button', { name: "Edmund's Mobile", exact: true }).click()
  await page.waitForTimeout(600)
  await shot(page, '23-photo-enhance')

  await page.goto('/case/001/witnesses/julian')
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: 'Challenge', exact: true }).click()
  await page.waitForTimeout(900)
  await shot(page, '24-challenge')
  await page.goto('/case/001/evidence')
  await page.waitForTimeout(2200)
  await shot(page, '25-board')
  await page.getByRole('button', { name: 'timeline' }).click()
  await page.waitForTimeout(1200)
  await shot(page, '26-timeline')
  await page.getByRole('button', { name: 'Notebook' }).click()
  await page.waitForTimeout(900)
  await shot(page, '27-notebook')
  await page.keyboard.press('Escape')

  await page.goto('/case/001/search/study')
  await page.waitForTimeout(800)
  await shot(page, '30-search-menu')
  await page.getByRole('button', { name: 'Play Search' }).click()
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: /^Find: / }).first().click()
  await page.mouse.click(30, 300)
  await page.waitForTimeout(300)
  await shot(page, '31-search-play')

  await page.goto('/case/001/lab')
  await page.waitForTimeout(1000)
  await shot(page, '32-lab')
  await page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'UV Light on the Will' }) }).getByRole('button', { name: 'Start' }).click()
  await page.waitForTimeout(500)
  await page.mouse.move(700, 450)
  await page.waitForTimeout(300)
  await shot(page, '33-uv')
})
