import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Loader2, MessageCircle, Search, Send, Trash2, X } from 'lucide-react'
import { useMockData } from '../context/MockDataContext'
import { buildDashboardContext } from '../lib/dashboardContext'
import { completeVisualAssistant } from '../lib/visualAssistantClient'
import { getVisualSimulatedQuestions } from '../lib/simulatedLlmQA'
import {
  clearVisualAssistantHistory,
  loadVisualAssistantHistory,
  saveVisualAssistantHistory,
  VISUAL_ASSISTANT_GUIDE,
  type VisualAssistantMessage,
} from '../lib/visualAssistantHistory'

export function VisualAssistantPanel() {
  const { data } = useMockData()
  const location = useLocation()
  const path = location.pathname || '/'
  const demoQuestions = useMemo(() => getVisualSimulatedQuestions(path), [path])
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState<VisualAssistantMessage[]>(() => loadVisualAssistantHistory())
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const hydrated = useRef(false)

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    saveVisualAssistantHistory(messages)
  }, [messages])

  const scrollDown = () => endRef.current?.scrollIntoView({ behavior: 'smooth' })

  const clearHistory = useCallback(() => {
    clearVisualAssistantHistory()
    setMessages([])
  }, [])

  const runSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return
      const ctx = buildDashboardContext(path, data)
      const userMsg: VisualAssistantMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: trimmed,
        path,
      }
      setMessages((m) => [...m, userMsg])
      setQuery('')
      setLoading(true)
      try {
        const reply = await completeVisualAssistant(trimmed, ctx, path)
        const asstMsg: VisualAssistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: reply,
        }
        setMessages((m) => [...m, asstMsg])
      } catch {
        const errMsg: VisualAssistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          text:
            '**1. Summary**\n• The request failed — nothing was saved beyond your question.\n\n**2. Key points**\n• Try again.\n\n**3. Mapping (visual → meaning)**\n• `Error` → No simulated reply was generated.',
        }
        setMessages((m) => [...m, errMsg])
      } finally {
        setLoading(false)
        requestAnimationFrame(scrollDown)
      }
    },
    [loading, path, data],
  )

  const send = useCallback(() => void runSend(query), [query, runSend])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex max-w-full flex-col items-end gap-2 p-0 sm:bottom-6 sm:right-6">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/25 bg-obs-teal px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-obs-teal-dim"
        >
          <MessageCircle className="h-5 w-5 text-white" aria-hidden />
          Ask about visuals
        </button>
      )}

      {open && (
        <div className="pointer-events-auto flex w-[min(100vw-2rem,420px)] flex-col overflow-hidden rounded-xl border border-white/20 bg-obs-surface text-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/15 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-white" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white">Visual assistant</div>
              <div className="truncate text-[11px] text-white/90" title={location.pathname || '/'}>
                {location.pathname || '/'}
              </div>
              <div className="truncate text-[10px] text-white/55">Simulated demo</div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-white hover:bg-white/10 disabled:opacity-30"
              aria-label="Clear chat history"
              disabled={messages.length === 0}
              onClick={clearHistory}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-white hover:bg-white/10"
              aria-label="Close panel"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            className="border-b border-white/15 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <label htmlFor="visual-assistant-search" className="sr-only">
              Ask about charts and visuals on this screen
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
              <input
                id="visual-assistant-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask what a chart, graph, or panel shows…"
                className="w-full rounded-lg border border-white/20 bg-black/25 py-2.5 pl-10 pr-12 text-sm text-white placeholder:text-white focus:border-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-obs-teal text-white hover:bg-obs-teal-dim disabled:opacity-40"
                aria-label="Send question"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </form>

          <div className="max-h-[min(50vh,320px)] min-h-[120px] overflow-y-auto px-3 py-2 text-left text-sm text-white">
            <p className="mb-3 border-b border-white/10 pb-2 text-[11px] leading-snug text-white whitespace-pre-wrap">
              {VISUAL_ASSISTANT_GUIDE}
            </p>

            {demoQuestions.length > 0 && (
              <div className="mb-3 border-b border-white/10 pb-2">
                <div className="text-[10px] font-medium uppercase tracking-wide text-white/55">
                  Sample questions
                </div>
                <div className="mt-1.5 flex flex-col gap-1">
                  {demoQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={loading}
                      onClick={() => void runSend(q)}
                      className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-left text-[11px] leading-snug text-white/90 hover:bg-white/10 disabled:opacity-40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length === 0 && (
              <p className="text-xs leading-relaxed text-white">
                No history yet. Ask anything about the current screen — your conversation is kept in this browser.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div
                    className={
                      msg.role === 'user'
                        ? 'ml-6 rounded-lg bg-white/15 px-3 py-2 text-white'
                        : 'mr-2 whitespace-pre-wrap rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white'
                    }
                  >
                    {msg.role === 'user' && msg.path && (
                      <div className="mb-1 text-[10px] uppercase tracking-wide text-white/80">
                        Asked on {msg.path}
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            {loading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-white">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" aria-hidden />
                Reading this screen…
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
      )}
    </div>
  )
}
