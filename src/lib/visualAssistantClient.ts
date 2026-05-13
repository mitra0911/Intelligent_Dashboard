import { findSimulatedVisualReply } from './simulatedLlmQA'

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/** Simulated visual Q&A: seeded chip answers, then keyword heuristics. */
export async function completeVisualAssistant(
  prompt: string,
  screenContext: string,
  pathname: string,
): Promise<string> {
  const seeded = findSimulatedVisualReply(pathname, prompt)
  if (seeded) {
    await delay(280 + Math.random() * 220)
    return seeded
  }

  await delay(450 + Math.random() * 350)

  const q = prompt.toLowerCase()
  const ctx = screenContext.toLowerCase()

  if (q.includes('chart') || q.includes('graph')) {
    if (ctx.includes('command center'))
      return (
        '**1. Summary**\n' +
        '• Command Center compares **raw alert noise** with **correlated incidents** over time.\n' +
        '• Business tiles compress **health**, **SLO burn**, and a **24h sparkline** per service.\n\n' +
        '**2. Key points**\n' +
        '• Wider gap between alert area and incident area ⇒ overlay is filtering/stitching signals into fewer actionable incidents (mock).\n' +
        '• Sparklines are synthetic load for demo — not live production series.\n\n' +
        '**3. Mapping (visual → meaning)**\n' +
        '• `Signal volume` (stacked area) → **Blue** = raw alerts/day; **Teal** = incidents after correlation.\n' +
        '• `Business service` tile → **Ring/status + SLO burn** = error-budget-style pressure; **Sparkline** = last 24h shape.\n' +
        '• `Live log stream` → Sample of structured mock logs for correlation demos.'
      )
    if (ctx.includes('trends'))
      return (
        '**1. Summary**\n' +
        '• Trends focuses on **reliability over time** and **operational noise**.\n' +
        '• Executive view is condensed into **scorecard chips**.\n\n' +
        '**2. Key points**\n' +
        '• Higher alert/incident ratio weeks ⇒ noisier alerting relative to declared incidents (mock).\n' +
        '• Forecast panel uses **linear extrapolation** — illustrative only.\n\n' +
        '**3. Mapping (visual → meaning)**\n' +
        '• `MTTR trend` (line) → Mean time to resolve incidents across ~90 days.\n' +
        '• `Alert → incident ratio` (bars) → Alerts per incident by week.\n' +
        '• `Repeat-offender` table → Services with most incidents / alert volume (30d).\n' +
        '• `Predictive` panel → Services flagged as **SLO breach risk** in next 7 days (demo logic).\n' +
        '• `Executive scorecard` strip → Availability + incident count rollup per business service.'
      )
  }

  if (q.includes('topology') || q.includes('node') || q.includes('service graph')) {
    return (
      '**1. Summary**\n' +
      '• Topology shows **filled bubbles** and a **mesh-style** spread (hub + web), **not** an orthogonal branch/tree layout.\n' +
      '• **Bubble fill** = worst of **live telemetry** + **Command Center** roll-up (green ok, amber warn, orange error, red critical).\n\n' +
      '**2. Key points**\n' +
      '• **White number** inside the bubble = **max SLO burn** across mapped business services.\n' +
      '• **Edges** are **solid straight**; color follows the **target (`to`)** node.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• Mono **`svc-*`** under the name → Command Center ids.\n' +
      '• `Side panel` → SLIs, dependencies, team — **per selected node**.'
    )
  }

  if (q.includes('incident') || q.includes('timeline')) {
    return (
      '**1. Summary**\n' +
      '• Incident view stitches **triage**, **time-ordered signals**, and **topology context**.\n\n' +
      '**2. Key points**\n' +
      '• Timeline badges show **which tool** produced each signal (Datadog, Splunk, etc.).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• `Header` (ID, severity, team, duration) → Incident record + ownership.\n' +
      '• `Auto-triage` panel → Model/rule summary: **why severity** and **probable domain**.\n' +
      '• `Correlated timeline` → Deploys, metrics, logs, traces merged into one vertical story.\n' +
      '• `Topology minimap` → **Blast radius** / affected path.\n' +
      '• `RCA Assistant` → Natural-language answers over injected incident context (simulated).'
    )
  }

  if (q.includes('health') || q.includes('slo') || q.includes('tile')) {
    return (
      '**1. Summary**\n' +
      '• Health tiles are the **business-level** status row on Command Center.\n\n' +
      '**2. Key points**\n' +
      '• **Critical** tiles pulse subtly (demo emphasis).\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• `Status pill` → **Healthy / Degraded / Critical** for that business service.\n' +
      '• `SLO burn` → Multiplier-style pressure over the window shown (mock).\n' +
      '• `Sparkline` → Last **24h** mini trend for that tile.'
    )
  }

  if (q.includes('automation')) {
    return (
      '**1. Summary**\n' +
      '• Automation shows **different agent catalogs** and **filtered run history** per governance toggle (mock).\n\n' +
      '**2. Key points**\n' +
      '• **Auto** → bounded, fast actions with outcomes framed as seconds/minutes.\n' +
      '• **Human-in-the-loop** → approvals, CAB, dual-control style actions.\n\n' +
      '**3. Mapping (visual → meaning)**\n' +
      '• `Execution mode` toggle → Switches **Auto** vs **HITL** agent list + matching history rows.\n' +
      '• `Agent row` + badge → Which governance stream owns that playbook.'
    )
  }

  const ctxLines = screenContext.split('\n').filter(Boolean)
  const bullets = ctxLines.map((line) => `• ${line}`).join('\n')

  return (
    '**1. Summary**\n' +
    '• You are on a **mock ObservIQ** screen; explanations use **seeded demo data** only.\n' +
    '• Ask about **charts**, **topology**, **incidents**, **health tiles**, or **automation** — or tap a **suggested question**.\n\n' +
    '**2. Key points**\n' +
    bullets +
    '\n\n' +
    '**3. Mapping (visual → meaning)**\n' +
    '• `Command Center` → Health grid + incidents + signal volume + log sample.\n' +
    '• `Incident detail` → Triage + correlated timeline + minimap + RCA chat.\n' +
    '• `Services & topology` → Graph + side panel + business roll-up list.\n' +
    '• `Trends` → MTTR, ratios, repeat offenders, forecast, scorecard.\n' +
    '• `Automation` → Agents list + governance mode + history.\n' +
    '• `This panel` → **Screen-aware simulated Q&A** using the context above.'
  )
}
