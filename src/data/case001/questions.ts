/**
 * Suggested questions shown as one-tap prompts in the interview room.
 * They only phrase what the player asks; what a witness reveals is still decided
 * by the case rules (and by the evidence the player presents).
 */
export const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  margaret: [
    'How well did you know the Ashworths?',
    'Tell me about the phone that rings at 11:13.',
    'Did you see anything at the house that night?',
    'Did anyone call you on 11 November 2008?',
    'Has anyone asked you to keep quiet?',
  ],
  dorothea: [
    'How long did you work for the family?',
    'When did you leave the house that day?',
    'Did you see the family leave?',
    'Did Julian ever ask you for anything?',
    'Did anyone pay you to talk to the police?',
  ],
  julian: [
    'Where were you on 11 November 2008?',
    'Were Edmund and Clara planning to move away?',
    'Did you go to the house that evening?',
    'What was the argument about?',
    'Tell me about the will.',
  ],
}
