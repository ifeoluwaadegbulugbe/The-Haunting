/* eslint-disable @next/next/no-img-element */
// Close-up artwork for each piece of evidence. Documents are drawn in code so their
// text stays sharp and readable; photographs use the existing artwork.
import type { ReactNode } from 'react'

interface EvidenceVisualProps {
  evidenceId: string
  assetPath?: string
  name: string
  compact?: boolean
}

// ── Shared paper surfaces ──────────────────────────────────────────────────

function Paper({
  children, tilt = 0, className = '', tone = 'light',
}: { children: ReactNode; tilt?: number; className?: string; tone?: 'light' | 'aged' }) {
  return (
    <div
      className={`relative rounded-sm px-5 py-4 text-obsidian ${className}`}
      style={{
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        background:
          tone === 'aged'
            ? 'linear-gradient(160deg, var(--parchment) 0%, var(--parchment-dark) 100%)'
            : 'linear-gradient(160deg, var(--parchment-light) 0%, var(--parchment) 100%)',
        boxShadow: '0 10px 30px rgba(14,12,16,0.55), inset 0 0 40px rgba(81,65,61,0.18)',
      }}
    >
      {children}
    </div>
  )
}

function Pin() {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full"
      style={{ background: 'var(--thread)', boxShadow: '0 2px 3px rgba(14,12,16,0.6)' }}
    />
  )
}

const hand = 'font-caveat text-lg leading-snug'

// ── EV-01 Rotary telephone ────────────────────────────────────────────────

function Telephone() {
  const holes = Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 28 - 60) * Math.PI) / 180
    return { x: 160 + Math.cos(a) * 46, y: 150 + Math.sin(a) * 46, n: (i + 1) % 10 }
  })
  return (
    <svg viewBox="0 0 320 260" className="w-full max-w-md mx-auto" role="img" aria-label="Rotary telephone labelled Ext 2, Cellar">
      {/* handset */}
      <path d="M70 70 Q160 20 250 70 L262 92 Q160 50 58 92 Z" fill="var(--ink)" stroke="var(--gold)" strokeWidth="2" />
      <ellipse cx="66" cy="88" rx="22" ry="14" fill="var(--ink)" stroke="var(--gold)" strokeWidth="2" />
      <ellipse cx="254" cy="88" rx="22" ry="14" fill="var(--ink)" stroke="var(--gold)" strokeWidth="2" />
      {/* body */}
      <path d="M60 230 L90 100 L230 100 L260 230 Z" fill="var(--ink)" stroke="var(--gold)" strokeWidth="2" />
      {/* dial */}
      <circle cx="160" cy="150" r="62" fill="var(--brown)" stroke="var(--gold)" strokeWidth="3" />
      {holes.map((h) => (
        <g key={h.n}>
          <circle cx={h.x} cy={h.y} r="9" fill="var(--ink)" stroke="var(--parchment-dark)" strokeWidth="1" />
          <text x={h.x} y={h.y + 3.5} textAnchor="middle" fontSize="9" fill="var(--parchment)" fontFamily="var(--font-inter), sans-serif">{h.n}</text>
        </g>
      ))}
      {/* paper label in the centre */}
      <circle cx="160" cy="150" r="27" fill="var(--parchment-light)" stroke="var(--parchment-dark)" />
      <text x="160" y="146" textAnchor="middle" fontSize="13" fill="var(--obsidian)" fontFamily="var(--font-caveat), cursive">Ext 2</text>
      <text x="160" y="162" textAnchor="middle" fontSize="13" fill="var(--obsidian)" fontFamily="var(--font-caveat), cursive">Cellar</text>
      {/* line tag */}
      <rect x="196" y="204" width="96" height="30" rx="2" fill="var(--parchment-light)" transform="rotate(-6 244 219)" />
      <text x="244" y="224" textAnchor="middle" fontSize="12" fill="var(--obsidian)" fontFamily="var(--font-caveat), cursive" transform="rotate(-6 244 219)">2nd handset ↓</text>
    </svg>
  )
}

// ── EV-03 Clara's diary ───────────────────────────────────────────────────

