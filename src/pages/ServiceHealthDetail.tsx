import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useMockData } from '../context/MockDataContext'
import type { HealthMetricStatus } from '../types'

function metricPill(status: HealthMetricStatus) {
  if (status === 'ok')
    return <span className="rounded-full bg-obs-green/15 px-2 py-0.5 text-[11px] font-medium text-obs-green">OK</span>
  if (status === 'warn')
    return <span className="rounded-full bg-obs-amber/15 px-2 py-0.5 text-[11px] font-medium text-obs-amber">Warn</span>
  return <span className="rounded-full bg-obs-red/15 px-2 py-0.5 text-[11px] font-medium text-obs-red">Critical</span>
}

function statusBadge(status: 'healthy' | 'degraded' | 'critical') {
  if (status === 'healthy')
    return <span className="rounded-full bg-obs-green/15 px-2 py-0.5 text-xs font-medium text-obs-green">Healthy</span>
  if (status === 'degraded')
    return <span className="rounded-full bg-obs-amber/15 px-2 py-0.5 text-xs font-medium text-obs-amber">Degraded</span>
  return <span className="rounded-full bg-obs-red/15 px-2 py-0.5 text-xs font-medium text-obs-red">Critical</span>
}

export function ServiceHealthDetail() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const { data } = useMockData()
  const drill = serviceId ? data.serviceHealthDrilldowns[serviceId] : undefined

  if (!drill) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-obs-teal hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Command Center
        </Link>
        <div className="rounded-xl border border-obs-border bg-obs-surface p-6 text-sm text-obs-muted">
          Unknown service <span className="font-mono text-obs-text">{serviceId ?? '—'}</span>. Return to Command Center and
          select a health tile.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-obs-teal hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Command Center
      </Link>

      <header className="rounded-xl border border-obs-border bg-obs-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-obs-muted">{drill.serviceId}</div>
            <h1 className="mt-1 text-xl font-semibold text-obs-text">{drill.serviceName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {statusBadge(drill.status)}
              <Link
                to={`/traces/${drill.serviceId}`}
                className="inline-flex items-center gap-1 text-xs text-obs-teal hover:underline"
              >
                Open trace workspace
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-1 text-xs text-obs-teal hover:underline"
              >
                View topology context
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
        <h2 className="text-sm font-medium text-obs-text">SLO &amp; burn rate</h2>
        <p className="mt-2 text-sm leading-relaxed text-obs-muted">{drill.sloTargetSummary}</p>
        <p className="mt-4 text-sm leading-relaxed text-obs-muted">{drill.sloBurnExplanation}</p>
      </section>

      <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
        <h2 className="text-sm font-medium text-obs-text">Why health is not green</h2>
        <p className="mt-2 text-sm leading-relaxed text-obs-muted">{drill.whyNotHealthy}</p>
        <p className="mt-3 text-xs text-obs-muted">
          Synthetic readings combine <strong className="text-obs-text">Datadog</strong> (infrastructure),{' '}
          <strong className="text-obs-text">Splunk</strong> (application logs), and{' '}
          <strong className="text-obs-text">Kentik</strong> (network) — correlated on Command Center.
        </p>
      </section>

      <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
        <h2 className="text-sm font-medium text-obs-text">Health metrics by layer</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-obs-border text-xs text-obs-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Metric</th>
                <th className="py-2 pr-3 font-medium">Current</th>
                <th className="py-2 pr-3 font-medium">Target</th>
                <th className="py-2 pr-3 font-medium">Tool</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {drill.metrics.map((m) => (
                <tr key={m.name} className="border-b border-obs-border/60 last:border-0">
                  <td className="py-2.5 pr-3 text-obs-text">{m.name}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-obs-muted">{m.current}</td>
                  <td className="py-2.5 pr-3 text-xs text-obs-muted">{m.target ?? '—'}</td>
                  <td className="py-2.5 pr-3 text-xs text-obs-teal">{m.sourceTool}</td>
                  <td className="py-2.5">{metricPill(m.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
        <h2 className="text-sm font-medium text-obs-text">Open incidents for this service</h2>
        {drill.openIncidents.length === 0 ? (
          <p className="mt-2 text-sm text-obs-muted">No active incidents mapped to this business service in the mock dataset.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {drill.openIncidents.map((inc) => (
              <li key={inc.id}>
                <Link to={`/incidents/${inc.id}`} className="text-sm font-medium text-obs-teal hover:underline">
                  {inc.id}
                </Link>
                <span className="ml-2 text-xs text-obs-muted">{inc.severity}</span>
                <div className="text-xs text-obs-muted">{inc.title}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
