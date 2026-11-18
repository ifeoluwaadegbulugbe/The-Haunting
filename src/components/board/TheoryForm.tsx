'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import type { Theory, Evidence } from '@/types'

const WHAT_HAPPENED_OPTIONS = [
  'Julian killed Edmund and locked Clara and Lily in the cellar',
  'The family left voluntarily and Julian helped them leave',
  'Edmund killed Clara and Lily and then himself',
  'An intruder killed the family and Julian covered it up',
]

const WHY_CALLS_OPTIONS = [
  "Clara's call for help was never answered",
  'A faulty telephone line causes phantom calls',
  'Margaret is making the calls to cover her guilt',
  "Julian haunts the house from beyond the grave",
]

const CULPRIT_OPTIONS = ['Julian', 'Margaret', 'Dorothea', 'The entity', 'Unknown'] as const
const RELIABILITY_OPTIONS = ['Honest', 'Concealing', 'Lying'] as const

interface TheoryFormProps {
  collectedEvidence: Evidence[]
  onSubmit: (theory: Theory) => void
  timelinePlacement: Record<string, string>
}

export function TheoryForm({ collectedEvidence, onSubmit, timelinePlacement }: TheoryFormProps) {
  const [culprit,          setCulprit]          = useState<Theory['culprit'] | ''>('')
  const [whatHappened,     setWhatHappened]     = useState('')
  const [whyCalls,         setWhyCalls]         = useState('')
  const [margaret,         setMargaret]         = useState<'Honest' | 'Concealing' | 'Lying' | ''>('')
  const [dorothea,         setDorothea]         = useState<'Honest' | 'Concealing' | 'Lying' | ''>('')
  const [julian,           setJulian]           = useState<'Honest' | 'Concealing' | 'Lying' | ''>('')
  const [manipulated,      setManipulated]      = useState('')
  const [culpritEvidence,  setCulpritEvidence]  = useState<string[]>([])
  const [timelineEvidence, setTimelineEvidence] = useState<string[]>([])
  const [coverUpEvidence,  setCoverUpEvidence]  = useState<string[]>([])
  const [summary,          setSummary]          = useState('')

  const toggle = (arr: string[], id: string, max: number): string[] => {
    if (arr.includes(id)) return arr.filter((x) => x !== id)
    if (arr.length >= max) return arr
    return [...arr, id]
  }

  const isReady =
    culprit && whatHappened && whyCalls &&
    margaret && dorothea && julian &&
    manipulated &&
    culpritEvidence.length >= 3 &&
    timelineEvidence.length >= 3 &&
    coverUpEvidence.length >= 2

  const handleSubmit = () => {
    if (!isReady) return
    onSubmit({
      culprit:          culprit as Theory['culprit'],
      whatHappened,
      whyCallsContinue: whyCalls,
      timelinePlacement,
      witnessReliability: {
        margaret: margaret as 'Honest' | 'Concealing' | 'Lying',
        dorothea: dorothea as 'Honest' | 'Concealing' | 'Lying',
        julian:   julian   as 'Honest' | 'Concealing' | 'Lying',
      },
      manipulatedEvidence: manipulated,
      supportingEvidence: {
        culpritAndMotive: culpritEvidence,
        timeline:         timelineEvidence,
        coverUp:          coverUpEvidence,
      },
      summary: summary || undefined,
    })
  }

  const labelCls = 'font-inter text-xs text-parchment-dark uppercase tracking-wide mb-1 block'
  const selectCls = 'w-full bg-ink border border-gold text-parchment font-inter text-sm rounded px-3 py-2 outline-none'

  return (
    <div className="space-y-6 max-w-xl">
      <section>
        <label className={labelCls}>Culprit</label>
        <select className={selectCls} value={culprit} onChange={(e) => setCulprit(e.target.value as Theory['culprit'])}>
          <option value="">Select…</option>
          {CULPRIT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </section>

      <section>
        <label className={labelCls}>What happened</label>
        <select className={selectCls} value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)}>
          <option value="">Select…</option>
          {WHAT_HAPPENED_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </section>

      <section>
        <label className={labelCls}>Why do the calls continue?</label>
        <select className={selectCls} value={whyCalls} onChange={(e) => setWhyCalls(e.target.value)}>
          <option value="">Select…</option>
          {WHY_CALLS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </section>

      <section className="space-y-3">
        <p className={labelCls}>Witness reliability</p>
        {[
          { label: 'Margaret Hale', value: margaret, set: setMargaret },
          { label: 'Dorothea Pryce', value: dorothea, set: setDorothea },
          { label: 'Julian Ashworth', value: julian, set: setJulian },
        ].map(({ label, value, set }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="font-inter text-sm text-parchment w-36">{label}</span>
            <select
              className={selectCls}
              value={value}
              onChange={(e) => set(e.target.value as 'Honest' | 'Concealing' | 'Lying')}
            >
              <option value="">Select…</option>
              {RELIABILITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </section>

      <section>
        <label className={labelCls}>Which evidence was manipulated?</label>
        <select className={selectCls} value={manipulated} onChange={(e) => setManipulated(e.target.value)}>
          <option value="">Select…</option>
          {collectedEvidence.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </section>

      {([
        { label: 'Evidence supporting culprit & motive (pick 3)', state: culpritEvidence, set: setCulpritEvidence, max: 5, min: 3 },
        { label: 'Evidence supporting timeline (pick 3)', state: timelineEvidence, set: setTimelineEvidence, max: 5, min: 3 },
        { label: 'Evidence supporting cover-up (pick 2)', state: coverUpEvidence, set: setCoverUpEvidence, max: 4, min: 2 },
      ] as const).map(({ label, state, set, max }) => (
        <section key={label}>
          <p className={labelCls}>{label}</p>
          <div className="flex flex-wrap gap-2">
            {collectedEvidence.map((ev) => (
              <button
                key={ev.id}
                onClick={() => set(toggle(state as string[], ev.id, max))}
                className="font-inter text-xs px-2 py-1 rounded border transition-colors cursor-pointer"
                style={{
                  background: state.includes(ev.id as never) ? 'var(--burgundy)' : 'transparent',
                  borderColor: state.includes(ev.id as never) ? 'var(--gold)' : 'var(--brown)',
                  color: 'var(--parchment)',
                }}
              >
                {ev.name}
              </button>
            ))}
          </div>
        </section>
      ))}

      <section>
        <label className={labelCls}>Summary (optional, 400 chars max)</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={400}
          rows={3}
          className="w-full bg-ink border border-gold text-parchment font-inter text-sm rounded px-3 py-2 outline-none resize-none"
        />
      </section>

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!isReady}
        tooltip="Complete all required fields and select minimum evidence for each claim"
        className="w-full py-3 text-base"
      >
        Submit Theory
      </Button>
    </div>
  )
}
