export type HealthStatus = 'healthy' | 'degraded' | 'critical'

export interface BusinessService {
  id: string
  name: string
  status: HealthStatus
  sloBurnPct: number
  sparkline: number[]
}

export interface IncidentRow {
  id: string
  title: string
  severity: 'SEV1' | 'SEV2' | 'SEV3'
  service: string
  verdict: string
  openedMinutesAgo: number
}

export interface TimelineSignal {
  id: string
  tsOffsetMin: number
  title: string
  detail: string
  source: 'Datadog' | 'Splunk' | 'ServiceNow' | 'AppDynamics' | 'Honeycomb' | 'Kentik'
  kind: 'deploy' | 'metric' | 'log' | 'trace' | 'ticket'
}

export interface IncidentDetail {
  id: string
  title: string
  severity: 'SEV1' | 'SEV2' | 'SEV3'
  team: string
  status: 'Investigating' | 'Mitigated' | 'Resolved'
  durationMin: number
  rationale: string
  domain: string
  signals: TimelineSignal[]
  affectedServiceIds: string[]
}

export interface DeployEvent {
  id: string
  service: string
  version: string
  minutesAgo: number
}

/** Live signals on the topology (distinct from business roll-up). */
export type TopologyTelemetrySeverity = 'ok' | 'warning' | 'error' | 'critical'

export interface MicroserviceNode {
  id: string
  label: string
  x: number
  y: number
  tier: 'edge' | 'app' | 'data'
  /** Maps this technical node to business services on the Command Center (e.g. svc-0). */
  businessServiceIds: string[]
  /** Mock live telemetry: warnings vs errors vs critical (shown on ring). */
  telemetry?: TopologyTelemetrySeverity
  /** Short reason for tooltips / panel copy. */
  telemetryHint?: string
}

export interface MicroserviceEdge {
  from: string
  to: string
  /** Primary dependency vs read-back / cyclic leg (rendering may treat `loop` the same as primary) */
  linkKind?: 'primary' | 'loop'
}

export interface AutomationAgent {
  id: string
  name: string
  description: string
  lastRun?: string
  outcome?: 'success' | 'rolled_back' | 'pending_approval'
  /** Policies under which this agent may execute (mock governance split). */
  modes: ('human-in-the-loop' | 'auto')[]
  /** V2 governance metadata (mock). */
  governance?: AutomationGovernance
  /** Optional roadmap status when listing agentic capabilities. */
  roadmap?: 'live' | 'beta' | 'planned'
  /** Playbook reference for context (mock). */
  playbookRef?: string
}

export interface AutomationGovernance {
  cabRequired: boolean
  dualControl: boolean
  approverGroup: string
  blastCap?: string
  cooldown?: string
  rollbackHook?: string
}

export interface AutomationRun {
  id: string
  agent: string
  time: string
  mode: 'human-in-the-loop' | 'auto'
  outcome: string
  /** V2: approvers, CAB ticket, blast-cap notes (mock). */
  approverChain?: string[]
  cabTicket?: string
}

/** Observability layer simulated from distinct vendor feeds (demo). */
export type TelemetryLayer = 'infrastructure' | 'application' | 'network'

export interface MonitoringToolRef {
  id: string
  vendorName: string
  layer: TelemetryLayer
  /** Short subtitle shown on Command Center. */
  focus: string
}

/** Normalized daily intensity so three tools can be overlaid (mock correlation). */
export interface CorrelatedLayerPoint {
  day: string
  infrastructure: number
  application: number
  network: number
}

/** Recent row from one of the layer feeds (CLI-style preview). */
export interface LayerSignalSample {
  id: string
  ts: string
  tool: string
  layer: TelemetryLayer
  severity: 'info' | 'warn' | 'error'
  message: string
}

export type HealthMetricStatus = 'ok' | 'warn' | 'critical'

export interface ServiceHealthMetricRow {
  name: string
  current: string
  target?: string
  status: HealthMetricStatus
  /** Which simulated monitoring tool produced this reading. */
  sourceTool: string
}

export interface ServiceHealthDrilldown {
  serviceId: string
  serviceName: string
  status: HealthStatus
  sloTargetSummary: string
  sloBurnExplanation: string
  whyNotHealthy: string
  metrics: ServiceHealthMetricRow[]
  openIncidents: { id: string; title: string; severity: string }[]
}

/**
 * Correlation anchors used by the platform to stitch signals from multiple tools
 * (ServiceNow / Grafana / Datadog / Splunk / Kentik) into a single incident view.
 */
export interface CorrelationAnchorSet {
  timeWindowLabel: string
  windowStartIso: string
  windowEndIso: string
  primaryCorrelationId: string
  /** Each entry is `tool: alt id seen in that tool's payload`. */
  toolCorrelationIds: { tool: string; id: string }[]
  /** Services involved (technical + business names). */
  servicesInvolved: { id: string; name: string }[]
  toolsInvolved: string[]
  notes: string
}

/** Pre-alert clustering: many events → one anomaly → one alert → maybe one incident. */
export interface EventCorrelationGroup {
  signature: string
  layer: TelemetryLayer
  sourceTool: string
  eventCount: number
  anomalyId: string
  alertId?: string
  incidentId?: string
  status: 'suppressed' | 'open' | 'closed'
  windowLabel: string
}

/** Coverage map shown on Services & topology to clarify what's live vs planned. */
export interface CoverageLayer {
  id: string
  label: string
  status: 'live' | 'planned' | 'optional'
  sources: string[]
  notes: string
}

/** End-to-end user journey overlay (Browse → Cart → Pay → Confirm). */
export interface UserJourneyStep {
  id: string
  label: string
  /** Topology node id to highlight when this step is active (mock mapping). */
  nodeId: string
  expectedP95Ms: number
  observedP95Ms: number
  status: 'ok' | 'slow' | 'failing'
  hint: string
}

/** Data integration + storage options surfaced on Settings (V2). */
export interface DataIntegration {
  id: string
  tool: string
  layer: TelemetryLayer | 'itsm' | 'apm' | 'storage'
  ingestionType: 'streaming' | 'webhook' | 'pull' | 'batch'
  status: 'live' | 'planned' | 'optional'
  notes: string
}

/** Single horizontal icicle bar in a Datadog-style flame graph (mock). */
export interface TraceFlameBar {
  id: string
  label: string
  /** Start position along trace timeline (0–100). */
  startPct: number
  /** Width along trace timeline (0–100). */
  widthPct: number
  /** Vertical lane (0 = root). */
  row: number
  hasError?: boolean
}

export interface TraceSpanOverview {
  spanId: string
  name: string
  resource: string
  durationMs: number
  httpMethod?: string
  httpRoute?: string
  statusCode?: number
  parentSpanId: string | null
}

export interface TraceFacetRow {
  label: string
  value: string
  sourceTool: string
}

export interface TraceLogLine {
  ts: string
  severity: 'info' | 'warn' | 'error'
  message: string
  source: string
}

export interface TraceErrorRow {
  time: string
  message: string
  spanId: string
  stackHint?: string
}

/** APM trace workspace: flame graph + cross-tool facets for one business service (mock). */
export interface TraceViewBundle {
  traceId: string
  rootOperation: string
  totalDurationMs: number
  serviceId: string
  serviceName: string
  flameBars: TraceFlameBar[]
  spanOverview: TraceSpanOverview
  errors: TraceErrorRow[]
  infra: TraceFacetRow[]
  metrics: TraceFacetRow[]
  logs: TraceLogLine[]
  network: TraceFacetRow[]
  /** Plain-language summary tying trace to health + tools. */
  serviceOverview: string
}
