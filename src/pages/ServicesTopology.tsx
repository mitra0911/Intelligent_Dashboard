import { useMemo, useState } from 'react'
import type { BusinessService, HealthStatus } from '../types'
import { TopologyMap } from '../components/TopologyMap'
import { useMockData } from '../context/MockDataContext'
import {
  effectiveTelemetrySeverity,
  telemetrySeverityLabel,
  telemetryStrokeColor,
} from '../lib/topologyStatus'

function healthBadge(status: HealthStatus) {
  if (status === 'healthy')
    return (
      <span className="rounded-full bg-obs-green/15 px-2 py-0.5 text-[11px] font-medium text-obs-green">
        Healthy
      </span>
    )
  if (status === 'degraded')
    return (
      <span className="rounded-full bg-obs-amber/15 px-2 py-0.5 text-[11px] font-medium text-obs-amber">
        Degraded
      </span>
    )
  return (
    <span className="rounded-full bg-obs-red/15 px-2 py-0.5 text-[11px] font-medium text-obs-red">Critical</span>
  )
}

type SidePanel = { slis: string[]; deps: string[]; incidents: string[]; team: string }

function buildTopologyDetailFor(primaryIncidentId: string): Record<string, SidePanel> {
  return {
    checkout: {
      slis: ['p95 latency under 800ms', 'error rate under 0.5%', 'checkout success over 99%'],
      deps: ['payments-edge', 'cart-svc', 'checkout-redis'],
      incidents: [`${primaryIncidentId} (active)`],
      team: 'Digital Commerce — Payments',
    },
    payments: {
      slis: ['auth latency', 'webhook success'],
      deps: ['stripe-proxy', 'events-kafka'],
      incidents: ['—'],
      team: 'Digital Commerce — Payments',
    },
    stripe: {
      slis: ['upstream 429 rate', 'connect latency'],
      deps: ['external Stripe'],
      incidents: [`Linked to ${primaryIncidentId}`],
      team: 'Platform Integrations',
    },
    cdn: {
      slis: ['cache hit ratio', 'edge TTFB'],
      deps: ['origins'],
      incidents: ['—'],
      team: 'Edge',
    },
    apigw: {
      slis: ['ingress p95', 'auth token validation', 'rate-limit accuracy'],
      deps: ['CDN / WAF', 'downstream app routes'],
      incidents: ['—'],
      team: 'Platform — API',
    },
    bff: {
      slis: ['mobile bundle latency'],
      deps: ['checkout-api'],
      incidents: ['—'],
      team: 'Mobile',
    },
    cart: {
      slis: ['cart merge p95'],
      deps: ['checkout-redis'],
      incidents: ['—'],
      team: 'Digital Commerce',
    },
    redis: {
      slis: ['memory pressure', 'evictions'],
      deps: ['—'],
      incidents: ['—'],
      team: 'Data Platform',
    },
    kafka: {
      slis: ['consumer lag', 'broker health'],
      deps: ['—'],
      incidents: ['—'],
      team: 'Data Platform',
    },
  }
}

