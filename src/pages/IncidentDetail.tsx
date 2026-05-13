import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { Anchor, ArrowLeft, Clock, Users } from 'lucide-react'
import { RCAAssistant } from '../components/RCAAssistant'
import { TopologyMap } from '../components/TopologyMap'
import { useMockData } from '../context/MockDataContext'
import { incidentContextForPrompt } from '../data/mockData'

const kindIcon: Record<string, string> = {
  deploy: 'Deploy',
  metric: 'Metric',
  log: 'Logs',
  trace: 'Trace',
  ticket: 'Ticket',
}

/**
 * Map a business-service id (e.g. `svc-0`) to topology node ids so the
 * blast-radius mini map highlights the right nodes for any incident.
 */
const SVC_TO_NODES: Record<string, string[]> = {
  'svc-0': ['checkout', 'payments', 'stripe'],
  'svc-1': ['cart', 'redis', 'checkout'],
  'svc-2': ['payments', 'stripe'],
  'svc-3': ['cdn', 'apigw'],
  'svc-4': ['kafka', 'redis'],
  'svc-5': ['apigw', 'bff'],
  'svc-6': ['bff', 'cart'],
  'svc-7': ['checkout', 'payments'],
}

function sevColor(s: string) {
  if (s === 'SEV1') return 'border-obs-red/40 bg-obs-red/10 text-obs-red'
  if (s === 'SEV2') return 'border-obs-amber/40 bg-obs-amber/10 text-obs-amber'
  return 'border-obs-blue/40 bg-obs-blue/10 text-obs-blue'
}

export function IncidentDetail() {
  const { id } = useParams()
  const { data } = useMockData()
  const {
    primaryIncidentDetail,
    incidentDetails,
    correlationAnchorsByIncident,
    businessServices,
    topologyEdges,
    topologyNodes,
    recentDeploys,
  } = data

  const incident = (id && incidentDetails[id]) || primaryIncidentDetail
  const anchors =
    (id && correlationAnchorsByIncident[id]) || correlationAnchorsByIncident[primaryIncidentDetail.id]!
  const idMismatch = Boolean(id && !incidentDetails[id])
  const ctx = incidentContextForPrompt(incident, recentDeploys, businessServices)

  const blast = useMemo(() => {
    const set = new Set<string>()
    incident.affectedServiceIds.forEach((svcId) => {
      const nodes = SVC_TO_NODES[svcId] ?? []
      nodes.forEach((n) => set.add(n))
    })
    if (set.size === 0) {
      set.add('checkout')
      set.add('payments')
    }
    return set
  }, [incident.affectedServiceIds])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-obs-teal hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Command Center
        </Link>
        <span className="text-obs-muted/60">/</span>
        <Link to="/incidents" className="text-obs-teal hover:underline">
          All incidents
        </Link>
        <span className="text-obs-muted/60">/</span>
        <span className="font-mono text-obs-muted">{incident.id}</span>
      </div>

      {idMismatch && (
        <div className="rounded-lg border border-obs-amber/40 bg-obs-amber/10 px-4 py-2 text-sm text-obs-amber">
          Incident <strong className="text-obs-text">{id}</strong> isn't in the current mock set — showing{' '}
          <strong className="text-obs-text">{incident.id}</strong> instead. Click an incident from the list to load
          its own anchors and timeline.
        </div>
      )}

      <header className="rounded-xl border border-obs-border bg-obs-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-obs-muted">{incident.id}</div>
            <h1 className="mt-1 text-xl font-semibold text-obs-text">{incident.title}</h1>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-obs-muted">
              <span className={`rounded border px-2 py-0.5 ${sevColor(incident.severity)}`}>
                {incident.severity}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {incident.team}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Open {incident.durationMin}m · {incident.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
            <div className="flex items-start gap-2">
              <Anchor className="mt-0.5 h-4 w-4 text-obs-teal" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium text-obs-text">Correlation anchors</h2>
                <p className="text-xs text-obs-muted">
                  Shared keys used to stitch every signal below into one timeline (per-incident).
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-obs-border bg-obs-bg p-2">
                    <div className="text-[11px] uppercase tracking-wide text-obs-muted">Time window</div>
                    <div className="font-mono text-sm text-obs-text">{anchors.timeWindowLabel}</div>
                  </div>
                  <div className="rounded-lg border border-obs-border bg-obs-bg p-2">
                    <div className="text-[11px] uppercase tracking-wide text-obs-muted">Correlation ID</div>
                    <div className="font-mono text-sm text-obs-teal">{anchors.primaryCorrelationId}</div>
                  </div>
                  <div className="rounded-lg border border-obs-border bg-obs-bg p-2">
                    <div className="text-[11px] uppercase tracking-wide text-obs-muted">Tools joined</div>
                    <div className="text-sm text-obs-text">{anchors.toolsInvolved.length}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  {anchors.toolCorrelationIds.map((t) => (
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
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
            <h2 className="text-sm font-medium text-obs-text">Auto-triage</h2>
            <p className="mt-2 text-sm text-obs-muted">{incident.rationale}</p>
            <div className="mt-3 inline-flex rounded-lg bg-obs-bg px-3 py-2 text-xs text-obs-teal">
              Probable domain: <span className="ml-1 font-medium text-obs-text">{incident.domain}</span>
            </div>
          </section>

          <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
            <h2 className="text-sm font-medium text-obs-text">Correlated timeline</h2>
            <p className="mt-1 text-xs text-obs-muted">
              Deploys, metrics, logs, traces, and <strong className="font-medium text-obs-text">Kentik</strong> network
              flow / TLS signals merged with source badges (mock).
            </p>
            <ol className="relative mt-6 border-l border-obs-border pl-6">
              {incident.signals.map((sig) => (
                <li key={sig.id} className="mb-8 last:mb-0">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-obs-teal bg-obs-bg" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-obs-bg px-1.5 py-0.5 font-mono text-[11px] text-obs-muted">
                      T{sig.tsOffsetMin >= 0 ? '+' : ''}
                      {sig.tsOffsetMin}m
                    </span>
                    <span className="rounded border border-obs-border px-1.5 py-0.5 text-[11px] text-obs-muted">
                      {kindIcon[sig.kind]}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        sig.source === 'Kentik'
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'bg-obs-teal/10 text-obs-teal'
                      }`}
                    >
                      {sig.source}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-obs-text">{sig.title}</div>
                  <div className="mt-1 text-sm text-obs-muted">{sig.detail}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-obs-border bg-obs-surface p-4">
            <h2 className="text-sm font-medium text-obs-text">Service topology (blast radius)</h2>
            <div className="mt-3 rounded-lg bg-obs-bg p-2">
              <TopologyMap
                nodes={topologyNodes}
                edges={topologyEdges}
                highlightIds={blast}
                businessServices={businessServices}
              />
            </div>
            <p className="mt-2 text-xs text-obs-muted">
              Highlighted nodes derived from this incident's affected services:{' '}
              <span className="font-mono text-obs-teal">
                {incident.affectedServiceIds.join(', ') || '—'}
              </span>
            </p>
          </section>

          <RCAAssistant
            incidentContext={ctx}
            seed={{ incident, services: businessServices }}
            className="min-h-[320px]"
          />
        </div>
      </div>
    </div>
  )
}
