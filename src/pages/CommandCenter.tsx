import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Anchor, Layers, Sparkles } from 'lucide-react'
import { MiniSparkline } from '../components/MiniSparkline'
import {
  CHART_AXIS_LINE,
  CHART_TICK,
  CHART_TICK_LINE,
  chartLegendProps,
  chartTooltipProps,
} from '../lib/chartTheme'
import { useMockData } from '../context/MockDataContext'
import type { HealthStatus } from '../types'

function statusBadge(status: HealthStatus) {
  if (status === 'healthy')
    return <span className="rounded-full bg-obs-green/15 px-2 py-0.5 text-[11px] font-medium text-obs-green">Healthy</span>
  if (status === 'degraded')
    return <span className="rounded-full bg-obs-amber/15 px-2 py-0.5 text-[11px] font-medium text-obs-amber">Degraded</span>
  return <span className="rounded-full bg-obs-red/15 px-2 py-0.5 text-[11px] font-medium text-obs-red">Critical</span>
}

function sevColor(s: string) {
  if (s === 'SEV1') return 'text-obs-red border-obs-red/40 bg-obs-red/10'
  if (s === 'SEV2') return 'text-obs-amber border-obs-amber/40 bg-obs-amber/10'
  return 'text-obs-blue border-obs-blue/40 bg-obs-blue/10'
}

