import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowLeft, GitBranch } from 'lucide-react'
import { useMockData } from '../context/MockDataContext'
import {
  CHART_AXIS_LINE,
  CHART_GRID_STROKE,
  CHART_TICK,
  CHART_TICK_LINE,
  chartLegendProps,
  chartTooltipProps,
} from '../lib/chartTheme'
import type { TelemetryLayer, TraceFlameBar } from '../types'

type DetailTab = 'overview' | 'span' | 'errors' | 'infra' | 'metrics' | 'logs' | 'network'

function layerBorderClass(layer: TelemetryLayer) {
  if (layer === 'infrastructure') return 'border-l-[3px] border-l-sky-400/70'
  if (layer === 'application') return 'border-l-[3px] border-l-violet-400/70'
  return 'border-l-[3px] border-l-amber-400/70'
}

function flameBarStyle(bar: TraceFlameBar): CSSProperties {
  if (bar.hasError) {
    return {
      background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
    }
  }
  const palette = ['#c7522c', '#d97736', '#e89654', '#f0b278']
  const c = palette[bar.row % palette.length]
  return {
    background: `linear-gradient(180deg, ${c} 0%, #9a3412 100%)`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
  }
}

const TAB_LABELS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'span', label: 'Span' },
  { id: 'errors', label: 'Errors' },
  { id: 'infra', label: 'Infra' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'logs', label: 'Logs' },
  { id: 'network', label: 'Network' },
]