function Diary() {
  const entries = [
    ['2 Oct', 'J. here again about money. E. said no. J. stayed very calm, which was worse.'],
    ['19 Oct', 'J. rang three times today. E. will not speak to him.'],
    ['1 Nov', "Aunt B. arriving on the 22nd. Lily's concert on the 14th, she is so nervous."],
    ['9 Nov', 'J. says it is "only a signature". E. has started locking the study.'],
  ]
  return (
    <div className="flex gap-0 justify-center">
      <Paper className="w-full max-w-sm">
        <p className="font-cormorant text-sm italic text-brown mb-3">C. Ashworth — 2008</p>
        <ul className="space-y-3">
          {entries.map(([d, t]) => (
            <li key={d}>
              <span className="font-inter text-xs text-brown tracking-wide">{d}</span>
              <p className={hand}>{t}</p>
            </li>
          ))}
        </ul>
        {/* torn-out final pages */}
        <div
          aria-hidden="true"
          className="absolute -right-2 top-4 bottom-4 w-3"
          style={{ background: 'repeating-linear-gradient(180deg, var(--parchment-dark) 0 6px, transparent 6px 10px)' }}
        />
        <p className="font-inter text-xs text-brown mt-4 italic">The last pages have been torn out.</p>
        {/* small key taped inside the back cover */}
        <svg viewBox="0 0 120 40" className="absolute -bottom-4 right-6 w-28" role="img" aria-label="A small key taped inside the back cover">
          <rect x="18" y="8" width="70" height="24" fill="rgba(234,223,201,0.7)" transform="rotate(-8 53 20)" />
          <circle cx="30" cy="20" r="9" fill="none" stroke="var(--gold)" strokeWidth="3" />
          <path d="M39 20 H92 M80 20 V28 M88 20 V26" stroke="var(--gold)" strokeWidth="3" fill="none" />
        </svg>
      </Paper>
    </div>
  )
}

// ── EV-04 Newspaper clippings ─────────────────────────────────────────────

function Clipping({
  date, headline, body, tilt, className = '',
}: { date: string; headline: string; body: string; tilt: number; className?: string }) {
  return (
    <Paper tone="aged" tilt={tilt} className={`w-72 ${className}`}>
      <Pin />
      <div className="flex items-baseline justify-between gap-2 border-b border-brown pb-1 mb-2 whitespace-nowrap">
        <span className="font-cinzel text-[10px] tracking-[0.18em] text-brown">THE WEXMOOR COURIER</span>
        <span className="font-inter text-[10px] text-brown">{date}</span>
      </div>
      <h4 className="font-cormorant font-bold text-xl leading-tight mb-2">{headline}</h4>
      <p className="font-cormorant text-base leading-snug">{body}</p>
    </Paper>
  )
}

function Clippings() {
  return (
    <div className="relative flex flex-wrap justify-center gap-4 py-2">
      <Clipping
        tilt={-3}
        date="13 NOV 2008"
        headline="Family leaves Hollow Lane home"
        body="Edmund and Clara Ashworth and their daughter Lily, 9, left Ashworth House on the afternoon of 11 November. Their housekeeper told officers the family drove away before dark."
      />
      <Clipping
        tilt={2}
        className="sm:mt-8"
        date="15 NOV 2008"
        headline={'Police: "no sign of foul play"'}
        body="Officers say there is no evidence of a crime and the family is believed to have travelled abroad of their own accord. The inquiry has been scaled back."
      />
      <Clipping
        tilt={-1}
        date="20 NOV 2008"
        headline="Cousin 'shocked' by departure"
        body="Julian Ashworth, Mr Ashworth's cousin, who was abroad at the time, said the couple had often spoken of emigrating. He asked for the family's privacy."
      />
    </div>
  )
}

// ── EV-08 Housekeeper's logbook ───────────────────────────────────────────

function Logbook() {
  const rows = [
    ['7 Nov 2008', '07:30', '16:45'],
    ['10 Nov 2008', '07:30', '16:50'],
    ['11 Nov 2008', '07:30', '16:55'],
  ]
  return (
    <Paper className="w-full max-w-md mx-auto">
      <p className="font-cormorant font-semibold text-lg mb-2">Ashworth House — Hours Kept</p>
      <table className="w-full font-inter text-sm border-collapse">
        <thead>
          <tr className="border-b border-brown text-left text-xs text-brown">
            <th className="py-1">Date</th><th>In</th><th>Out</th><th>Initials</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([d, i, o]) => (
            <tr key={d} className="border-b" style={{ borderColor: 'rgba(81,65,61,0.25)' }}>
              <td className="py-1.5">{d}</td><td>{i}</td>
              <td className={d.startsWith('11') ? 'font-semibold' : ''}>{o}</td>
              <td className={hand}>D.P.</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`${hand} mt-3 pl-3 border-l-2 border-brown`}>
        Mr Julian asked to borrow the house key copies — 4 Nov.
      </p>
    </Paper>
  )
}

// ── EV-07 Final night recording ───────────────────────────────────────────

