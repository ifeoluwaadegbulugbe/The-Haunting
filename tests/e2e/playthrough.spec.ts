/**
 * Full playthrough in a real browser, using only clicks and typing a player could do.
 * Witnesses run in scripted mode (AI_MOCK=1), so it is deterministic.
 */
import { test, expect, type Page } from '@playwright/test'
import { handleInterruptions } from './helpers'

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
  // The whole case, including searches, the lab and the confrontation
  test.setTimeout(420_000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  // Calls, chapter endings and memories can interrupt at any point; this investigator answers them
  const seen = await handleInterruptions(page)

  // ── Title and name ──────────────────────────────────────────────────────
  await page.goto('/')
  // The sound gate comes first (browsers need a click before audio can play)
  await page.getByRole('button', { name: 'Enter the archive' }).click()
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
  // The next lead is always there, folded, and says what is left in the study
  await page.getByRole('button', { name: 'Next lead' }).click()
  await expect(page.getByRole('status', { name: 'Next lead' })).toContainText('Still to search')
  await page.getByRole('button', { name: 'Hide the next lead' }).click()
  for (const name of SCENE_ORDER) await inspect(page, name)

  // ── A timed search of the study earns stars ─────────────────────────────
  await clearOverlays(page)
  await page.getByRole('link', { name: 'Search the study' }).click()
  await page.getByRole('button', { name: 'Play Search' }).click()
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: /^Find: / }).first().click()
  const results = page.getByRole('dialog', { name: 'Search results' })
  await expect(results.getByText('Search complete')).toBeVisible()
  await expect(results.getByLabel(/[1-5] of 5 stars/)).toBeVisible()
  await expect(results.getByRole('button', { name: 'Play By Candlelight' })).toBeEnabled()
  await results.getByRole('link', { name: 'Back to the room' }).click()
  await expect(page).toHaveURL(/\/case\/001\/scene$/)

  // ── Lily's room (optional, by torchlight) ───────────────────────────────
  await clearOverlays(page)
  await page.getByRole('link', { name: /Lily.s room/ }).click()
  await expect(page).toHaveURL(/\/case\/001\/lily-room$/)
  for (const [spot, gate] of [['Toy Shelf', 'Lift it up'], ['Wardrobe', 'Open the wardrobe']] as const) {
    await page.locator(`button[aria-pressed][aria-label="${spot}"]`).click()
    const panel = page.getByRole('dialog', { name: spot })
    await panel.getByRole('button', { name: gate }).click()
    await panel.getByRole('button', { name: 'Take it' }).click()
    await expect(panel.getByText('Logged in your evidence.')).toBeVisible()
    await panel.getByRole('button', { name: 'Back to the room' }).click()
  }
  await expect(page.getByText(/Hidden here: 2 of 2/)).toBeVisible()
  await page.getByRole('link', { name: 'Back to the study' }).click()
  await expect(page).toHaveURL(/\/case\/001\/scene$/)

  // ── Archive ─────────────────────────────────────────────────────────────
  // Once the study is searched, the next lead points to the archive
  await clearOverlays(page)
  const lead = page.getByRole('status', { name: 'Next lead' })
  await expect(lead).toContainText('The study is searched')
  await lead.getByRole('button', { name: 'Open the Digital Archives' }).click()
  await expect(page).toHaveURL(/\/case\/001\/archive$/)
  for (const tab of ['Telephone Records', "Edmund's Mobile", "Clara's Laptop"]) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    if (tab === "Edmund's Mobile") {
      // Enhance the photo: first the car, then its number plate
      const photo = page.getByRole('button', { name: /Photograph: click a spot/ })
      const box = (await photo.boundingBox())!
      await page.mouse.click(box.x + box.width * 0.41, box.y + box.height * 0.75)
      const zoomed = page.getByRole('button', { name: /Enhanced photograph/ })
      await expect(zoomed).toBeVisible()
      const z = (await zoomed.boundingBox())!
      await page.mouse.click(z.x + z.width * 0.619, z.y + z.height * 0.836)
      await expect(page.getByText('J4 ASH', { exact: true }).last()).toBeVisible()
      // The photo, the cached profile and Margaret's text (a red herring) can now be logged
      await expect(page.getByRole('button', { name: 'Log as evidence' })).toHaveCount(3, { timeout: 10_000 })
    }
    if (tab === "Clara's Laptop") {
      // A hint can be asked for before guessing
      await page.getByRole('button', { name: 'Need a hint?' }).click()
      await expect(page.getByRole('status').filter({ hasText: /diary/ })).toBeVisible()
      // The password is pencilled in Clara's diary; a wrong guess is refused
      await page.getByLabel('Laptop password').fill('clara')
      await page.getByRole('button', { name: 'Unlock' }).click()
      await expect(page.getByText(/Incorrect password/)).toBeVisible()
      await page.getByLabel('Laptop password').fill('lily14')
      await page.getByRole('button', { name: 'Unlock' }).click()
      // The deleted voicemail is rebuilt by scrubbing the damaged tape
      await page.getByLabel('Scrub the recording').fill('100')
      await expect(page.getByText('Message restored.')).toBeVisible()
      await expect(page.getByRole('img', { name: 'RECOVERED' })).toHaveCount(1, { timeout: 10_000 })
    }
    for (; ;) {
      const btn = page.getByRole('button', { name: /^(Log as evidence|Recover)$/ }).first()
      if (!(await btn.isVisible().catch(() => false))) break
      await btn.click()
      await clearOverlays(page)
    }
  }
  // Both deleted laptop records (voicemail and email) are back
  await expect(page.getByRole('img', { name: 'RECOVERED' })).toHaveCount(2)
  await expect(page.getByRole('link', { name: 'Witnesses' })).not.toHaveAttribute('aria-disabled', 'true')

  // ── Forensics lab: bench work, a lab wait skipped with a star, the profile ─
  await page.getByRole('link', { name: 'Lab', exact: true }).click()
  await expect(page).toHaveURL(/\/case\/001\/lab$/)
  const task = (name: string) => page.getByRole('listitem').filter({ has: page.getByRole('heading', { name }) })
  await task('Rebuild the Torn Photograph').getByRole('button', { name: 'Start' }).click()
  for (let p = 0; p < 6; p++) {
    const tile = page.getByRole('button', { name: /^Piece \d/ }).nth(p)
    if ((await tile.getAttribute('aria-label')) === `Piece ${p + 1}`) continue
    await tile.click()
    await page.getByRole('button', { name: `Piece ${p + 1}`, exact: true }).click()
  }
  await expect(page.getByRole('dialog', { name: 'Lab report' })).toContainText('signet ring', { timeout: 10_000 })
  await page.getByRole('button', { name: 'File it' }).click()
  await task('Pencil Rubbing of the Diary').getByRole('button', { name: 'Start' }).click()
  const page2 = page.getByRole('button', { name: /^Rub the pencil/ })
  await page2.focus()
  for (let i = 0; i < 5; i++) await page2.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Lab report' })).toContainText('cellar telephone', { timeout: 10_000 })
  await page.getByRole('button', { name: 'File it' }).click()
  await task('Run the Number Plate').getByRole('button', { name: 'Send to the lab' }).click()
  await task('Run the Number Plate').getByRole('button', { name: /Speed up/ }).click()
  await task('Run the Number Plate').getByRole('button', { name: 'Read the report' }).click()
  await expect(page.getByRole('dialog', { name: 'Lab report' })).toContainText('J4 ASH')
  await page.getByRole('button', { name: 'File it' }).click()
  await expect(page.getByRole('complementary', { name: 'Killer profile' })).toContainText('Drives a green Mercedes, J4 ASH')

  // ── Witnesses ───────────────────────────────────────────────────────────
  await interrogate(page, 'margaret', ['Digital Photograph', 'Telephone Company Ledger'])
  await interrogate(page, 'dorothea', ["Housekeeper's Logbook", 'Recovered Email'])
  await interrogate(page, 'julian', ["Clara's Diary", 'Digital Photograph', "Julian's Social Profile", 'Final Night Recording'])
  // Challenge a claim: the Lisbon alibi against the social post proves CX-04; the diary does not
  await page.getByRole('button', { name: 'Challenge', exact: true }).click()
  await page.getByRole('button', { name: /^Challenge: I was in Lisbon/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: /^Clara's Diary/ }).click()
  await expect(page.getByRole('img', { name: 'IT HOLDS' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByPlaceholder(/Ask a question/)).toBeEnabled({ timeout: 20_000 })
  await clearOverlays(page)
  await page.getByRole('button', { name: 'Challenge', exact: true }).click()
  await page.getByRole('button', { name: /^Challenge: I was in Lisbon/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: /^Julian's Social Profile/ }).click()
  await expect(page.getByRole('img', { name: /^(CONTRADICTED|ALREADY PROVEN)$/ })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByPlaceholder(/Ask a question/)).toBeEnabled({ timeout: 20_000 })
  await clearOverlays(page)
  // The notebook has written up the case so far
  await page.getByRole('button', { name: 'Notebook' }).click()
  const notebook = page.getByRole('dialog', { name: "Investigator's notebook" })
  await expect(notebook).toContainText('Who is calling at 11:13?')
  await expect(notebook).toContainText('Ext 2, the cellar line')
  await notebook.getByRole('button', { name: 'Close the notebook' }).click()
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
  // The confrontation: answer each point of Julian's defence (one wrong answer first)
  const court = page.getByRole('list', { name: 'Your evidence' })
  await court.getByRole('button', { name: "Clara's Diary" }).click()
  await expect(page.getByRole('img', { name: 'OVERRULED' })).toBeVisible()
  await page.getByRole('button', { name: 'Try again' }).click()
  for (const ev of ['Digital Photograph', 'Final Night Recording', 'Unsigned Will Amendment', 'Recovered Email', 'Telephone Company Ledger']) {
    await court.getByRole('button', { name: ev, exact: true }).click()
    await expect(page.getByRole('img', { name: 'OBJECTION SUSTAINED' })).toBeVisible()
    await page.getByRole('button', { name: 'Press on' }).click()
  }
  await expect(page.getByRole('img', { name: 'GUILTY' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/Convincing \(1 wrong answer\)/)).toBeVisible()
  await page.getByRole('button', { name: 'Leave the court' }).click()
  await page.getByRole('button', { name: 'Answer' }).click({ timeout: 30_000 })
  // The reveal walks back through the night, the witnesses and the entity
  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 60_000 })
  await expect(page.getByText('THE WITNESSES, RECONSIDERED')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Go down to the cellar' }).click({ timeout: 30_000 })
  // The cellar extension rings one last time; how it ends depends on the calls answered
  await page.getByRole('button', { name: 'Answer the cellar phone' }).click({ timeout: 15_000 })
  await expect(page.getByText(seen.calls >= 2 ? /Thank you for answering/ : /That will have to be enough/)).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Leave the cellar' }).click()
  const report = page.locator('main', { hasText: 'Case 001 — Closed' })
  await expect(report).toBeVisible({ timeout: 30_000 })
  // The rank line; the achievement chip of the same name is also on the card
  await expect(report.getByText('Master of the Archive').first()).toBeVisible()
  await expect(report.getByText('Hidden details found')).toBeVisible()
  await expect(report.getByText('100', { exact: true })).toBeVisible()

  // HQ shows the case solved, and a reload keeps it
  await page.getByRole('button', { name: 'Return to HQ' }).click()
  await expect(page.getByRole('img', { name: 'SOLVED' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'SOLVED' })).toBeVisible()

  // Replay starts clean: no evidence, no false lead
  const save = await page.evaluate(() => localStorage.getItem('haunting-save-v1'))
  expect(save).toContain('"score":100')

  // At least the first 11:13 call rang during the investigation and was answered
  expect(seen.calls).toBeGreaterThan(0)
  // Every chapter ended with its cliffhanger
  expect(seen.chapters).toBeGreaterThanOrEqual(3)
  for (const ch of ['chapter-1', 'chapter-2', 'chapter-3']) expect(save).toContain(ch)
  expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([])
})

test('a corrupt save does not freeze the game', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('haunting-save-v1', '{not json'))
  await page.reload()
  await expect(page.getByRole('button', { name: 'Enter the archive' })).toBeVisible({ timeout: 15_000 })
})

test('the case assignment plays from the HQ telephone', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Enter the archive' }).click()
  await page.getByRole('button', { name: 'BEGIN INVESTIGATION' }).click()
  await page.getByLabel('Your name').fill('Ada')
  await page.getByRole('button', { name: 'Begin', exact: true }).click()
  await expect(page.getByText('The telephone is ringing.')).toBeVisible()
  await page.locator('button[aria-pressed][aria-label="Telephone"]').click()
  const film = page.getByRole('dialog', { name: 'Case assignment' })
  await film.getByRole('button', { name: 'Answer' }).click()
  await expect(film.getByText('Investigator Ada.')).toBeVisible({ timeout: 10_000 })
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(3600)
    await page.mouse.click(720, 450)
  }
  await film.getByRole('button', { name: 'Break the seal' }).click({ timeout: 10_000 })
  await expect(film.getByText('YOUR OBJECTIVES')).toBeVisible({ timeout: 10_000 })
  await film.getByRole('button', { name: 'Enter Ashworth House' }).click({ timeout: 10_000 })
  await expect(page).toHaveURL(/\/case\/001\/scene$/)
  // Coming back, the phone has stopped ringing
  await page.goto('/hq')
  await expect(page.getByText('The case file is on your desk.')).toBeVisible()
})