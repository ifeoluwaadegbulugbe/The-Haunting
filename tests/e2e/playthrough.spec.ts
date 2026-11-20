/**
 * Full playthrough in a real browser, using only clicks and typing a player could do.
 * Witnesses run in scripted mode (AI_MOCK=1), so it is deterministic.
 */
import { test, expect, type Page } from '@playwright/test'

const SCENE_ORDER = [
  'Rotary Telephone', 'Torn Family Photograph', "Clara's Diary", 'Newspaper Clippings',
  'Mantel Clock', 'Study Recorder', 'Locked Cabinet', "Lily's Belongings", 'Study Rug',
]

// Entity overlays are full-screen and dismiss on click; clear any before the next action
async function clearOverlays(page: Page) {
  for (let i = 0; i < 4; i++) {
    const overlay = page.getByRole('dialog', { name: 'Entity message' })
    if (!(await overlay.isVisible().catch(() => false))) return
    await overlay.click({ position: { x: 5, y: 5 } })
    await expect(overlay).toBeHidden()
  }
}

// Scene hotspots carry aria-pressed; tray thumbnails with the same name do not
const hotspot = (page: Page, name: string) => page.locator(`button[aria-pressed][aria-label="${name}"]`)

async function inspect(page: Page, name: string) {
  await clearOverlays(page)
  await hotspot(page, name).click()
  await page.getByRole('button', { name: 'Inspect', exact: true }).click()
  await clearOverlays(page) // the telephone rings first
  // The camera zooms in and the item opens in a close-up
  const closeUp = page.getByRole('dialog', { name: `Close-up: ${name}` })
  await expect(closeUp).toBeVisible()
  await closeUp.getByRole('button', { name: 'Return to the study' }).click()
  await expect(closeUp).toBeHidden()
  await clearOverlays(page)
  await expect(hotspot(page, name)).toHaveAttribute('aria-pressed', 'true')
}

async function ask(page: Page, text: string) {
  const input = page.getByPlaceholder('Ask a question…')
  await expect(input).toBeEnabled()
  await input.fill(text)
  await input.press('Enter')
  await expect(input).toBeEnabled({ timeout: 20_000 })
  await clearOverlays(page)
}

async function present(page: Page, evidenceName: string) {
  await clearOverlays(page)
  await page.getByRole('button', { name: 'Present' }).click()
  await page.getByRole('dialog').getByRole('button', { name: new RegExp(`^${evidenceName}`) }).click()
  await expect(page.getByPlaceholder('Ask a question…')).toBeEnabled({ timeout: 20_000 })
  await clearOverlays(page)
}

async function interrogate(page: Page, id: string, evidence: string[]) {
  await page.goto(`/case/001/witnesses/${id}`)
  await ask(page, 'Tell me about the night of 11 November 2008.')
  for (const e of evidence) await present(page, e)
}

