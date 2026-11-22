import type { Page } from '@playwright/test'

/**
 * (Overlay buttons shake or slide in, so they are clicked without waiting for them to settle.)
 *
 * Things that can interrupt play at any moment: chapter endings, the 11:13 calls,
 * the real-clock 11:13 event and a found memory. Handle them the way a player would.
 * Returns counters so a test can check they happened.
 */
export async function handleInterruptions(page: Page) {
  const seen = { calls: 0, chapters: 0 }
  await page.addLocatorHandler(page.getByRole('alertdialog', { name: 'Incoming call' }), async () => {
    await page.getByRole('alertdialog', { name: 'Incoming call' }).getByRole('button', { name: 'Answer' }).click({ force: true })
    seen.calls++
  }, { noWaitAfter: true })
  await page.addLocatorHandler(page.getByRole('dialog', { name: /^Chapter \d closed$/ }), async () => {
    await page.getByRole('dialog', { name: /^Chapter \d closed$/ }).first().getByRole('button', { name: 'Continue' }).click({ force: true, timeout: 3000 }).catch(() => { /* the card was already closing */ })
    seen.chapters++
  }, { noWaitAfter: true })
  await page.addLocatorHandler(page.getByRole('alertdialog', { name: 'It is 11:13' }), async () => {
    await page.getByRole('alertdialog', { name: 'It is 11:13' }).getByRole('button', { name: 'Answer' }).click({ force: true })
  }, { noWaitAfter: true })
  await page.addLocatorHandler(page.getByRole('dialog', { name: 'A memory' }), async () => {
    await page.getByRole('dialog', { name: 'A memory' }).getByRole('button', { name: 'Let it go' }).click({ force: true })
  }, { noWaitAfter: true })
  return seen
}
