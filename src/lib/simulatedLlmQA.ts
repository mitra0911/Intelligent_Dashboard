import type { BusinessService, IncidentDetail } from '../types'

/** Deterministic “chip” questions on the incident RCA assistant. */
const RCA_QA: { q: string; reply: (ctx: { incident: IncidentDetail; services: BusinessService[] }) => string }[] = [
  {
    q: 'What changed right before symptoms?',
    reply: ({ incident }) => {
      const deploy = incident.signals.find((s) => s.kind === 'deploy')
      return (
        '**1. Summary**\n' +
        `• **${deploy?.title ?? 'Deploy in timeline'}** precedes the latency spike window.\n` +
        '• Mock correlation ties **checkout-api** stall to **payments-edge / stripe-proxy**.\n\n' +
        '**2. Key findings**\n' +
        '• Canary expansion + **pay_retry_v3** flag appears in the deploy detail.\n\n' +
        '**3. Mapping (signal → implication)**\n' +
        '• `Deploy (ServiceNow)` → Likely behavior change vector.\n' +
        '• `APM / traces` → Symptom surface on checkout path.\n' +
        '• `Splunk PAY-429` → Upstream limiter / retry pressure hint.'
      )
    },
  },
  {
    q: 'Which business services are in blast radius?',
    reply: ({ incident, services }) => {
      const rows = incident.affectedServiceIds.map((id) => {
        const s = services.find((x) => x.id === id)
        return s ? `• **${s.name}** (\`${id}\`) — ${s.status}, SLO burn **${s.sloBurnPct}x**` : `• \`${id}\` — not on health strip`
      })
      return (
        '**1. Summary**\n' +
        '• Blast radius maps **technical nodes** to **business services** on Command Center.\n\n' +
        '**2. Key findings**\n' +
        rows.join('\n') +
        '\n\n**3. Mapping (signal → implication)**\n' +
        '• `Affected ids` → Roll-up health tiles + topology highlighting.'
      )
    },
  },
  {
    q: 'What does the correlated timeline show?',
    reply: ({ incident }) =>
      '**1. Summary**\n' +
      `• **${incident.signals.length}** ordered signals from deploy → logs/metrics/traces → **Kentik network** flow/TLS (mock).\n\n` +
      '**2. Key findings**\n' +
      incident.signals
        .slice(0, 4)
        .map((s) => `• **T${s.tsOffsetMin >= 0 ? '+' : ''}${s.tsOffsetMin}m** ${s.source}: ${s.title}`)
        .join('\n') +
      '\n\n**3. Mapping (signal → implication)**\n' +
      '• Vertical story compresses **ITSM + observability + network (Kentik)** into one narrative.',
  },
  {
    q: 'What is the incident severity and team?',
    reply: ({ incident }) =>
      '**1. Summary**\n' +
      `• **${incident.severity}** · **${incident.team}** · status **${incident.status}**.\n\n` +
      '**2. Key findings**\n' +
      `• Duration **${incident.durationMin}m** (demo clock).\n\n` +
      '**3. Mapping (signal → implication)**\n' +
      '• `Header chips` → Ownership + urgency for comms bridges.',
  },
  {
    q: 'Summarize auto-triage for this incident.',
    reply: ({ incident }) =>
      '**1. Summary**\n' +
      `• Domain: **${incident.domain}**.\n\n` +
      '**2. Key findings**\n' +
      `• ${incident.rationale}\n\n` +
      '**3. Mapping (signal → implication)**\n' +
      '• `Auto-triage panel` → Compressed hypothesis before deeper RCA.',
  },
]