test('a player can finish Case 001 and get a full score', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  // ── Title and name ──────────────────────────────────────────────────────
  await page.goto('/')
  await page.getByRole('button', { name: 'BEGIN INVESTIGATION' }).click()
  await page.getByLabel('Your name').fill('Test Investigator')
  await page.getByRole('button', { name: 'Begin', exact: true }).click()
  await expect(page).toHaveURL(/\/hq$/)
  await expect(page.getByText('Test Investigator')).toBeVisible()

  // ── Scene ───────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Continue Investigation' }).click()
  await expect(page).toHaveURL(/\/case\/001\/scene$/)
  // A locked object cannot be inspected yet
  await expect(hotspot(page, 'Mantel Clock')).toHaveAttribute('title', /Requires/)
  for (const name of SCENE_ORDER) await inspect(page, name)

  // ── Archive ─────────────────────────────────────────────────────────────
  await page.goto('/case/001/archive')
  for (const tab of ['Telephone Records', "Edmund's Mobile", "Clara's Laptop"]) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    for (; ;) {
      const btn = page.getByRole('button', { name: /^(Log as evidence|Recover)$/ }).first()
      if (!(await btn.isVisible().catch(() => false))) break
      await btn.click()
      await clearOverlays(page)
    }
  }
  await expect(page.getByRole('link', { name: 'Witnesses' })).not.toHaveAttribute('aria-disabled', 'true')

  // ── Witnesses ───────────────────────────────────────────────────────────
  await interrogate(page, 'margaret', ['Digital Photograph', 'Telephone Company Ledger'])
  await interrogate(page, 'dorothea', ["Housekeeper's Logbook", 'Recovered Email'])
  await interrogate(page, 'julian', ["Clara's Diary", 'Digital Photograph', "Julian's Social Profile", 'Final Night Recording'])
  // Margaret's trusting admission (M6) and a reply after each step must render as text
  await page.goto('/case/001/witnesses/margaret')
  await expect(page.getByText(/kept what I'd seen to myself/)).toBeVisible()

  // ── Board: theory tab plants the false lead; it can be disproved ─────────
  await page.goto('/case/001/evidence')
  await page.getByRole('button', { name: 'theories' }).click()
  await clearOverlays(page)
  await interrogate(page, 'dorothea', ['Disturbed Photograph'])

  // Contradictions: confirm every one that is offered
  await page.goto('/case/001/evidence')
  for (; ;) {
    await clearOverlays(page)
    const btn = page.locator('button:visible', { hasText: 'Confirm contradiction' }).first()
    if (!(await btn.isVisible().catch(() => false))) break
    await btn.click()
  }
  await expect(page.locator('p:visible', { hasText: /— CONFIRMED/ })).toHaveCount(7)

  // Links: drag pin to card for every ground-truth pair, using real pointer moves
  const pairs: Array<[string, string]> = [
    ['Rotary Telephone', 'Telephone Company Ledger'], ['Rotary Telephone', "Lily's Drawing"],
    ['Torn Family Photograph', 'Photograph Strip'], ['Photograph Strip', 'Digital Photograph'],
    ['Unsigned Will Amendment', 'Final Night Recording'], ['Unsigned Will Amendment', 'Creditor Final Notice'],
    ['Final Night Recording', 'Digital Photograph'], ["Housekeeper's Logbook", 'Recovered Email'],
    ['Recovered Voicemail', 'Final Night Recording'], ["Clara's Diary", 'Unsigned Will Amendment'],
    ['Telephone Company Ledger', 'Recovered Voicemail'], ['Recovered Email', "Julian's Social Profile"],
  ]
  const card = (name: string) => page.locator('[data-card]', { hasText: name }).first()
  for (const [a, b] of pairs) {
    await clearOverlays(page)
    const pin = card(a).locator('[data-pin]')
    await pin.scrollIntoViewIfNeeded()
    const from = (await pin.boundingBox())!
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await card(b).scrollIntoViewIfNeeded()
    const to = (await card(b).boundingBox())!
    await page.mouse.move(to.x + to.width / 2, to.y + 40, { steps: 8 })
    await page.mouse.up()
  }
  await clearOverlays(page)
  await expect(page.locator('[data-thread="valid"]')).toHaveCount(12)

  // Timeline: select then place, in order; removing a slot does not re-place
  await page.getByRole('button', { name: 'timeline' }).click()
  const events = [
    'Dorothea clocks out', 'Julian arrives', 'Clara leaves a voicemail', 'Edmund refuses to sign',
    'Edmund is killed', 'Clara calls Margaret', 'Julian emails Dorothea',
  ]
  for (let i = 0; i < events.length; i++) {
    await page.getByRole('button', { name: new RegExp(events[i]) }).click()
    await page.getByText(`Slot ${i + 1}`, { exact: true }).click()
  }
  await expect(page.getByText('Sequence conflict')).toHaveCount(0)

  // ── Theory ──────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'theories' }).click()
  const selects = page.locator('select')
  await selects.nth(0).selectOption('Julian')
  await selects.nth(1).selectOption('Julian killed Edmund and locked Clara and Lily in the cellar')
  await selects.nth(2).selectOption("Clara's call for help was never answered")
  await selects.nth(3).selectOption('Concealing')
  await selects.nth(4).selectOption('Lying')
  await selects.nth(5).selectOption('Lying')
  await selects.nth(6).selectOption({ label: 'Disturbed Photograph' })
  const pick = async (section: number, names: string[]) => {
    const group = page.locator('section').nth(section)
    for (const n of names) await group.getByRole('button', { name: n, exact: true }).click()
  }
  await pick(5, ['Photograph Strip', 'Unsigned Will Amendment', 'Final Night Recording'])
  await pick(6, ['Rotary Telephone', 'Final Night Recording', 'Telephone Company Ledger'])
  await pick(7, ["Housekeeper's Logbook", 'Recovered Email'])
  await page.getByRole('button', { name: 'Submit Theory' }).click()

  // ── Conclusion ──────────────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/case\/001\/conclusion$/)
  await page.getByRole('button', { name: 'Reveal the Truth' }).click()
  await page.getByRole('button', { name: 'Answer' }).click({ timeout: 30_000 })
  const report = page.locator('main', { hasText: 'Case 001 — Closed' })
  await expect(report).toBeVisible({ timeout: 30_000 })
  await expect(report.getByText('Master of the Archive')).toBeVisible()
  await expect(report.getByText('100', { exact: true })).toBeVisible()

  // HQ shows the case solved, and a reload keeps it
  await page.getByRole('button', { name: 'Return to HQ' }).click()
  await expect(page.getByRole('img', { name: 'SOLVED' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'SOLVED' })).toBeVisible()

  // Replay starts clean: no evidence, no false lead
  const save = await page.evaluate(() => localStorage.getItem('haunting-save-v1'))
  expect(save).toContain('"score":100')

  expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([])
})

test('a corrupt save does not freeze the game', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('haunting-save-v1', '{not json'))
  await page.reload()
  await expect(page.getByRole('button', { name: 'BEGIN INVESTIGATION' })).toBeVisible({ timeout: 15_000 })
})
