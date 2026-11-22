// Visual check of the chapter card, the confrontation and the cellar ending. Not a pass/fail journey.
import { test, type Page } from '@playwright/test'

const shot = (page: Page, name: string) => page.screenshot({ path: `test-results/screens/${name}.png` })
const ALL = ['EV-01', 'EV-02', 'EV-03', 'EV-04', 'EV-05', 'EV-06', 'EV-07', 'EV-08', 'EV-09', 'EV-10', 'EV-11', 'EV-12', 'EV-13', 'EV-14', 'EV-15', 'EV-X1']

test('finale screens', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/')
  await page.evaluate((ids) => {
    const collectedEvidence = Object.fromEntries(ids.map((id, i) => [id, { at: i + 1, flags: [] }]))
    localStorage.setItem('haunting-save-v1', JSON.stringify({
      state: {
        version: 2, investigator: { name: 'Ada', startedAt: 1 }, collectedEvidence, seenCinematics: ['assignment'],
        calls: { 'CALL-1': 'answered', 'CALL-2': 'answered' }, fragments: ['CF-1', 'CF-2'],
      }, version: 0
    }))
  }, ALL)

  // Chapter 1's ending shows on the next case page
  await page.goto('/case/001/scene')
  await page.waitForTimeout(5000)
  await shot(page, '40-chapter-card')

  // Straight to the conclusion with a full theory
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('haunting-save-v1')!)
    raw.state.seenCinematics = ['assignment', 'chapter-1', 'chapter-2', 'chapter-3']
    raw.state.contradictionsFlagged = ['CX-01', 'CX-02', 'CX-03']
    raw.state.revealedFacts = ['M3', 'M4', 'M5', 'D2', 'D3', 'D4', 'J2', 'J4']
    raw.state.theory = {
      culprit: 'Julian', whatHappened: 'x', whyCallsContinue: 'y', timelinePlacement: {}, witnessReliability: {},
      manipulatedEvidence: 'EV-X1', supportingEvidence: { culpritAndMotive: ['EV-14'], timeline: [], coverUp: [] }, summary: '',
    }
    localStorage.setItem('haunting-save-v1', JSON.stringify(raw))
  })
  await page.goto('/case/001/conclusion')
  await page.getByRole('button', { name: 'Reveal the Truth' }).click()
  await page.waitForTimeout(1200)
  await shot(page, '41-confrontation')
  await page.getByRole('list', { name: 'Your evidence' }).getByRole('button', { name: 'Digital Photograph' }).click()
  await page.waitForTimeout(900)
  await shot(page, '42-objection')
  await page.getByRole('button', { name: 'Press on' }).click()
  for (const ev of ['Final Night Recording', 'Unsigned Will Amendment', 'Recovered Email', 'Telephone Company Ledger']) {
    await page.getByRole('list', { name: 'Your evidence' }).getByRole('button', { name: ev, exact: true }).click()
    await page.getByRole('button', { name: 'Press on' }).click()
  }
  await page.waitForTimeout(4000)
  await shot(page, '43-verdict')
  await page.getByRole('button', { name: 'Leave the court' }).click()
  // Skip ahead through the reveal to the cellar
  await page.getByRole('button', { name: 'Answer' }).click({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 60_000 })
  await page.getByText('THE WITNESSES, RECONSIDERED').waitFor()
  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Go down to the cellar' }).click({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Answer the cellar phone' }).click({ timeout: 15_000 })
  await page.waitForTimeout(2500)
  await shot(page, '44-cellar-ending')
})
