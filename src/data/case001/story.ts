import type { Condition } from '@/types'

// ── Chapters (truth file §9.13) ──────────────────────────────────────────

export interface Chapter {
  id: string
  number: number
  title: string
  /** The chapter closes when this becomes true */
  closesWhen: Condition | 'archive' | 'witnesses' | 'conclusion'
  cliffhanger: string
  partner: string
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'chapter-1',
    number: 1,
    title: 'The Call',
    closesWhen: 'archive',
    cliffhanger:
      'The tape runs on after the crash. Under the hiss, so faint you almost miss it, a second telephone is ringing somewhere below the floor.',
    partner: 'The family\u2019s phones and computers came in with the case file. Let\u2019s see what they kept.',
  },
  {
    id: 'chapter-2',
    number: 2,
    title: 'The Records',
    closesWhen: 'witnesses',
    cliffhanger:
      'At 22:50 Clara was alive and frightened. At 23:13 a call left the cellar. By morning, someone had paid for a lie.',
    partner: 'Three people were near that house that night. Time we spoke to them.',
  },
  {
    id: 'chapter-3',
    number: 3,
    title: 'The Witnesses',
    closesWhen: 'conclusion',
    cliffhanger:
      'Three people kept the same night secret for eighteen years. Now one of them has to answer for it.',
    partner: 'Put it all on the board. When you are sure, name them.',
  },
]

// ── Archivist Reed, the investigator's partner ───────────────────────────

export interface PartnerNote { id: string; when: Condition; text: string; route?: string }

export const PARTNER_NOTES: PartnerNote[] = [
  { id: 'P-start', when: {}, route: '/case/001/scene', text: 'Start with the telephone. Everything in this case starts with that phone.' },
  { id: 'P-ev07', when: { allOf: [{ type: 'hasEvidence', ref: 'EV-07' }] }, text: 'That recording. Play it again when you can stand to. Listen for what is under the voices.' },
  { id: 'P-ev03', when: { allOf: [{ type: 'hasEvidence', ref: 'EV-03' }] }, text: 'Bring the diary to the lab. Torn-out pages still leave their writing pressed into the next one.' },
  { id: 'P-ev09', when: { allOf: [{ type: 'hasEvidence', ref: 'EV-09' }] }, text: 'Lily\u2019s room is upstairs. Take a torch.' },
  { id: 'P-ev14', when: { allOf: [{ type: 'hasEvidence', ref: 'EV-14' }] }, text: 'A car in the drive at 22:31. Send the plate to the lab.' },
  { id: 'P-cx', when: { anyOf: [{ type: 'hasContradiction', ref: 'CX-01' }, { type: 'hasContradiction', ref: 'CX-02' }, { type: 'hasContradiction', ref: 'CX-03' }, { type: 'hasContradiction', ref: 'CX-04' }, { type: 'hasContradiction', ref: 'CX-05' }, { type: 'hasContradiction', ref: 'CX-06' }] }, text: 'There it is. Once one story breaks, the others usually follow.' },
  { id: 'P-x1', when: { allOf: [{ type: 'hasEvidence', ref: 'EV-X1' }] }, text: 'That photograph was not in our files yesterday. Check it against the housekeeper\u2019s logbook.' },
  // Red herrings (§9.14): Reed takes them seriously, as a partner would
  { id: 'P-ev16', when: { allOf: [{ type: 'hasEvidence', ref: 'EV-16' }] }, text: 'Clara looked up one-way flights two nights before. So she was thinking of leaving. With them, or from them?' },
  { id: 'P-ev17', when: { allOf: [{ type: 'hasEvidence', ref: 'EV-17' }] }, text: 'Mrs Hale threatened Edmund in writing. Over a hedge, but still. Keep her in mind.' },
  { id: 'P-ev18', when: { allOf: [{ type: 'hasEvidence', ref: 'EV-18' }] }, text: 'The housekeeper handed in her notice and left on the very day they vanished. Chance, or not?' },
  { id: 'P-m4', when: { allOf: [{ type: 'hasFact', ref: 'M4' }] }, text: 'She heard it ring and let it ring. Imagine carrying that for eighteen years.' },
]

// ── Clara's last hour: found by catching the entity in a reflection ──────

