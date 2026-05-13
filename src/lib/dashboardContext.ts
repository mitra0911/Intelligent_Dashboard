import type { MockDataBundle } from '../data/mockData'

/** Compact screen summary for the visual assistant (mock telemetry only). */
export function buildDashboardContext(pathname: string, data: MockDataBundle): string {
  const p = pathname.replace(/\/$/, '') || '/'
  const { businessServices, activeIncidents, mockStats, primaryIncidentDetail } = data

  const svcLine = businessServices
    .map((s) => `${s.name}: ${s.status} (SLO burn ${s.sloBurnPct}x)`)
    .join('; ')
  const incidentLine = activeIncidents.map((i) => `${i.id} ${i.severity} ${i.service}`).join('; ')

  if (p === '/' || p === '') {
    return [
      'Screen: Command Center (home).',
      ...(data.scenario === 'allHealthy' ?
        ['Scenario: ALL HEALTHY simulation — green tiles, zero active incidents, calm telemetry.']
      : []),
      `Mock KPIs: ${mockStats.alertCount} alerts, ${mockStats.incidentCount} incidents, ${mockStats.correlatedPct}% correlated.`,
      `Business services: ${svcLine}`,
      `Active incidents list: ${incidentLine}`,
      'Visuals: Correlation anchors card (time window, correlation_id, services, tools); "Why this is different" card (vs Datadog/AppDynamics); health tiles (drill-down); signal volume 4-stage funnel events→anomalies→alerts→incidents; event correlation table (pre-alert clustering); sample log stream; Traces tab holds flame graph + multi-tool correlation.',
      `Correlation anchors in use: time=${data.correlationAnchors.timeWindowLabel}, id=${data.correlationAnchors.primaryCorrelationId}, tools=${data.correlationAnchors.toolsInvolved.join('/')}.`,
    ].join('\n')
  }

  if (p.startsWith('/traces')) {
    return [
      'Screen: Traces (APM-style workspace).',
      'Flame graph icicle timeline (mock); tabs Overview / Span / Errors / Infra / Metrics / Logs / Network.',
      'Overview: service narrative + Datadog/Splunk/Kentik correlation chart + sample streams.',
      'Facets attribute infra to Datadog, logs to Splunk, network to Kentik (demo labels).',
    ].join('\n')
  }

  if (p.startsWith('/health/')) {
    const id = p.replace(/^\/health\//, '').split('/')[0] ?? ''
    const drill = data.serviceHealthDrilldowns[id]
    if (!drill) return `Screen: Service health drill-down (unknown id ${id}).`
    return [
      `Screen: Service health drill-down (${drill.serviceName} / ${drill.serviceId}).`,
      `Status: ${drill.status}.`,
      `SLO narrative + burn explanation present; metrics tagged by Datadog / Splunk / Kentik (mock).`,
      `Open incidents for service: ${drill.openIncidents.map((i) => i.id).join(', ') || 'none'}.`,
    ].join('\n')
  }

  if (p === '/incidents') {
    return [
      'Screen: Incidents list (widget grid of all non-closed incidents).',
      `Total open: ${data.activeIncidents.length}.`,
      `Rows: ${data.activeIncidents.map((i) => `${i.id}/${i.severity}/${i.service}`).join('; ') || '—'}`,
      'Each card shows id, severity, status, team, age, blast service count, verdict, domain hint, and a snippet of correlation anchors. Click → full incident detail.',
    ].join('\n')
  }

  if (p.startsWith('/incidents/')) {
    const incidentId = p.replace(/^\/incidents\//, '').split('/')[0] ?? ''
    const inc = data.incidentDetails[incidentId] ?? primaryIncidentDetail
    const anchors = data.correlationAnchorsByIncident[inc.id] ?? data.correlationAnchors
    return [
      `Screen: Incident detail (${inc.id}).`,
      `Title: ${inc.title}; ${inc.severity}; team ${inc.team}; ${inc.status}.`,
      `Domain hint: ${inc.domain}.`,
      `Signals count: ${inc.signals.length}; blast ids: ${inc.affectedServiceIds.join(', ')}.`,
      `Correlation anchors: ${anchors.primaryCorrelationId} over ${anchors.timeWindowLabel}, joining ${anchors.toolsInvolved.join('/')}.`,
    ].join('\n')
  }

  if (p.startsWith('/services')) {
    return [
      'Screen: Services & topology.',
      'Graph: mesh-style dependency map; bubble fill reflects roll-up + mock telemetry.',
      'User journey overlay toggle (Browse → Auth → Cart → Pay → Confirm) with per-step p95.',
      `Coverage card: App / Logs / ITSM live; Network, Firewall, User journeys planned; Storage optional.`,
      `Business roll-up mirrors Command Center: ${svcLine}`,
    ].join('\n')
  }

  if (p.startsWith('/trends')) {
    return [
      'Screen: Trends & reliability.',
      'Panels: MTTR trend, alert/incident ratio, repeat offenders, forecast strip, executive scorecard (mock).',
    ].join('\n')
  }

  if (p.startsWith('/automation')) {
    return [
      'Screen: Automation.',
      'Toggle: Auto vs Human-in-the-loop; agent catalog with governance chips (CAB required, dual control, approver group, blast cap, cooldown, playbook ref).',
      'Run history exposes CAB ticket + approver chain per HITL run.',
      'Agentic AI roadmap card: Suggest (live mock) → Execute supervised (beta) → Full agentic (planned, guardrailed).',
    ].join('\n')
  }

  if (p.startsWith('/settings')) {
    return [
      'Screen: Settings — data integrations & storage.',
      'Streaming-first ingest (HEC/API/webhook). Optional storage tier (S3/Iceberg/Snowflake/Databricks) for retro RCA + agentic training.',
      'Per-tool credentials in customer-owned KMS; outbound actions still gated by approver groups.',
    ].join('\n')
  }

  return `Screen: ${p}. Mock ObservIQ dashboard — seeded demo data only.`
}