export function Traces() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const navigate = useNavigate()
  const { data } = useMockData()
  const {
    businessServices,
    monitoringTools,
    correlatedLayerSeries,
    layerSignalSamples,
    traceViews,
  } = data

  const defaultServiceId = businessServices[0]?.id ?? 'svc-0'

  useEffect(() => {
    if (!serviceId) {
      navigate(`/traces/${defaultServiceId}`, { replace: true })
    }
  }, [serviceId, defaultServiceId, navigate])

  const activeId = serviceId ?? defaultServiceId
  const trace = serviceId ? traceViews[serviceId] : undefined
  const svcMeta = businessServices.find((s) => s.id === activeId)

  const [tab, setTab] = useState<DetailTab>('overview')

  const flameRows = useMemo(() => {
    if (!trace) return 0
    return Math.max(...trace.flameBars.map((b) => b.row)) + 1
  }, [trace])

  const layers: TelemetryLayer[] = ['infrastructure', 'application', 'network']

  if (!serviceId) {
    return (
      <div className="mx-auto max-w-7xl py-12 text-center text-sm text-obs-muted">
        Opening trace workspace…
      </div>
    )
  }

  if (!trace) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-obs-teal hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Command Center
        </Link>
        <div className="rounded-xl border border-obs-border bg-obs-surface p-6 text-sm text-obs-muted">
          No trace workspace for <span className="font-mono text-obs-text">{serviceId}</span>. Pick a service from the Traces
          nav after refresh.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-obs-teal hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Command Center
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-obs-teal" aria-hidden />
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-obs-text">Traces</h1>
              <p className="mt-0.5 text-sm text-obs-muted">
                Datadog-style flame timeline with Splunk logs &amp; Kentik network facets — correlated mock workspace.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="trace-service" className="text-[11px] font-medium text-obs-muted">
            Business service
          </label>
          <select
            id="trace-service"
            value={activeId}
            onChange={(e) => navigate(`/traces/${e.target.value}`)}
            className="rounded-lg border border-obs-border bg-obs-bg px-3 py-2 text-sm text-obs-text focus:border-obs-teal focus:outline-none"
          >
            {businessServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
          <Link to={`/health/${activeId}`} className="text-xs text-obs-teal hover:underline">
            Open health drill-down →
          </Link>
        </div>
      </div>

      {/* Trace header strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-obs-border bg-obs-surface px-4 py-3 text-xs">
        <span className="rounded bg-obs-bg px-2 py-1 font-mono text-obs-muted">trace_id</span>
        <span className="font-mono text-obs-teal">{trace.traceId}</span>
        <span className="text-obs-muted">·</span>
        <span className="text-obs-text">{trace.rootOperation}</span>
        <span className="text-obs-muted">·</span>
        <span className="text-obs-muted">
          duration <strong className="text-obs-text">{trace.totalDurationMs}ms</strong>
        </span>
        {svcMeta && (
          <>
            <span className="text-obs-muted">·</span>
            <span className="capitalize text-obs-muted">
              roll-up: <span className="text-obs-text">{svcMeta.status}</span>
            </span>
          </>
        )}
      </div>

      {/* Flame graph */}
      <section className="rounded-xl border border-obs-border bg-[#0b0f14] p-4 shadow-inner">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-200">Trace · flame graph</h2>
          <span className="text-[10px] text-slate-500">Icicle timeline (mock) · hover bars</span>
        </div>
        <div className="mb-2 flex justify-between border-b border-white/10 pb-1 font-mono text-[10px] text-slate-500">
          <span>0ms</span>
          <span>{Math.round(trace.totalDurationMs / 2)}ms</span>
          <span>{trace.totalDurationMs}ms</span>
        </div>
        <div className="space-y-1">
          {Array.from({ length: flameRows }).map((_, rowIdx) => (
            <div key={rowIdx} className="relative h-9 rounded bg-black/25">
              {trace.flameBars
                .filter((b) => b.row === rowIdx)
                .map((bar) => (
                  <div
                    key={bar.id}
                    className="absolute top-0.5 bottom-0.5 cursor-default overflow-hidden rounded-sm px-1.5 text-[10px] font-medium leading-8 text-white/95 ring-1 ring-black/30"
                    style={{
                      left: `${bar.startPct}%`,
                      width: `${bar.widthPct}%`,
                      ...flameBarStyle(bar),
                    }}
                    title={`${bar.label} · ${bar.widthPct.toFixed(1)}% of trace`}
                  >
                    <span className="block truncate">{bar.label}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-obs-border bg-obs-surface p-1">
        {TAB_LABELS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-obs-teal/20 text-obs-teal' : 'text-obs-muted hover:bg-obs-elevated hover:text-obs-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[280px] rounded-xl border border-obs-border bg-obs-surface p-5">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-obs-text">Service overview</h3>
              <p className="mt-2 text-sm leading-relaxed text-obs-muted">{trace.serviceOverview}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-obs-text">Multi-tool correlation (30d intensity)</h3>
              <p className="mb-3 text-xs text-obs-muted">
                Same normalized overlay used previously on Command Center — infra vs application vs network feeds aligned in
                time.
              </p>
              <div className="grid gap-3 lg:grid-cols-3">
                {monitoringTools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`rounded-lg border border-obs-border bg-obs-bg/80 px-3 py-2 ${layerBorderClass(tool.layer)}`}
                  >
                    <div className="text-xs font-semibold text-obs-text">{tool.vendorName}</div>
                    <div className="mt-0.5 text-[11px] capitalize text-obs-muted">{tool.layer.replace('-', ' ')} layer</div>
                    <div className="mt-1 text-[11px] leading-snug text-obs-muted">{tool.focus}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-56 rounded-lg border border-obs-border bg-obs-bg/40 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={correlatedLayerSeries} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                    <XAxis dataKey="day" tick={CHART_TICK} tickLine={CHART_TICK_LINE} axisLine={CHART_AXIS_LINE} interval={6} />
                    <YAxis domain={[0, 100]} tick={CHART_TICK} tickLine={CHART_TICK_LINE} axisLine={CHART_AXIS_LINE} />
                    <Tooltip {...chartTooltipProps} />
                    <Legend {...chartLegendProps} />
                    <Line type="monotone" dataKey="infrastructure" name="Datadog · infra" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="application" name="Splunk · application" stroke="#a78bfa" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="network" name="Kentik · network" stroke="#fbbf24" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {layers.map((layer) => {
                  const tool = monitoringTools.find((x) => x.layer === layer)!
                  const samples = layerSignalSamples.filter((s) => s.layer === layer).slice(0, 6)
                  return (
                    <div key={layer} className={`rounded-xl border border-obs-border bg-obs-bg/60 ${layerBorderClass(layer)}`}>
                      <div className="border-b border-obs-border px-3 py-2">
                        <div className="text-xs font-medium text-obs-text">{tool.vendorName}</div>
                        <div className="text-[10px] text-obs-muted">Recent samples · {tool.focus}</div>
                      </div>
                      <ul className="max-h-44 space-y-1 overflow-y-auto px-2 py-2 font-mono text-[10px] leading-snug text-obs-muted">
                        {samples.map((s) => (
                          <li key={s.id} className="border-b border-obs-border/40 pb-1.5 last:border-0">
                            <span className="text-obs-muted/80">{s.ts}</span>{' '}
                            <span
                              className={
                                s.severity === 'error'
                                  ? 'text-obs-red'
                                  : s.severity === 'warn'
                                    ? 'text-obs-amber'
                                    : 'text-sky-300/90'
                              }
                            >
                              [{s.severity}]
                            </span>{' '}
                            <span className="text-obs-text/90">{s.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'span' && (
          <div>
            <h3 className="text-sm font-medium text-obs-text">Span · overview</h3>
            <p className="mt-1 text-xs text-obs-muted">Hot span aligned with flame selection (mock).</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-obs-border bg-obs-bg px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-obs-muted">Span name</dt>
                <dd className="mt-1 font-mono text-sm text-obs-text">{trace.spanOverview.name}</dd>
              </div>
              <div className="rounded-lg border border-obs-border bg-obs-bg px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-obs-muted">Span ID</dt>
                <dd className="mt-1 font-mono text-xs text-obs-teal">{trace.spanOverview.spanId}</dd>
              </div>
              <div className="rounded-lg border border-obs-border bg-obs-bg px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-obs-muted">Resource</dt>
                <dd className="mt-1 font-mono text-xs text-obs-text">{trace.spanOverview.resource}</dd>
              </div>
              <div className="rounded-lg border border-obs-border bg-obs-bg px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-obs-muted">Duration</dt>
                <dd className="mt-1 font-mono text-sm text-obs-text">{trace.spanOverview.durationMs}ms</dd>
              </div>
              <div className="rounded-lg border border-obs-border bg-obs-bg px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-obs-muted">HTTP</dt>
                <dd className="mt-1 text-sm text-obs-text">
                  {trace.spanOverview.httpMethod} {trace.spanOverview.httpRoute}
                </dd>
              </div>
              <div className="rounded-lg border border-obs-border bg-obs-bg px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-obs-muted">Status</dt>
                <dd className="mt-1 font-mono text-sm text-obs-text">{trace.spanOverview.statusCode}</dd>
              </div>
              <div className="rounded-lg border border-obs-border bg-obs-bg px-3 py-2 sm:col-span-2">
                <dt className="text-[10px] uppercase tracking-wide text-obs-muted">Parent span</dt>
                <dd className="mt-1 font-mono text-xs text-obs-muted">{trace.spanOverview.parentSpanId ?? '—'}</dd>
              </div>
            </dl>
          </div>
        )}

        {tab === 'errors' && (
          <div>
            <h3 className="text-sm font-medium text-obs-text">Errors</h3>
            {trace.errors.length === 0 ?
              <p className="mt-3 text-sm text-obs-muted">No error rows for this trace in the mock dataset.</p>
            : <ul className="mt-4 space-y-3">
                {trace.errors.map((e, i) => (
                  <li key={i} className="rounded-lg border border-obs-red/30 bg-obs-red/5 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-obs-muted">{e.time}</span>
                      <span className="rounded bg-obs-bg px-1.5 py-0.5 font-mono text-[10px] text-obs-teal">{e.spanId}</span>
                    </div>
                    <p className="mt-1 text-sm text-obs-text">{e.message}</p>
                    {e.stackHint && (
                      <p className="mt-1 font-mono text-[11px] text-obs-muted">{e.stackHint}</p>
                    )}
                  </li>
                ))}
              </ul>
            }
          </div>
        )}

        {tab === 'infra' && (
          <FacetTable title="Infra (Datadog)" rows={trace.infra} />
        )}
        {tab === 'metrics' && (
          <FacetTable title="Metrics (APM &amp; SLO signals)" rows={trace.metrics} />
        )}
        {tab === 'logs' && (
          <div>
            <h3 className="text-sm font-medium text-obs-text">Logs (Splunk)</h3>
            <ul className="mt-4 space-y-2 font-mono text-[11px]">
              {trace.logs.map((log, i) => (
                <li key={i} className="rounded-lg border border-obs-border bg-obs-bg px-3 py-2">
                  <span className="text-obs-muted">{log.ts}</span>{' '}
                  <span className={log.severity === 'error' ? 'text-obs-red' : log.severity === 'warn' ? 'text-obs-amber' : 'text-sky-300'}>
                    [{log.severity}]
                  </span>{' '}
                  <span className="text-obs-teal">{log.source}</span>{' '}
                  <span className="text-obs-muted">{log.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {tab === 'network' && (
          <FacetTable title="Network (Kentik)" rows={trace.network} />
        )}
      </div>
    </div>
  )
}

function FacetTable({ title, rows }: { title: string; rows: { label: string; value: string; sourceTool: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-obs-text">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-obs-border text-xs text-obs-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">Facet</th>
              <th className="py-2 pr-3 font-medium">Value</th>
              <th className="py-2 font-medium">Tool</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-obs-border/50 last:border-0">
                <td className="py-2 pr-3 text-obs-text">{r.label}</td>
                <td className="py-2 pr-3 font-mono text-xs text-obs-muted">{r.value}</td>
                <td className="py-2 text-xs text-obs-teal">{r.sourceTool}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
