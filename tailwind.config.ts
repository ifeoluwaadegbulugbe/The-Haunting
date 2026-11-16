import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian:          'var(--obsidian)',
        ink:               'var(--ink)',
        burgundy:          'var(--burgundy)',
        parchment:         'var(--parchment)',
        'parchment-light': 'var(--parchment-light)',
        'parchment-dark':  'var(--parchment-dark)',
        gold:              'var(--gold)',
        brown:             'var(--brown)',
        candle:            'var(--candle)',
        thread:            'var(--thread)',
        entity:            'var(--entity)',
        'entity-glow':     'var(--entity-glow)',
        verdigris:         'var(--verdigris)',
      },
      fontFamily: {
        cinzel:    ['var(--font-cinzel)', 'serif'],
        cormorant: ['var(--font-cormorant)', 'serif'],
        inter:     ['var(--font-inter)', 'sans-serif'],
        caveat:    ['var(--font-caveat)', 'cursive'],
      },
    },
  },
  plugins: [],
}

export default config
