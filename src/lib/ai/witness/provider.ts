// All provider code runs server-side only. Never import in client components.

export interface AIProvider {
  complete(
    prompt: string,
    options: { temperature: number; maxTokens: number; json?: boolean }
  ): Promise<string>
}

// ── MockProvider ───────────────────────────────────────────────────────────
// Deterministic. Used when AI_MOCK=1 or in tests. No network calls.

export class MockProvider implements AIProvider {
  async complete(prompt: string, _options?: { temperature: number; maxTokens: number }): Promise<string> { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Parse the first allowed fact from the prompt
    const factMatch = prompt.match(/ALLOWED FACTS:\s*\n([\s\S]*?)(?:\n\n|RECENT|USER|$)/)
    let reply = "I'm afraid I cannot say more about that."
    let usedFactIds: string[] = []

    if (factMatch) {
      const lines = factMatch[1].trim().split('\n').filter(Boolean)
      if (lines.length > 0) {
        // First line format: "M1: statement text"
        const firstLine = lines[0]
        const colonIdx = firstLine.indexOf(':')
        if (colonIdx > -1) {
          const factId = firstLine.substring(0, colonIdx).trim()
          reply = firstLine.substring(colonIdx + 1).trim()
          usedFactIds = [factId]
        }
      }
    }

    return JSON.stringify({
      reply,
      usedFactIds,
      mood: 'calm',
    })
  }
}

// ── GeminiProvider ────────────────────────────────────────────────────────

export class GeminiProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  async complete(
    prompt: string,
    options: { temperature: number; maxTokens: number; json?: boolean }
  ): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    try {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${this.model}:generateContent?key=${this.apiKey}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature,
            maxOutputTokens: options.maxTokens,
            ...(options.json ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      })

      if (!res.ok) throw new Error(`Gemini ${res.status}`)

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>
      }
      // Newer models can return several parts; skip any thinking parts
      return (data.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought && typeof p.text === 'string')
        .map((p) => p.text)
        .join('')
    } finally {
      clearTimeout(timeout)
    }
  }
}

// ── GroqProvider ──────────────────────────────────────────────────────────

export class GroqProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  async complete(
    prompt: string,
    options: { temperature: number; maxTokens: number; json?: boolean }
  ): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          ...(options.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      })

      if (!res.ok) throw new Error(`Groq ${res.status}`)

      const data = await res.json() as {
        choices?: Array<{ message?: { content?: string } }>
      }
      return data.choices?.[0]?.message?.content ?? ''
    } finally {
      clearTimeout(timeout)
    }
  }
}

// ── Factory ───────────────────────────────────────────────────────────────

export function getProvider(): AIProvider {
  if (process.env.AI_MOCK === '1') return new MockProvider()

  const providerName = process.env.AI_PROVIDER ?? 'gemini'
  const apiKey = process.env.AI_API_KEY ?? ''
  // The model is configuration, never hard-coded (models are retired over time)
  const model = process.env.AI_MODEL ?? ''
  if (!apiKey || !model) return new UnconfiguredProvider()

  if (providerName === 'groq') return new GroqProvider(apiKey, model)
  return new GeminiProvider(apiKey, model)
}

/** Used when AI_API_KEY or AI_MODEL is missing: every call fails, so routes use scripted lines. */
class UnconfiguredProvider implements AIProvider {
  async complete(): Promise<string> {
    throw new Error('AI provider not configured')
  }
}
