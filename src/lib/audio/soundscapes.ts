import type { MusicId, AmbientId } from './engine'

/** Which music and ambience each room plays. */
export function soundscapeFor(pathname: string): { music: MusicId; ambient: AmbientId } {
  if (pathname.startsWith('/case/001/scene')) return { music: 'house', ambient: 'house' }
  if (pathname.startsWith('/case/001/witnesses')) return { music: 'interview', ambient: 'interview' }
  if (pathname.startsWith('/case/001/archive')) return { music: 'house', ambient: 'interview' }
  if (pathname.startsWith('/case/001/evidence')) return { music: 'theme', ambient: 'hq' }
  if (pathname.startsWith('/case/001/conclusion')) return { music: 'reveal', ambient: 'none' }
  return { music: 'theme', ambient: 'hq' } // title, HQ, profile
}
