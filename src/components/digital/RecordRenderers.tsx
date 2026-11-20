'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { audio } from '@/lib/audio/engine'
import type { DigitalRecord } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTs(ts: string) {
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ts
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ts
  }
}

// ── Record renderers ───────────────────────────────────────────────────────

export function CallLogEntry({ record }: { record: DigitalRecord }) {
  const c = record.content as {
    header?: string
    entries?: Array<{
      date: string; time: string; from: string; to: string
      duration: string; notes: string; highlighted?: boolean
    }>
    from?: string; to?: string; duration?: string; notes?: string
  }

  if (c.entries) {
    return (
      <div className="space-y-1">
        {c.header && (
          <p className="font-cinzel text-xs text-parchment-dark tracking-wide mb-3">
            {c.header}
          </p>
        )}
        <table className="w-full font-inter text-xs text-parchment-dark border-collapse">
          <thead>
            <tr className="border-b border-gold">
              <th className="text-left py-1 pr-2">Date</th>
              <th className="text-left py-1 pr-2">Time</th>
              <th className="text-left py-1 pr-2">From</th>
              <th className="text-left py-1 pr-2">To</th>
              <th className="text-left py-1">Dur.</th>
            </tr>
          </thead>
          <tbody>
            {c.entries.map((row, i) => (
              <tr
                key={i}
                className={row.highlighted ? 'font-semibold' : ''}
                style={row.highlighted ? { color: 'var(--parchment)', background: 'rgba(165,138,96,0.1)' } : {}}
              >
                <td className="py-1 pr-2">{row.date}</td>
                <td className="py-1 pr-2">{row.time}</td>
                <td className="py-1 pr-2 max-w-[80px] truncate">{row.from}</td>
                <td className="py-1 pr-2 max-w-[80px] truncate">{row.to}</td>
                <td className="py-1">{row.duration} {row.notes && <span className="text-thread ml-1">{row.notes}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="font-inter text-xs text-parchment-dark space-y-1">
      <p>{formatTs(record.timestamp)}</p>
      <p>From: {c.from} → To: {c.to}</p>
      <p>Duration: {c.duration} {c.notes}</p>
    </div>
  )
}

export function SmsMessage({ record }: { record: DigitalRecord }) {
  const c = record.content as { from: string; to: string; text: string }
  return (
    <div className="space-y-1">
      <p className="font-inter text-xs text-parchment-dark">{formatTs(record.timestamp)}</p>
      <p className="font-inter text-xs text-gold">{c.from} → {c.to}</p>
      <p className="font-inter text-sm text-parchment bg-brown rounded px-3 py-2">{c.text}</p>
    </div>
  )
}

export function EmailMessage({ record }: { record: DigitalRecord }) {
  const c = record.content as { from: string; to: string; subject: string; body: string }
  return (
    <div className="space-y-2">
      <div className="border-b border-gold pb-2 space-y-0.5">
        <p className="font-inter text-xs text-parchment-dark">From: <span className="text-parchment">{c.from}</span></p>
        <p className="font-inter text-xs text-parchment-dark">To: <span className="text-parchment">{c.to}</span></p>
        <p className="font-inter text-xs text-parchment-dark">Subject: <span className="text-parchment">{c.subject}</span></p>
        <p className="font-inter text-xs text-parchment-dark">{formatTs(record.timestamp)}</p>
      </div>
      <p className="font-inter text-sm text-parchment leading-relaxed">{c.body}</p>
    </div>
  )
}

export function VoicemailEntry({ record }: { record: DigitalRecord }) {
  const c = record.content as { from: string; to: string; transcript: string; duration: string }
  const words = c.transcript.split(' ')
  const [heard, setHeard] = useState(0)
  const [playing, setPlaying] = useState(false)
  const play = () => {
    if (playing) return
    audio.sfx('tape', 0.7)
    setPlaying(true); setHeard(0)
    words.forEach((_, i) => setTimeout(() => { setHeard(i + 1); if (i === words.length - 1) setTimeout(() => setPlaying(false), 900) }, 500 + i * 260))
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={play}
          aria-label={playing ? 'Playing voicemail' : 'Play voicemail'}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
          style={{ background: 'var(--burgundy)', border: '1px solid var(--gold)' }}
        >
          <span className="text-parchment text-xs">{playing ? '❚❚' : '▶'}</span>
        </button>
        <div className="flex items-end gap-[2px] h-7" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => (
            <motion.span
              key={i}
              className="w-[3px] rounded-sm"
              style={{ background: 'var(--candle)', height: 4 }}
              animate={playing ? { height: [4, 6 + ((i * 37) % 20), 4] } : { height: 4 }}
              transition={playing ? { repeat: Infinity, duration: 0.5 + ((i * 13) % 5) / 10 } : { duration: 0.3 }}
            />
          ))}
        </div>
        <div>
          <p className="font-inter text-xs text-parchment">Voicemail from {c.from}</p>
          <p className="font-inter text-xs text-parchment-dark">{formatTs(record.timestamp)} · {c.duration}</p>
        </div>
      </div>
      <p className="font-caveat text-lg text-parchment-dark border-l-2 border-gold pl-3 min-h-8">
        {heard === 0 ? <span className="opacity-60">Press play to hear the message.</span> : <>&quot;{words.slice(0, heard).join(' ')}{heard === words.length ? '\u201D' : ''}</>}
      </p>
    </div>
  )
}

export function PhotoEntry({ record }: { record: DigitalRecord }) {
  const c = record.content as { caption: string; description: string; assetPath?: string | null }
  return (
    <div className="space-y-2">
      <div
        className="w-full aspect-video rounded flex items-center justify-center"
        style={{ background: 'var(--brown)', border: '1px solid var(--gold)' }}
      >
        {c.assetPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.assetPath} alt={c.caption} className="w-full h-full object-cover rounded" />
        ) : (
          <span className="font-caveat text-parchment-dark text-sm">[photo]</span>
        )}
      </div>
      <p className="font-caveat text-xs text-parchment-dark">{c.caption}</p>
      {c.description && (
        <p className="font-inter text-xs text-parchment-dark">{c.description}</p>
      )}
    </div>
  )
}

export function ProfileEntry({ record }: { record: DigitalRecord }) {
  const c = record.content as { platform: string; user: string; status: string; postedAt: string }
  return (
    <div className="space-y-1 p-2 rounded" style={{ background: 'var(--brown)' }}>
      <p className="font-inter text-xs text-parchment-dark">{c.platform}</p>
      <p className="font-inter text-sm text-parchment font-semibold">{c.user}</p>
      <p className="font-inter text-sm text-parchment">{c.status}</p>
      <p className="font-inter text-xs text-parchment-dark">{c.postedAt}</p>
    </div>
  )
}

export function NoteEntry({ record }: { record: DigitalRecord }) {
  const c = record.content as { title: string; body: string }
  return (
    <div className="space-y-2">
      <p className="font-cormorant font-semibold text-obsidian text-sm">{c.title}</p>
      <p className="font-caveat text-sm text-brown leading-relaxed">{c.body}</p>
      <p className="font-inter text-xs text-brown opacity-60">{formatTs(record.timestamp)}</p>
    </div>
  )
}

// ── Dispatcher ────────────────────────────────────────────────────────────

export function RecordContent({ record }: { record: DigitalRecord }) {
  switch (record.kind) {
    case 'call': return <CallLogEntry record={record} />
    case 'sms': return <SmsMessage record={record} />
    case 'email': return <EmailMessage record={record} />
    case 'voicemail': return <VoicemailEntry record={record} />
    case 'photo': return <PhotoEntry record={record} />
    case 'profile': return <ProfileEntry record={record} />
    case 'note': return <NoteEntry record={record} />
    default: return (
      <p className="font-inter text-xs text-parchment-dark">{JSON.stringify(record.content)}</p>
    )
  }
}
