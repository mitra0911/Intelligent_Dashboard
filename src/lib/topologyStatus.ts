import type { BusinessService, HealthStatus, MicroserviceNode, TopologyTelemetrySeverity } from '../types'

const RANK_HEALTH: Record<HealthStatus, number> = { healthy: 0, degraded: 1, critical: 2 }

const TELEM_RANK: Record<TopologyTelemetrySeverity, number> = {
  ok: 0,
  warning: 1,
  error: 2,
  critical: 3,
}

const HEALTH_AS_TELEM: Record<HealthStatus, TopologyTelemetrySeverity> = {
  healthy: 'ok',
  degraded: 'warning',
  critical: 'critical',
}

export function worstStatus(a: HealthStatus, b: HealthStatus): HealthStatus {
  return RANK_HEALTH[a] >= RANK_HEALTH[b] ? a : b
}

/** Roll up Command Center business health onto a topology node (multi-tenant mapping). */
export function statusForTopologyNode(node: MicroserviceNode, services: BusinessService[]): HealthStatus {
  const ids = node.businessServiceIds
  if (!ids?.length) return 'healthy'
  let out: HealthStatus = 'healthy'
  for (const id of ids) {
    const bs = services.find((s) => s.id === id)
    if (bs) out = worstStatus(out, bs.status)
  }
  return out
}

/** Worst of live telemetry mock and business roll-up (what we paint on the ring). */
export function effectiveTelemetrySeverity(
  node: MicroserviceNode,
  services: BusinessService[] | undefined,
): TopologyTelemetrySeverity {
  const fromProbe = node.telemetry ?? 'ok'
  if (!services?.length) return fromProbe
  const fromRollup = HEALTH_AS_TELEM[statusForTopologyNode(node, services)]
  return TELEM_RANK[fromProbe] >= TELEM_RANK[fromRollup] ? fromProbe : fromRollup
}

export function telemetryStrokeColor(s: TopologyTelemetrySeverity): string {
  switch (s) {
    case 'ok':
      return '#22c55e'
    case 'warning':
      return '#eab308'
    case 'error':
      return '#f97316'
    case 'critical':
      return '#dc2626'
    default:
      return '#64748b'
  }
}

export function telemetrySeverityLabel(s: TopologyTelemetrySeverity): string {
  switch (s) {
    case 'ok':
      return 'OK'
    case 'warning':
      return 'Warning'
    case 'error':
      return 'Error'
    case 'critical':
      return 'Critical'
    default:
      return s
  }
}

export function worstTelemetrySeverity(a: TopologyTelemetrySeverity, b: TopologyTelemetrySeverity): TopologyTelemetrySeverity {
  return TELEM_RANK[a] >= TELEM_RANK[b] ? a : b
}
