const STORAGE_KEY = 'observiq-visual-assistant-v1'

export type VisualAssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Route when the user sent the message */
  path?: string
}

export const VISUAL_ASSISTANT_GUIDE =
  'This panel answers questions about **mock** charts and UI on the current route. ' +
  'Replies are **simulated** from seeded patterns and keywords — not a live LLM.'

export function loadVisualAssistantHistory(): VisualAssistantMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data.filter(
      (m): m is VisualAssistantMessage =>
        typeof m === 'object' &&
        m !== null &&
        typeof (m as VisualAssistantMessage).id === 'string' &&
        ((m as VisualAssistantMessage).role === 'user' || (m as VisualAssistantMessage).role === 'assistant') &&
        typeof (m as VisualAssistantMessage).text === 'string',
    )
  } catch {
    return []
  }
}

export function saveVisualAssistantHistory(messages: VisualAssistantMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    /* quota / private mode */
  }
}

export function clearVisualAssistantHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
