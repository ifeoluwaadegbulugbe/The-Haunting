/**
 * The demo video, recorded as one scripted tour (not part of the test suite).
 * Later scenes start from a prepared save so the tour fits in under three minutes.
 */
import { test, type Page } from '@playwright/test'
import { handleInterruptions } from '../e2e/helpers'

const SAVE = 'haunting-save-v1'
const wait = (page: Page, s: number) => page.waitForTimeout(s * 1000)

/** A lower-third caption, drawn over the page. */
async function caption(page: Page, text: string, sub = '', atTop = false) {
  await page.evaluate(([t, s, top]) => {
    document.getElementById('demo-cap')?.remove()
    const el = document.createElement('div')
    el.id = 'demo-cap'
    el.style.cssText = 'position:fixed;left:50%;' + (top ? 'top:36px;' : 'bottom:36px;') + 'transform:translateX(-50%);z-index:99999;pointer-events:none;' +
      'background:rgba(10,8,12,0.86);border:1px solid #A58A60;border-radius:6px;padding:12px 26px;max-width:880px;text-align:center;' +
      'font-family:Georgia,serif;color:#EADFC9;box-shadow:0 10px 30px rgba(0,0,0,0.6);opacity:0;transition:opacity .4s'
    el.innerHTML = `<div style="font-size:24px;line-height:1.25">${t}</div>` +
      (s ? `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#B9A98C;margin-top:4px">${s}</div>` : '')
    document.body.appendChild(el)
    requestAnimationFrame(() => { el.style.opacity = '1' })
  }, [text, sub, atTop] as const)
}
const clearCaption = (page: Page) => page.evaluate(() => document.getElementById('demo-cap')?.remove())

/** A full-screen title card. */
async function card(page: Page, title: string, sub: string, seconds: number) {
  await page.evaluate(([t, s]) => {
    const el = document.createElement('div')
    el.id = 'demo-card'
    el.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#0E0C10;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:18px;text-align:center;font-family:Georgia,serif;color:#EADFC9;padding:60px'
    el.innerHTML = `<div style="font-size:46px;letter-spacing:0.08em">${t}</div>` +
      `<div style="width:120px;height:1px;background:#A58A60"></div>` +
      `<div style="font-family:Inter,Arial,sans-serif;font-size:20px;line-height:1.6;color:#B9A98C;max-width:860px">${s}</div>`
    document.body.appendChild(el)
  }, [title, sub])
  await wait(page, seconds)
  await page.evaluate(() => document.getElementById('demo-card')?.remove())
}

/** Write a save and open a page with it. */
async function withSave(page: Page, path: string, state: Record<string, unknown>) {
  await page.evaluate(([key, s]) => {
    localStorage.setItem(key as string, JSON.stringify({ state: { version: 2, investigator: { name: 'Ada', startedAt: 1 }, ...(s as object) }, version: 0 }))
  }, [SAVE, state] as const)
  await page.goto(path)
}

const held = (ids: string[]) => Object.fromEntries(ids.map((id, i) => [id, { at: i + 1, flags: [] }]))
const STUDY = ['EV-01', 'EV-02', 'EV-03', 'EV-04', 'EV-05', 'EV-06', 'EV-07', 'EV-08', 'EV-09', 'EV-10']
const ALL = [...STUDY, 'EV-11', 'EV-12', 'EV-13', 'EV-14', 'EV-15', 'EV-X1', 'EV-17', 'EV-18']
const SEEN = ['assignment', 'chapter-1', 'chapter-2', 'chapter-3']
const OBJECTS = ['OBJ-telephone', 'OBJ-photograph', 'OBJ-diary', 'OBJ-clippings', 'OBJ-clock', 'OBJ-recorder', 'OBJ-cabinet', 'OBJ-belongings', 'OBJ-rug']

