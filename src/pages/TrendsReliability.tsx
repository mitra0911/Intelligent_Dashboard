import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART_AXIS_LINE,
  CHART_GRID_STROKE,
  CHART_TICK,
  CHART_TICK_LINE,
  chartLegendProps,
  chartTooltipProps,
} from '../lib/chartTheme'
import { useMockData } from '../context/MockDataContext'

function ExecutiveTrendArrow({ trend }: { trend: string }) {
  const thick = 3.5
  const size = 'h-7 w-7 shrink-0'
  if (trend === '↓') {
    return (
      <ArrowDown className={`${size} text-obs-red`} strokeWidth={thick} aria-label="Trending down" />
    )
  }
  if (trend === '↑') {
    return (
      <ArrowUp className={`${size} text-obs-green`} strokeWidth={thick} aria-label="Trending up" />
    )
  }
  return (
    <ArrowRight className={`${size} text-obs-muted`} strokeWidth={3} aria-label="Flat trend" />
  )
}

export function TrendsReliability() {
  const { data } = useMockData()
  const { mttrTrend, alertIncidentRatio, repeatOffenders, sloRiskForecast, executiveScorecard } = data

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-obs-text">Trends &amp; reliability</h1>
        <p className="mt-1 text-sm text-obs-muted">MTTR, noise ratio, repeat offenders, and executive rollup (mock).</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-obs-border bg-obs-surface p-4">
          <h2 className="text-sm font-medium text-obs-text">MTTR trend (90 days)</h2>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mttrTrend} margin={{ top: 8, right: 8, left: 4, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis
                  dataKey="day"
                  interval={13}
                  angle={-35}
                  textAnchor="end"
                  height={52}
                  tick={{ fill: '#ffffff', fontSize: 9 }}
                  tickLine={CHART_TICK_LINE}
                  axisLine={CHART_AXIS_LINE}
                />
                <YAxis tick={CHART_TICK} tickLine={CHART_TICK_LINE} axisLine={CHART_AXIS_LINE} />
                <Tooltip {...chartTooltipProps} />
                <Legend {...chartLegendProps} />
                <Line type="monotone" dataKey="mttr" name="MTTR (min)" stroke="#2dd4bf" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-obs-border bg-obs-surface p-4">
          <h2 className="text-sm font-medium text-obs-text">Alert → incident ratio (12 weeks)</h2>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertIncidentRatio} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis
                  dataKey="week"
                  tick={CHART_TICK}
                  tickLine={CHART_TICK_LINE}
                  axisLine={CHART_AXIS_LINE}
                />
                <YAxis tick={CHART_TICK} tickLine={CHART_TICK_LINE} axisLine={CHART_AXIS_LINE} />
                <Tooltip {...chartTooltipProps} />
                <Legend {...chartLegendProps} />
                <Bar dataKey="ratio" name="Alerts per incident" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-obs-border bg-obs-surface p-5">
          <h2 className="text-sm font-medium text-obs-text">Repeat-offender leaderboard</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-obs-border text-xs text-obs-muted">
                <tr>
                  <th className="pb-2 font-medium">Service</th>
                  <th className="pb-2 font-medium">Incidents (30d)</th>
                  <th className="pb-2 font-medium">Alert volume</th>
                </tr>
              </thead>
              <tbody>
                {repeatOffenders.map((r) => (
                  <tr key={r.service} className="border-b border-obs-border/60">
                    <td className="py-2 text-obs-text">{r.service}</td>
                    <td className="py-2 font-mono text-obs-teal">{r.incidents}</td>
                    <td className="py-2 font-mono text-obs-muted">{r.alerts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
          <h2 className="text-sm font-medium text-obs-text">Predictive (linear extrapolation)</h2>
          <p className="mt-2 text-xs text-obs-muted">
            {sloRiskForecast.length} services forecast to breach SLO in the next 7 days (demo logic).
          </p>
          <ul className="mt-4 space-y-3">
            {sloRiskForecast.map((s) => (
              <li key={s.service} className="rounded-lg bg-obs-bg px-3 py-2 text-sm">
                <div className="font-medium text-obs-text">{s.service}</div>
                <div className="text-xs text-obs-muted">{s.reason}</div>
                <div className="mt-1 text-xs text-obs-amber">Est. breach in ~{s.daysToBreach} days</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-obs-border bg-obs-surface p-5">
        <h2 className="text-sm font-medium text-obs-text">Executive scorecard</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {executiveScorecard.map((row) => (
            <div
              key={row.name}
              className="min-w-[140px] flex-1 rounded-lg border border-obs-border bg-obs-bg px-4 py-3"
            >
              <div className="text-xs text-obs-muted">{row.name}</div>
              <div className="mt-1 text-lg font-semibold text-obs-text">{row.availability}</div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-obs-muted">
                <span>{row.incidents30d} inc / 30d</span>
                <ExecutiveTrendArrow trend={row.trend} />
              </div>
              <div className="mt-2 space-y-0.5 border-t border-obs-border pt-2 text-[11px] text-obs-muted">
                <div className="flex justify-between gap-2">
                  <span>SLO attainment</span>
                  <span className="font-mono text-obs-text">{row.sloAttainmentPct}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Error budget used</span>
                  <span className="font-mono text-obs-text">{row.errorBudgetUsedPct}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Pain index</span>
                  <span className="font-mono text-obs-text">{row.customerPainIndex}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
