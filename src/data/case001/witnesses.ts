import { z } from 'zod'
import { WitnessSchema } from '@/types'
import type { Witness } from '@/types'

export const WITNESSES: Witness[] = [
  // ── Margaret Hale ─────────────────────────────────────────────────────────
  {
    id: 'margaret',
    name: 'Margaret Hale',
    role: 'Neighbour',
    portrait: '/assets/portraits/portrait-margaret.jpg',
    background:
      'Retired schoolteacher. Has lived on Hollow Lane for thirty years, ' +
      '400 metres from Ashworth House. Knew the family well.',
    relationship: 'Close neighbour and family friend of the Ashworths.',
    personality:
      'Warm, apologetic, prone to repeating herself when nervous. ' +
      'She circles around the subject of the phone rather than approaching it directly.',
    motive: 'Guilt. She heard the call and did nothing. She has lived with it since.',
    deception: 'evasive',
    speechStyle:
      'Soft, slightly formal, frequently pauses. Uses phrases like "you see" and "I suppose." ' +
      'Trails off when the subject comes close to November 2008.',
    forbiddenTopics: [
      "the cellar's contents",
      'what the entity is',
      'where the bodies are',
    ],
    facts: [
      {
        id: 'M1',
        truth: 'Lives 400 metres up Hollow Lane. Knew the family well.',
        statement: 'I live just up the lane — four hundred metres or so. Known the Ashworths for years.',
        revealWhen: {},
        forbiddenTokens: [],
      },
      {
        id: 'M2',
        truth: 'The phone rings at 11:13 most nights and she never answers.',
        statement: "The phone rings at eleven thirteen most nights. I don't answer it. I never answer it.",
        revealWhen: {},
        forbiddenTokens: [],
      },
      {
        id: 'M3',
        truth: 'Saw a car in the Ashworth drive on the night of 11 November 2008.',
        statement: 'There was a car in the drive that night. I saw it from my window.',
        revealWhen: {
          anyOf: [
            { type: 'presentedEvidence', ref: 'EV-14' },
            { type: 'trustAtLeast', ref: 'margaret:60' },
          ],
        },
        deniedLine: 'I really — I didn\'t notice anyone. It was a dark night.',
        lieAllowedUntil: {
          anyOf: [
            { type: 'presentedEvidence', ref: 'EV-14' },
            { type: 'trustAtLeast', ref: 'margaret:60' },
          ],
        },
        forbiddenTokens: ['Julian', 'car', 'drive'],
      },
      {
        id: 'M4',
        truth: 'Her phone rang at 11:13 on 11 November 2008 and she let it ring.',
        statement: "My phone rang at eleven thirteen that night. I saw the number — Ashworth House. I let it ring.",
        revealWhen: {
          allOf: [{ type: 'presentedEvidence', ref: 'EV-11' }],
        },
        deniedLine: "I never got any call that night. I would have remembered.",
        lieAllowedUntil: {
          allOf: [{ type: 'presentedEvidence', ref: 'EV-11' }],
        },
        forbiddenTokens: ['rang', 'called', '23:13', '11:13', 'Ashworth'],
        yieldsStatementId: 'ST-M-DENY',
      },
      {
        id: 'M5',
        truth: "She recognised the car as Julian's.",
        statement: "It was Julian's car. I knew it. That's why I didn't answer.",
        revealWhen: {
          allOf: [{ type: 'hasFact', ref: 'M4' }],
        },
        forbiddenTokens: ['Julian'],
      },
      {
        id: 'M6',
        truth: 'Julian visited her a week later and warned her to stay quiet.',
        statement: "Julian came to see me the week after. He was polite. He said it would be better for everyone if I kept what I'd seen to myself.",
        revealWhen: {
          allOf: [
            { type: 'hasFact', ref: 'M5' },
            { type: 'trustAtLeast', ref: 'margaret:70' },
          ],
        },
        forbiddenTokens: ['warned', 'threatened', 'quiet'],
      },
    ],
    fallbackLines: {
      greeting: [
        "Come in, please. I've been — well, I suppose I've been expecting someone to ask eventually.",
        "I don't get many visitors. Sit down, won't you.",
      ],
      unknown: [
        "I'm afraid I don't know anything about that.",
        "That's not something I can help you with, I'm sorry.",
      ],
      evasive: [
        "I really couldn't say. You see — it was such a long time ago.",
        "I'm not sure that's relevant, is it? I mean — perhaps it isn't.",
      ],
      pressure: [
        "I think — I think I've said quite enough for today.",
        "Please. I'm an old woman. This is very difficult.",
      ],
    },
    trustRules: [
      { on: 'presented-EV-11', delta: 15 },
      { on: 'presented-EV-14', delta: 10 },
      { on: 'fact-M4-revealed', delta: -10 },
      { on: 'fact-M5-revealed', delta: -5 },
    ],
  },

  // ── Dorothea Pryce ────────────────────────────────────────────────────────
  {
    id: 'dorothea',
    name: 'Dorothea Pryce',
    role: 'Former Housekeeper',
    portrait: '/assets/portraits/portrait-dorothea.jpg',
    background:
      'Worked for the Ashworth family for nine years. Left the house at 16:55 ' +
      'on 11 November 2008 and was paid by Julian to give false information to police.',
    relationship: 'Trusted employee of the Ashworth family. Betrayed them for money.',
    personality:
      'Clipped, defensive, proud of her professional standards. ' +
      'Takes offence at any suggestion of impropriety. When cornered, becomes very still.',
    motive: 'Self-preservation. She was bribed and has been living with the lie ever since.',
    deception: 'deceptive',
    speechStyle:
      'Formal, precise. Short sentences. Refers to herself in terms of duty and service. ' +
      'Rarely volunteers information.',
    forbiddenTopics: [
      "the cellar's contents",
      'what the entity is',
      'where the bodies are',
    ],
    facts: [
      {
        id: 'D1',
        truth: 'Worked for the family nine years and left at 16:55 on 11 November 2008.',
        statement: 'I worked for the family for nine years and I left the house at ten to five that afternoon. As recorded.',
        revealWhen: {},
        forbiddenTokens: [],
      },
      {
        id: 'D2',
        truth: 'The family did not leave before dark — this is a lie she told police.',
        statement: 'The family drove away before dark. I saw them go.',
        revealWhen: {},
        deniedLine: 'The family drove away before dark. I saw them go.',
        lieAllowedUntil: {
          anyOf: [
            { type: 'presentedEvidence', ref: 'EV-08' },
            { type: 'presentedEvidence', ref: 'EV-12' },
          ],
        },
        forbiddenTokens: ['before dark', 'drove away'],
        yieldsStatementId: 'ST-D-LEFT',
      },
      {
        id: 'D3',
        truth: 'Julian asked her to copy the house keys a week before the murder.',
        statement: 'Mr Julian asked me if he could have copies of the house keys made. A week before — the fourth, I think.',
        revealWhen: {
          allOf: [{ type: 'presentedEvidence', ref: 'EV-08' }],
        },
        forbiddenTokens: ['keys'],
      },
      {
        id: 'D4',
        truth: 'Julian paid her to give a false statement to police.',
        statement: 'He paid me. I told police what he asked me to say. I am not proud of it.',
        revealWhen: {
          allOf: [{ type: 'presentedEvidence', ref: 'EV-13' }],
        },
        forbiddenTokens: ['paid', 'money', 'bribed'],
      },
      {
        id: 'D5',
        truth: 'She never returned to the house after 16:55 and fears the family never left.',
        statement: "I never went back after that day. I've always feared — I've always thought perhaps they never left at all.",
        revealWhen: {
          anyOf: [
            { type: 'hasFact', ref: 'D4' },
            { type: 'presentedEvidence', ref: 'EV-X1' },
          ],
        },
        forbiddenTokens: ['never left', 'cellar'],
      },
    ],
    fallbackLines: {
      greeting: [
        "I assume this is about the Ashworths. Very well. Ask what you need to ask.",
        "I expected someone would come eventually. I am prepared to answer questions.",
      ],
      unknown: [
        "That is not something I know anything about.",
        "I cannot help you with that.",
      ],
      evasive: [
        "I would prefer not to speculate.",
        "I did my job and I left. That is all there is to say.",
      ],
      pressure: [
        "I think you are reaching for something that isn't there.",
        "I have nothing further to add on that subject.",
      ],
    },
    trustRules: [
      { on: 'presented-EV-08', delta: -10 },
      { on: 'presented-EV-13', delta: -20 },
      { on: 'fact-D4-revealed', delta: 5 },
    ],
  },

  // ── Julian Ashworth ───────────────────────────────────────────────────────
  {
    id: 'julian',
    name: 'Julian Ashworth',
    role: 'Family Relative',
    portrait: '/assets/portraits/portrait-julian.jpg',
    background:
      "Edmund's cousin. Deep in debt. Arrived at Ashworth House on the night of " +
      '11 November 2008 with a forged will amendment naming himself heir.',
    relationship: "Edmund Ashworth's cousin. Grew up with the family.",
    personality:
      'Charming, concerned, rehearsed. Deflects with questions. ' +
      'When cornered by evidence, becomes very precise and cold — the warmth drops entirely.',
    motive: 'Greed and desperation. He killed his cousin to inherit the estate.',
    deception: 'evasive',
    speechStyle:
      'Polished, measured, slightly too smooth. Uses phrases like "I understand your concern" ' +
      'and "I want to be helpful." Under pressure, sentences become shorter and harder.',
    forbiddenTopics: [
      "the cellar's contents",
      'what the entity is',
      'where the bodies are',
      'the murder itself',
    ],
    facts: [
      {
        id: 'J1',
        truth: "Edmund's cousin who helped with family finances.",
        statement: "Edmund was my cousin. We were close. I helped him manage some financial matters over the years.",
        revealWhen: {},
        forbiddenTokens: [],
      },
      {
        id: 'J2',
        truth: 'He was not in Lisbon from 10 November — this is a lie.',
        statement: "I was in Lisbon from the tenth of November. I had business there.",
        revealWhen: {},
        deniedLine: "I was in Lisbon from the tenth of November. I had business there.",
        lieAllowedUntil: {
          anyOf: [
            { type: 'presentedEvidence', ref: 'EV-14' },
            { type: 'presentedEvidence', ref: 'EV-15' },
          ],
        },
        forbiddenTokens: ['Lisbon', 'abroad', 'Portugal'],
        yieldsStatementId: 'ST-J-ABROAD',
      },
      {
        id: 'J3',
        truth: 'The diary shows no plan to emigrate — this is a deflection.',
        statement: "Edmund and Clara talked quite seriously about moving abroad. They had been considering it for some time.",
        revealWhen: {},
        deniedLine: "Edmund and Clara talked quite seriously about moving abroad. They had been considering it for some time.",
        lieAllowedUntil: {
          allOf: [{ type: 'presentedEvidence', ref: 'EV-03' }],
        },
        forbiddenTokens: ['emigrate', 'moving', 'abroad'],
        yieldsStatementId: 'ST-J-EMIGRATE',
      },
      {
        id: 'J4',
        truth: 'He visited the house that evening to discuss money.',
        statement: "All right. I did visit the house that evening. There was a — a financial matter I needed to discuss with Edmund.",
        revealWhen: {
          allOf: [{ type: 'presentedEvidence', ref: 'EV-14' }],
        },
        forbiddenTokens: ['visit', 'house', 'that night'],
      },
      {
        id: 'J5',
        truth: 'There was an argument about the will, but he never admits to killing Edmund.',
        statement: "We argued. About the will, yes. But Edmund was alive when I left. I want to make that very clear.",
        revealWhen: {
          anyOf: [
            { type: 'presentedEvidence', ref: 'EV-07' },
            { type: 'presentedEvidence', ref: 'EV-06' },
          ],
        },
        forbiddenTokens: ['killed', 'dead', 'murder', 'cellar'],
      },
      {
        id: 'J6',
        truth: 'At maximum pressure, Julian asks for a lawyer.',
        statement: "I think — I think at this point I should speak to a solicitor before answering any further questions.",
        revealWhen: {
          allOf: [{ type: 'trustBelow', ref: 'julian:10' }],
        },
        forbiddenTokens: [],
      },
    ],
    fallbackLines: {
      greeting: [
        "I want to help in any way I can. Edmund's disappearance has been very — it has been difficult.",
        "Of course. Please, ask anything. I have nothing to hide.",
      ],
      unknown: [
        "I'm not sure I follow. Can you be more specific?",
        "I don't know anything about that, I'm afraid.",
      ],
      evasive: [
        "I understand your concern. I really do. But I'm not sure what you're suggesting.",
        "I want to be cooperative, but I'm not certain that's relevant.",
      ],
      pressure: [
        "I think you're reading too much into this.",
        "I've told you everything I know. I don't see what else there is to discuss.",
      ],
    },
    trustRules: [
      { on: 'presented-EV-14', delta: -15 },
      { on: 'presented-EV-07', delta: -20 },
      { on: 'presented-EV-06', delta: -10 },
      { on: 'fact-J4-revealed', delta: -5 },
      { on: 'fact-J5-revealed', delta: -15 },
    ],
  },
]

// Validate at import time
z.array(WitnessSchema).parse(WITNESSES)
