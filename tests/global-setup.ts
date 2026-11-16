/**
 * Vitest globalSetup — runs once before the test environment is created.
 * We polyfill localStorage here so it's available when module-level code
 * (like the Zustand store) executes.
 */
export function setup() {
  // This runs in the main Node process, not in jsdom.
  // We set up a simple in-memory store that the jsdom environment will
  // also receive through the setupFiles step.
}
