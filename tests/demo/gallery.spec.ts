/**
 * Devpost gallery images (3:2, 1500x1000): real game screens with a caption band.
 * Run with: npx playwright test -c playwright.demo.config.ts gallery
 */
import { test, type Page } from '@playwright/test'
import { handleInterruptions } from '../e2e/helpers'

test.use({ video: 'off', viewport: { width: 1500, height: 1000 } })

const OUT = 'demo-video/gallery'
const wait = (page: Page, s: number) => page.waitForTimeout(s * 1000)
const held = (ids: string[]) => Object.fromEntries(ids.map((id, i) => [id, { at: i + 1, flags: [] }]))
const STUDY = ['EV-01', 'EV-02', 'EV-03', 'EV-04', 'EV-05', 'EV-06', 'EV-07', 'EV-08', 'EV-09', 'EV-10']
const ALL = [...STUDY, 'EV-11', 'EV-12', 'EV-13', 'EV-14', 'EV-15', 'EV-X1', 'EV-16', 'EV-17', 'EV-18']
const OBJECTS = ['OBJ-telephone', 'OBJ-photograph', 'OBJ-diary', 'OBJ-clippings', 'OBJ-clock', 'OBJ-recorder', 'OBJ-cabinet', 'OBJ-belongings', 'OBJ-rug']
// No calls, partner notes or chapter cards popping up over the shots
const QUIET = {
  seenCinematics: ['assignment', 'chapter-1', 'chapter-2', 'chapter-3'],
  calls: { 'CALL-1': 'answered', 'CALL-2': 'answered', 'CALL-3': 'answered' },
  partnerSeen: ['P-start', 'P-ev07', 'P-ev03', 'P-ev09', 'P-ev14', 'P-cx', 'P-x1', 'P-ev16', 'P-ev17', 'P-ev18', 'P-m4'],
  clockEvents: [new Date().toISOString().slice(0, 10)],
}
const THEORY = {
  culprit: 'Julian', whatHappened: 'Julian killed Edmund and locked Clara and Lily in the cellar',
  whyCallsContinue: "Clara's call for help was never answered",
  timelinePlacement: { 0: 'TL-01', 1: 'TL-02', 2: 'TL-03', 3: 'TL-04', 4: 'TL-05', 5: 'TL-06', 6: 'TL-07' },
  witnessReliability: { margaret: 'Concealing', dorothea: 'Lying', julian: 'Lying' },
  manipulatedEvidence: 'EV-X1',
  supportingEvidence: { culpritAndMotive: ['EV-05', 'EV-06', 'EV-07'], timeline: ['EV-01', 'EV-07', 'EV-11'], coverUp: ['EV-08', 'EV-13'] }, summary: '',
}
const FULL = {
  ...QUIET, collectedEvidence: held(ALL), inspectedObjects: OBJECTS, recoveredRecords: ['DR-voicemail', 'DR-email'],
  deviceUnlocks: ['laptop', 'photo-enhanced'],
  revealedFacts: ['M3', 'M4', 'M5', 'D2', 'D3', 'D4', 'J2', 'J4', 'J5'],
  contradictionsFlagged: ['CX-01', 'CX-02', 'CX-03'],
  links: [
    { a: 'EV-01', b: 'EV-11', verdict: 'valid' }, { a: 'EV-06', b: 'EV-07', verdict: 'valid' },
    { a: 'EV-06', b: 'EV-10', verdict: 'valid' }, { a: 'EV-07', b: 'EV-14', verdict: 'valid' },
    { a: 'EV-08', b: 'EV-13', verdict: 'valid' }, { a: 'EV-02', b: 'EV-05', verdict: 'valid' },
  ],
  forensics: ['F-jigsaw', 'F-plate', 'F-uv', 'F-prints'],
  witnessTrust: { margaret: 60, dorothea: 40, julian: 20 },
  entity: { attention: 55, stage: 2, firedRules: ['ER-01', 'ER-02', 'ER-03', 'ER-04', 'ER-05', 'ER-06'], disturbed: [], lockedObjects: [], locks: {}, messages: [] },
}

async function withSave(page: Page, path: string, state: Record<string, unknown>) {
  await page.evaluate((s) => {
    localStorage.setItem('haunting-save-v1', JSON.stringify({ state: { version: 2, investigator: { name: 'Ada', startedAt: 1 }, ...s }, version: 0 }))
  }, state)
  await page.goto(path)
}

/** Draw the caption band and save the image. */
async function shot(page: Page, n: number, title: string, line: string, where: 'bottom' | 'top' = 'bottom', k = 1) {
  await page.evaluate(([t, l, w, s]) => {
    document.getElementById('g-cap')?.remove()
    const el = document.createElement('div')
    el.id = 'g-cap'
    const edge = w === 'top' ? 'top:0;background:linear-gradient(180deg,rgba(10,8,12,.95) 55%,transparent)' : 'bottom:0;background:linear-gradient(0deg,rgba(10,8,12,.95) 55%,transparent)'
    el.style.cssText = `position:fixed;left:0;right:0;${edge};z-index:99999;pointer-events:none;padding:${w === 'top' ? '26px 56px 60px' : '60px 56px 30px'};font-family:Georgia,serif;color:#EADFC9;zoom:${s}`
    el.innerHTML = `<div style="font-size:40px;line-height:1.1">${t}</div><div style="font-family:Inter,Arial,sans-serif;font-size:21px;color:#B9A98C;margin-top:8px;max-width:1150px">${l}</div>`
    document.body.appendChild(el)
  }, [title, line, where, k] as const)
  await wait(page, 0.4)
  await page.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 90 })
  await page.evaluate(() => document.getElementById('g-cap')?.remove())
}

