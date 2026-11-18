/**
 * scripts/usage-log.ts
 * Appends a dated row to the task log in docs/KIRO_USAGE.md.
 * Called by the usage-log hook after a spec task runs. The hook passes
 * session context as JSON on stdin; we take a task label from it if present.
 *
 * Manual use: npm run usage-log -- "Task 4.2 scoring engine"
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const DOC = join(__dirname, '..', 'docs', 'KIRO_USAGE.md')

function readStdin(): string {
  try {
    return process.stdin.isTTY ? '' : readFileSync(0, 'utf-8')
  } catch {
    return ''
  }
}

function taskLabel(): string {
  const arg = process.argv.slice(2).join(' ').trim()
  if (arg) return arg
  const raw = readStdin()
  try {
    const ctx = JSON.parse(raw) as Record<string, unknown>
    const pick = (o: unknown, k: string) =>
      o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined
    const candidate =
      pick(ctx, 'taskId') ?? pick(ctx, 'task') ?? pick(pick(ctx, 'task'), 'title') ?? pick(ctx, 'name')
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  } catch {
    // no usable context
  }
  return 'Spec task completed'
}

function changedFiles(): string {
  try {
    const out = execSync('git diff --name-only HEAD', { encoding: 'utf-8' }).trim()
    const files = out ? out.split('\n') : []
    if (files.length === 0) return '—'
    const shown = files.slice(0, 5).map((f) => `\`${f}\``).join(', ')
    return files.length > 5 ? `${shown} (+${files.length - 5} more)` : shown
  } catch {
    return '—'
  }
}

const date = new Date().toISOString().slice(0, 10)
// Keep table cells on one line and free of pipes
const clean = (s: string) => s.replace(/[|\r\n]+/g, ' ').slice(0, 120)
const row = `| ${date} | ${clean(taskLabel())} | ${clean(changedFiles())} |`

const doc = readFileSync(DOC, 'utf-8').replace(/\s+$/, '')
writeFileSync(DOC, `${doc}\n${row}\n`)
console.log(`usage-log: ${row}`)