export function CommandCenter() {
  const { data } = useMockData()
  const {
    activeIncidents,
    businessServices,
    mockAlerts,
    signalVolumeSeries,
    correlationAnchors,
    eventCorrelationGroups,
  } = data

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-obs-text">Command Center</h1>
        <p className="mt-1 text-sm text-obs-muted">
          Unified health, incidents, and signal funnel — multi-tool trace correlation lives on the{' '}
          <Link to="/traces" className="text-obs-teal hover:underline">
            Traces
          </Link>{' '}
          tab (mock).
        </p>
      </div>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-obs-border bg-obs-surface p-4">
          <div className="flex items-start gap-2">
            <Anchor className="mt-0.5 h-4 w-4 text-obs-teal" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-sm font-medium text-obs-text">Correlation anchors</h2>
                <span className="text-[11px] text-obs-muted">
                  How tools join — shared across ServiceNow / Grafana / Datadog / Splunk / Kentik (mock)
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-obs-border bg-obs-bg p-3">
                  <div className="text-[11px] uppercase tracking-wide text-obs-muted">Time window</div>
                  <div className="mt-1 font-mono text-sm text-obs-text">{correlationAnchors.timeWindowLabel}</div>
                  <div className="mt-1 text-[11px] text-obs-muted">
                    {new Date(correlationAnchors.windowStartIso).toLocaleDateString()} (UTC)
                  </div>
                </div>
                <div className="rounded-lg border border-obs-border bg-obs-bg p-3">
                  <div className="text-[11px] uppercase tracking-wide text-obs-muted">Correlation ID</div>
                  <div className="mt-1 font-mono text-sm text-obs-teal">{correlationAnchors.primaryCorrelationId}</div>
                  <div className="mt-1 text-[11px] text-obs-muted">
                    Propagated to {correlationAnchors.toolCorrelationIds.length} downstream tools
                  </div>
                </div>
                <div className="rounded-lg border border-obs-border bg-obs-bg p-3">
                  <div className="text-[11px] uppercase tracking-wide text-obs-muted">Services involved</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {correlationAnchors.servicesInvolved.length === 0 ?
                      <span className="text-xs text-obs-muted">None — feeds quiet</span>
                    : correlationAnchors.servicesInvolved.map((s) => (
                        <span
                          key={s.id}
                          className="rounded bg-obs-elevated px-1.5 py-0.5 text-[11px] text-obs-text"
                        >
                          {s.name}
                        </span>
                      ))
                    }
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                {correlationAnchors.toolCorrelationIds.map((t) => (
                  <span
                    key={t.tool}
                    className="rounded-full border border-obs-border bg-obs-bg px-2 py-0.5 text-obs-muted"
                  >
                    <span className="text-obs-text">{t.tool}</span>
                    <span className="mx-1 text-obs-muted/50">·</span>
                    <span className="font-mono text-obs-teal">{t.id}</span>
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-obs-muted">{correlationAnchors.notes}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-obs-teal/30 bg-obs-teal/5 p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 text-obs-teal" />
            <div>
              <h2 className="text-sm font-medium text-obs-text">Why this is different</h2>
              <p className="mt-1 text-xs text-obs-muted">
                Datadog / AppDynamics map <em>their own</em> world. This dashboard correlates across vendors and
                layers on shared anchors.
              </p>
              <ul className="mt-3 space-y-2 text-xs text-obs-muted">
                <li>
                  <span className="text-obs-text">Cross-tool fan-in</span> — ServiceNow, Datadog, Splunk, Kentik, Grafana
                  joined on time + correlation_id + service.
                </li>
                <li>
                  <span className="text-obs-text">Multi-layer view</span> — application + logs + metrics + ITSM today;
                  network/firewall planned.
                </li>
                <li>
                  <span className="text-obs-text">Agentic + governed</span> — LLM-suggested fixes route through CAB,
                  dual-control, approver groups.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-medium text-obs-text">Business service health</h2>
          <span className="text-[11px] text-obs-muted">Click a tile for SLO burn narrative, layer metrics, and open incidents</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {businessServices.map((svc) => (
            <Link
              key={svc.id}
              to={`/health/${svc.id}`}
              className={`block rounded-xl border border-obs-border bg-obs-surface p-4 transition-colors hover:border-obs-teal/40 hover:bg-obs-elevated/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obs-teal/50 ${
                svc.status === 'critical' ? 'animate-incident-pulse border-obs-red/50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-obs-text">{svc.name}</div>
                  <div className="mt-1">{statusBadge(svc.status)}</div>
                </div>
                <MiniSparkline service={svc} />
              </div>
              <div className="mt-3 flex items-baseline justify-between text-xs text-obs-muted">
                <span>SLO burn (24h)</span>
                <span className="font-mono text-obs-text">{svc.sloBurnPct}x</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-medium text-obs-text">
              <AlertTriangle className="h-4 w-4 text-obs-amber" />
              Active incidents
            </h2>
            <Link to="/incidents" className="text-[11px] text-obs-teal hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-obs-border bg-obs-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-obs-border bg-obs-elevated text-xs text-obs-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Incident</th>
                  <th className="px-4 py-2 font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {activeIncidents.length === 0 ?
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-sm text-obs-muted">
                      No active incidents — healthy simulation or a quiet period (mock).
                    </td>
                  </tr>
                : activeIncidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-obs-border last:border-0 hover:bg-obs-elevated/50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="font-medium text-obs-teal hover:underline"
                      >
                        {inc.id}
                      </Link>
                      <div className="mt-0.5 text-obs-muted">{inc.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                        <span className={`rounded border px-1.5 py-0.5 ${sevColor(inc.severity)}`}>
                          {inc.severity}
                        </span>
                        <span className="text-obs-muted">{inc.service}</span>
                        <span className="text-obs-muted">{inc.openedMinutesAgo}m ago</span>
                      </div>
                    </td>
                    <td className="align-top px-4 py-3">
                      <span className="inline-flex rounded-full bg-obs-bg px-2 py-1 text-xs text-obs-muted">
                        {inc.verdict}
                      </span>
                    </td>
                  </tr>
                ))
                }
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-obs-text">
            <Layers className="h-4 w-4 text-obs-teal" />
            Signal volume funnel — events → metric anomalies → alerts → incidents
          </h2>
          <p className="mb-2 text-xs text-obs-muted">
            Raw events (all layers) → clustered into <span className="text-obs-text">metric/event anomalies</span>{' '}
            <em>before</em> alerting → deduped alerts → correlated incidents in ITSM. Event-level clustering reduces
            noise so on-call sees unique incidents, not the firehose.
          </p>
          <div className="h-72 rounded-xl border border-obs-border bg-obs-surface p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signalVolumeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#64748b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#64748b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillAnomalies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={CHART_TICK}
                  tickLine={CHART_TICK_LINE}
                  axisLine={CHART_AXIS_LINE}
                  interval={6}
                />
                <YAxis tick={CHART_TICK} tickLine={CHART_TICK_LINE} axisLine={CHART_AXIS_LINE} />
                <Tooltip {...chartTooltipProps} />
                <Legend {...chartLegendProps} />
                <Area
                  type="monotone"
                  dataKey="events"
                  name="Raw events (all layers)"
                  stroke="#94a3b8"
                  fill="url(#fillEvents)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="metricAnomalies"
                  name="Metric / event anomalies (pre-alert)"
                  stroke="#a78bfa"
                  fill="url(#fillAnomalies)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="alerts"
                  name="Deduped alerts"
                  stroke="#38bdf8"
                  fill="url(#fillAlerts)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  name="Correlated incidents"
                  stroke="#2dd4bf"
                  fill="url(#fillInc)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-obs-text">
              Event correlation (pre-alert clustering)
            </h2>
            <p className="text-xs text-obs-muted">
              How raw events from different tools get clustered into anomalies <em>before</em> they fan out as alerts —
              and which ones became today's incident.
            </p>
          </div>
          <span className="text-[11px] text-obs-muted">Signature → anomaly → alert → incident</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-obs-border bg-obs-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-obs-border bg-obs-elevated text-xs text-obs-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Signature</th>
                <th className="px-4 py-2 font-medium">Layer · tool</th>
                <th className="px-4 py-2 font-medium">Events → anomaly</th>
                <th className="px-4 py-2 font-medium">Alert</th>
                <th className="px-4 py-2 font-medium">Incident</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {eventCorrelationGroups.map((g) => (
                <tr key={g.anomalyId} className="border-b border-obs-border last:border-0">
                  <td className="px-4 py-2">
                    <div className="font-medium text-obs-text">{g.signature}</div>
                    <div className="text-[11px] text-obs-muted">{g.windowLabel}</div>
                  </td>
                  <td className="px-4 py-2 text-xs text-obs-muted">
                    <div className="capitalize text-obs-text">{g.layer}</div>
                    <div>{g.sourceTool}</div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    <span className="text-obs-muted">{g.eventCount.toLocaleString()} events</span>
                    <span className="mx-1 text-obs-muted/60">→</span>
                    <span className="text-obs-teal">{g.anomalyId}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-obs-blue">
                    {g.alertId ?? <span className="text-obs-muted">—</span>}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {g.incidentId ?
                      <Link to={`/incidents/${g.incidentId}`} className="text-obs-teal hover:underline">
                        {g.incidentId}
                      </Link>
                    : <span className="text-obs-muted">—</span>
                    }
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        g.status === 'open'
                          ? 'bg-obs-red/15 text-obs-red'
                          : g.status === 'suppressed'
                            ? 'bg-obs-amber/15 text-obs-amber'
                            : 'bg-obs-muted/10 text-obs-muted'
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-obs-text">Live log stream (sample)</h2>
        <p className="mb-2 text-xs text-obs-muted">
          Mock structured logs — full dataset includes {mockAlerts.length} events for correlation demos.
        </p>
        <div className="max-h-48 overflow-auto rounded-xl border border-obs-border bg-obs-bg font-mono text-[11px]">
          {mockAlerts.slice(0, 12).map((a) => (
            <div
              key={a.id}
              className="flex gap-2 border-b border-obs-border/50 px-3 py-1.5 text-obs-muted last:border-0"
            >
              <span className="shrink-0 text-obs-muted/70">{a.ts}</span>
              <span
                className={
                  a.severity === 'error'
                    ? 'text-obs-red'
                    : a.severity === 'warn'
                      ? 'text-obs-amber'
                      : 'text-obs-blue/90'
                }
              >
                [{a.severity}]
              </span>
              <span className="text-obs-teal/90">{a.source}</span>
              <span className="min-w-0 truncate text-obs-muted">{a.msg}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
