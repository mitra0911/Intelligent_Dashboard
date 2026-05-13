import { useCallback, useMemo, useRef, useState } from 'react'
import { Loader2, Send, Sparkles } from 'lucide-react'
import type { BusinessService, IncidentDetail } from '../types'
import { completeRca } from '../lib/rcaClient'
import { getRcaSimulatedQuestions } from '../lib/simulatedLlmQA'

export interface RCAAssistantProps {
  incidentContext: string
  seed?: { incident: IncidentDetail; services: BusinessService[] }
  className?: string
}

interface Msg {
  role: 'user' | 'assistant'
  text: string
}

export function RCAAssistant({ incidentContext, seed, className = '' }: RCAAssistantProps) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const demoQuestions = useMemo(() => (seed ? getRcaSimulatedQuestions() : []), [seed])

  const scrollDown = () => endRef.current?.scrollIntoView({ behavior: 'smooth' })

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return
      setMessages((m) => [...m, { role: 'user', text: trimmed }])
      setInput('')
      setLoading(true)
      try {
        const reply = await completeRca(trimmed, incidentContext, seed)
        setMessages((m) => [...m, { role: 'assistant', text: reply }])
      } catch {
        setMessages((m) => [...m, { role: 'assistant', text: 'Request failed. Try again.' }])
      } finally {
        setLoading(false)
        requestAnimationFrame(scrollDown)
      }
    },
    [incidentContext, loading, seed],
  )

  const quickWhatChanged = () => void send('What changed?')

  return (
    <div
      className={`flex flex-col rounded-xl border border-obs-border bg-obs-elevated ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-obs-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-obs-teal" aria-hidden />
        <span className="text-sm font-medium text-obs-text">RCA Assistant</span>
        <span className="ml-auto text-xs text-obs-muted">Simulated demo</span>
      </div>

      <div className="max-h-72 min-h-44 overflow-y-auto px-4 py-3 text-left text-sm">
        {messages.length === 0 && (
          <p className="text-obs-muted">
            Ask in natural language. Answers use seeded sample questions and keyword-style mock replies from
            this page&apos;s incident context (no external LLM).
          </p>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.role === 'user'
                  ? 'ml-8 rounded-lg bg-obs-surface px-3 py-2 text-obs-text'
                  : 'mr-4 rounded-lg border border-obs-border bg-obs-bg/80 px-3 py-2 text-obs-muted whitespace-pre-wrap'
              }
            >
              {msg.text}
            </div>
          ))}
        </div>
        {loading && (
          <div className="mt-2 flex items-center gap-2 text-obs-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing signals…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {seed && demoQuestions.length > 0 && (
        <div className="space-y-1.5 border-t border-obs-border px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-obs-muted">
            Sample questions
          </div>
          <div className="flex flex-col gap-1">
            {demoQuestions.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => void send(q)}
                className="rounded-md border border-obs-border bg-obs-bg px-2 py-1.5 text-left text-[11px] leading-snug text-obs-text hover:border-obs-teal/40 hover:bg-obs-surface disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-obs-border px-3 py-2">
        <button
          type="button"
          onClick={quickWhatChanged}
          disabled={loading}
          className="rounded-lg bg-obs-teal/15 px-3 py-1.5 text-xs font-medium text-obs-teal hover:bg-obs-teal/25 disabled:opacity-50"
        >
          What changed?
        </button>
      </div>

      <form
        className="flex gap-2 border-t border-obs-border p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about logs, metrics, deploys, topology…"
          className="min-w-0 flex-1 rounded-lg border border-obs-border bg-obs-bg px-3 py-2 text-sm text-obs-text placeholder:text-obs-muted focus:border-obs-teal focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex shrink-0 items-center justify-center rounded-lg bg-obs-teal px-3 py-2 text-obs-bg hover:bg-obs-teal-dim disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