export interface Fragment { id: string; time: string; text: string }

export const CLARA_FRAGMENTS: Fragment[] = [
  { id: 'CF-1', time: '23:09', text: 'The door shut above us. I heard the key turn twice. Lily did not cry. She held my sleeve.' },
  { id: 'CF-2', time: '23:10', text: 'It is so cold down here. I called up the stairs for Edmund. Nobody called back.' },
  { id: 'CF-3', time: '23:11', text: 'Lily remembered before I did. \u201cThe secret phone, Mummy.\u201d The one Julian doesn\u2019t know about.' },
  { id: 'CF-4', time: '23:13', text: 'I dialled the nearest number I knew. Mrs Hale. She is always up late. It rang and rang.' },
  { id: 'CF-5', time: '23:14', text: 'Forty-one seconds. I counted them out loud so Lily would have something to listen to.' },
  { id: 'CF-6', time: 'after', text: 'I am not angry with her. I only wanted someone to pick up. I will keep ringing until someone does.' },
]

/** Where the entity can be caught in each room: % of the room picture. */
export const SIGHTING_SPOTS: Record<string, { x: number; y: number; size: number; where: string }> = {
  hq: { x: 63.6, y: 23.4, size: 5, where: 'in the mirror' },
  study: { x: 44, y: 34, size: 4, where: 'between the books' },
  'lily-room': { x: 64.5, y: 22, size: 6, where: 'at the window' },
  interview: { x: 14.5, y: 46, size: 7, where: 'in the doorway' },
}

/** Seconds between sightings, once the entity is at least aware. */
export const SIGHTING_DELAY = { min: 18, max: 40 }
export const SIGHTING_SECONDS = 5

// ── The entity remembers ──────────────────────────────────────────────────

export interface MemoryInput {
  answered: number
  ignored: number
  sawLilysRoom: boolean
  margaretTrust: number
  fragments: number
}

/** The authored line the entity uses to show it remembers how it was treated. */
export function entityMemoryLine(m: MemoryInput): string {
  if (m.ignored >= 2 && m.answered === 0) return 'You let me ring. Again and again. Just like her.'
  if (m.answered >= 3) return 'You answered every time. No one has ever done that.'
  if (!m.sawLilysRoom) return 'You never went up to her room.'
  if (m.margaretTrust < 30) return 'You were hard on her. She has been hard on herself for eighteen years.'
  if (m.fragments >= 4) return 'You listened. You kept every piece of me you found.'
  return 'You came all this way. Most people stop at the door.'
}

// ── The confrontation with Julian (truth file §9.13) ──────────────────────

export interface DefencePoint { id: string; claim: string; accepts: string[]; crack: string }

export const DEFENCE_POINTS: DefencePoint[] = [
  { id: 'DP-1', claim: 'I was in Lisbon. I flew out on the tenth.', accepts: ['EV-14', 'EV-15'], crack: 'A photograph can be anyone\u2019s car. \u2026It is my car.' },
  { id: 'DP-2', claim: 'Edmund was alive when I left that house.', accepts: ['EV-07'], crack: '\u201cYou\u2019ll sign it, Edmund.\u201d \u2026I don\u2019t remember saying that.' },
  { id: 'DP-3', claim: 'I had no reason to hurt him. We were family.', accepts: ['EV-06', 'EV-10'], crack: 'Everyone has debts. That doesn\u2019t make me\u2026 It was only a signature.' },
  { id: 'DP-4', claim: 'They drove away before dark. Ask Dorothea.', accepts: ['EV-13', 'EV-08'], crack: 'She agreed to it. She took the envelope. You can\u2019t put that on me alone.' },
  { id: 'DP-5', claim: 'Nobody could have called from that house after I left.', accepts: ['EV-11', 'EV-01'], crack: 'A cellar extension. I didn\u2019t know. I didn\u2019t know there was a phone down there.' },
]

export const TRIAL_VERDICT =
  'Julian Ashworth: on the evidence recovered by the Archive, the court finds you guilty of the murder of Edmund Ashworth, ' +
  'and of the deaths of Clara and Lily Ashworth, whom you left locked in the cellar of Ashworth House on 11 November 2008.'
