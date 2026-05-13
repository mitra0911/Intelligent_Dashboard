import type {
  AutomationAgent,
  AutomationRun,
  BusinessService,
  CorrelatedLayerPoint,
  DeployEvent,
  IncidentDetail,
  IncidentRow,
  LayerSignalSample,
  MicroserviceEdge,
  MicroserviceNode,
  MonitoringToolRef,
  CorrelationAnchorSet,
  CoverageLayer,
  DataIntegration,
  EventCorrelationGroup,
  ServiceHealthDrilldown,
  ServiceHealthMetricRow,
  TimelineSignal,
  TraceFlameBar,
  TraceLogLine,
  TraceViewBundle,
  UserJourneyStep,
} from '../types'

/** Deterministic PRNG (Mulberry32). Same seed → same mock universe. */
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEFAULT_MOCK_SEED = 0x4e5643f0 // "NVC0"

const SERVICE_NAMES = [
  'DTC Checkout',
  'Order-to-Cash',
  'Plant MES',
  'Mobile Apps',
  'SAP Core',
  'Salesforce CRM',
  'Fulfillment API',
  'Payment Gateway',
] as const

const INCIDENT_TITLES = [
  'Checkout payment latency spike — cart abandon climbing',
  'Cart service deadlock — thread pool exhaustion',
  'Payment gateway certificate drift — TLS handshakes failing',
  'Fulfillment cache stampede — thundering herd on cold keys',
  'MES PLC read timeouts — batch backlog growing',
  'Mobile BFF saturation — auth fan-out amplification',
] as const

const VERDICTS = [
  'Likely deploy + downstream dependency',
  'Infra saturation',
  'Config drift suspected',
  'Retry storm after flag flip',
  'Third-party rate limit correlation',
] as const

const TEAMS = [
  'Digital Commerce — Payments',
  'Retail Operations — Stores',
  'Manufacturing IT — MES',
  'Mobile Platform — BFF',
  'ERP Integration — SAP',
] as const

const DOMAINS = [
  'Application — recent deploy',
  'Infrastructure — capacity',
  'Dependency — third-party limits',
  'Data plane — cache coherence',
] as const

const SIGNAL_TEMPLATES: Omit<TimelineSignal, 'id' | 'tsOffsetMin'>[] = [
  {
    title: 'Deploy: payments-edge roll-forward',
    detail: 'Canary ramp; feature flags adjusted for retry budget',
    source: 'ServiceNow',
    kind: 'deploy',
  },
  {
    title: 'APM: checkout-api p95 latency jump',
    detail: 'Region hotspot; dependency stall on payments path',
    source: 'AppDynamics',
    kind: 'trace',
  },
  {
    title: 'Logs: rate-limit signature cluster',
    detail: 'Elevated 429s aligned with client retry loop',
    source: 'Splunk',
    kind: 'log',
  },
  {
    title: 'Metric: synthetic checkout journey failing',
    detail: 'Step-level timeouts increasing vs golden baseline',
    source: 'Datadog',
    kind: 'metric',
  },
  {
    title: 'Trace: bubble-up on critical path stretch',
    detail: 'Bubble-up highlights retry amplification',
    source: 'Honeycomb',
    kind: 'trace',
  },
  {
    title: 'Network metric: TLS handshake p99 vs regional egress',
    detail:
      'Kentik path analysis — checkout-api → stripe endpoints: TLS p99 +180ms vs 24h baseline; aligns with APM stall window',
    source: 'Kentik',
    kind: 'metric',
  },
  {
    title: 'Network flow: east-west burst + asymmetric retries',
    detail:
      'Netflow-derived log pattern — top talkers checkout-api ↔ payments-edge; burst correlates with Splunk 429 cluster timestamps',
    source: 'Kentik',
    kind: 'log',
  },
]

/** Three simulated vendor feeds used on Command Center (infra / app / network). */
export const MONITORING_TOOLS: MonitoringToolRef[] = [
  {
    id: 'datadog-infra',
    vendorName: 'Datadog',
    layer: 'infrastructure',
    focus: 'Hosts, containers, infra metrics & platform logs',
  },
  {
    id: 'splunk-app',
    vendorName: 'Splunk',
    layer: 'application',
    focus: 'Application logs, auth & transaction trails',
  },
  {
    id: 'kentik-net',
    vendorName: 'Kentik',
    layer: 'network',
    focus: 'Flow, bandwidth, path latency & packet analytics',
  },
]

/** `allHealthy` forces green tiles, empty active incidents, calm telemetry (demo / QA). */
export type MockScenario = 'default' | 'allHealthy'

export type MockDataBundle = {
  seed: number
  scenario: MockScenario
  businessServices: BusinessService[]
  activeIncidents: IncidentRow[]
  primaryIncidentDetail: IncidentDetail
  recentDeploys: DeployEvent[]
  monitoringTools: MonitoringToolRef[]
  correlatedLayerSeries: CorrelatedLayerPoint[]
  layerSignalSamples: LayerSignalSample[]
  serviceHealthDrilldowns: Record<string, ServiceHealthDrilldown>
  signalVolumeSeries: { day: string; events: number; metricAnomalies: number; alerts: number; incidents: number }[]
  /** V2: correlation anchors used to stitch tools for the primary incident. */
  correlationAnchors: CorrelationAnchorSet
  /** V2: full IncidentDetail (signals + triage + affected services) keyed by incident id. */
  incidentDetails: Record<string, IncidentDetail>
  /** V2: correlation anchor set per incident id. */
  correlationAnchorsByIncident: Record<string, CorrelationAnchorSet>
  /** V2: pre-alert event clustering examples. */
  eventCorrelationGroups: EventCorrelationGroup[]
  /** V2: coverage map (live vs planned layers). */
  coverageLayers: CoverageLayer[]
  /** V2: user journey overlay steps. */
  userJourney: UserJourneyStep[]
  /** V2: data integration + storage roadmap. */
  dataIntegrations: DataIntegration[]
  mttrTrend: { day: string; mttr: number }[]
  alertIncidentRatio: { week: string; ratio: number }[]
  repeatOffenders: { service: string; incidents: number; alerts: number }[]
  sloRiskForecast: { service: string; reason: string; daysToBreach: number }[]
  executiveScorecard: {
    name: string
    availability: string
    incidents30d: number
    trend: '↓' | '→' | '↑'
    sloAttainmentPct: string
    errorBudgetUsedPct: string
    customerPainIndex: string
  }[]
  connectedTools: { name: string; ok: boolean }[]
  mockStats: { alertCount: number; incidentCount: number; correlatedPct: number }
  topologyNodes: MicroserviceNode[]
  topologyEdges: MicroserviceEdge[]
  automationAgentsAuto: AutomationAgent[]
  automationAgentsHitl: AutomationAgent[]
  automationAgents: AutomationAgent[]
  automationRuns: AutomationRun[]
  mockAlerts: { id: string; ts: string; source: string; severity: 'info' | 'warn' | 'error'; msg: string }[]
  /** Per–business-service trace workspace (flame + facets). */
  traceViews: Record<string, TraceViewBundle>
}

function buildSignalVolumeSeries(rand: () => number, allHealthy: boolean) {
  const days = 30
  const out: { day: string; events: number; metricAnomalies: number; alerts: number; incidents: number }[] = []
  for (let d = days - 1; d >= 0; d--) {
    rand()
    const events = 1200 + Math.floor(rand() * 3800)
    /** Pre-alert metric/event correlation — anomalies are ~30–55% of raw events. */
    const anomalyFactor = allHealthy ? 0.05 + rand() * 0.06 : 0.22 + rand() * 0.18
    const metricAnomalies = Math.max(allHealthy ? 18 : 80, Math.floor(events * anomalyFactor))
    /** Alerts are deduped from anomalies via grouping rules. */
    const alertFactor = allHealthy ? 0.18 + rand() * 0.1 : 0.32 + rand() * 0.18
    const alerts = Math.max(allHealthy ? 8 : 40, Math.floor(metricAnomalies * alertFactor))
    const incidents = allHealthy
      ? Math.floor(rand() * 2.2)
      : Math.max(1, Math.floor(alerts * (0.05 + rand() * 0.14)))
    const date = new Date()
    date.setDate(date.getDate() - d)
    out.push({
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      events,
      metricAnomalies,
      alerts,
      incidents,
    })
  }
  return out
}

