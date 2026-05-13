import type { BusinessService, IncidentDetail } from '../types'
import { findSimulatedRcaReply } from './simulatedLlmQA'

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/**
 * Simulated RCA assistant: seeded answers for suggested questions, then keyword mock replies.
 */
export async function completeRca(
  prompt: string,
  _incidentContext: string,
  seed?: { incident: IncidentDetail; services: BusinessService[] },
): Promise<string> {
  if (seed) {
    const seeded = findSimulatedRcaReply(prompt, seed.incident, seed.services)
    if (seeded) {
      await delay(320 + Math.random() * 220)
      return seeded
    }
  }

  await delay(600 + Math.random() * 400)

  const lower = prompt.toLowerCase()
  if (lower.includes('what changed') || lower.includes('change')) {
    return (
      '**1. Summary**\n' +
      '• A **payments-edge** deploy landed just before checkout latency jumped.\n' +
      '• **stripe-proxy** shows a **429 / rate-limit** log cluster consistent with a **retry storm**.\n\n' +
      '**2. Key findings**\n' +
      '• Canary expansion on **v2.14.3** lines up with trace stall on **stripe-proxy** spans.\n' +
      '• **Redis / Kafka** show no primary anomaly in the same window (mock).\n\n' +
      '**3. Mapping (signal → implication)**\n' +
      '• `Deploy (ServiceNow)` → **payments-edge v2.14.3** — likely behavior change vector.\n' +
      '• `APM trace heat` → **checkout-api p95** — symptom surface.\n' +
      '• `Splunk PAY-429 cluster` → **Upstream limiter / retry loop** pressure.\n' +
      '• `Datadog dependency check` → **stripe-proxy** path instability.\n' +
      '• `Topology blast` → **checkout → payments → stripe** — narrow remediation scope.\n\n' +
      '**Next steps**\n' +
      '• Validate **pay_retry_v3**; compare **stripe-proxy QPS** vs limiter; consider **rollback** or **throttle** on payments-edge.'
    )
  }
  if (lower.includes('root cause') || lower.includes('cause')) {
    return (
      '**1. Summary**\n' +
      '• Most likely: **client retry behavior** in **payments-edge v2.14.3** amplified by **stripe-proxy rate limits**.\n\n' +
      '**2. Key findings**\n' +
      '• Timeline order: **deploy → latency → log spike → dependency alert** (mock correlation).\n\n' +
      '**3. Mapping (signal → implication)**\n' +
      '• `Deploy` → Introduces **retry / timeout** tuning risk.\n' +
      '• `Latency + 429 logs` → **Retry storm** hits shared limiter.\n' +
      '• `Traces` → Confirms **critical path** through **payments → stripe**.'
    )
  }

  return (
    '**1. Summary**\n' +
    '• Prioritize **payments-edge v2.14.3** and **stripe-proxy rate limits** using the incident context above.\n\n' +
    '**2. Key findings**\n' +
    '• Try a **suggested question** for a fuller seeded answer, or ask about **timeline**, **blast radius**, or **severity**.\n\n' +
    '**3. Mapping (signal → implication)**\n' +
    '• `Correlated timeline` → Ordered evidence chain for hypothesis testing.\n' +
    '• `Auto-triage panel` → Compressed **severity + domain** hypothesis.\n' +
    '• `Topology minimap` → **Blast radius** for containment.\n\n' +
    `• _Your prompt:_ ${prompt}`
  )
}