test('demo video', async ({ page }) => {
  await handleInterruptions(page)

  // ── 1. Title ─────────────────────────────────────────────────────────────
  await page.goto('/')
  await card(page, 'THE HAUNTING', 'A paranormal investigation game, built with Kiro<br>Kiroween 2026 · Frankenstein', 4)
  await page.getByRole('button', { name: 'Enter the archive' }).click()
  await caption(page, 'Case 001: The House That Calls Back', 'In 2008 the Ashworth family vanished. Every night at 11:13, their phone still rings.')
  await wait(page, 4.5)
  await page.getByRole('button', { name: 'BEGIN INVESTIGATION' }).click()
  await page.getByLabel('Your name').pressSequentially('Ada', { delay: 120 })
  await wait(page, 0.6)
  await page.getByRole('button', { name: 'Begin', exact: true }).click()
  await page.waitForURL(/\/hq$/)

  // ── 2. The study ─────────────────────────────────────────────────────────
  await withSave(page, '/case/001/scene', { seenCinematics: ['assignment'] })
  await caption(page, 'Search the study', 'Nine objects. Some stay locked until you hold the item that opens them.')
  await wait(page, 4)
  const hotspot = (name: string) => page.locator(`button[aria-pressed][aria-label="${name}"]`)
  await hotspot('Rotary Telephone').click()
  await wait(page, 1.5)
  await page.getByRole('button', { name: 'Inspect', exact: true }).click()
  await caption(page, 'The entity is watching too', 'Clara\u2019s echo reacts to what you find. It can mislead you, but never change the truth.')
  await wait(page, 5)
  const overlay = page.getByRole('dialog', { name: 'Entity message' })
  if (await overlay.isVisible().catch(() => false)) await overlay.click({ position: { x: 5, y: 5 } })
  const closeTel = page.getByRole('dialog', { name: 'Close-up: Rotary Telephone' })
  await closeTel.waitFor({ timeout: 10_000 }).catch(() => { })
  await wait(page, 3)
  await closeTel.getByRole('button', { name: 'Return to the study' }).click().catch(() => { })
  await wait(page, 1)
  await hotspot("Clara's Diary").click()
  await page.getByRole('button', { name: 'Inspect', exact: true }).click()
  await caption(page, 'Every clue is a real object', 'Turn it over, magnify it, read it. Hidden details reward a careful eye.')
  await wait(page, 4.5)
  await page.getByRole('dialog', { name: "Close-up: Clara's Diary" }).getByRole('button', { name: 'Return to the study' }).click().catch(() => { })
  await wait(page, 1)

  // ── 3. Digital Archives ──────────────────────────────────────────────────
  await withSave(page, '/case/001/archive', { seenCinematics: SEEN, collectedEvidence: held(STUDY), inspectedObjects: OBJECTS })
  await page.getByRole('button', { name: "Edmund's Mobile", exact: true }).click()
  await caption(page, 'Recovered devices from 2008', 'Enhance Edmund\u2019s last photograph until the number plate can be read.')
  await wait(page, 2.5)
  const photo = page.getByRole('button', { name: /Photograph: click a spot/ })
  const box = (await photo.boundingBox())!
  await page.mouse.click(box.x + box.width * 0.41, box.y + box.height * 0.75)
  await wait(page, 2.5)
  const zoomed = page.getByRole('button', { name: /Enhanced photograph/ })
  const z = (await zoomed.boundingBox())!
  await page.mouse.click(z.x + z.width * 0.619, z.y + z.height * 0.836)
  await wait(page, 4)
  await page.getByRole('button', { name: "Clara's Laptop", exact: true }).click()
  await caption(page, 'Clara\u2019s laptop is locked', 'The password is somewhere in her diary. Ask for a hint if you are stuck.')
  await wait(page, 2)
  await page.getByRole('button', { name: 'Need a hint?' }).click()
  await wait(page, 3)
  await page.getByLabel('Laptop password').pressSequentially('lily14', { delay: 160 })
  await page.getByRole('button', { name: 'Unlock' }).click()
  await wait(page, 2)
  await caption(page, 'Rebuild a deleted voicemail', 'Scrub the damaged tape to piece Clara\u2019s last message back together.')
  const tape = page.getByLabel('Scrub the recording')
  // The tape is restored (and the slider locks) once it reaches 95
  for (let v = 0; v <= 95; v += 5) { await tape.fill(String(v)); await wait(page, 0.15) }
  await wait(page, 3.5)

  // ── 4. Witnesses ─────────────────────────────────────────────────────────
  await withSave(page, '/case/001/witnesses/margaret', {
    seenCinematics: SEEN, collectedEvidence: held(ALL), inspectedObjects: OBJECTS,
    recoveredRecords: ['DR-voicemail', 'DR-email'], witnessTrust: { margaret: 50, dorothea: 50, julian: 50 },
  })
  await caption(page, 'Question three witnesses', 'AI writes the words. Code decides the facts: a witness can only reveal what you have earned.')
  await wait(page, 3)
  const input = page.getByPlaceholder('Ask a question…')
  await input.pressSequentially('Did anyone call you that night?', { delay: 45 })
  await input.press('Enter')
  await wait(page, 5)
  await caption(page, 'Catch them in a lie', 'Present the telephone ledger. The 23:13 call reached Margaret\u2019s house.')
  await page.getByRole('button', { name: 'Present' }).click()
  await wait(page, 1.5)
  await page.getByRole('dialog').getByRole('button', { name: /^Telephone Company Ledger/ }).click()
  await wait(page, 8)
  const ov = page.getByRole('dialog', { name: 'Entity message' })
  if (await ov.isVisible().catch(() => false)) { await wait(page, 2); await ov.click({ position: { x: 5, y: 5 } }) }
  await wait(page, 2)

  // ── 5. Evidence board ────────────────────────────────────────────────────
  await withSave(page, '/case/001/evidence', {
    seenCinematics: SEEN, collectedEvidence: held(ALL), inspectedObjects: OBJECTS,
    revealedFacts: ['M3', 'M4', 'M5', 'D2', 'D3', 'D4', 'J2', 'J4', 'J5'],
    contradictionsFlagged: ['CX-01', 'CX-02', 'CX-03'],
    links: [
      { a: 'EV-01', b: 'EV-11', verdict: 'valid' }, { a: 'EV-06', b: 'EV-07', verdict: 'valid' },
      { a: 'EV-06', b: 'EV-10', verdict: 'valid' }, { a: 'EV-07', b: 'EV-14', verdict: 'valid' },
      { a: 'EV-08', b: 'EV-13', verdict: 'valid' }, { a: 'EV-02', b: 'EV-05', verdict: 'valid' },
    ],
    entity: { attention: 55, stage: 2, firedRules: ['ER-01', 'ER-02', 'ER-03', 'ER-06'], disturbed: [], lockedObjects: [], locks: {}, messages: [] },
  })
  await caption(page, 'Pin it to the board', 'Connect evidence with red string, flag contradictions and set the night in order.')
  await wait(page, 5)
  await caption(page, 'Not everything points one way', 'Red herrings implicate the neighbour and the housekeeper. The entity plants a fake photograph.')
  await wait(page, 5)

  // ── 6. Forensics lab ─────────────────────────────────────────────────────
  await withSave(page, '/case/001/lab', {
    seenCinematics: SEEN, collectedEvidence: held(ALL), inspectedObjects: OBJECTS,
    contradictionsFlagged: ['CX-01'], forensics: ['F-jigsaw', 'F-plate'],
  })
  await caption(page, 'The forensics lab', 'Dust for prints, rebuild photographs, run the plate. The killer profile narrows the suspects.')
  await wait(page, 5.5)

  // ── 7. The confrontation and the ending ─────────────────────────────────
  await withSave(page, '/case/001/conclusion', {
    seenCinematics: SEEN, collectedEvidence: held(ALL), inspectedObjects: OBJECTS,
    calls: { 'CALL-1': 'answered', 'CALL-2': 'answered' }, fragments: ['CF-1', 'CF-2', 'CF-3', 'CF-4'],
    contradictionsFlagged: ['CX-01', 'CX-02', 'CX-03'],
    revealedFacts: ['M3', 'M4', 'M5', 'D2', 'D3', 'D4', 'J2', 'J4'],
    theory: {
      culprit: 'Julian', whatHappened: 'Julian killed Edmund and locked Clara and Lily in the cellar',
      whyCallsContinue: "Clara's call for help was never answered",
      timelinePlacement: { 0: 'TL-01', 1: 'TL-02', 2: 'TL-03', 3: 'TL-04', 4: 'TL-05', 5: 'TL-06', 6: 'TL-07' },
      witnessReliability: { margaret: 'Concealing', dorothea: 'Lying', julian: 'Lying' },
      manipulatedEvidence: 'EV-X1',
      supportingEvidence: { culpritAndMotive: ['EV-05', 'EV-06', 'EV-07'], timeline: ['EV-01', 'EV-07', 'EV-11'], coverUp: ['EV-08', 'EV-13'] }, summary: '',
    },
  })
  await caption(page, 'Name the killer', 'A deterministic engine scores your theory out of 100.')
  await wait(page, 3)
  await clearCaption(page)
  await page.getByRole('button', { name: 'Reveal the Truth' }).click()
  await wait(page, 2)
  await caption(page, 'Face Julian', 'Answer each of his defences with the evidence that breaks it.')
  const pick = (ev: string) => page.getByRole('list', { name: 'Your evidence' }).getByRole('button', { name: ev, exact: true }).click()
  for (const ev of ['Digital Photograph', 'Final Night Recording', 'Unsigned Will Amendment', 'Recovered Email', 'Telephone Company Ledger']) {
    await wait(page, 1.2)
    await pick(ev)
    await wait(page, 1.8)
    await page.getByRole('button', { name: 'Press on' }).click()
  }
  await clearCaption(page)
  await wait(page, 4.5)
  await page.getByRole('button', { name: 'Leave the court' }).click()
  await page.getByRole('button', { name: 'Answer' }).click({ timeout: 30_000 })
  await caption(page, 'The truth, in her own words', 'Clara\u2019s voice from the cellar, then the final night, step by step.')
  await wait(page, 5)
  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 60_000 })
  await page.getByText('THE WITNESSES, RECONSIDERED').waitFor()
  await clearCaption(page)
  await wait(page, 2.5)
  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Go down to the cellar' }).click({ timeout: 30_000 })
  await wait(page, 2)
  await page.getByRole('button', { name: 'Answer the cellar phone' }).click({ timeout: 15_000 })
  await caption(page, 'The entity remembers', 'How you treated her decides how the house falls quiet.', true)
  await wait(page, 7)
  await clearCaption(page)

  // ── 8. Built with Kiro ───────────────────────────────────────────────────
  await card(page, 'Built with Kiro',
    'Steering keeps the case file sacred and the AI on a leash.<br>Seven specs, from the foundation to the entity.<br>' +
    'Hooks check case data, colour tokens and secrets on every save.<br><br>' +
    'Next.js · TypeScript · Zustand · Gemini · Web Audio · Playwright', 7)
  await card(page, 'THE HAUNTING', 'INVESTIGATE · UNCOVER · BE FOUND<br><br>github.com/ifeoluwaadegbulugbe/The-Haunting', 4)
})
