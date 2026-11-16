import type { Case001 } from '@/data/case001'

/**
 * Evaluates an evidence link pair against the case link rules.
 * Order-insensitive: (a,b) and (b,a) are treated identically.
 */
export function evaluateLink(
  a: string,
  b: string,
  caseData: Case001
): 'valid' | 'invalid' | 'contradiction' {
  const rule = caseData.links.find(
    (r) => (r.a === a && r.b === b) || (r.a === b && r.b === a)
  )
  if (!rule) return 'invalid'
  if (rule.type === 'contradicts') return 'contradiction'
  return 'valid'
}
