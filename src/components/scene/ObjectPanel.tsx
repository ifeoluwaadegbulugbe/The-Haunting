'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, ParchmentCard } from '@/components/ui'
import type { SceneObject, Evidence } from '@/types'

interface ObjectPanelProps {
  object: SceneObject | null
  collectedEvidenceIds: string[]
  allEvidence: Evidence[]
  isLocked: boolean
  lockedMessage: string
  onInspect: (object: SceneObject) => void
  onClose: () => void
}

export function ObjectPanel({
  object,
  collectedEvidenceIds,
  allEvidence,
  isLocked,
  lockedMessage,
  onInspect,
  onClose,
}: ObjectPanelProps) {
  if (!object) return null

  const alreadyCollected = object.yieldsEvidence.every((id) =>
    collectedEvidenceIds.includes(id)
  )

  const yieldedNames = object.yieldsEvidence
    .map((id) => allEvidence.find((e) => e.id === id)?.name ?? id)

  return (
    <AnimatePresence>
      <motion.div
        key={object.id}
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pointer-events-auto absolute z-20 flex flex-col inset-x-0 bottom-0 max-h-[60%] lg:inset-x-auto lg:bottom-auto lg:top-0 lg:right-0 lg:h-full lg:max-h-none lg:w-80"
        style={{ paddingTop: 'var(--panel-top, 0px)' }}
      >
        <ParchmentCard className="flex-1 overflow-y-auto m-3 p-5 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-cormorant font-bold text-obsidian text-xl leading-tight">
              {object.name}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="flex-shrink-0 p-1 rounded hover:bg-parchment transition-colors"
            >
              <X size={18} color="var(--brown)" />
            </button>
          </div>

          {/* Description */}
          <p className="font-inter text-sm text-brown leading-relaxed">
            {object.description}
          </p>

          {/* Locked message */}
          {isLocked && (
            <p className="font-caveat text-sm italic text-brown border-l-2 border-brown pl-3">
              {lockedMessage}
            </p>
          )}

          {/* Collected evidence */}
          {alreadyCollected && yieldedNames.length > 0 && (
            <div className="border-t border-parchment pt-3">
              <p className="font-inter text-xs text-brown uppercase tracking-wide mb-2">
                Collected
              </p>
              <ul className="space-y-1">
                {yieldedNames.map((name) => (
                  <li key={name} className="font-inter text-xs text-obsidian flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-verdigris flex-shrink-0" />
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action button */}
          <div className="mt-auto pt-2">
            {alreadyCollected ? (
              <Button variant="secondary" disabled tooltip="Already collected">
                Collected
              </Button>
            ) : isLocked ? (
              <Button variant="secondary" disabled tooltip={lockedMessage}>
                Inspect
              </Button>
            ) : (
              <Button variant="primary" onClick={() => onInspect(object)}>
                Inspect
              </Button>
            )}
          </div>
        </ParchmentCard>
      </motion.div>
    </AnimatePresence>
  )
}
