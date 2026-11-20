import type { Case001 } from '@/data/case001'
import { evaluateLink } from './links'

const PEOPLE: Record<string, string> = {
  edmund: 'Edmund', clara: 'Clara', lily: 'Lily', julian: 'Julian',
  margaret: 'Margaret', dorothea: 'Dorothea', beatrice: 'Aunt Beatrice',
}

/**
 * A plain-language reason for a link verdict, built from the case data.
 * Valid and contradicting links use the authored explanation. Unsupported links
 * say what the two items share, if anything, and why that is not enough.
 */
export function explainLink(a: string, b: string, caseData: Case001): { verdict: ReturnType<typeof evaluateLink>; text: string } {
  const verdict = evaluateLink(a, b, caseData)
  const rule = caseData.links.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a))
  if (rule) return { verdict, text: rule.explanation }

  const A = caseData.evidence.find((e) => e.id === a)
  const B = caseData.evidence.find((e) => e.id === b)
  if (!A || !B) return { verdict, text: 'These two items cannot be compared.' }

  const people = A.relatedCharacters.filter((c) => B.relatedCharacters.includes(c)).map((c) => PEOPLE[c] ?? c)
  const events = A.relatedEvents.filter((e) => B.relatedEvents.includes(e))
  const eventLabel = (id: string) => caseData.timeline.find((t) => t.id === id)?.label.toLowerCase() ?? id

  if (events.length > 0) {
    return {
      verdict,
      text: `Both concern the same moment (${eventLabel(events[0])}), but neither tells you anything the other doesn't. Look for an item that proves or disproves what this one claims.`,
    }
  }
  if (people.length > 0) {
    return {
      verdict,
      text: `Both involve ${people.join(' and ')}, but at different times and for different reasons. A shared name is not a connection.`,
    }
  }
  return {
    verdict,
    text: `${A.name} and ${B.name} share no person and no event. Nothing ties them together.`,
  }
}