/** Overlay intensity per layer — loosely coupled so spikes align (demo correlation). */
function buildCorrelatedLayerSeries(rand: () => number, allHealthy: boolean): CorrelatedLayerPoint[] {
  const days = 30
  let infra = allHealthy ? 22 + rand() * 12 : 28 + rand() * 18
  let app = allHealthy ? 20 + rand() * 10 : 24 + rand() * 16
  let net = allHealthy ? 16 + rand() * 10 : 18 + rand() * 14
  const out: CorrelatedLayerPoint[] = []
  for (let d = days - 1; d >= 0; d--) {
    const spike = allHealthy ?
        rand() > 0.992 ? 4 + rand() * 10 : 0
      : rand() > 0.85 ? 22 + rand() * 38
        : rand() > 0.94 ? 35 + rand() * 28
        : 0
    infra = Math.max(allHealthy ? 18 : 12, Math.min(allHealthy ? 48 : 100, infra * (allHealthy ? 0.96 : 0.9) + rand() * (allHealthy ? 5 : 14) + spike))
    app = Math.max(allHealthy ? 15 : 10, Math.min(allHealthy ? 42 : 100, app * (allHealthy ? 0.97 : 0.92) + rand() * (allHealthy ? 4 : 12) + spike * (allHealthy ? 0.25 : 0.72) + rand() * (allHealthy ? 2 : 6)))
    net = Math.max(allHealthy ? 12 : 8, Math.min(allHealthy ? 38 : 100, net * (allHealthy ? 0.97 : 0.91) + rand() * (allHealthy ? 3 : 11) + spike * (allHealthy ? 0.2 : 0.48) + rand() * (allHealthy ? 2 : 5)))
    const date = new Date()
    date.setDate(date.getDate() - d)
    out.push({
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      infrastructure: Math.round(infra),
      application: Math.round(app),
      network: Math.round(net),
    })
  }
  return out
}

function buildLayerSignalSamples(rand: () => number, pick: <T>(arr: readonly T[]) => T, allHealthy: boolean): LayerSignalSample[] {
  const infraTemplates = [
    'kube-node: MemoryPressure threshold crossed — cgroup OOM risk',
    'containerd: image pull latency p95 +340ms vs 24h baseline',
    'host.cpu: steal time spike AZ=us-east-1b correlating with noisy neighbor',
    'disk.io: write queue depth elevated on checkout-db replica',
    'systemd: kubelet restart storm — 4 pods recycled in 6m window',
    'cadvisor: container throttle_seconds_total climbing on payments-edge',
    'nvidia-dcgm: GPU util nominal — ruled out inference queue',
    'windows_exporter: LSASS handle leak warning on legacy SAP bridge VM',
  ] as const
  const appTemplates = [
    'checkout-api: NullPointer in PaymentOrchestrator — stack matches canary build',
    'cart-svc: deadlock detector — thread pool exhaustion pool=checkout-workers',
    'oauth-proxy: spike in 401 after JWKS rotation window',
    'fulfillment-cache: Redis timeout cluster — MOVED redirection storm',
    'sap-idoc: IDoc status 51 burst — partner profile mismatch suspected',
    'bff-mobile: GraphQL depth limit breaches from single tenant',
    'payments-edge: retry budget exhausted — upstream 429 fingerprint',
    'stripe-proxy: TLS alert unknown_ca during cert chain validation',
  ] as const
  const netTemplates = [
    'flow: east→west traffic +42% vs baseline — burst aligns with retry loop',
    'interface: discard counter increment on tor-agg-07',
    'path.analysis: RTT p99 +180ms via IX peer AS64500',
    'mpls: tunnel flaps on backup path — FECN markers elevated',
    'dns: NXDOMAIN noise from stale service discovery cache',
    'flow: top talkers — checkout-api → stripe endpoints',
    'latency: TLS handshake p99 breach on regional egress',
    'capacity: 95th percentile bandwidth hour approaching commit threshold',
  ] as const

  const mk = (
    layer: LayerSignalSample['layer'],
    tool: string,
    templates: readonly string[],
    i: number,
  ): LayerSignalSample => ({
    id: `lay-${layer}-${i}`,
    ts: `${String(9 + Math.floor(rand() * 12)).padStart(2, '0')}:${String(Math.floor(rand() * 59)).padStart(2, '0')}:${String(Math.floor(rand() * 59)).padStart(2, '0')}`,
    tool,
    layer,
    severity: allHealthy ? 'info' : rand() > 0.72 ? 'error' : rand() > 0.45 ? 'warn' : 'info',
    message: pick([...templates]),
  })

  const samples: LayerSignalSample[] = []
  for (let i = 0; i < 8; i++) samples.push(mk('infrastructure', 'Datadog', infraTemplates, i))
  for (let i = 0; i < 8; i++) samples.push(mk('application', 'Splunk', appTemplates, i))
  for (let i = 0; i < 8; i++) samples.push(mk('network', 'Kentik', netTemplates, i))
  return samples.sort(() => rand() - 0.5)
}

function buildServiceHealthDrilldowns(
  services: BusinessService[],
  incidents: IncidentRow[],
  rand: () => number,
  pick: <T>(arr: readonly T[]) => T,
): Record<string, ServiceHealthDrilldown> {
  const DD = 'Datadog'
  const SPL = 'Splunk'
  const NET = 'Kentik'

  const out: Record<string, ServiceHealthDrilldown> = {}
  for (const svc of services) {
    const openIncidents = incidents
      .filter((i) => i.service === svc.name)
      .map((i) => ({ id: i.id, title: i.title, severity: i.severity }))

    const cpu = svc.status === 'healthy' ? 38 + Math.floor(rand() * 18) : 68 + Math.floor(rand() * 28)
    const metrics: ServiceHealthMetricRow[] = [
      {
        name: 'CPU saturation (p95)',
        current: `${cpu}%`,
        target: '< 70%',
        status: cpu >= 85 ? 'critical' : cpu >= 70 ? 'warn' : 'ok',
        sourceTool: DD,
      },
      {
        name: 'Memory pressure / OOM adjacency',
        current:
          svc.status === 'healthy'
            ? pick(['Nominal', 'Soft limit headroom OK'])
            : pick(['cgroups near limit', 'Pod evictions observed', 'Swap churn on legacy node']),
        target: 'No evictions',
        status: svc.status === 'critical' ? 'critical' : svc.status === 'degraded' ? 'warn' : 'ok',
        sourceTool: DD,
      },
      {
        name: 'ERROR log rate (application)',
        current:
          svc.status === 'healthy'
            ? `${(rand() * 5).toFixed(1)}/min`
            : `${(10 + rand() * 55).toFixed(1)}/min`,
        target: '< 12/min',
        status: svc.status === 'critical' ? 'critical' : svc.status === 'degraded' ? 'warn' : 'ok',
        sourceTool: SPL,
      },
      {
        name: 'Trace error ratio (APM-linked)',
        current:
          svc.status === 'healthy'
            ? `${(rand() * 0.8).toFixed(2)}%`
            : `${(1.5 + rand() * 6).toFixed(2)}%`,
        target: '< 1.5%',
        status: svc.status === 'critical' ? 'critical' : svc.status === 'degraded' ? 'warn' : 'ok',
        sourceTool: SPL,
      },
      {
        name: 'Egress bandwidth vs baseline',
        current:
          svc.status === 'healthy'
            ? `+${Math.floor(rand() * 12)}%`
            : `+${22 + Math.floor(rand() * 48)}%`,
        target: '< +30%',
        status: svc.status === 'degraded' || svc.status === 'critical' ? 'warn' : 'ok',
        sourceTool: NET,
      },
      {
        name: 'Path latency / TLS handshake p99',
        current:
          svc.status === 'healthy'
            ? `${42 + Math.floor(rand() * 40)}ms`
            : `${110 + Math.floor(rand() * 220)}ms`,
        target: '< 160ms',
        status: svc.status === 'critical' ? 'critical' : svc.status === 'degraded' ? 'warn' : 'ok',
        sourceTool: NET,
      },
    ]

    const sloTargetSummary =
      'Monthly target 99.95% availability for this business capability; error budget erodes when burn stays above 1.0× against rolling 24h SLO window (demo thresholds).'

    let sloBurnExplanation = ''
    let whyNotHealthy = ''
    if (svc.status === 'healthy') {
      sloBurnExplanation = `Burn ${svc.sloBurnPct}× sits inside budget. Infra (${DD}), application (${SPL}), and network (${NET}) feeds agree — no sustained multi-layer excursion.`
      whyNotHealthy =
        'No actionable degradation: synthetic journeys mostly pass; elevated signals are isolated noise or expected variance.'
    } else if (svc.status === 'degraded') {
      sloBurnExplanation = `Burn ${svc.sloBurnPct}× shows accelerated consumption — overlay correlates ${DD} capacity friction with ${SPL} error clusters and ${NET} egress lift within the same windows.`
      whyNotHealthy = pick([
        'Retry amplification couples application ERROR spikes with infra CPU steal time and WAN RTT tail.',
        'Partial outage pattern: dependency stall visible in traces while Kentik shows asymmetric east-west load.',
      ])
    } else {
      sloBurnExplanation = `Burn ${svc.sloBurnPct}× breaches guardrails — three-layer correlation highlights simultaneous infra saturation, application fault signatures, and network/TLS stress on critical paths.`
      whyNotHealthy = pick([
        'Critical: payment-path latency SLO breached; all three monitoring planes show aligned excursions within ±15 minutes.',
        'Critical: deploy-adjacent regression plus downstream rate limits — infra restarts, app 429 fingerprints, and flow spikes coincide.',
      ])
    }

    out[svc.id] = {
      serviceId: svc.id,
      serviceName: svc.name,
      status: svc.status,
      sloTargetSummary,
      sloBurnExplanation,
      whyNotHealthy,
      metrics,
      openIncidents,
    }
  }
  return out
}

