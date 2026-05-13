import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Clock, Layers, Users } from 'lucide-react'
import { useMockData } from '../context/MockDataContext'
import type { IncidentDetail } from '../types'

function sevTone(s: string) {
  if (s === 'SEV1') return { bar: 'bg-obs-red', chip: 'border-obs-red/40 bg-obs-red/10 text-obs-red' }
  if (s === 'SEV2') return { bar: 'bg-obs-amber', chip: 'border-obs-amber/40 bg-obs-amber/10 text-obs-amber' }
  return { bar: 'bg-obs-blue', chip: 'border-obs-blue/40 bg-obs-blue/10 text-obs-blue' }
}

function statusTone(s: IncidentDetail['status']) {
  if (s === 'Investigating') return 'bg-obs-red/15 text-obs-red'
  if (s === 'Mitigated') return 'bg-obs-amber/15 text-obs-amber'
  return 'bg-obs-green/15 text-obs-green'
}

export function IncidentsList() {
  const { data } = useMockData()
  const { activeIncidents, incidentDetails, correlationAnchorsByIncident, scenario } = data

  const sevCounts = activeIncidents.reduce<Record<string, number>>((acc, i) => {
    acc[i.severity] = (acc[i.severity] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-obs-text">Incidents</h1>
        <p className="mt-1 text-sm text-obs-muted">
          All non-closed incidents in the mock window. Click any card to load its own correlation anchors, auto-triage,
          and correlated timeline.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-obs-border bg-obs-surface p-4">
          <div className="text-[11px] uppercase tracking-wide text-obs-muted">Open</div>
          <div className="mt-1 text-2xl font-semibold text-obs-text">{activeIncidents.length}</div>
          <div className="mt-1 text-[11px] text-obs-muted">
            {scenario === 'allHealthy' ? 'Healthy simulation active' : 'Investigating + Mitigated'}
          </div>
        </div>
        <div className="rounded-xl border border-obs-red/30 bg-obs-red/5 p-4">
          <div className="text-[11px] uppercase tracking-wide text-obs-red">SEV1</div>
          <div className="mt-1 text-2xl font-semibold text-obs-text">{sevCounts.SEV1 ?? 0}</div>
          <div className="mt-1 text-[11px] text-obs-muted">Customer-impacting</div>
        </div>
        <div className="rounded-xl border border-obs-amber/30 bg-obs-amber/5 p-4">
          <div className="text-[11px] uppercase tracking-wide text-obs-amber">SEV2</div>
          <div className="mt-1 text-2xl font-semibold text-obs-text">{sevCounts.SEV2 ?? 0}</div>
          <div className="mt-1 text-[11px] text-obs-muted">Degraded path</div>
        </div>
        <div className="rounded-xl border border-obs-blue/30 bg-obs-blue/5 p-4">
          <div className="text-[11px] uppercase tracking-wide text-obs-blue">SEV3</div>
          <div className="mt-1 text-2xl font-semibold text-obs-text">{sevCounts.SEV3 ?? 0}</div>
          <div className="mt-1 text-[11px] text-obs-muted">Minor / advisory</div>
        </div>
      </section>

      {activeIncidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-obs-border bg-obs-surface p-10 text-center text-sm text-obs-muted">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-obs-green" />
          No active incidents — healthy simulation or a quiet period (mock).
        </div>
      ) : (
        <section className="grid gap-3 lg:grid-cols-2">
          {activeIncidents.map((row) => {
            const detail = incidentDetails[row.id]
            const anchors = correlationAnchorsByIncident[row.id]
            const tone = sevTone(row.severity)
            return (
              <Link
                key={row.id}
                to={`/incidents/${row.id}`}
                className="group flex overflow-hidden rounded-xl border border-obs-border bg-obs-surface transition-colors hover:border-obs-teal/40 hover:bg-obs-elevated/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obs-teal/50"
              >
                <span className={`w-1 shrink-0 ${tone.bar}`} aria-hidden />
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-obs-muted">
                        <span className="font-mono text-obs-teal">{row.id}</span>
                        <span className={`rounded border px-1.5 py-0.5 font-medium ${tone.chip}`}>
                          {row.severity}
                        </span>
                        {detail && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(
                              detail.status,
                            )}`}
                          >
                            {detail.status}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-sm font-medium text-obs-text">{row.title}</div>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 text-obs-muted transition-colors group-hover:text-obs-teal" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-obs-muted">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {detail?.team ?? row.service}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Open {row.openedMinutesAgo}m
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {detail?.affectedServiceIds.length ?? 0} services in blast
                    </span>
                  </div>

                  <div className="mt-3 rounded-lg bg-obs-bg px-3 py-2 text-xs text-obs-muted">
                    <span className="text-obs-text">Verdict:</span> {row.verdict}
                    {detail && (
                      <>
                        {' '}
                        <span className="text-obs-muted/60">·</span>{' '}
                        <span className="text-obs-text">Domain:</span> {detail.domain}
                      </>
                    )}
                  </div>

                  {anchors && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-obs-muted">
                      <span className="font-mono text-obs-teal">{anchors.primaryCorrelationId}</span>
                      <span className="text-obs-muted/60">·</span>
                      <span>{anchors.timeWindowLabel}</span>
                      <span className="text-obs-muted/60">·</span>
                      <span>{anchors.toolsInvolved.length} tools joined</span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </div>
  )
}
