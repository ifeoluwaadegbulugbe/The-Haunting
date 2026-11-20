'use client'

import { useEffect, useState } from 'react'

const cache = new Map<string, Promise<boolean>>()

/**
 * True once an optional art file exists on the server. Lets the game show generated
 * artwork as soon as it is added, and a drawn or stand-in version until then.
 */
export function useAsset(url: string | null | undefined): boolean {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    if (!url) return
    let alive = true
    if (!cache.has(url)) {
      cache.set(url, fetch(url, { method: 'HEAD' }).then((r) => r.ok).catch(() => false))
    }
    void cache.get(url)!.then((v) => { if (alive) setOk(v) })
    return () => { alive = false }
  }, [url])
  return ok
}