function Recording() {
  const lines: Array<[string, string, boolean?]> = [
    ['23:05', '[Two voices. Raised.]'],
    ['', 'JULIAN: You\u2019ll sign it, Edmund.', true],
    ['', 'EDMUND: Get out of my study.'],
    ['23:08', '[A struggle. Something heavy falls.]'],
    ['23:09', '[Silence. The tape runs on.]'],
  ]
  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 240 140" className="w-56" role="img" aria-label="Cassette tape labelled Study, 11.11.08">
        <rect x="4" y="4" width="232" height="132" rx="10" fill="var(--ink)" stroke="var(--gold)" strokeWidth="2" />
        <rect x="24" y="18" width="192" height="46" rx="3" fill="var(--parchment-light)" />
        <text x="120" y="47" textAnchor="middle" fontSize="20" fill="var(--obsidian)" fontFamily="var(--font-caveat), cursive">Study — 11.11.08</text>
        <rect x="60" y="78" width="120" height="34" rx="17" fill="var(--brown)" />
        <circle cx="84" cy="95" r="12" fill="var(--parchment-dark)" />
        <circle cx="156" cy="95" r="12" fill="var(--parchment-dark)" />
      </svg>
      <Paper className="w-full max-w-md">
        <p className="font-inter text-xs text-brown uppercase tracking-wide mb-2">Transcript</p>
        <dl className="space-y-1.5">
          {lines.map(([t, text, key], i) => (
            <div key={i} className="flex gap-3">
              <dt className="font-inter text-xs text-brown w-10 pt-0.5">{t}</dt>
              <dd className={`font-cormorant text-base ${key ? 'font-bold' : ''}`}>{text}</dd>
            </div>
          ))}
        </dl>
      </Paper>
    </div>
  )
}

// ── EV-06 Unsigned will amendment ─────────────────────────────────────────

function Will() {
  return (
    <Paper className="w-full max-w-md mx-auto">
      <p className="font-cinzel text-xs tracking-[0.2em] text-center text-brown">AMENDMENT TO THE LAST WILL AND TESTAMENT</p>
      <p className="font-cormorant font-bold text-xl text-center mb-3">of Edmund Ashworth</p>
      <p className="font-cormorant text-base leading-relaxed">
        I, EDMUND ASHWORTH, of Ashworth House, Hollow Lane, revoke all earlier bequests and
        name my cousin, <strong>JULIAN ASHWORTH</strong>, sole heir to my whole estate.
      </p>
      <div className="mt-6 space-y-4 font-inter text-xs text-brown">
        <div className="flex items-end gap-2">Signed:<span className="flex-1 border-b border-brown h-5" /></div>
        <div className="flex items-end gap-2">Dated:<span className="flex-1 border-b border-brown h-5" />November 2008</div>
      </div>
      <p className={`${hand} mt-3 text-brown`}>The signature line is blank.</p>
    </Paper>
  )
}

// ── EV-10 Creditor final notice ───────────────────────────────────────────

function CreditorNotice() {
  return (
    <Paper className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-start border-b border-brown pb-2 mb-3">
        <p className="font-cinzel text-xs tracking-[0.15em]">HARROW &amp; FINCH CREDIT LTD<br /><span className="text-brown">LONDON</span></p>
        <p className="font-inter text-xs text-brown">28 October 2008</p>
      </div>
      <p className="font-inter text-sm mb-1">To: Mr Julian Ashworth</p>
      <p className="font-cinzel font-bold text-lg tracking-widest my-3" style={{ color: 'var(--thread)' }}>FINAL NOTICE</p>
      <p className="font-cormorant text-base leading-relaxed">
        Your account is seriously in arrears. Unless the outstanding balance is settled
        within fourteen days, proceedings will begin without further notice.
      </p>
    </Paper>
  )
}

// ── Photographs and other image evidence ──────────────────────────────────

function Photo({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="mx-auto w-fit p-3 pb-5 rounded-sm" style={{ background: 'var(--parchment-light)', boxShadow: '0 10px 30px rgba(14,12,16,0.55)' }}>
      <img src={src} alt={alt} className="block max-h-[52dvh] max-w-full object-contain" draggable={false} />
      {caption && <figcaption className={`${hand} text-obsidian text-center mt-2`}>{caption}</figcaption>}
    </figure>
  )
}

const VISUALS: Record<string, () => ReactNode> = {
  'EV-01': Telephone,
  'EV-03': Diary,
  'EV-04': Clippings,
  'EV-06': Will,
  'EV-07': Recording,
  'EV-08': Logbook,
  'EV-10': CreditorNotice,
}

const CAPTIONS: Record<string, string> = {
  'EV-02': 'Christmas 2007',
  'EV-05': 'The missing strip',
  'EV-09': 'Lily, 10 Nov',
}

/** Returns the close-up for an evidence item, or null if it has none. */
export function EvidenceVisual({ evidenceId, assetPath, name, compact = false }: EvidenceVisualProps) {
  const Drawn = VISUALS[evidenceId]
  const content = Drawn ? <Drawn /> : assetPath ? <Photo src={assetPath} alt={name} caption={CAPTIONS[evidenceId]} /> : null
  if (!content) return null
  return (
    <div className={compact ? 'origin-top scale-[0.85] -mb-8' : ''}>{content}</div>
  )
}

export function hasEvidenceVisual(evidenceId: string, assetPath?: string): boolean {
  return Boolean(VISUALS[evidenceId] || assetPath)
}