async function dismissEntity(page: Page) {
  const ov = page.getByRole('dialog', { name: 'Entity message' })
  for (let i = 0; i < 3 && (await ov.isVisible().catch(() => false)); i++) { await ov.click({ position: { x: 5, y: 5 } }); await wait(page, 0.6) }
}

test('gallery', async ({ page }) => {
  test.setTimeout(300_000)
  await handleInterruptions(page)

  // 1. Title
  await page.goto('/')
  await page.getByRole('button', { name: 'Enter the archive' }).click()
  await wait(page, 3)
  await shot(page, 1, 'Case 001: The House That Calls Back', 'In 2008 the Ashworth family vanished. Every night at 11:13, their house still rings the neighbour\u2019s phone.')

  // 2. The study
  await withSave(page, '/case/001/scene', { ...QUIET, collectedEvidence: held(['EV-01', 'EV-02', 'EV-03']), inspectedObjects: OBJECTS.slice(0, 3) })
  await wait(page, 3)
  await shot(page, 2, 'Search the haunted study', 'Nine illustrated objects. Some stay padlocked until you hold the item that opens them.')

  // 4. Witness: a lie breaks
  await withSave(page, '/case/001/witnesses/margaret', { ...QUIET, collectedEvidence: held(ALL), inspectedObjects: OBJECTS, witnessTrust: { margaret: 50 } })
  const input = page.getByPlaceholder('Ask a question…')
  await input.fill('Did anyone call you that night?')
  await input.press('Enter')
  await wait(page, 3)
  await page.getByRole('button', { name: 'Present' }).click()
  await page.getByRole('dialog').getByRole('button', { name: /^Telephone Company Ledger/ }).click()
  await wait(page, 6)
  await dismissEntity(page)
  await wait(page, 1.5)
  await shot(page, 4, 'Interrogate AI witnesses in your own words', 'They can lie and dodge, but they can only reveal facts you have earned. Present the ledger and Margaret\u2019s story breaks.')

  // 5. Evidence board
  await withSave(page, '/case/001/evidence', FULL)
  await wait(page, 3)
  await dismissEntity(page)
  await shot(page, 5, 'Pin it to the board', 'Red string between clues, contradictions confirmed by rule, and a fake photograph planted by the entity.')

  // 6. Forensics lab
  await withSave(page, '/case/001/lab', FULL)
  await wait(page, 2.5)
  await shot(page, 6, 'The forensics lab and the killer profile', 'Early traits fit more than one suspect. Red herrings point at the neighbour and the housekeeper.')

  // 7–9. Confrontation, final night, cellar
  await withSave(page, '/case/001/conclusion', { ...FULL, fragments: ['CF-1', 'CF-2', 'CF-3', 'CF-4'], theory: THEORY })
  await page.getByRole('button', { name: 'Reveal the Truth' }).click()
  await wait(page, 2)
  await page.getByRole('list', { name: 'Your evidence' }).getByRole('button', { name: 'Digital Photograph', exact: true }).click()
  await wait(page, 1.5)
  await shot(page, 7, 'Face the killer', 'Answer each of Julian\u2019s defences with the evidence that breaks it.')
  await page.getByRole('button', { name: 'Press on' }).click()
  for (const ev of ['Final Night Recording', 'Unsigned Will Amendment', 'Recovered Email', 'Telephone Company Ledger']) {
    await page.getByRole('list', { name: 'Your evidence' }).getByRole('button', { name: ev, exact: true }).click()
    await page.getByRole('button', { name: 'Press on' }).click()
  }
  await page.getByRole('button', { name: 'Leave the court' }).click({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Answer' }).click({ timeout: 30_000 })
  const cont = page.getByRole('button', { name: 'Continue' })
  await cont.waitFor({ timeout: 60_000 })
  // Wait until all seven events of the night are on screen
  await page.getByText(/Julian emails Dorothea/).first().waitFor({ timeout: 60_000 })
  await wait(page, 3)
  await shot(page, 8, 'The truth, step by step', 'A deterministic engine scores your theory out of 100, then replays the final night against what you placed.', 'top')
  await cont.click()
  await page.getByText('THE WITNESSES, RECONSIDERED').waitFor()
  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Go down to the cellar' }).click({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Answer the cellar phone' }).click({ timeout: 15_000 })
  await wait(page, 4)
  await shot(page, 9, 'The entity remembers', 'Calls answered, rooms visited, memories kept: how you treated Clara\u2019s echo decides how the house falls quiet.', 'top')
})

// Same image size (1500x1000), but a smaller window so the phone screen is large enough to read
test('gallery archive', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1050, height: 700 }, deviceScaleFactor: 1500 / 1050, baseURL: 'http://localhost:3100', reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  await handleInterruptions(page)
  await page.goto('/')
  // 3. Digital Archives: the enhanced photograph
  await withSave(page, '/case/001/archive', { ...QUIET, collectedEvidence: held(STUDY), inspectedObjects: OBJECTS })
  await page.getByRole('button', { name: "Edmund's Mobile", exact: true }).click()
  const photo = page.getByRole('button', { name: /Photograph: click a spot/ })
  const b = (await photo.boundingBox())!
  await page.mouse.click(b.x + b.width * 0.41, b.y + b.height * 0.75)
  const zoomed = page.getByRole('button', { name: /Enhanced photograph/ })
  await zoomed.waitFor()
  const z = (await zoomed.boundingBox())!
  await page.mouse.click(z.x + z.width * 0.619, z.y + z.height * 0.836)
  await wait(page, 3)
  await shot(page, 3, 'Recover devices from 2008', 'Enhance Edmund\u2019s last photograph until the plate reads J4 ASH. Crack Clara\u2019s laptop. Rebuild a deleted voicemail.', 'bottom', 1 / 1.43)

  await ctx.close()
})
