'use client'

import { Stamp, Button } from '@/components/ui'
import { RecordContent } from './RecordRenderers'
import type { DigitalRecord } from '@/types'

interface RecordWrapperProps {
  record: DigitalRecord
  isRecovered: boolean
  conditionMet: boolean
  isCollected?: boolean
  onRecover: () => void
}

export function RecordWrapper({
  record,
  isRecovered,
  conditionMet,
  isCollected = false,
  onRecover,
}: RecordWrapperProps) {
  const isDeleted = record.deleted

  if (isDeleted && !isRecovered) {
    return (
      <div
        className="rounded p-3 border border-dashed mb-3"
        style={{
          borderColor: 'var(--brown)',
          opacity: conditionMet ? 0.65 : 0.35,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="font-inter text-xs italic tracking-wider"
            style={{ color: 'var(--thread)' }}
          >
            — DELETED —
          </span>
          {conditionMet && (
            <Button variant="secondary" onClick={onRecover} className="text-xs py-1 px-3">
              Recover
            </Button>
          )}
        </div>
        <div style={{ filter: 'blur(1px)', pointerEvents: 'none' }}>
          <RecordContent record={record} />
        </div>
      </div>
    )
  }

  // Visible records that hold evidence are logged with one click
  const canLog = !isDeleted && Boolean(record.yieldsEvidence)

  return (
    <div className="mb-4">
      {canLog && !isCollected && (
        <div className="flex justify-end mb-1">
          <Button variant="secondary" onClick={onRecover} className="text-xs py-1 px-3">
            Log as evidence
          </Button>
        </div>
      )}
      {canLog && isCollected && (
        <div className="flex justify-end mb-1">
          <Stamp label="LOGGED" variant="solved" />
        </div>
      )}
      {isRecovered && isDeleted && (
        <div className="flex justify-end mb-1">
          <Stamp label="RECOVERED" variant="solved" />
        </div>
      )}
      <RecordContent record={record} />
    </div>
  )
}
