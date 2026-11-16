import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'

// ── Global localStorage mock (needed before Zustand store modules load) ────
const _store: Record<string, string> = {}

beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => _store[key] ?? null,
      setItem: (key: string, value: string) => { _store[key] = value },
      removeItem: (key: string) => { delete _store[key] },
      clear: () => { Object.keys(_store).forEach((k) => delete _store[k]) },
    },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  cleanup()
  // Clear mock store between tests
  Object.keys(_store).forEach((k) => delete _store[k])
})
