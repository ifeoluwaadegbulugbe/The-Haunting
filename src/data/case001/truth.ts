// ── Case 001 canonical truth ─────────────────────────────────────────────────
// THIS FILE IS SACRED. Never edited by AI. The AI may phrase things; it may
// never decide facts. All content here is authored and locked.

export const CASE_TRUTH = {
  caseId: 'case-001',
  caseTitle: 'The House That Calls Back',
  caseTeaser:
    'A family vanished on a November night in 2008.\n' +
    'The house on Hollow Lane has been silent for eighteen years.\n' +
    'Every night at 11:13, someone calls.',

  entityIdentity:
    "The entity is Clara Ashworth's echo. Every night at 11:13 the cellar " +
    'extension calls the one person who never answered. Caller ID reads ' +
    'ASHWORTH H. EXT 2.',

  fiveAnswers: {
    whoIsCalling:
      "Clara's echo, from the cellar extension.",
    whyFamilyDisappeared:
      'Julian killed Edmund and trapped Clara and Lily to secure a forged inheritance.',
    whatHappenedFinalNight:
      'Julian arrived at 21:40 to force Edmund to sign a will amendment naming him heir. ' +
      'Edmund refused. Julian killed Edmund at 23:09 and locked Clara and Lily in the cellar. ' +
      'At 23:13 Clara called Margaret Hale from the cellar extension; Margaret saw Julian\'s car ' +
      'and let it ring. The next morning Julian paid Dorothea Pryce to tell police the family ' +
      'had left before dark.',
    whyCallsContinue:
      "Margaret never answered the call for help.",
    whoConcealedMost:
      'Margaret Hale, who withheld that the 23:13 call reached her. ' +
      '(Julian is the culprit; Dorothea was bribed.)',
  },

  // Clara's authored final voicemail — played in the conclusion sequence.
  finalVoicemail:
    'Hello. This is Clara. Clara Ashworth. I know you can hear this — I know you ' +
    'always could. We are in the cellar. Lily is with me. Please. Please come. ' +
    "I'm sorry I couldn't make you understand. I'm sorry the phone just kept ringing.",

  // Static narration shown if the AI verdict call fails (120–160 words).
  revealNarrationFallback:
    'On the eleventh of November 2008, Julian Ashworth arrived at Ashworth House ' +
    'carrying a document that would have made him heir to everything his cousin owned. ' +
    'Edmund refused to sign. The argument that followed ended Edmund\'s life at eleven minutes ' +
    'past eleven that night. Julian locked Clara and Lily Ashworth in the cellar and left, ' +
    'believing silence would protect him. He did not know about the cellar telephone. ' +
    'At thirteen minutes past eleven, Clara called the one neighbour close enough to help. ' +
    'Margaret Hale heard the phone. She saw Julian\'s car. She did not answer. ' +
    'The next morning, Julian paid Dorothea Pryce to tell police the family had left before dark. ' +
    'The case was closed as a voluntary disappearance. ' +
    'The phone has rung every night at eleven thirteen since.',
} as const

export type CaseTruth = typeof CASE_TRUTH