export function getRcaSimulatedQuestions(): string[] {
  return RCA_QA.map((x) => x.q)
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function findSimulatedRcaReply(
  prompt: string,
  incident: IncidentDetail,
  services: BusinessService[],
): string | null {
  const t = norm(prompt)
  for (const row of RCA_QA) {
    if (t === norm(row.q)) {
      return row.reply({ incident, services })
    }
  }
  return null
}

type VisualSeed = { q: string; reply: string }

const VISUAL_HOME: VisualSeed[] = [
  {
    q: 'What active incidents are listed on Command Center?',
    reply:
      '**1. Summary**\n' +
      '• The incident table lists open **SEV1–SEV3** rows with service, verdict, and age (mock).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• `SEV` badge → Customer impact tier for triage.\n' +
      '• `Service` column → Business service label for ownership.',
  },
  {
    q: 'What do the health tiles represent?',
    reply:
      '**1. Summary**\n' +
      '• Each tile is one **business service** with status, **SLO burn**, and a **24h sparkline** — **clickable** for metric drill-down.\n\n' +
      '**2. Key points**\n' +
      '• **Critical** tiles pulse subtly in the demo.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• `Status pill` → Healthy / Degraded / Critical.\n' +
      '• `SLO burn` → Error-budget-style pressure (mock).\n' +
      '• `Sparkline` → Recent shape for that service.',
  },
  {
    q: 'What does the Signal volume chart show?',
    reply:
      '**1. Summary**\n' +
      '• Four-stage funnel per day: **raw events** → **metric/event anomalies** (pre-alert clustering) → **deduped alerts** → **correlated incidents**.\n\n' +
      '**2. Key points**\n' +
      '• The anomaly layer answers the **"correlate before alerting"** ask — clusters of raw events get a single anomaly id before any alert is fanned out.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Slate → violet → sky → teal layers ≈ telemetry firehose vs anomalies vs actionable alerts vs declared incidents.',
  },
  {
    q: 'How are signals from different tools correlated?',
    reply:
      '**1. Summary**\n' +
      '• Three anchors join every signal: **time window**, **correlation_id**, and **service name**.\n\n' +
      '**2. Key points**\n' +
      '• The **Correlation anchors** card on Command Center shows the active values + each tool\'s alt ID (Datadog/Splunk/Kentik/Grafana/ServiceNow).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Any signal that carries one of those anchors lands in the same incident view — that\'s the single pane of glass.',
  },
  {
    q: 'How is event correlation done before alerts?',
    reply:
      '**1. Summary**\n' +
      '• The **Event correlation** table shows signatures of repeating events that get grouped into an **ANO-** anomaly id **before** any alert fires.\n\n' +
      '**2. Key points**\n' +
      '• Only anomalies that exceed thresholds become **AL-** alerts; only correlated alerts become **INC-** incidents.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Status pill = open / suppressed / closed — suppressed groups are noise the responder never has to see.',
  },
  {
    q: 'Why is this different from Datadog or AppDynamics?',
    reply:
      '**1. Summary**\n' +
      '• Datadog and AppDynamics map their **own** world. This dashboard joins **multiple vendors** on the three correlation anchors.\n\n' +
      '**2. Key points**\n' +
      '• Cross-tool fan-in, multi-layer view (app + logs + metrics + ITSM live; network/firewall planned), and **agentic** with explicit CAB / dual-control gates.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• The "Why this is different" card on Command Center is the elevator pitch (visible just below the anchors card).',
  },
]

const VISUAL_INCIDENTS_LIST: VisualSeed[] = [
  {
    q: 'What does the Incidents page show?',
    reply:
      '**1. Summary**\n' +
      '• Widget grid of **all non-closed incidents** (Investigating + Mitigated). Each card shows id, severity, status, team, age, blast service count, verdict, domain hint and a snippet of its **own correlation anchors**.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• **Left color bar** = severity (red/amber/blue).\n' +
      '• **Status pill** = Investigating / Mitigated / Resolved.\n' +
      '• Click any card → that incident\'s correlated anchors, auto-triage, and timeline.',
  },
  {
    q: 'How do I find SEV1 incidents quickly?',
    reply:
      '**1. Summary**\n' +
      '• Top strip shows **counts per severity**. The red **SEV1** tile aggregates customer-impacting incidents.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Cards with the **red left bar** are SEV1 — clicking opens that incident\'s anchors + timeline.',
  },
]

const VISUAL_INCIDENT: VisualSeed[] = [
  {
    q: 'What is on the correlated timeline?',
    reply:
      '**1. Summary**\n' +
      '• Vertical ordered signals: **deploys, metrics, logs, traces**, plus **Kentik** network rows (**TLS/path metrics** and **flow-derived log patterns**) with tool badges.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• `Time badge` → Minutes relative to incident anchor.\n' +
      '• `Source pill` → Datadog, Splunk, ServiceNow, Kentik, etc.',
  },
  {
    q: 'What does the topology minimap show?',
    reply:
      '**1. Summary**\n' +
      '• Subset of the services graph focused on **blast radius** for this incident.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Highlights topology nodes **derived from this incident’s affected business services** (mock mapping).',
  },
  {
    q: 'Where is auto-triage explained?',
    reply:
      '**1. Summary**\n' +
      '• The **Auto-triage** card summarizes probable domain and rationale from mock rules.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• `Probable domain` chip → Hypothesis bucket for responders.',
  },
]

const VISUAL_SERVICES: VisualSeed[] = [
  {
    q: 'How are topology bubbles colored?',
    reply:
      '**1. Summary**\n' +
      '• Fill reflects **worst of mock telemetry** + Command Center roll-up.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• **White number** inside bubble ≈ max **SLO burn** among mapped business services.\n' +
      '• Edges follow **target node** color; teal ring can flag blast highlight.',
  },
  {
    q: 'What does the User journey overlay do?',
    reply:
      '**1. Summary**\n' +
      '• Toggle on top of the map highlights the **checkout journey** across the topology: Browse → Auth → Cart → Pay → Confirm.\n\n' +
      '**2. Key points**\n' +
      '• Each step shows **observed vs expected p95** and status (ok / slow / failing).\n' +
      '• Click a step to spotlight just that node — answers Dilip\'s "can blast radius follow user journeys?" ask.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Today\'s journey data is mock; roadmap brings in RUM + synthetic checks for live wiring.',
  },
  {
    q: 'What is the Coverage & scope card?',
    reply:
      '**1. Summary**\n' +
      '• Honest map of **what\'s wired today vs planned**: App/Logs/ITSM live; Network, Firewall, User journeys planned; Storage optional.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Each card lists **sources** (e.g. Kentik, Palo Alto, AWS WAF) so stakeholders see exactly what gets added in v2/v3.',
  },
]

const VISUAL_TRENDS: VisualSeed[] = [
  {
    q: 'What is MTTR trend?',
    reply:
      '**1. Summary**\n' +
      '• Line chart of **mean time to resolve** over ~90 days (mock).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Recent uptick ⇒ operational drag vs baseline (illustrative only).',
  },
  {
    q: 'What does repeat-offender show?',
    reply:
      '**1. Summary**\n' +
      '• Table ranks services by incident frequency / noise over ~30 days (mock).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Use as a **prioritization** lens for reliability investments.',
  },
  {
    q: 'What is the executive scorecard?',
    reply:
      '**1. Summary**\n' +
      '• Horizontal strip of condensed KPI chips per business service.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Paired with deeper charts below for drill-down (prototype).',
  },
]

const VISUAL_AUTOMATION: VisualSeed[] = [
  {
    q: 'What is the difference between Auto and HITL?',
    reply:
      '**1. Summary**\n' +
      '• **Auto** runs bounded actions fast; **Human-in-the-loop** requires approvals (CAB ticket, dual-control, approver group).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• `Execution mode` toggle → swaps agent catalog + **filtered** history table. Governance chips are visible per agent.',
  },
  {
    q: 'How is governance enforced for automations?',
    reply:
      '**1. Summary**\n' +
      '• Each agent shows its **governance chips**: CAB required, Dual control, Approver group, Blast cap, Cooldown, Playbook ref.\n\n' +
      '**2. Key points**\n' +
      '• HITL runs in the history table expose the **CAB ticket** and **approver chain** that executed the change.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Critical actions (drain node, rollback canary) always carry CAB + dual-control. Bounded actions (scale, recycle) run guardrailed.',
  },
  {
    q: 'What is the agentic AI roadmap?',
    reply:
      '**1. Summary**\n' +
      '• Three-stage roadmap card: **Suggest** (live mock — LLM proposes fixes), **Execute supervised** (beta — operator approves, agent runs), **Full agentic** (planned — guardrailed only for known-safe classes).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Critical paths stay human-gated; suggestion is always free.',
  },
]

const VISUAL_SETTINGS: VisualSeed[] = [
  {
    q: 'How does data integration work?',
    reply:
      '**1. Summary**\n' +
      '• **Streaming-first** ingest from Datadog / Splunk / Kentik / Grafana / ServiceNow / AppDynamics via API, HEC, or webhook.\n\n' +
      '**2. Key points**\n' +
      '• Correlation happens **in-flight** on shared anchors — no warehouse needed for the live view.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Live / Planned / Optional cards show today\'s wiring and the roadmap honestly.',
  },
  {
    q: 'Is there a storage layer?',
    reply:
      '**1. Summary**\n' +
      '• Optional. Plug in **S3/Iceberg, Snowflake, or Databricks** if you need months of retention, retro RCA, or agentic training data.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• The "Optional / opt-in" section on Settings lists this — surfaces appear on the dashboard automatically once attached.',
  },
]

const VISUAL_TRACES: VisualSeed[] = [
  {
    q: 'What does the flame graph represent?',
    reply:
      '**1. Summary**\n' +
      '• **Icicle-style** span timeline: each bar is a span; width ≈ share of total trace duration (mock).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• **Red / deeper gradient** bars flag spans marked with errors in the demo dataset.',
  },
  {
    q: 'Where is multi-tool correlation shown?',
    reply:
      '**1. Summary**\n' +
      '• On **Traces → Overview**: intensity lines for **Datadog**, **Splunk**, **Kentik** plus per-tool sample columns.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Same overlay narrative previously shown on Command Center, relocated here next to trace context.',
  },
]

const VISUAL_HEALTH: VisualSeed[] = [
  {
    q: 'What do the health metric rows represent?',
    reply:
      '**1. Summary**\n' +
      '• Each row is a **synthetic KPI** attributed to **Datadog** (infra), **Splunk** (application logs), or **Kentik** (network).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Status pills summarize threshold breaches driving SLO burn in the mock scenario.',
  },
  {
    q: 'Where do open incidents come from?',
    reply:
      '**1. Summary**\n' +
      '• Listed incidents are those whose **business service name** matches this tile on Command Center.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Links jump into incident RCA while preserving multi-layer context copy.',
  },
]

function seedsForPath(pathname: string): VisualSeed[] {
  const p = pathname.replace(/\/$/, '') || '/'
  if (p === '/' || p === '') return VISUAL_HOME
  if (p.startsWith('/health')) return [...VISUAL_HEALTH, ...VISUAL_HOME]
  if (p.startsWith('/traces')) return [...VISUAL_TRACES, ...VISUAL_HOME]
  if (p === '/incidents') return [...VISUAL_INCIDENTS_LIST, ...VISUAL_HOME]
  if (p.startsWith('/incidents/')) return [...VISUAL_INCIDENT, ...VISUAL_HOME]
  if (p.startsWith('/services')) return [...VISUAL_SERVICES, ...VISUAL_HOME]
  if (p.startsWith('/trends')) return [...VISUAL_TRENDS, ...VISUAL_HOME]
  if (p.startsWith('/automation')) return [...VISUAL_AUTOMATION, ...VISUAL_HOME]
  if (p.startsWith('/settings')) return [...VISUAL_SETTINGS, ...VISUAL_HOME]
  return VISUAL_HOME
}

export function getVisualSimulatedQuestions(pathname: string): string[] {
  return seedsForPath(pathname).map((s) => s.q)
}

export function findSimulatedVisualReply(pathname: string, prompt: string): string | null {
  const t = norm(prompt)
  for (const row of seedsForPath(pathname)) {
    if (t === norm(row.q)) {
      return row.reply
    }
  }
  return null
}