export function ServicesTopology() {
  const { data } = useMockData()
  const {
    activeIncidents,
    businessServices,
    topologyEdges,
    topologyNodes,
    primaryIncidentDetail,
    coverageLayers,
    userJourney,
  } = data
  const [selected, setSelected] = useState<string | null>('checkout')
  const [journeyOn, setJourneyOn] = useState(false)
  const [activeJourneyStep, setActiveJourneyStep] = useState<string | null>(null)

  const journeyHighlights = useMemo(() => {
    if (!journeyOn) return undefined
    if (activeJourneyStep) {
      const step = userJourney.find((s) => s.id === activeJourneyStep)
      return step ? new Set([step.nodeId]) : new Set(userJourney.map((s) => s.nodeId))
    }
    return new Set(userJourney.map((s) => s.nodeId))
  }, [journeyOn, userJourney, activeJourneyStep])

  const detailFor = useMemo(
    () => buildTopologyDetailFor(primaryIncidentDetail.id),
    [primaryIncidentDetail.id],
  )
  const panel = selected ? detailFor[selected] : null

  const represented = useMemo(
    () => new Set(topologyNodes.flatMap((n) => n.businessServiceIds)),
    [topologyNodes],
  )

  const selectedNode = useMemo(
    () => topologyNodes.find((n) => n.id === selected),
    [topologyNodes, selected],
  )

  const rollupForSelection = useMemo((): BusinessService[] => {
    if (!selectedNode) return []
    return selectedNode.businessServiceIds
      .map((id) => businessServices.find((s) => s.id === id))
      .filter((s): s is BusinessService => Boolean(s))
  }, [selectedNode, businessServices])

  const mapSeverity = selectedNode
    ? effectiveTelemetrySeverity(selectedNode, businessServices)
    : null

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <h1 className="text-xl font-semibold text-obs-text">Services &amp; topology</h1>
          <p className="mt-1 text-sm text-obs-muted">
            <strong className="font-medium text-obs-text">Mesh-style</strong> graph (not a tree):{' '}
            <strong className="font-medium text-obs-text">checkout-api</strong> sits as the hub; other services are spread in a
            web. Links are <span className="text-green-400">green</span> /{' '}
            <span className="text-yellow-400">yellow</span> / <span className="text-orange-400">orange</span> /{' '}
            <span className="text-red-400">red</span> by the <strong className="font-medium text-obs-text">target</strong> node
            (line “heads” into the bubble), with a slow on/off pulse (teal when blast-highlighted).
            Bubbles match the reference look — filled severity color, lighter ring, white SLO-burn number inside, name +{' '}
            <code className="text-[11px] text-obs-teal">svc-*</code> below.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-obs-border bg-obs-surface px-4 py-3">
          <div>
            <div className="text-sm font-medium text-obs-text">User journey overlay</div>
            <p className="text-[11px] text-obs-muted">
              Highlight the checkout journey across the topology — Browse → Auth → Cart → Pay → Confirm (preview).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !journeyOn
              setJourneyOn(next)
              if (!next) setActiveJourneyStep(null)
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              journeyOn
                ? 'border-obs-teal/50 bg-obs-teal/15 text-obs-teal'
                : 'border-obs-border bg-obs-bg text-obs-muted hover:text-obs-text'
            }`}
          >
            {journeyOn ? 'Journey overlay: ON' : 'Enable journey overlay'}
          </button>
        </div>
        {journeyOn && (
          <div className="rounded-xl border border-obs-border bg-obs-surface p-3">
            <div className="flex flex-wrap items-stretch gap-2">
              {userJourney.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveJourneyStep(activeJourneyStep === step.id ? null : step.id)}
                  className={`min-w-[120px] flex-1 rounded-lg border px-3 py-2 text-left transition-colors ${
                    activeJourneyStep === step.id
                      ? 'border-obs-teal/60 bg-obs-teal/10'
                      : step.status === 'failing'
                        ? 'border-obs-red/40 bg-obs-red/5 hover:bg-obs-red/10'
                        : step.status === 'slow'
                          ? 'border-obs-amber/40 bg-obs-amber/5 hover:bg-obs-amber/10'
                          : 'border-obs-border bg-obs-bg hover:bg-obs-elevated/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-obs-muted">Step {idx + 1}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        step.status === 'failing'
                          ? 'bg-obs-red/20 text-obs-red'
                          : step.status === 'slow'
                            ? 'bg-obs-amber/20 text-obs-amber'
                            : 'bg-obs-green/15 text-obs-green'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-obs-text">{step.label}</div>
                  <div className="mt-1 font-mono text-[11px] text-obs-muted">
                    p95 <span className="text-obs-text">{step.observedP95Ms}ms</span>
                    <span className="mx-1 text-obs-muted/60">/ exp</span>
                    <span>{step.expectedP95Ms}ms</span>
                  </div>
                  <div className="mt-1 text-[11px] text-obs-muted">→ {step.nodeId}</div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-obs-muted">
              Click a step to spotlight only that node on the map. Roadmap: live RUM + synthetic checks per step.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-obs-border bg-obs-surface p-4">
          <TopologyMap
            nodes={topologyNodes}
            edges={topologyEdges}
            selectedId={selected}
            onSelect={setSelected}
            highlightIds={journeyHighlights}
            businessServices={businessServices}
            showTooltips
            className="h-[420px]"
          />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-obs-border pt-3 text-[11px] text-obs-muted">
            <span className="font-medium text-obs-text">Bubble fill (severity)</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full ring-1 ring-green-300/40" style={{ backgroundColor: '#166534' }} />{' '}
              OK
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full ring-1 ring-yellow-200/50" style={{ backgroundColor: '#a16207' }} />{' '}
              Warning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full ring-1 ring-orange-200/50" style={{ backgroundColor: '#c2410c' }} />{' '}
              Error
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full ring-1 ring-red-200/50" style={{ backgroundColor: '#991b1b' }} />{' '}
              Critical
            </span>
            <span className="text-obs-muted/80">Lines: color = target node (green → yellow → orange → red), slow on/off</span>
            <span className="text-obs-muted/80">Read-back redis ↔ checkout uses same rules</span>
          </div>
        </div>

        <div className="rounded-xl border border-obs-border bg-obs-surface p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium text-obs-text">Coverage &amp; scope</h2>
              <p className="text-[11px] text-obs-muted">
                What's actually wired today vs. planned. Network/firewall and user journeys are next.
              </p>
            </div>
            <div className="flex gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-obs-green" /> Live
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-obs-amber" /> Planned
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-obs-blue" /> Optional
              </span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coverageLayers.map((layer) => (
              <div
                key={layer.id}
                className={`rounded-lg border p-3 ${
                  layer.status === 'live'
                    ? 'border-obs-green/30 bg-obs-green/5'
                    : layer.status === 'planned'
                      ? 'border-obs-amber/30 bg-obs-amber/5'
                      : 'border-obs-blue/30 bg-obs-blue/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-obs-text">{layer.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      layer.status === 'live'
                        ? 'bg-obs-green/15 text-obs-green'
                        : layer.status === 'planned'
                          ? 'bg-obs-amber/15 text-obs-amber'
                          : 'bg-obs-blue/15 text-obs-blue'
                    }`}
                  >
                    {layer.status}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-obs-muted">{layer.sources.join(' · ')}</div>
                <p className="mt-2 text-xs text-obs-muted">{layer.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="w-full shrink-0 rounded-xl border border-obs-border bg-obs-surface p-5 lg:w-96">
        {panel ? (
          <>
            <div className="text-xs text-obs-muted">Selected component</div>
            <div className="mt-1 text-lg font-semibold text-obs-text">
              {topologyNodes.find((n) => n.id === selected)?.label}
            </div>
            {mapSeverity && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-obs-muted">Worst on map</span>
                <span
                  className="rounded-full px-2 py-0.5 font-semibold text-[11px] text-slate-950"
                  style={{
                    backgroundColor: telemetryStrokeColor(mapSeverity),
                  }}
                >
                  {telemetrySeverityLabel(mapSeverity)}
                </span>
                {selectedNode?.telemetryHint && (
                  <span className="text-obs-muted">{selectedNode.telemetryHint}</span>
                )}
              </div>
            )}

            {rollupForSelection.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wide text-obs-muted">
                  Rolls up to (Command Center)
                </div>
                <ul className="mt-2 space-y-2">
                  {rollupForSelection.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-obs-text">{s.name}</span>
                      {healthBadge(s.status)}
                      <span className="font-mono text-xs text-obs-muted">SLO burn {s.sloBurnPct}x</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 text-xs font-medium uppercase tracking-wide text-obs-muted">SLIs</div>
            <ul className="mt-2 list-inside list-disc text-sm text-obs-muted">
              {panel.slis.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="mt-4 text-xs font-medium uppercase tracking-wide text-obs-muted">
              Dependencies
            </div>
            <ul className="mt-2 text-sm text-obs-text">
              {panel.deps.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <div className="mt-4 text-xs font-medium uppercase tracking-wide text-obs-muted">
              Recent incidents
            </div>
            <ul className="mt-2 text-sm text-obs-muted">
              {panel.incidents.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <div className="mt-4 text-xs font-medium uppercase tracking-wide text-obs-muted">Owning team</div>
            <div className="mt-2 text-sm text-obs-teal">{panel.team}</div>
          </>
        ) : (
          <p className="text-sm text-obs-muted">Select a node on the graph.</p>
        )}

        <div className="mt-6 border-t border-obs-border pt-4">
          <div className="text-xs font-medium text-obs-text">All business services</div>
          <p className="mt-1 text-[11px] text-obs-muted">
            Same list as Command Center. Grey note: not all have nodes on this topology slice.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {businessServices.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-obs-text">{s.name}</span>
                <span className="flex items-center gap-2">
                  {healthBadge(s.status)}
                  {!represented.has(s.id) && (
                    <span className="text-[10px] uppercase tracking-wide text-obs-muted">off-graph</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-obs-muted">
            Active incidents: {activeIncidents.map((i) => i.id).join(', ')}
          </div>
        </div>
      </aside>
    </div>
  )
}
