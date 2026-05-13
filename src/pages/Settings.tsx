import { Database, Plug, ShieldCheck } from 'lucide-react'
import { useMockData } from '../context/MockDataContext'

const layerLabel: Record<string, string> = {
  infrastructure: 'Infrastructure',
  application: 'Application',
  network: 'Network',
  itsm: 'ITSM',
  apm: 'APM',
  storage: 'Storage',
}

export function Settings() {
  const { data } = useMockData()
  const { dataIntegrations } = data
  const live = dataIntegrations.filter((i) => i.status === 'live')
  const planned = dataIntegrations.filter((i) => i.status === 'planned')
  const optional = dataIntegrations.filter((i) => i.status === 'optional')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-obs-text">Settings — data integrations &amp; storage</h1>
        <p className="mt-1 text-sm text-obs-muted">
          The platform is streaming-first today. A storage / lakehouse tier is an optional extension when deeper
          retrospective analysis is needed.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-obs-teal/30 bg-obs-teal/5 p-5">
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-obs-teal" />
            <h2 className="text-sm font-medium text-obs-text">Streaming-first ingest</h2>
          </div>
          <p className="mt-2 text-xs text-obs-muted">
            Metrics, logs, traces and ITSM events are consumed from each tool's native stream (HEC, API, webhook).
            Correlation happens in-flight via shared timestamps, correlation IDs, and service names — no warehouse
            required for the live view.
          </p>
        </div>
        <div className="rounded-xl border border-obs-amber/30 bg-obs-amber/5 p-5">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-obs-amber" />
            <h2 className="text-sm font-medium text-obs-text">Optional storage tier</h2>
          </div>
          <p className="mt-2 text-xs text-obs-muted">
            Plug in S3/Iceberg, Snowflake or Databricks if the client needs months of retention, retro RCA, or training
            data for the agentic models. Surfaces appear automatically on the dashboard once attached.
          </p>
        </div>
        <div className="rounded-xl border border-obs-border bg-obs-surface p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-obs-teal" />
            <h2 className="text-sm font-medium text-obs-text">Governance &amp; secrets</h2>
          </div>
          <p className="mt-2 text-xs text-obs-muted">
            Per-tool credentials live in a customer-owned KMS. Outbound actions (CAB tickets, restarts) require
            approver groups + dual control, configured per integration.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-obs-text">Live integrations</h2>
          <span className="text-[11px] text-obs-muted">{live.length} connected</span>
        </div>
        <IntegrationGrid items={live} accent="live" />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-obs-text">Planned integrations</h2>
          <span className="text-[11px] text-obs-muted">{planned.length} on roadmap</span>
        </div>
        <IntegrationGrid items={planned} accent="planned" />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-obs-text">Optional / opt-in</h2>
          <span className="text-[11px] text-obs-muted">{optional.length} available</span>
        </div>
        <IntegrationGrid items={optional} accent="optional" />
      </section>
    </div>
  )
}

function IntegrationGrid({
  items,
  accent,
}: {
  items: ReturnType<typeof useMockData>['data']['dataIntegrations']
  accent: 'live' | 'planned' | 'optional'
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-obs-border bg-obs-surface p-4 text-xs text-obs-muted">
        Nothing here yet.
      </div>
    )
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div
          key={i.id}
          className={`rounded-xl border p-4 ${
            accent === 'live'
              ? 'border-obs-green/30 bg-obs-green/5'
              : accent === 'planned'
                ? 'border-obs-amber/30 bg-obs-amber/5'
                : 'border-obs-blue/30 bg-obs-blue/5'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-obs-text">{i.tool}</span>
            <span className="rounded-full bg-obs-bg px-2 py-0.5 text-[10px] uppercase text-obs-muted">
              {layerLabel[i.layer] ?? i.layer}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-obs-muted">
            Ingest: <span className="text-obs-text">{i.ingestionType}</span>
          </div>
          <p className="mt-2 text-xs text-obs-muted">{i.notes}</p>
        </div>
      ))}
    </div>
  )
}