function buildTraceViewsByService(
  services: BusinessService[],
  seed: number,
  rand: () => number,
  pick: <T>(arr: readonly T[]) => T,
): Record<string, TraceViewBundle> {
  const DD = 'Datadog'
  const SPL = 'Splunk'
  const NET = 'Kentik'

  const out: Record<string, TraceViewBundle> = {}
  for (const svc of services) {
    const bad = svc.status !== 'healthy'
    const totalDurationMs = 410 + Math.floor(rand() * 540)
    const traceId = `dd-${seed.toString(16).slice(0, 8)}-${svc.id}-${Math.floor(rand() * 1e6)
      .toString(36)
      .slice(0, 7)}`

    const midW = bad ? 54 : 48
    const payStart = 12 + midW
    const tailStart = payStart + 26
    const flameBars: TraceFlameBar[] = [
      { id: `${svc.id}-r0`, label: `${svc.name} · trace root`, startPct: 0, widthPct: 100, row: 0 },
      { id: `${svc.id}-r1a`, label: 'middleware.auth_context', startPct: 0, widthPct: 12, row: 1 },
      {
        id: `${svc.id}-r1b`,
        label: 'handler.primary_flow',
        startPct: 12,
        widthPct: midW,
        row: 1,
        hasError: bad,
      },
      {
        id: `${svc.id}-r1c`,
        label: 'integration.downstream_pay',
        startPct: payStart,
        widthPct: 26,
        row: 1,
      },
      {
        id: `${svc.id}-r1d`,
        label: 'serializer.response',
        startPct: tailStart,
        widthPct: 100 - tailStart,
        row: 1,
      },
      {
        id: `${svc.id}-r2a`,
        label: 'client.http/charges',
        startPct: 12,
        widthPct: Math.min(38, midW - 2),
        row: 2,
        hasError: bad,
      },
      {
        id: `${svc.id}-r2b`,
        label: 'cache.read_through',
        startPct: 12 + Math.min(38, midW - 2) + 1,
        widthPct: Math.max(14, midW - Math.min(38, midW - 2) - 3),
        row: 2,
      },
      {
        id: `${svc.id}-r3a`,
        label: 'net.tls_handshake',
        startPct: 12,
        widthPct: 10,
        row: 3,
      },
      {
        id: `${svc.id}-r3b`,
        label: 'net.http_post',
        startPct: 23,
        widthPct: Math.min(38, midW - 2) - 11,
        row: 3,
        hasError: bad,
      },
    ]

    const route = pick(['/v2/checkout/confirm', '/v1/payments/intent', '/api/fulfillment/reserve'])
    const spanOverview = {
      spanId: `${svc.id}-span-hot`,
      name: bad ? 'handler.primary_flow' : 'integration.downstream_pay',
      resource: `${svc.name.replace(/\s+/g, '-').toLowerCase()}-prod`,
      durationMs: Math.floor(totalDurationMs * (bad ? 0.46 : 0.21)),
      httpMethod: 'POST',
      httpRoute: route,
      statusCode: bad ? pick([502, 503, 504] as const) : 200,
      parentSpanId: `${svc.id}-root`,
    }

    const errors =
      bad ?
        [
          {
            time: `${String(Math.floor(rand() * 10) + 8).padStart(2, '0')}:${String(Math.floor(rand() * 59)).padStart(2, '0')}:${String(Math.floor(rand() * 59)).padStart(2, '0')}`,
            message: pick([
              'UpstreamUnavailable: stripe-proxy returned 503 — circuit half-open',
              'DEADLINE_EXCEEDED on payments.route_intent after 4.2s',
              'RedisCluster MOVED redirection storm — snapshot merge aborted',
            ]),
            spanId: `${svc.id}-r2a`,
            stackHint: pick(['checkout-api:PaymentOrchestrator.java:412', 'payments-edge:retry.rs:88']),
          },
          {
            time: `${String(Math.floor(rand() * 10) + 9).padStart(2, '0')}:${String(Math.floor(rand() * 59)).padStart(2, '0')}:${String(Math.floor(rand() * 59)).padStart(2, '0')}`,
            message: pick([
              'Splunk ERROR fingerprint PAY-429 correlated with trace span client.http/charges',
              'Synthetic probe checkout_us_east failing — matches trace tail latency',
            ]),
            spanId: `${svc.id}-r3b`,
            stackHint: 'bff-mobile:graphql_depth_guard.kt:54',
          },
        ]
      : []

    const infra = [
      {
        label: 'Host CPU steal time',
        value: bad ? `${8 + Math.floor(rand() * 22)}%` : `${1 + Math.floor(rand() * 5)}%`,
        sourceTool: DD,
      },
      {
        label: 'Container throttle (cgroup)',
        value: bad ? `${Math.floor(rand() * 120)}ms/s` : `${Math.floor(rand() * 15)}ms/s`,
        sourceTool: DD,
      },
      {
        label: 'Pod restart count (1h)',
        value: bad ? `${2 + Math.floor(rand() * 6)}` : `${Math.floor(rand() * 2)}`,
        sourceTool: DD,
      },
    ]

    const metrics = [
      {
        label: 'Trace duration (this span)',
        value: `${spanOverview.durationMs}ms`,
        sourceTool: DD,
      },
      {
        label: 'Checkout journey p95',
        value: bad ? `${820 + Math.floor(rand() * 400)}ms` : `${180 + Math.floor(rand() * 90)}ms`,
        sourceTool: DD,
      },
      {
        label: 'Error budget burn (rolling 1h)',
        value: `${svc.sloBurnPct}x`,
        sourceTool: DD,
      },
    ]

    const logs: TraceLogLine[] = [
      {
        ts: `10:${String(Math.floor(rand() * 59)).padStart(2, '0')}:${String(Math.floor(rand() * 59)).padStart(2, '0')}`,
        severity: bad ? (rand() > 0.45 ? 'warn' : 'error') : 'info',
        message: bad ?
          pick([
            `payment_intent=${rand().toString(36).slice(2, 10)} status=failed reason=upstream_timeout`,
            `correlation_id=${traceId.slice(0, 12)} retry_exhausted=true`,
          ])
        : `correlation_id=${traceId.slice(0, 12)} checkout_ok=true`,
        source: SPL,
      },
      {
        ts: `10:${String(Math.floor(rand() * 59)).padStart(2, '0')}:${String(Math.floor(rand() * 59)).padStart(2, '0')}`,
        severity: bad ? 'error' : 'info',
        message: bad ?
          pick([
            'OutboxPublisher: delivery stalled — Kafka ISR shrink',
            'RateLimiter: token bucket empty for tenant shard 7',
          ])
        : 'RequestCompleted duration_ms=' + Math.floor(totalDurationMs * 0.8),
        source: SPL,
      },
    ]

    const network = [
      {
        label: 'Flow volume vs baseline',
        value: bad ? `+${28 + Math.floor(rand() * 45)}%` : `+${Math.floor(rand() * 14)}%`,
        sourceTool: NET,
      },
      {
        label: 'East-west RTT p99',
        value: bad ? `${92 + Math.floor(rand() * 140)}ms` : `${34 + Math.floor(rand() * 40)}ms`,
        sourceTool: NET,
      },
      {
        label: 'TLS handshake p99 (egress)',
        value: bad ? `${130 + Math.floor(rand() * 200)}ms` : `${48 + Math.floor(rand() * 55)}ms`,
        sourceTool: NET,
      },
    ]

    const serviceOverview =
      `Business service ${svc.name} (${svc.id}) — Command Center status ${svc.status}, SLO burn ${svc.sloBurnPct}×. ` +
      `This trace (${traceId}) ties ${DD} APM spans to ${SPL} logs and ${NET} flow analytics on the same correlation keys (mock). ` +
      (bad ?
        'Hot spans line up with infra saturation and outbound dependency latency; use flame timeline + facet tabs to narrate the blast radius.'
      : 'Golden-path latency; facets show nominal infra/network headroom with low error logs.')

    out[svc.id] = {
      traceId,
      rootOperation: `POST ${route}`,
      totalDurationMs,
      serviceId: svc.id,
      serviceName: svc.name,
      flameBars,
      spanOverview,
      errors,
      infra,
      metrics,
      logs,
      network,
      serviceOverview,
    }
  }
  return out
}

