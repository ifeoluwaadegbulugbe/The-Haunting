import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface ChatBubbleProps {
  role: 'player' | 'witness'
  text: ReactNode
  mood?: string
}

export function ChatBubble({ role, text }: ChatBubbleProps) {
  const isPlayer = role === 'player'

  return (
    <div className={clsx('flex', isPlayer ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[80%] px-4 py-2.5 rounded text-base leading-relaxed',
          isPlayer ? 'rounded-br-none' : 'rounded-bl-none'
        )}
        style={{
          background: isPlayer ? 'var(--parchment-dark)' : 'var(--brown)',
          color: isPlayer ? 'var(--obsidian)' : 'var(--parchment)',
          fontFamily: 'var(--font-cormorant)',
          fontSize: '16px',
        }}
      >
        {text}
      </div>
    </div>
  )
}
