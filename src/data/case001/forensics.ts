/**
 * Forensics (truth file §9.12). Bench work done by hand, some sent on to the lab.
 * Results restate or support the canonical truth; none is needed to finish the case.
 */
export type BenchKind = 'dust' | 'jigsaw' | 'rubbing' | 'uv' | 'none'

export interface ForensicTask {
  id: string
  name: string
  /** What the player does at the bench */
  instruction: string
  /** Evidence that must be held before the task opens */
  needs: string[]
  bench: BenchKind
  /** If set, the bench result goes to the lab and returns after this many seconds */
  labSeconds?: number
  labName?: string
  result: string
}

export const FORENSIC_TASKS: ForensicTask[] = [
  {
    id: 'F-prints',
    name: 'Dust the Telephone',
    instruction: 'Brush powder over the telephone until the prints show.',
    needs: ['EV-01'],
    bench: 'dust',
    labSeconds: 45,
    labName: 'Fingerprint comparison',
    result:
      'The handset was wiped clean. Whoever wiped it missed the underside of the cradle: a man\u2019s thumbprint, ' +
      'and beside it the pressed outline of a ring worn on the next finger.',
  },
  {
    id: 'F-jigsaw',
    name: 'Rebuild the Torn Photograph',
    instruction: 'Swap the pieces until the family photograph is whole again.',
    needs: ['EV-02', 'EV-05'],
    bench: 'jigsaw',
    result:
      'Christmas 2007. The man torn from the picture is Julian Ashworth, his hand on Lily\u2019s shoulder. ' +
      'A gold signet ring on his little finger.',
  },
  {
    id: 'F-rubbing',
    name: 'Pencil Rubbing of the Diary',
    instruction: 'Rub the pencil over the blank page to bring up what was pressed into it.',
    needs: ['EV-03'],
    bench: 'rubbing',
    result:
      '11 Nov. J. is coming tonight about the will. E. says he will not sign, whatever happens. ' +
      'I have shown Lily the cellar telephone. Just in case.',
  },
  {
    id: 'F-uv',
    name: 'UV Light on the Will',
    instruction: 'Sweep the ultraviolet lamp over the back of the will and mark what it shows.',
    needs: ['EV-06', 'EV-08'],
    bench: 'uv',
    labSeconds: 60,
    labName: 'Handwriting comparison',
    result:
      'Three rubbed-out pencil practices of Edmund\u2019s signature. They were written by the same hand that ' +
      'signed for the key copies in the housekeeper\u2019s logbook: J. Ashworth.',
  },
  {
    id: 'F-plate',
    name: 'Run the Number Plate',
    instruction: 'Send the registration from Edmund\u2019s photograph to the vehicle records office.',
    needs: ['EV-14'],
    bench: 'none',
    labSeconds: 30,
    labName: 'Vehicle records',
    result: 'Registration J4 ASH: a green Mercedes saloon, registered to Julian Ashworth.',
  },
]

/** Traits of the killer that the evidence can establish (truth file §9.12). */
export interface ProfileTrait {
  id: string
  text: string
  /** Known once any of these is true */
  from: { evidence?: string[]; facts?: string[]; forensics?: string[]; contradictions?: string[] }
}

export const PROFILE_TRAITS: ProfileTrait[] = [
  // The first three fit more than one suspect, so the early profile does not settle the case
  { id: 'T-LIED', text: 'Lied about the night of 11 November', from: { contradictions: ['CX-01', 'CX-02', 'CX-03', 'CX-04'] } },
  { id: 'T-ACCESS', text: 'Could let themselves into the house', from: { evidence: ['EV-08', 'EV-18'] } },
  { id: 'T-GRUDGE', text: 'Quarrelled with Edmund that autumn', from: { evidence: ['EV-17', 'EV-06'] } },
  { id: 'T-THERE', text: 'Was at Ashworth House after dark on 11 November', from: { evidence: ['EV-14'] } },
  { id: 'T-DEBT', text: 'Was deep in debt', from: { evidence: ['EV-10'] } },
  { id: 'T-KEYS', text: 'Had copies made of the house keys', from: { evidence: ['EV-08'], facts: ['D3'] } },
  { id: 'T-RING', text: 'Wears a gold signet ring', from: { evidence: ['OC-01'], forensics: ['F-jigsaw', 'F-prints'] } },
  { id: 'T-CAR', text: 'Drives a green Mercedes, J4 ASH', from: { forensics: ['F-plate'] } },
  { id: 'T-FORGER', text: 'Practised Edmund\u2019s signature', from: { forensics: ['F-uv'] } },
]

/** Which traits fit each suspect. The truth: only Julian fits them all (truth file §9.12, §9.14). */
export const SUSPECT_TRAITS: Record<string, string[]> = {
  julian: ['T-LIED', 'T-ACCESS', 'T-GRUDGE', 'T-THERE', 'T-DEBT', 'T-KEYS', 'T-RING', 'T-CAR', 'T-FORGER'],
  dorothea: ['T-LIED', 'T-ACCESS'],
  margaret: ['T-LIED', 'T-GRUDGE'],
}
