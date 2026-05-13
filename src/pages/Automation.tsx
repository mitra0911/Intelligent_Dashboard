import { useMemo, useState } from 'react'
import { useMockData } from '../context/MockDataContext'

export function Automation() {
  const { data } = useMockData()
  const { automationAgents, automationRuns } = data
  const [mode, setMode] = useState<'human-in-the-loop' | 'auto'>('human-in-the-loop')

  const agentsForMode = useMemo(
    () => automationAgents.filter((a) => a.modes.includes(mode)),
    [mode, automationAgents],
  )

  const runsForMode = useMemo(() => automationRuns.filter((r) => r.mode === mode), [mode, automationRuns])

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-obs-text">Automation</h1>
          <p className="mt-1 text-sm text-obs-muted">
            Mock agents and runs differ by governance: approval gates vs. immediate bounded actions.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-obs-border bg-obs-surface px-4 py-3">
          <span className="text-xs font-medium text-obs-muted">Execution mode</span>
          <div className="flex rounded-lg bg-obs-bg p-1">
            <button
              type="button"
              onClick={() => setMode('human-in-the-loop')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'human-in-the-loop'
                  ? 'bg-obs-teal/20 text-obs-teal'
                  : 'text-obs-muted hover:text-obs-text'
              }`}
            >
              Human-in-the-loop
            </button>
            <button
              type="button"
              onClick={() => setMode('auto')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'auto'
                  ? 'bg-obs-blue/20 text-obs-blue'
                  : 'text-obs-muted hover:text-obs-text'
              }`}
            >
              Auto
            </button>
          </div>
        </div>
      </div>

      <div
        className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
          mode === 'human-in-the-loop'
            ? 'border-obs-teal/35 bg-obs-teal/10 text-obs-muted'
            : 'border-obs-blue/35 bg-obs-blue/10 text-obs-muted'
        }`}
      >
        {mode === 'human-in-the-loop' ? (
          <>
            <strong className="text-obs-teal">Human-in-the-loop</strong>
            <span className="text-obs-text"> — </span>
            Runs create approvals, CAB tickets, or dual-control gates before execution. Outcomes often include
            “awaiting approver”, “denied pending docs”, or explicit operator ack.
          </>
        ) : (
          <>
            <strong className="text-obs-blue">Auto</strong>
            <span className="text-obs-text"> — </span>
            Runs execute within tight guardrails (blast caps, cooldowns, safelists). Outcomes emphasize latency to
            action (seconds/minutes) and automated rollback hooks — no approval queue.
          </>
        )}
      </div>

      <section className="rounded-xl border border-obs-border bg-obs-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obs-border px-5 py-3">
          <span className="text-sm font-medium text-obs-text">Agents</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              mode === 'human-in-the-loop'
                ? 'bg-obs-teal/15 text-obs-teal'
                : 'bg-obs-blue/15 text-obs-blue'
            }`}
          >
            Showing {agentsForMode.length} for {mode === 'auto' ? 'Auto' : 'Human-in-the-loop'}
          </span>
        </div>
        <ul className="divide-y divide-obs-border">
          {agentsForMode.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-obs-text">{a.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      mode === 'auto'
                        ? 'bg-obs-blue/15 text-obs-blue'
                        : 'bg-obs-teal/15 text-obs-teal'
                    }`}
                  >
                    {mode === 'auto' ? 'Auto policy' : 'HITL policy'}
                  </span>
                  {a.roadmap && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        a.roadmap === 'live'
                          ? 'bg-obs-green/15 text-obs-green'
                          : a.roadmap === 'beta'
                            ? 'bg-obs-amber/15 text-obs-amber'
                            : 'bg-obs-muted/15 text-obs-muted'
                      }`}
                    >
                      {a.roadmap}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-obs-muted">{a.description}</div>
                {a.governance && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    {a.governance.cabRequired && (
                      <span className="rounded-full bg-obs-amber/15 px-2 py-0.5 text-obs-amber">
                        CAB required
                      </span>
                    )}
                    {a.governance.dualControl && (
                      <span className="rounded-full bg-obs-red/15 px-2 py-0.5 text-obs-red">
                        Dual control
                      </span>
                    )}
                    <span className="rounded-full bg-obs-bg px-2 py-0.5 text-obs-muted">
                      Approver: <span className="text-obs-text">{a.governance.approverGroup}</span>
                    </span>
                    {a.governance.blastCap && (
                      <span className="rounded-full bg-obs-bg px-2 py-0.5 text-obs-muted">
                        Blast cap: <span className="text-obs-text">{a.governance.blastCap}</span>
                      </span>
                    )}
                    {a.governance.cooldown && a.governance.cooldown !== '—' && (
                      <span className="rounded-full bg-obs-bg px-2 py-0.5 text-obs-muted">
                        Cooldown: <span className="text-obs-text">{a.governance.cooldown}</span>
                      </span>
                    )}
                    {a.playbookRef && (
                      <span className="rounded-full bg-obs-bg px-2 py-0.5 font-mono text-obs-teal">
                        {a.playbookRef}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-1">
                <input type="checkbox" defaultChecked className="rounded border-obs-border" />
                <span className="text-xs text-obs-muted">Enabled</span>
              </label>
              <div className="text-right text-xs text-obs-muted">
                <div>Last: {a.lastRun ?? '—'}</div>
                <div className="mt-1 capitalize text-obs-teal">{a.outcome?.replace(/_/g, ' ')}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-obs-teal/30 bg-obs-teal/5 p-5">
        <h2 className="text-sm font-medium text-obs-text">Agentic AI — roadmap</h2>
        <p className="mt-1 text-xs text-obs-muted">
          Suggested fixes today, supervised remediation next, fully agentic last — every step gated by approval policy.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-obs-green/30 bg-obs-green/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-obs-text">Suggest</span>
              <span className="rounded-full bg-obs-green/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-obs-green">
                Live (mock)
              </span>
            </div>
            <p className="mt-1 text-xs text-obs-muted">
              LLM reads correlated timeline + topology + RCA history → proposes top-3 fixes ranked by likelihood and
              blast-cap.
            </p>
          </div>
          <div className="rounded-lg border border-obs-amber/30 bg-obs-amber/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-obs-text">Execute (supervised)</span>
              <span className="rounded-full bg-obs-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-obs-amber">
                Beta
              </span>
            </div>
            <p className="mt-1 text-xs text-obs-muted">
              Operator clicks "approve" → agent runs the playbook with dual-control + CAB. Rollback hook armed.
            </p>
          </div>
          <div className="rounded-lg border border-obs-blue/30 bg-obs-blue/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-obs-text">Full agentic</span>
              <span className="rounded-full bg-obs-blue/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-obs-blue">
                Planned
              </span>
            </div>
            <p className="mt-1 text-xs text-obs-muted">
              Agent triages, decides, executes within tight guardrails for known-safe classes (e.g. scale, recycle).
              Critical paths stay human-gated.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
        <h2 className="text-sm font-medium text-obs-text">Run history</h2>
        <p className="mt-1 text-xs text-obs-muted">
          Filtered to <strong className="text-obs-text">{mode}</strong> only ({runsForMode.length} runs).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-obs-border text-xs text-obs-muted">
              <tr>
                <th className="pb-2 font-medium">Run</th>
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 font-medium">Mode</th>
                <th className="pb-2 font-medium">Governance</th>
                <th className="pb-2 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {runsForMode.map((r) => (
                <tr key={r.id} className="border-b border-obs-border/60 align-top">
                  <td className="py-2 text-obs-muted">{r.time}</td>
                  <td className="py-2 text-obs-text">{r.agent}</td>
                  <td className="py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                        r.mode === 'auto'
                          ? 'bg-obs-blue/15 text-obs-blue'
                          : 'bg-obs-teal/15 text-obs-teal'
                      }`}
                    >
                      {r.mode === 'auto' ? 'Auto' : 'Human-in-the-loop'}
                    </span>
                  </td>
                  <td className="py-2 text-[11px] text-obs-muted">
                    {r.cabTicket ? (
                      <div>
                        <span className="font-mono text-obs-teal">{r.cabTicket}</span>
                        <div className="mt-0.5">
                          {r.approverChain?.map((a, i) => (
                            <span key={a} className="text-obs-text">
                              {a}
                              {i < (r.approverChain?.length ?? 0) - 1 && (
                                <span className="mx-1 text-obs-muted/60">→</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-obs-muted/70">guardrails only</span>
                    )}
                  </td>
                  <td className="py-2 text-obs-muted">{r.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