function buildMttrTrend(rand: () => number, allHealthy: boolean) {
  const out: { day: string; mttr: number }[] = []
  for (let d = 89; d >= 0; d--) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    const base = allHealthy ? 18 + rand() * 35 : 35 + rand() * 95
    const tail = allHealthy ? rand() * 8 : d < 14 ? rand() * 40 : 0
    out.push({
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mttr: Math.round(base + tail),
    })
  }
  return out
}

function buildAlertIncidentRatio(rand: () => number, allHealthy: boolean) {
  const out: { week: string; ratio: number }[] = []
  for (let w = 11; w >= 0; w--) {
    const ratio = allHealthy ? Math.round((4 + rand() * 9) * 10) / 10 : Math.round((14 + rand() * 22) * 10) / 10
    out.push({
      week: `W${12 - w}`,
      ratio,
    })
  }
  return out
}

function generateMockAlerts(rand: () => number, pick: <T>(arr: T[]) => T, allHealthy: boolean) {
  const sources = ['checkout-api', 'payments-edge', 'stripe-proxy', 'sap-idoc', 'mes-bridge', 'bff-mobile']
  const out: MockDataBundle['mockAlerts'] = []
  for (let i = 0; i < 200; i++) {
    const sev = allHealthy ? (rand() < 0.08 ? 'warn' : 'info') : rand() < 0.12 ? 'error' : rand() < 0.35 ? 'warn' : 'info'
    const src = pick(sources)
    out.push({
      id: `AL-${10000 + i}`,
      ts: `${Math.floor(rand() * 23)}:${String(Math.floor(rand() * 59)).padStart(2, '0')}:${String(Math.floor(rand() * 59)).padStart(2, '0')}`,
      source: src,
      severity: sev,
      msg: `${pick(['timeout', 'retry', 'rate_limit', 'cache_miss', 'pod_restart', 'deploy_marker'])} — trace=${rand().toString(36).slice(2, 10)}`,
    })
  }
  return out
}

