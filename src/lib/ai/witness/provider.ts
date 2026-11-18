// All provider code runs server-side only. Never import in client components.

export interface AIProvider {
  complete(
    prompt: string,
    options: { temperature: number; maxTokens: number }
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
    options: { temperature: number; maxTokens: number }
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
          },
        }),
      })

      if (!res.ok) throw new Error(`Gemini ${res.status}`)

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
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
    options: { temperature: number; maxTokens: number }
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
  const model = process.env.AI_MODEL ?? 'gemini-1.5-flash'

  if (providerName === 'groq') return new GroqProvider(apiKey, model)
  return new GeminiProvider(apiKey, model)
}
