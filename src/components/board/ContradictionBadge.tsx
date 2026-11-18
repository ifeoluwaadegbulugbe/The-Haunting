'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'
import type { ContradictionRule } from '@/types'

interface ContradictionBadgeProps {
  contradiction: ContradictionRule
  isConfirmed:   boolean
  onConfirm:     (id: string) => void
}

export function ContradictionBadge({ contradiction, isConfirmed, onConfirm }: ContradictionBadgeProps) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded border text-sm"
      style={{
        background: 'var(--ink)',
        borderColor: isConfirmed ? 'var(--verdigris)' : 'var(--thread)',
      }}
    >
      <AlertTriangle
        size={16}
        color={isConfirmed ? 'var(--verdigris)' : 'var(--thread)'}
        className="flex-shrink-0 mt-0.5"
      />
      <div className="flex-1 space-y-1">
        <p className="font-inter text-xs font-medium" style={{ color: isConfirmed ? 'var(--verdigris)' : 'var(--thread)' }}>
          {contradiction.severity.toUpperCase()} CONTRADICTION {isConfirmed ? '— CONFIRMED' : ''}
        </p>
        <p className="font-inter text-xs text-parchment-dark leading-relaxed">
          {contradiction.explanation}
        </p>
        {!isConfirmed && (
          <Button
            variant="secondary"
            onClick={() => onConfirm(contradiction.id)}
            className="text-xs py-1 px-3 mt-1"
          >
            Confirm contradiction
          </Button>
        )}
      </div>
    </div>
  )
}