/** Build a full mock universe from a 32-bit seed (new seed ⇒ new dashboard numbers & copy). */
export function createMockData(seed: number, options?: { scenario?: MockScenario }): MockDataBundle {
  const scenario: MockScenario = options?.scenario ?? 'default'
  const allHealthy = scenario === 'allHealthy'
  const rand = mulberry32(seed >>> 0)
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!
  const usedIncidentIds = new Set<string>()
  const nextIncidentId = () => {
    let id: string
    do {
      id = `INC-${28000 + Math.floor(rand() * 9999)}`
    } while (usedIncidentIds.has(id))
    usedIncidentIds.add(id)
    return id
  }

  const durationMin = 12 + Math.floor(rand() * 48)

  const businessServices: BusinessService[] = SERVICE_NAMES.map((name, i) => {
    if (allHealthy) {
      const sparkline = Array.from({ length: 24 }, () => 38 + rand() * 22)
      return {
        id: `svc-${i}`,
        name,
        status: 'healthy' as const,
        sloBurnPct: Math.round(rand() * 0.45 * 10) / 10,
        sparkline,
      }
    }
    const statusRoll = rand()
    let status: BusinessService['status'] = 'healthy'
    const forceHot = i === Math.floor(rand() * SERVICE_NAMES.length)
    if (forceHot || (i < 2 && rand() > 0.35)) {
      status = rand() > 0.45 ? 'critical' : 'degraded'
    } else if (statusRoll < 0.08) status = 'degraded'
    else if (statusRoll < 0.03) status = 'critical'

    const sparkline = Array.from({ length: 24 }, () => 40 + rand() * 55 + (status !== 'healthy' ? rand() * 25 : 0))

    return {
      id: `svc-${i}`,
      name,
      status,
      sloBurnPct:
        Math.round((status === 'critical' ? 4 + rand() * 8 : status === 'degraded' ? 1.5 + rand() * 2 : rand() * 0.9) * 10) / 10,
      sparkline,
    }
  })

  const primaryId = nextIncidentId()
  const primaryTitle = pick(INCIDENT_TITLES)
  const primaryService = pick([...SERVICE_NAMES])
  const altTitles = INCIDENT_TITLES.filter((t) => t !== primaryTitle)

  const activeIncidents: IncidentRow[] = allHealthy ?
      []
    : [
        {
          id: primaryId,
          title: primaryTitle,
          severity: rand() > 0.25 ? 'SEV1' : 'SEV2',
          service: primaryService,
          verdict: pick(VERDICTS),
          openedMinutesAgo: durationMin,
        },
        {
          id: nextIncidentId(),
          title: altTitles.length ? pick(altTitles) : primaryTitle,
          severity: 'SEV2',
          service: pick([...SERVICE_NAMES]),
          verdict: pick(VERDICTS),
          openedMinutesAgo: 30 + Math.floor(rand() * 120),
        },
        {
          id: nextIncidentId(),
          title: altTitles.length ? pick(altTitles) : primaryTitle,
          severity: 'SEV3',
          service: pick([...SERVICE_NAMES]),
          verdict: pick(VERDICTS),
          openedMinutesAgo: 80 + Math.floor(rand() * 200),
        },
      ]

  /**
   * Build a per-incident signal timeline using `SIGNAL_TEMPLATES` rotated for variety.
   * Each incident gets its own anchored offsets so the timeline reads independently.
   */
  const buildSignalsFor = (row: IncidentRow, idx: number): TimelineSignal[] => {
    const offset = idx % SIGNAL_TEMPLATES.length
    return SIGNAL_TEMPLATES.map((_, i) => {
      const tpl = SIGNAL_TEMPLATES[(offset + i) % SIGNAL_TEMPLATES.length]!
      return {
        id: `${row.id}-sig-${i + 1}`,
        tsOffsetMin: -row.openedMinutesAgo - 10 + Math.floor(rand() * 24) + i * 3,
        ...tpl,
        detail: `${tpl.detail} (mock-${(seed + idx * 7 + i).toString(36)})`,
      }
    })
  }

  /** Map an active-incident row to 1–2 affected svc ids based on service name. */
  const buildAffectedIdsFor = (row: IncidentRow): string[] => {
    const direct = businessServices.find((s) => s.name === row.service)?.id
    const blast = ['svc-0', 'svc-7'].filter(() => rand() > 0.5)
    const all = new Set<string>()
    if (direct) all.add(direct)
    for (const b of blast) all.add(b)
    if (all.size === 0) all.add('svc-0')
    return Array.from(all)
  }

  const healthyAffectedIds: string[] = []
  const healthySignals: TimelineSignal[] = [
    {
      id: 'sig-h1',
      tsOffsetMin: 0,
      title: 'Synthetic heartbeat — correlation overlay idle',
      detail: `Datadog, Splunk, and Kentik feeds nominal under healthy simulation (seed ${seed.toString(16)}).`,
      source: 'Datadog',
      kind: 'metric',
    },
    {
      id: 'sig-h2',
      tsOffsetMin: -2,
      title: 'SLO monitors: no burn excursions',
      detail: 'All business services within error budget for rolling 24h window (mock).',
      source: 'AppDynamics',
      kind: 'metric',
    },
    {
      id: 'sig-h3',
      tsOffsetMin: -1,
      title: 'Kentik: golden-path flow + TLS within baseline',
      detail: 'No sustained east-west burst; path RTT nominal vs IX peers (healthy simulation).',
      source: 'Kentik',
      kind: 'metric',
    },
  ]

  /** Full per-incident detail map. Healthy scenario uses a single stub keyed by the primary id. */
  const incidentDetails: Record<string, IncidentDetail> = {}
  if (allHealthy) {
    incidentDetails[primaryId] = {
      id: primaryId,
      title: 'Healthy simulation — no active production incidents',
      severity: 'SEV3',
      team: 'Platform — Observability (demo)',
      status: 'Resolved',
      durationMin: 0,
      rationale:
        'All business services are using the healthy simulation profile: green status, low SLO burn, empty active incident queue, and calm cross-tool telemetry. Turn off "All healthy" in the header to restore mixed scenarios.',
      domain: 'Infrastructure — capacity',
      affectedServiceIds: healthyAffectedIds,
      signals: healthySignals,
    }
  } else {
    const rationales = [
      'p95 latency crossed SLO; error budget burn accelerated; correlated deploy within window.',
      'Synthetic journeys failing; dependency stall matches payments path telemetry.',
      'Log cluster spike aligns with canary expansion window — retry amplification suspected.',
      'Capacity pressure on shared hosts; noisy-neighbor pattern in metrics + flow.',
      'Third-party gateway 429s amplified by retry budget exhaustion at the edge.',
    ] as const
    activeIncidents.forEach((row, idx) => {
      incidentDetails[row.id] = {
        id: row.id,
        title: row.title,
        severity: row.severity,
        team: pick(TEAMS),
        status: idx === 0 ? 'Investigating' : pick(['Investigating', 'Mitigated'] as const),
        durationMin: row.openedMinutesAgo,
        rationale: `${rationales[idx % rationales.length]} Seed ${seed.toString(16)}.`,
        domain: pick(DOMAINS),
        affectedServiceIds: buildAffectedIdsFor(row),
        signals: buildSignalsFor(row, idx),
      }
    })
  }

  /** Primary detail = the first non-closed incident (or healthy stub). */
  const primaryIncidentDetail: IncidentDetail = incidentDetails[primaryId]!

  const recentDeploys: DeployEvent[] = [
    {
      id: 'd1',
      service: 'payments-edge',
      version: `v2.${14 + Math.floor(rand() * 3)}.${Math.floor(rand() * 9)}`,
      minutesAgo: durationMin + 4 + Math.floor(rand() * 12),
    },
    {
      id: 'd2',
      service: 'checkout-api',
      version: `v1.${8 + Math.floor(rand() * 4)}.${Math.floor(rand() * 12)}`,
      minutesAgo: 180 + Math.floor(rand() * 120),
    },
    {
      id: 'd3',
      service: 'fulfillment-cache',
      version: `v0.${5 + Math.floor(rand() * 3)}.${Math.floor(rand() * 20)}`,
      minutesAgo: 320 + Math.floor(rand() * 200),
    },
    {
      id: 'd4',
      service: 'sap-connector',
      version: `r${4200 + Math.floor(rand() * 400)}`,
      minutesAgo: 800 + Math.floor(rand() * 400),
    },
    {
      id: 'd5',
      service: 'mobile-bff',
      version: `v3.${1 + Math.floor(rand() * 3)}.${Math.floor(rand() * 15)}`,
      minutesAgo: 1200 + Math.floor(rand() * 600),
    },
  ]

  const telemetryLevels = ['ok', 'warning', 'error', 'critical'] as const
  const topologyNodesRaw: MicroserviceNode[] = [
    {
      id: 'cdn',
      label: 'CDN / WAF',
      x: 50,
      y: 12,
      tier: 'edge',
      businessServiceIds: ['svc-0'],
      telemetry: pick([...telemetryLevels]),
      telemetryHint: pick(['Edge cache nominal', 'WAF challenge rate elevated', 'PoP variance east coast']),
    },
    {
      id: 'apigw',
      label: 'API gateway',
      x: 80,
      y: 24,
      tier: 'edge',
      businessServiceIds: ['svc-0'],
      telemetry: pick([...telemetryLevels]),
      telemetryHint: pick(['Ingress p95 elevated', 'Auth latency tail', 'Golden signals green']),
    },
    {
      id: 'bff',
      label: 'Mobile BFF',
      x: 18,
      y: 32,
      tier: 'edge',
      businessServiceIds: ['svc-3'],
      telemetry: pick([...telemetryLevels]),
      telemetryHint: pick(['Bundle latency OK', 'GraphQL depth warnings', 'Cold start burst']),
    },
    {
      id: 'checkout',
      label: 'checkout-api',
      x: 52,
      y: 48,
      tier: 'app',
      businessServiceIds: ['svc-0'],
      telemetry: rand() > 0.2 ? 'critical' : pick(['error', 'warning']),
      telemetryHint: `Active incident context — ${primaryId}`,
    },
    {
      id: 'cart',
      label: 'cart-svc',
      x: 22,
      y: 62,
      tier: 'app',
      businessServiceIds: ['svc-0'],
      telemetry: pick([...telemetryLevels]),
      telemetryHint: pick(['Merge retries above baseline', 'Inventory lock waits', 'Stable']),
    },
    {
      id: 'payments',
      label: 'payments-edge',
      x: 86,
      y: 42,
      tier: 'app',
      businessServiceIds: ['svc-0', 'svc-7'],
      telemetry: pick(['error', 'warning', 'critical']),
      telemetryHint: pick(['Canary ripple', '5xx burst window', 'Limiter friction']),
    },
    {
      id: 'stripe',
      label: 'stripe-proxy',
      x: 92,
      y: 58,
      tier: 'app',
      businessServiceIds: ['svc-0', 'svc-7'],
      telemetry: pick(['error', 'warning']),
      telemetryHint: pick(['429 cluster', 'Adaptive backoff engaged', 'Latency tail']),
    },
    {
      id: 'redis',
      label: 'checkout-redis',
      x: 34,
      y: 78,
      tier: 'data',
      businessServiceIds: ['svc-0', 'svc-6'],
      telemetry: pick([...telemetryLevels]),
      telemetryHint: pick(['Memory pressure watch', 'Evictions nominal', 'Hot key skew']),
    },
    {
      id: 'kafka',
      label: 'events-kafka',
      x: 74,
      y: 80,
      tier: 'data',
      businessServiceIds: ['svc-1', 'svc-6'],
      telemetry: pick([...telemetryLevels]),
      telemetryHint: pick(['Lag nominal', 'Broker bounce recovery', 'Consumer stall cleared']),
    },
  ]

  const topologyHintHealthy = (id: string): string => {
    const m: Record<string, string> = {
      cdn: 'Edge cache nominal · healthy simulation',
      apigw: 'Ingress golden signals green',
      bff: 'Bundle latency within budget',
      checkout: 'Checkout path nominal — no incident context',
      cart: 'Merge pipeline stable',
      payments: 'Limiter headroom OK · steady state',
      stripe: 'Upstream handshake stable',
      redis: 'Evictions nominal · memory OK',
      kafka: 'Lag flat · brokers healthy',
    }
    return m[id] ?? 'Nominal telemetry'
  }

  const topologyNodes: MicroserviceNode[] = allHealthy
    ? topologyNodesRaw.map((n) => ({ ...n, telemetry: 'ok' as const, telemetryHint: topologyHintHealthy(n.id) }))
    : topologyNodesRaw

  const topologyEdges: MicroserviceEdge[] = [
    { from: 'cdn', to: 'apigw' },
    { from: 'apigw', to: 'checkout' },
    { from: 'bff', to: 'checkout' },
    { from: 'checkout', to: 'cart' },
    { from: 'checkout', to: 'payments' },
    { from: 'payments', to: 'stripe' },
    { from: 'checkout', to: 'redis' },
    { from: 'checkout', to: 'kafka' },
    { from: 'cart', to: 'redis' },
    { from: 'redis', to: 'checkout', linkKind: 'loop' },
  ]

  const svcLabels = ['checkout-api', 'stripe-proxy', 'sap-idoc-worker', 'mes-plc-bridge', 'fulfillment-cache', 'bff-mobile']
  const repeatOffenders = allHealthy ?
      svcLabels.map((service) => ({
        service,
        incidents: 0,
        alerts: Math.floor(rand() * 35),
      }))
    : svcLabels.map((service) => ({
        service,
        incidents: 4 + Math.floor(rand() * 12),
        alerts: 200 + Math.floor(rand() * 2000),
      }))

  const sloRiskForecast =
    allHealthy ?
      [
        { service: 'DTC Checkout', reason: 'Healthy simulation — no breach trajectory', daysToBreach: 120 },
        { service: 'Payment Gateway', reason: 'Margin to error budget high', daysToBreach: 120 },
        { service: 'Fulfillment API', reason: 'Stable demand + flat burn', daysToBreach: 120 },
      ]
    : pick([
        [
          { service: 'DTC Checkout', reason: 'Burn rate + retry storms', daysToBreach: 3 + Math.floor(rand() * 5) },
          { service: 'Payment Gateway', reason: 'Dependency latency tail', daysToBreach: 4 + Math.floor(rand() * 6) },
          { service: 'Fulfillment API', reason: 'Cache regression', daysToBreach: 5 + Math.floor(rand() * 7) },
        ],
        [
          { service: 'Plant MES', reason: 'PLC timeout budget', daysToBreach: 2 + Math.floor(rand() * 4) },
          { service: 'Mobile Apps', reason: 'BFF fan-out', daysToBreach: 6 + Math.floor(rand() * 5) },
          { service: 'SAP Core', reason: 'Batch backlog', daysToBreach: 7 + Math.floor(rand() * 8) },
        ],
      ])

  const executiveScorecard = SERVICE_NAMES.map((name) => {
    if (allHealthy) {
      const availabilityPct = 99.92 + rand() * 0.07
      return {
        name,
        availability: `${availabilityPct.toFixed(2)}%`,
        incidents30d: Math.floor(rand() * 2),
        trend: '↑' as const,
        sloAttainmentPct: `${98 + rand() * 1.8}%`,
        errorBudgetUsedPct: `${Math.floor(rand() * 12)}%`,
        customerPainIndex: (rand() * 0.8).toFixed(1),
      }
    }
    const availabilityPct = 99.65 + rand() * 0.35
    const incidents30d = Math.floor(rand() * 22)
    const trends = ['↓', '→', '↑'] as const
    const sloAttainment = 84 + rand() * 15
    const errorBudgetUsed = Math.floor(rand() * 92)
    const customerPainIndex = (rand() * 4.5).toFixed(1)

    return {
      name,
      availability: `${availabilityPct.toFixed(2)}%`,
      incidents30d,
      trend: trends[Math.floor(rand() * 3)]!,
      sloAttainmentPct: `${sloAttainment.toFixed(1)}%`,
      errorBudgetUsedPct: `${errorBudgetUsed}%`,
      customerPainIndex,
    }
  })

  const automationAgentsAuto: AutomationAgent[] = [
    {
      id: 'auto-1',
      name: 'Scale checkout pods',
      description: 'HPA-style add/remove replicas when p95 > budget for 5m; max +3 per hour.',
      lastRun: `${5 + Math.floor(rand() * 40)}m ago`,
      outcome: 'success',
      modes: ['auto'],
      roadmap: 'live',
      playbookRef: 'pb-checkout-scale-v3',
      governance: {
        cabRequired: false,
        dualControl: false,
        approverGroup: 'sre-checkout',
        blastCap: '+3 replicas / hour',
        cooldown: '10m',
        rollbackHook: 'auto-scale-down',
      },
    },
    {
      id: 'auto-2',
      name: 'Restart stuck Kafka consumer',
      description: 'Partition lag stall; single bounded restart with 10m cooldown.',
      lastRun: `${1 + Math.floor(rand() * 4)}h ago`,
      outcome: rand() > 0.9 ? 'rolled_back' : 'success',
      modes: ['auto'],
      roadmap: 'live',
      playbookRef: 'pb-kafka-consumer-bounce',
      governance: {
        cabRequired: false,
        dualControl: false,
        approverGroup: 'data-platform-on-call',
        blastCap: '1 consumer group / 10m',
        cooldown: '10m',
        rollbackHook: 'reseat-offset-backup',
      },
    },
    {
      id: 'auto-3',
      name: 'Clear transient rate-limit bucket',
      description: 'Client-ID scoped reset when 429 storm correlates to single tenant (safelist).',
      lastRun: `${2 + Math.floor(rand() * 8)}h ago`,
      outcome: 'success',
      modes: ['auto'],
      roadmap: 'beta',
      playbookRef: 'pb-ratelimit-tenant-scoped',
      governance: {
        cabRequired: false,
        dualControl: false,
        approverGroup: 'platform-edge',
        blastCap: '1 tenant / 5m',
        cooldown: '5m',
        rollbackHook: 'restore-original-budget',
      },
    },
    {
      id: 'auto-4',
      name: 'Recycle noisy health-check pod',
      description: 'Replace pod failing readiness only; excludes stateful sets.',
      lastRun: pick(['Yesterday', '2d ago', 'Today']),
      outcome: 'success',
      modes: ['auto'],
      roadmap: 'live',
      playbookRef: 'pb-pod-recycle-readiness',
      governance: {
        cabRequired: false,
        dualControl: false,
        approverGroup: 'platform-k8s',
        blastCap: '1 pod / 2m',
        cooldown: '2m',
        rollbackHook: 'pod-rollback-on-failure',
      },
    },
  ]

  const automationAgentsHitl: AutomationAgent[] = [
    {
      id: 'hitl-1',
      name: 'Rollback canary (payments-edge)',
      description: 'Changes routing weights; requires approver + ServiceNow change record.',
      lastRun: '—',
      outcome: 'pending_approval',
      modes: ['human-in-the-loop'],
      roadmap: 'live',
      playbookRef: 'pb-canary-rollback-payments',
      governance: {
        cabRequired: true,
        dualControl: true,
        approverGroup: 'payments-cab',
        blastCap: 'Whole canary slice',
        cooldown: '30m',
        rollbackHook: 'restore-traffic-mix',
      },
    },
    {
      id: 'hitl-2',
      name: 'Drain & replace poison-pill node',
      description: 'Evicts workloads; needs infra lead ACK and maintenance window flag.',
      lastRun: '—',
      outcome: 'pending_approval',
      modes: ['human-in-the-loop'],
      roadmap: 'live',
      playbookRef: 'pb-node-drain-replace',
      governance: {
        cabRequired: true,
        dualControl: true,
        approverGroup: 'infra-cab',
        blastCap: '1 node / window',
        cooldown: '60m',
        rollbackHook: 'cordon-only-fallback',
      },
    },
    {
      id: 'hitl-3',
      name: 'Flush CDN edge cache (SKU pricing)',
      description: 'Broad invalidation; commerce approval required (SAP pricing tie-in).',
      lastRun: `${3 + Math.floor(rand() * 20)}h ago`,
      outcome: rand() > 0.5 ? 'rolled_back' : 'success',
      modes: ['human-in-the-loop'],
      roadmap: 'live',
      playbookRef: 'pb-cdn-flush-pricing',
      governance: {
        cabRequired: true,
        dualControl: false,
        approverGroup: 'commerce-merch',
        blastCap: 'Pricing namespace only',
        cooldown: '15m',
        rollbackHook: 'serve-from-origin',
      },
    },
    {
      id: 'hitl-4',
      name: 'Open emergency traffic throttle',
      description: 'Global checkout throttle; two-person rule + VPNotify.',
      lastRun: pick(['Yesterday', 'Today']),
      outcome: 'success',
      modes: ['human-in-the-loop'],
      roadmap: 'live',
      playbookRef: 'pb-traffic-throttle-emergency',
      governance: {
        cabRequired: true,
        dualControl: true,
        approverGroup: 'incident-commander',
        blastCap: 'Global edge — bounded %',
        cooldown: '60m',
        rollbackHook: 'restore-traffic-mix',
      },
    },
    {
      id: 'hitl-5',
      name: 'Agentic RCA → suggested fix (LLM)',
      description: 'Agent proposes top-3 fixes from correlated timeline; nothing executes without operator ACK.',
      lastRun: '—',
      outcome: 'pending_approval',
      modes: ['human-in-the-loop'],
      roadmap: 'planned',
      playbookRef: 'pb-agentic-rca-suggest',
      governance: {
        cabRequired: true,
        dualControl: true,
        approverGroup: 'incident-commander',
        blastCap: 'Suggestions only — no execution',
        cooldown: '—',
        rollbackHook: 'n/a',
      },
    },
  ]

  const automationRuns: AutomationRun[] = [
    {
      id: 'r-auto-1',
      agent: 'Scale checkout pods',
      time: pick(['Today 09:41', 'Today 10:22', 'Today 08:05']),
      mode: 'auto',
      outcome: pick(['+2 replicas in 38s; p95 recovered', '+1 replica; burn flattening']),
    },
    {
      id: 'r-auto-2',
      agent: 'Clear transient rate-limit bucket',
      time: pick(['Today 08:52', 'Today 07:40']),
      mode: 'auto',
      outcome: pick(['429 rate −82% at edge', 'Edge 429 −65%']),
    },
    {
      id: 'r-auto-3',
      agent: 'Recycle noisy health-check pod',
      time: pick(['Today 07:18', 'Today 06:55']),
      mode: 'auto',
      outcome: 'Pod replaced; readiness green',
    },
    {
      id: 'r-auto-4',
      agent: 'Restart stuck Kafka consumer',
      time: pick(['Yesterday 22:05', 'Yesterday 21:12']),
      mode: 'auto',
      outcome: 'Lag cleared after restart',
    },
    {
      id: 'r-hitl-1',
      agent: 'Rollback canary (payments-edge)',
      time: pick(['Today 08:05', 'Today 09:10']),
      mode: 'human-in-the-loop',
      outcome: pick(['Awaiting CAB + second approver', 'Approver picked up — CAB tonight']),
      cabTicket: `CHG${100000 + Math.floor(rand() * 9999)}`,
      approverChain: ['payments-on-call', 'payments-cab-lead'],
    },
    {
      id: 'r-hitl-2',
      agent: 'Drain & replace poison-pill node',
      time: pick(['Today 06:40', 'Today 05:50']),
      mode: 'human-in-the-loop',
      outcome: pick(['Denied — attach blast-radius doc', 'Deferred — window conflict']),
      cabTicket: `CHG${100000 + Math.floor(rand() * 9999)}`,
      approverChain: ['infra-on-call', 'infra-cab-lead'],
    },
    {
      id: 'r-hitl-3',
      agent: 'Open emergency traffic throttle',
      time: pick(['Yesterday 14:12', 'Yesterday 13:40']),
      mode: 'human-in-the-loop',
      outcome: pick(['Approved; throttle 18% 45m', 'Approved; throttle 12% 60m']),
      cabTicket: `CHG${100000 + Math.floor(rand() * 9999)}`,
      approverChain: ['incident-commander', 'cto-on-call'],
    },
    {
      id: 'r-hitl-4',
      agent: 'Flush CDN edge cache (SKU pricing)',
      time: pick(['Yesterday 11:30', 'Yesterday 10:05']),
      mode: 'human-in-the-loop',
      outcome: pick(['Approved run → partial miss; manual rollback', 'Completed — pricing TTL skew']),
      cabTicket: `CHG${100000 + Math.floor(rand() * 9999)}`,
      approverChain: ['commerce-merch-lead'],
    },
  ]

  const correlatedLayerSeries = buildCorrelatedLayerSeries(rand, allHealthy)
  const layerSignalSamples = buildLayerSignalSamples(rand, pick, allHealthy)
  const serviceHealthDrilldowns = buildServiceHealthDrilldowns(businessServices, activeIncidents, rand, pick)
  const traceViews = buildTraceViewsByService(businessServices, seed >>> 0, rand, pick)

  /** ---------------- V2 helpers (kept inline to share `rand` / `pick`) ---------------- */

  const corrIdRoot = (seed >>> 0).toString(36).slice(0, 6)
  const primaryCorrelationId = `corr-${corrIdRoot}-${primaryId.replace('INC-', '')}`
  const nowMs = Date.now()
  const windowStartMs = nowMs - (durationMin + 15) * 60_000
  const windowEndMs = nowMs - 2 * 60_000
  const fmtIso = (ms: number) => new Date(ms).toISOString()
  const buildAnchorsFor = (inc: IncidentDetail): CorrelationAnchorSet => {
    const suffix = inc.id.replace('INC-', '')
    const incCorrId = `corr-${corrIdRoot}-${suffix}`
    const startMs = nowMs - (inc.durationMin + 15) * 60_000
    const endMs = nowMs - 2 * 60_000
    const services = inc.affectedServiceIds
      .map((id) => businessServices.find((s) => s.id === id))
      .filter((s): s is BusinessService => Boolean(s))
    return {
      timeWindowLabel: `${new Date(startMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → ${new Date(endMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      windowStartIso: fmtIso(startMs),
      windowEndIso: fmtIso(endMs),
      primaryCorrelationId: incCorrId,
      toolCorrelationIds: [
        { tool: 'Datadog', id: `dd-${suffix}` },
        { tool: 'Splunk', id: `spl-${suffix}` },
        { tool: 'Kentik', id: `flow-${suffix}` },
        { tool: 'Grafana', id: `gf-${suffix}` },
        { tool: 'ServiceNow', id: inc.id },
      ],
      servicesInvolved: services.map((s) => ({ id: s.id, name: s.name })),
      toolsInvolved: ['Datadog', 'Splunk', 'Kentik', 'Grafana', 'ServiceNow', 'AppDynamics'],
      notes:
        'Anchors used: shared time window, primary correlation_id propagated across tools, and the affected service names from the topology — same payload joins on any one anchor.',
    }
  }

  const correlationAnchorsByIncident: Record<string, CorrelationAnchorSet> = {}
  if (allHealthy) {
    correlationAnchorsByIncident[primaryId] = {
      timeWindowLabel: `${new Date(windowStartMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → ${new Date(windowEndMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      windowStartIso: fmtIso(windowStartMs),
      windowEndIso: fmtIso(windowEndMs),
      primaryCorrelationId,
      toolCorrelationIds: [
        { tool: 'Datadog', id: `dd-${corrIdRoot}` },
        { tool: 'Splunk', id: `spl-${corrIdRoot.toUpperCase()}` },
        { tool: 'Kentik', id: `flow-${corrIdRoot}` },
        { tool: 'Grafana', id: `gf-${corrIdRoot}` },
        { tool: 'ServiceNow', id: primaryId },
      ],
      servicesInvolved: businessServices.slice(0, 3).map((s) => ({ id: s.id, name: s.name })),
      toolsInvolved: ['Datadog', 'Splunk', 'Kentik', 'Grafana', 'ServiceNow', 'AppDynamics'],
      notes: 'Healthy simulation: anchor set exists but no active correlation cluster — feeds quiet.',
    }
  } else {
    Object.values(incidentDetails).forEach((inc) => {
      correlationAnchorsByIncident[inc.id] = buildAnchorsFor(inc)
    })
  }
  const correlationAnchors: CorrelationAnchorSet = correlationAnchorsByIncident[primaryId]!

  const eventCorrelationGroups: EventCorrelationGroup[] = allHealthy
    ? [
        {
          signature: 'kube.pod.readiness flap (single replica)',
          layer: 'infrastructure',
          sourceTool: 'Datadog',
          eventCount: 18 + Math.floor(rand() * 14),
          anomalyId: `ANO-${10000 + Math.floor(rand() * 999)}`,
          status: 'suppressed',
          windowLabel: 'last 30m',
        },
        {
          signature: 'oauth.token.refresh retries (transient)',
          layer: 'application',
          sourceTool: 'Splunk',
          eventCount: 24 + Math.floor(rand() * 18),
          anomalyId: `ANO-${10000 + Math.floor(rand() * 999)}`,
          status: 'suppressed',
          windowLabel: 'last 1h',
        },
      ]
    : [
        {
          signature: 'kube-node MemoryPressure (8 hosts, AZ=us-east-1b)',
          layer: 'infrastructure',
          sourceTool: 'Datadog',
          eventCount: 220 + Math.floor(rand() * 180),
          anomalyId: `ANO-${10000 + Math.floor(rand() * 999)}`,
          alertId: `AL-${22000 + Math.floor(rand() * 999)}`,
          incidentId: primaryId,
          status: 'open',
          windowLabel: 'last 20m',
        },
        {
          signature: 'PaymentOrchestrator NullPointer (canary build)',
          layer: 'application',
          sourceTool: 'Splunk',
          eventCount: 96 + Math.floor(rand() * 90),
          anomalyId: `ANO-${10000 + Math.floor(rand() * 999)}`,
          alertId: `AL-${22000 + Math.floor(rand() * 999)}`,
          incidentId: primaryId,
          status: 'open',
          windowLabel: 'last 15m',
        },
        {
          signature: 'TLS handshake p99 breach (egress us-east → stripe)',
          layer: 'network',
          sourceTool: 'Kentik',
          eventCount: 64 + Math.floor(rand() * 80),
          anomalyId: `ANO-${10000 + Math.floor(rand() * 999)}`,
          alertId: `AL-${22000 + Math.floor(rand() * 999)}`,
          incidentId: primaryId,
          status: 'open',
          windowLabel: 'last 12m',
        },
        {
          signature: 'JWKS rotation 401 spike (single tenant)',
          layer: 'application',
          sourceTool: 'Splunk',
          eventCount: 38 + Math.floor(rand() * 22),
          anomalyId: `ANO-${10000 + Math.floor(rand() * 999)}`,
          status: 'suppressed',
          windowLabel: 'last 45m',
        },
        {
          signature: 'container throttle climbing (payments-edge)',
          layer: 'infrastructure',
          sourceTool: 'Datadog',
          eventCount: 142 + Math.floor(rand() * 80),
          anomalyId: `ANO-${10000 + Math.floor(rand() * 999)}`,
          alertId: `AL-${22000 + Math.floor(rand() * 999)}`,
          status: 'open',
          windowLabel: 'last 25m',
        },
        {
          signature: 'flow burst east→west (retry loop)',
          layer: 'network',
          sourceTool: 'Kentik',
          eventCount: 88 + Math.floor(rand() * 60),
          anomalyId: `ANO-${10000 + Math.floor(rand() * 999)}`,
          status: 'closed',
          windowLabel: 'last 2h',
        },
      ]

  const coverageLayers: CoverageLayer[] = [
    {
      id: 'app',
      label: 'Application health & SLOs',
      status: 'live',
      sources: ['Datadog APM', 'AppDynamics', 'Honeycomb'],
      notes: 'Service tiles, SLO burn, blast radius across application dependencies.',
    },
    {
      id: 'logs',
      label: 'Application logs',
      status: 'live',
      sources: ['Splunk'],
      notes: 'Correlated by trace/correlation id with metrics and traces.',
    },
    {
      id: 'itsm',
      label: 'ITSM & change',
      status: 'live',
      sources: ['ServiceNow'],
      notes: 'Incidents, CAB tickets, change records aligned to the incident timeline.',
    },
    {
      id: 'network',
      label: 'Network flow & bandwidth',
      status: 'planned',
      sources: ['Kentik (mock)', 'Cisco ThousandEyes'],
      notes: 'East-west flow, RTT, TLS p99 — feed is simulated today; live wiring planned.',
    },
    {
      id: 'firewall',
      label: 'Firewall / edge security',
      status: 'planned',
      sources: ['Palo Alto', 'AWS WAF', 'Cloudflare'],
      notes: 'WAF deny patterns, rule hits, geo-anomalies — not yet wired.',
    },
    {
      id: 'journey',
      label: 'End-to-end user journeys',
      status: 'planned',
      sources: ['Synthetic monitors', 'RUM / Sentry'],
      notes: 'Step-level checkout journey overlay — preview available via toggle.',
    },
    {
      id: 'storage',
      label: 'Long-term storage / lakehouse',
      status: 'optional',
      sources: ['S3 / Iceberg', 'Snowflake', 'Databricks'],
      notes: 'Streaming-first today; storage layer is an opt-in extension for deeper analysis.',
    },
  ]

  const userJourney: UserJourneyStep[] = [
    {
      id: 'j1',
      label: 'Browse catalog',
      nodeId: 'cdn',
      expectedP95Ms: 220,
      observedP95Ms: allHealthy ? 210 + Math.floor(rand() * 30) : 240 + Math.floor(rand() * 60),
      status: allHealthy ? 'ok' : (rand() > 0.7 ? 'slow' : 'ok'),
      hint: 'Edge cache + CDN serves browsing traffic.',
    },
    {
      id: 'j2',
      label: 'Authenticate',
      nodeId: 'apigw',
      expectedP95Ms: 180,
      observedP95Ms: allHealthy ? 160 + Math.floor(rand() * 25) : 220 + Math.floor(rand() * 90),
      status: allHealthy ? 'ok' : (rand() > 0.6 ? 'slow' : 'ok'),
      hint: 'API gateway → auth service → session token.',
    },
    {
      id: 'j3',
      label: 'Add to cart',
      nodeId: 'cart',
      expectedP95Ms: 250,
      observedP95Ms: allHealthy ? 220 + Math.floor(rand() * 30) : 320 + Math.floor(rand() * 140),
      status: allHealthy ? 'ok' : (rand() > 0.55 ? 'slow' : 'ok'),
      hint: 'Cart merge + inventory lock with Redis cache.',
    },
    {
      id: 'j4',
      label: 'Pay (checkout)',
      nodeId: 'checkout',
      expectedP95Ms: 700,
      observedP95Ms: allHealthy ? 620 + Math.floor(rand() * 60) : 1100 + Math.floor(rand() * 800),
      status: allHealthy ? 'ok' : 'failing',
      hint: 'Checkout API → payments-edge → stripe-proxy on the hot path.',
    },
    {
      id: 'j5',
      label: 'Confirm & receipt',
      nodeId: 'kafka',
      expectedP95Ms: 300,
      observedP95Ms: allHealthy ? 240 + Math.floor(rand() * 40) : 360 + Math.floor(rand() * 220),
      status: allHealthy ? 'ok' : (rand() > 0.5 ? 'slow' : 'ok'),
      hint: 'Order events → Kafka outbox → email/receipt service.',
    },
  ]

  const dataIntegrations: DataIntegration[] = [
    {
      id: 'i-dd',
      tool: 'Datadog',
      layer: 'infrastructure',
      ingestionType: 'streaming',
      status: 'live',
      notes: 'Metrics + APM via API; events fan in on shared correlation_id.',
    },
    {
      id: 'i-splunk',
      tool: 'Splunk',
      layer: 'application',
      ingestionType: 'streaming',
      status: 'live',
      notes: 'HEC stream filtered to ERROR + correlated by trace id.',
    },
    {
      id: 'i-kentik',
      tool: 'Kentik',
      layer: 'network',
      ingestionType: 'streaming',
      status: 'planned',
      notes: 'Flow + TLS analytics; live wiring depends on tenant access.',
    },
    {
      id: 'i-grafana',
      tool: 'Grafana',
      layer: 'apm',
      ingestionType: 'pull',
      status: 'live',
      notes: 'Embedded panels + alert webhook for cross-tool overlay.',
    },
    {
      id: 'i-snow',
      tool: 'ServiceNow',
      layer: 'itsm',
      ingestionType: 'webhook',
      status: 'live',
      notes: 'Incident & CAB ticket sync; reverse update on resolution.',
    },
    {
      id: 'i-appd',
      tool: 'AppDynamics',
      layer: 'apm',
      ingestionType: 'streaming',
      status: 'live',
      notes: 'Business transaction p95/errors; back-pressure aware.',
    },
    {
      id: 'i-storage',
      tool: 'S3 / Iceberg lakehouse',
      layer: 'storage',
      ingestionType: 'batch',
      status: 'optional',
      notes: 'Optional long-term storage tier for retro analysis / training data.',
    },
  ]

  return {
    seed,
    scenario,
    businessServices,
    activeIncidents,
    primaryIncidentDetail,
    recentDeploys,
    monitoringTools: MONITORING_TOOLS,
    correlatedLayerSeries,
    layerSignalSamples,
    serviceHealthDrilldowns,
    signalVolumeSeries: buildSignalVolumeSeries(rand, allHealthy),
    correlationAnchors,
    incidentDetails,
    correlationAnchorsByIncident,
    eventCorrelationGroups,
    coverageLayers,
    userJourney,
    dataIntegrations,
    mttrTrend: buildMttrTrend(rand, allHealthy),
    alertIncidentRatio: buildAlertIncidentRatio(rand, allHealthy),
    repeatOffenders,
    sloRiskForecast,
    executiveScorecard,
    connectedTools: allHealthy ?
      [
        { name: 'Datadog', ok: true },
        { name: 'Splunk', ok: true },
        { name: 'Kentik', ok: true },
        { name: 'AppDynamics', ok: true },
        { name: 'ServiceNow', ok: true },
        { name: 'Honeycomb', ok: true },
        { name: 'Salesforce', ok: true },
        { name: 'SAP ALM', ok: true },
      ]
    : [
        { name: 'Datadog', ok: true },
        { name: 'Splunk', ok: true },
        { name: 'Kentik', ok: rand() > 0.06 },
        { name: 'AppDynamics', ok: true },
        { name: 'ServiceNow', ok: true },
        { name: 'Honeycomb', ok: true },
        { name: 'Salesforce', ok: true },
        { name: 'SAP ALM', ok: rand() > 0.08 },
      ],
    mockStats: allHealthy ?
      {
        alertCount: 22 + Math.floor(rand() * 38),
        incidentCount: 0,
        correlatedPct: 93 + Math.floor(rand() * 6),
      }
    : {
        alertCount: 160 + Math.floor(rand() * 120),
        incidentCount: 18 + Math.floor(rand() * 18),
        correlatedPct: 68 + Math.floor(rand() * 22),
      },
    topologyNodes,
    topologyEdges,
    automationAgentsAuto,
    automationAgentsHitl,
    automationAgents: [...automationAgentsAuto, ...automationAgentsHitl],
    automationRuns,
    mockAlerts: generateMockAlerts(rand, pick, allHealthy),
    traceViews,
  }
}

/** Rich text block injected into the RCA assistant (mock incident + roll-ups). */
export function incidentContextForPrompt(
  incident: IncidentDetail,
  recentDeploys: DeployEvent[],
  services?: BusinessService[],
): string {
  const deploys = recentDeploys.map((d) => `${d.service} ${d.version} (${d.minutesAgo}m ago)`).join('; ')
  const signals = incident.signals
    .map((s) => `[${s.source} · ${s.kind}] ${s.title}: ${s.detail}`)
    .join('\n')
  const topo = `Affected blast radius (service ids): ${incident.affectedServiceIds.join(', ')}`
  let health = ''
  if (services?.length) {
    const rows = incident.affectedServiceIds.map((id) => {
      const s = services.find((x) => x.id === id)
      return s
        ? `- ${s.name} [${id}]: status=${s.status}, sloBurn=${s.sloBurnPct}x`
        : `- [${id}]: not listed on Command Center health strip`
    })
    health = `\n\n--- Command Center health (dashboard) ---\n${rows.join('\n')}`
  }
  return `Incident ${incident.id} (${incident.severity}): ${incident.title}\nTeam: ${incident.team}\nStatus: ${incident.status}\nDuration: ${incident.durationMin}m\nAuto-triage: ${incident.domain}\nRationale: ${incident.rationale}\n\nCorrelated timeline (metrics / logs / traces / deploys / network flow):\n${signals}\n\nRecent deploys: ${deploys}\n${topo}${health}`
}
