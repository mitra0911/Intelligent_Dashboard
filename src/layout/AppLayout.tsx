import { useMemo } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  ChevronDown,
  HeartPulse,
  LayoutDashboard,
  Network,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  Waypoints,
  Zap,
} from 'lucide-react'
import { AppBrandMark } from '../components/AppBrandMark'
import { BRAND_SUITE_PRIMARY, BRAND_SUITE_SECONDARY } from '../config/brand'
import { OutlookUserLogo } from '../components/OutlookUserLogo'
import { VisualAssistantPanel } from '../components/VisualAssistantPanel'
import { useMockData } from '../context/MockDataContext'

export function AppLayout() {
  const { data, refresh, scenario, setScenario } = useMockData()
  const allHealthyOn = scenario === 'allHealthy'
  const { mockStats, connectedTools } = data

  const nav = useMemo(
    () => [
      { to: '/', label: 'Command Center', icon: LayoutDashboard },
      { to: '/incidents', label: 'Incidents', icon: Activity },
      { to: '/services', label: 'Services', icon: Network },
      { to: '/traces', label: 'Traces', icon: Waypoints },
      { to: '/trends', label: 'Trends', icon: TrendingUp },
      { to: '/automation', label: 'Automation', icon: Zap },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
    [],
  )

  return (
    <div className="flex min-h-full bg-obs-bg font-sans text-obs-text">
      <aside className="flex w-56 shrink-0 flex-col border-r border-obs-border bg-obs-surface">
        <div className="border-b border-obs-border px-4 py-4">
          <AppBrandMark placement="sidebar" />
          <div className="mt-3 text-[11px] text-obs-muted">
            <span className="font-medium text-obs-text">{BRAND_SUITE_PRIMARY}</span>
            <span className="text-obs-muted"> · {BRAND_SUITE_SECONDARY}</span>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-obs-teal/15 text-obs-teal'
                    : 'text-obs-muted hover:bg-obs-elevated hover:text-obs-text'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-obs-border p-3 text-xs text-obs-muted">
          <div className="mb-1 font-medium text-obs-text">Overlay layer</div>
          Datadog · Splunk · ITSM merged timeline (mock)
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-obs-border bg-obs-surface/80 px-6 backdrop-blur">
          <div className="mr-1 shrink-0 border-r border-obs-border pr-4">
            <AppBrandMark placement="header" />
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-obs-border bg-obs-bg px-3 py-1.5 text-xs text-obs-muted"
          >
            Production
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obs-muted" />
            <input
              type="search"
              placeholder="Search services, incidents, traces…"
              className="w-full rounded-lg border border-obs-border bg-obs-bg py-2 pl-9 pr-3 text-sm text-obs-text placeholder:text-obs-muted focus:border-obs-teal focus:outline-none"
            />
          </div>
          <div className="hidden gap-4 text-xs text-obs-muted md:flex">
            <span>
              Alerts <strong className="text-obs-text">{mockStats.alertCount}</strong>
            </span>
            <span>
              Incidents <strong className="text-obs-text">{mockStats.incidentCount}</strong>
            </span>
            <span>
              Correlated <strong className="text-obs-teal">{mockStats.correlatedPct}%</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setScenario(allHealthyOn ? 'default' : 'allHealthy')}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              allHealthyOn ?
                'border-obs-green/50 bg-obs-green/10 text-obs-green hover:border-obs-green/70'
              : 'border-obs-border bg-obs-bg text-obs-muted hover:border-obs-teal/40 hover:text-obs-text'
            }`}
            title="Temporarily force green services, no active incidents, calm telemetry (mock)"
            aria-pressed={allHealthyOn}
          >
            <HeartPulse className="h-3.5 w-3.5" aria-hidden />
            All healthy
          </button>
          <button
            type="button"
            onClick={refresh}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-obs-border bg-obs-bg px-3 py-1.5 text-xs font-medium text-obs-muted transition-colors hover:border-obs-teal/40 hover:text-obs-text"
            title="Regenerate mock dashboard data (respects All healthy if on)"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </button>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-obs-border bg-obs-bg ring-1 ring-white/10"
            role="img"
            aria-label="User — Outlook"
            title="Signed in with Outlook (mock)"
          >
            <OutlookUserLogo className="h-full w-full scale-105" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 pb-28">
          <Outlet />
        </main>

        <footer className="flex flex-wrap items-center gap-3 border-t border-obs-border bg-obs-surface px-6 py-2 text-[11px] text-obs-muted">
          <span className="font-medium text-obs-text">Tool coverage</span>
          {connectedTools.map((t) => (
            <span key={t.name} className="flex items-center gap-1">
              <span className={t.ok ? 'text-obs-green' : 'text-obs-amber'}>●</span>
              {t.name}
            </span>
          ))}
        </footer>

        <VisualAssistantPanel />
      </div>
    </div>
  )
}
