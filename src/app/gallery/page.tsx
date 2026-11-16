'use client'

import { notFound } from 'next/navigation'
import { useState } from 'react'
import {
  Button,
  Modal,
  Toast,
  ProgressBar,
  Stamp,
  WaxSeal,
  ArchiveFrame,
  ParchmentCard,
  CaseFolder,
} from '@/components/ui'

export default function GalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    variant: 'info' | 'success' | 'error'
  } | null>(null)

  return (
    <main className="min-h-screen bg-obsidian p-8 space-y-16">
      <h1 className="font-cinzel text-gold text-2xl tracking-widest">
        Component Gallery — Dev Only
      </h1>

      {/* ── Button ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-cormorant text-parchment text-xl font-semibold">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled tooltip="Requires more evidence">
            Disabled
          </Button>
          <Button variant="secondary" disabled>Secondary Disabled</Button>
        </div>
      </section>

      {/* ── Modal ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-cormorant text-parchment text-xl font-semibold">Modal</h2>
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Open Modal
        </Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Confirm Action"
        >
          <p className="font-inter text-parchment text-sm mb-4">
            Are you sure you want to proceed? This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </Modal>
      </section>

      {/* ── Toast ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-cormorant text-parchment text-xl font-semibold">Toast</h2>
        <div className="flex gap-3">
          {(['info', 'success', 'error'] as const).map((v) => (
            <Button
              key={v}
              variant="secondary"
              onClick={() => setToast({ message: `This is a ${v} toast`, variant: v })}
            >
              Show {v}
            </Button>
          ))}
        </div>
        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => setToast(null)}
          />
        )}
      </section>

      {/* ── ProgressBar ──────────────────────────────────────────── */}
      <section className="space-y-4 max-w-sm">
        <h2 className="font-cormorant text-parchment text-xl font-semibold">ProgressBar</h2>
        {[0, 33, 67, 100].map((v) => (
          <ProgressBar key={v} value={v} label={`${v}% complete`} />
        ))}
      </section>

      {/* ── Stamp ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-cormorant text-parchment text-xl font-semibold">Stamp</h2>
        <div className="flex gap-6">
          <Stamp label="UNRESOLVED" variant="unresolved" />
          <Stamp label="SOLVED" variant="solved" />
        </div>
      </section>

      {/* ── WaxSeal ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-cormorant text-parchment text-xl font-semibold">WaxSeal</h2>
        <WaxSeal />
      </section>

      {/* ── ArchiveFrame ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-cormorant text-parchment text-xl font-semibold">ArchiveFrame</h2>
        <ArchiveFrame className="p-6 inline-block">
          <p className="font-inter text-parchment text-sm">
            Content inside an archive frame
          </p>
        </ArchiveFrame>
      </section>

      {/* ── ParchmentCard ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-cormorant text-parchment text-xl font-semibold">ParchmentCard</h2>
        <div className="flex gap-6">
          <ParchmentCard className="p-4 w-48">
            <p className="font-inter text-sm text-obsidian">No tilt</p>
          </ParchmentCard>
          <ParchmentCard tilt={1} className="p-4 w-48">
            <p className="font-inter text-sm text-obsidian">1° tilt</p>
          </ParchmentCard>
        </div>
      </section>

      {/* ── CaseFolder ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-cormorant text-parchment text-xl font-semibold">CaseFolder</h2>
        <CaseFolder
          caseNumber="CASE 001"
          title="The House That Calls Back"
          teaser={`A family vanished on a November night in 2008.\nThe house on Hollow Lane has been silent for eighteen years.\nEvery night at 11:13, someone calls.`}
          status="unresolved"
          progress={42}
        />
        <CaseFolder
          caseNumber="CASE 001"
          title="The House That Calls Back"
          teaser={`A family vanished on a November night in 2008.\nThe house on Hollow Lane has been silent for eighteen years.\nEvery night at 11:13, someone calls.`}
          status="solved"
          progress={100}
        />
      </section>
    </main>
  )
}
