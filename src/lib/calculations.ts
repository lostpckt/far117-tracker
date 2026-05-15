import type { Entry, Computed, RestFacility, ContractProvisions } from '@/types/entry'
import { DEFAULT_PROVISIONS } from '@/types/entry'

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function ms(dtStr: string | undefined | null): number | null {
  if (!dtStr) return null
  const t = new Date(dtStr).getTime()
  return isNaN(t) ? null : t
}

export function hrs(startMs: number | null, endMs: number | null): number | null {
  if (startMs === null || endMs === null) return null
  const h = (endMs - startMs) / 3600000
  return h >= 0 ? h : null
}

export function fmtHrs(h: number | null | undefined): string {
  if (h === null || h === undefined || isNaN(h)) return '—'
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh}h ${String(mm).padStart(2, '0')}m`
}

export function fmtDT(dtStr: string | undefined | null): string {
  if (!dtStr) return '—'
  const d = new Date(dtStr)
  if (isNaN(d.getTime())) return '—'
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mo}/${dy} ${hh}:${mi}`
}

export function parseDTPair(date: string, time: string): string {
  if (!date || !time) return ''
  const t = time.trim()
  const norm = t.length === 4 ? t.slice(0, 2) + ':' + t.slice(2) : t
  if (!/^\d{2}:\d{2}$/.test(norm)) return ''
  return `${date}T${norm}`
}

export function splitDT(dtStr: string): { d: string; t: string } {
  if (!dtStr) return { d: '', t: '' }
  const [d, t] = dtStr.split('T')
  return { d: d || '', t: t || '' }
}

// §117.15 Table B — unaugmented FDP limits (hours)
// 10 start-time rows × 7 segment columns (1 seg … 7+ segs)
const TABLE_B: Array<{ start: number; end: number; limits: number[] }> = [
  { start:  0, end:  4, limits: [9,  9,  9,  9,  9,    9,    9   ] },
  { start:  4, end:  5, limits: [10, 10, 10, 10,  9,    9,    9   ] },
  { start:  5, end:  6, limits: [12, 12, 12, 12, 11.5, 11,   10.5] },
  { start:  6, end:  7, limits: [13, 13, 12, 12, 11.5, 11,   10.5] },
  { start:  7, end: 12, limits: [14, 14, 13, 13, 12.5, 12,   11.5] },
  { start: 12, end: 13, limits: [13, 13, 13, 13, 12.5, 12,   11.5] },
  { start: 13, end: 17, limits: [12, 12, 12, 12, 11.5, 11,   10.5] },
  { start: 17, end: 22, limits: [12, 12, 11, 11, 10,    9,    9   ] },
  { start: 22, end: 23, limits: [11, 11, 10, 10,  9,    9,    9   ] },
  { start: 23, end: 24, limits: [10, 10, 10,  9,  9,    9,    9   ] },
]

export function tableBLimit(fdpStartHour: number, segments: number): number {
  const h   = fdpStartHour % 24
  const col = Math.min(Math.max(segments, 1) - 1, 6)
  for (const row of TABLE_B) {
    if (h >= row.start && h < row.end) return row.limits[col]
  }
  return 9
}

// §117.17 Table C — augmented FDP limits (hours)
// 5 start-time rows × 6 columns: [C1/3-pilot, C1/4-pilot, C2/3-pilot, C2/4-pilot, C3/3-pilot, C3/4-pilot]
const TABLE_C: Array<{ start: number; end: number; limits: number[] }> = [
  { start:  0, end:  6, limits: [15,   17,   14,   15.5, 13,   13.5] },
  { start:  6, end:  7, limits: [16,   18.5, 15,   16.5, 14,   14.5] },
  { start:  7, end: 13, limits: [17,   19,   16.5, 18,   15,   15.5] },
  { start: 13, end: 17, limits: [16,   18.5, 15,   16.5, 14,   14.5] },
  { start: 17, end: 24, limits: [15,   17,   14,   15.5, 13,   13.5] },
]

function tableCCol(restFacility: RestFacility, crewCount: 2 | 3 | 4): number {
  const is4 = crewCount === 4
  if (restFacility === 'C1') return is4 ? 1 : 0
  if (restFacility === 'C2') return is4 ? 3 : 2
  return is4 ? 5 : 4
}

export function tableCLimit(fdpStartHour: number, restFacility: RestFacility, crewCount: 2 | 3 | 4): number {
  const h   = fdpStartHour % 24
  const col = tableCCol(restFacility, crewCount)
  for (const row of TABLE_C) {
    if (h >= row.start && h < row.end) return row.limits[col]
  }
  return 13
}

// Returns true if [fdpStart, fdpEnd] overlaps WOCL (0200–0559) on any calendar day
function crossesWocl(fdpStart: string, fdpEnd: string): boolean {
  const sMs = ms(fdpStart)
  const eMs = ms(fdpEnd)
  if (sMs === null || eMs === null || eMs <= sMs) return false
  let day = new Date(sMs)
  day.setHours(0, 0, 0, 0)
  while (day.getTime() <= eMs) {
    const w0 = day.getTime() + 2 * 3600000
    const w1 = day.getTime() + 6 * 3600000
    if (sMs < w1 && eMs > w0) return true
    day = new Date(day.getTime() + 86400000)
  }
  return false
}

export function computeFdpLimit(entry: Entry): number {
  const sMs = ms(entry.fdpStart)
  if (sMs === null) return 9
  const hour = new Date(sMs).getHours() + new Date(sMs).getMinutes() / 60
  if (entry.augmented) {
    return tableCLimit(hour, entry.restFacility, entry.crewCount)
  }
  let limit = tableBLimit(hour, entry.segments)
  if (crossesWocl(entry.fdpStart, entry.fdpEnd)) limit -= 0.5
  return limit
}

// §117.25(c): check for consecutive duty-free hours within the preceding 168h window
function check30hRest(entry: Entry, all: Entry[], minHours = 30): boolean | null {
  const startMs = ms(entry.fdpStart)
  if (startMs === null) return null
  const winStart = startMs - 168 * 3600000
  const H30 = minHours * 3600000

  const duties = all
    .filter(e => e.id !== entry.id)
    .flatMap(e => {
      const s  = ms(e.fdpStart)
      const en = ms(e.fdpEnd) ?? ms(e.fdpStart)
      if (s === null || en === null || en < winStart || s >= startMs) return []
      return [{ start: Math.max(s, winStart), end: Math.min(en, startMs) }]
    })
    .sort((a, b) => a.start - b.start)

  if (!duties.length) return null

  let cursor = winStart
  for (const d of duties) {
    if (d.start - cursor >= H30) return true
    cursor = Math.max(cursor, d.end)
  }
  return startMs - cursor >= H30
}

export function compute(entry: Entry, all: Entry[], prov: ContractProvisions = DEFAULT_PROVISIONS): Computed {
  const c = {} as Computed

  const sMs = ms(entry.fdpStart)
  const eMs = ms(entry.fdpEnd)

  c.fdpActual = hrs(sMs, eMs)
  c.fdpLimit  = computeFdpLimit(entry)
  c.fdpOk     = c.fdpActual !== null ? c.fdpActual <= c.fdpLimit : null
  c.fdpExc    = c.fdpActual !== null ? Math.max(0, c.fdpActual - c.fdpLimit) : 0
  c.woclFlag  = entry.fdpStart ? crossesWocl(entry.fdpStart, entry.fdpEnd || entry.fdpStart) : false

  const anchor = eMs ?? sMs
  if (anchor !== null) {
    const w672h = anchor - 672 * 3600000
    const w365d = anchor - 365 * 86400000
    const w168h = anchor - 168 * 3600000

    c.rolling28 = all.reduce((sum, e) => {
      const en = ms(e.fdpEnd) ?? ms(e.fdpStart)
      if (en === null || en > anchor || en < w672h) return sum
      return sum + (e.blockTime || 0)
    }, 0)

    c.rolling365 = all.reduce((sum, e) => {
      const en = ms(e.fdpEnd) ?? ms(e.fdpStart)
      if (en === null || en > anchor || en < w365d) return sum
      return sum + (e.blockTime || 0)
    }, 0)

    c.fdpHours168 = all.reduce((sum, e) => {
      const es = ms(e.fdpStart)
      const en = ms(e.fdpEnd) ?? es
      if (es === null || en === null || en > anchor || en < w168h) return sum
      return sum + Math.max(0, (en - es) / 3600000)
    }, 0)

    c.fdpHours672 = all.reduce((sum, e) => {
      const es = ms(e.fdpStart)
      const en = ms(e.fdpEnd) ?? es
      if (es === null || en === null || en > anchor || en < w672h) return sum
      return sum + Math.max(0, (en - es) / 3600000)
    }, 0)

    c.hours28Ok  = c.rolling28   !== null ? c.rolling28   <= prov.maxBlock28Hours  : null
    c.hours365Ok = c.rolling365  !== null ? c.rolling365  <= prov.maxBlock365Hours : null
    c.fdp168Ok   = c.fdpHours168 !== null ? c.fdpHours168 <= prov.maxFdp168Hours  : null
    c.fdp672Ok   = c.fdpHours672 !== null ? c.fdpHours672 <= prov.maxFdp672Hours  : null
  } else {
    c.rolling28   = null
    c.rolling365  = null
    c.fdpHours168 = null
    c.fdpHours672 = null
    c.hours28Ok   = null
    c.hours365Ok  = null
    c.fdp168Ok    = null
    c.fdp672Ok    = null
  }

  c.consRest   = hrs(ms(entry.restStart), ms(entry.restEnd))
  c.restOk     = c.consRest !== null ? c.consRest >= prov.minRestHours : null
  c.weekly30Ok = check30hRest(entry, all, prov.minWeeklyRestHours)

  return c
}

export function generateReport(entries: Entry[], periodDays: number | null, prov: ContractProvisions = DEFAULT_PROVISIONS): string {
  if (!entries.length) return ''

  const nowMs   = Date.now()
  const cutoff  = periodDays ? nowMs - periodDays * 86400000 : 0
  const filtered = entries
    .filter(e => { const t = ms(e.fdpStart); return t !== null && t >= cutoff })
    .sort((a, b) => (ms(a.fdpStart) ?? 0) - (ms(b.fdpStart) ?? 0))

  if (!filtered.length) return ''

  // Rolling-window snapshot from the most recent entry across ALL data
  const latestEntry = [...entries].sort(
    (a, b) => (ms(b.fdpEnd) ?? ms(b.fdpStart) ?? 0) - (ms(a.fdpEnd) ?? ms(a.fdpStart) ?? 0)
  )[0]
  const snap = compute(latestEntry, entries, prov)

  const pilots    = [...new Set(filtered.map(e => e.pilot).filter(Boolean))].join(', ') || 'All Pilots'
  const generated = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
  const periodLabel = periodDays === 28 ? 'Last 28 days' : periodDays === 90 ? 'Last 90 days' : periodDays === 365 ? 'Last 365 days' : 'All entries'

  // Violation tallies across filtered entries (rolling windows still use all entries for accuracy)
  let fdpFail = 0, restFail = 0, rest30Fail = 0

  const violations: { date: string; pilot: string; type: string; detail: string }[] = []

  filtered.forEach(e => {
    const c = compute(e, entries, prov)
    if (c.fdpOk === false) {
      fdpFail++
      violations.push({ date: fmtDT(e.fdpStart), pilot: e.pilot, type: 'FDP Limit Exceeded', detail: `FDP: ${fmtHrs(c.fdpActual)} (limit ${c.fdpLimit}h)` })
    }
    if (c.restOk === false) {
      restFail++
      violations.push({ date: fmtDT(e.fdpStart), pilot: e.pilot, type: 'Pre-FDP Rest Deficient', detail: `Got ${fmtHrs(c.consRest)}, required ${prov.minRestHours}h` })
    }
    if (c.weekly30Ok === false) {
      rest30Fail++
      violations.push({ date: fmtDT(e.fdpStart), pilot: e.pilot, type: `${prov.minWeeklyRestHours}h Weekly Rest Not Met`, detail: `No ${prov.minWeeklyRestHours}-consecutive-hour rest period found in prior 168h` })
    }
  })

  const totalViolations  = fdpFail + restFail + rest30Fail
  const r28ok  = snap.hours28Ok  !== false
  const r365ok = snap.hours365Ok !== false
  const f168ok = snap.fdp168Ok   !== false
  const f672ok = snap.fdp672Ok   !== false
  const overallOk = totalViolations === 0 && r28ok && r365ok && f168ok && f672ok
  const statusColor = overallOk ? '#16a34a' : '#dc2626'
  const statusText  = overallOk ? 'COMPLIANT' : 'REVIEW REQUIRED'

  const flag = (ok: boolean | null) => ok === null ? '—' : ok ? '✓' : '⚠'

  const provTag = (key: keyof ContractProvisions) =>
    prov[key] !== DEFAULT_PROVISIONS[key] ? ' <span style="font-size:0.7rem;color:#7c3aed;font-weight:400">(contract)</span>' : ''

  const scRows = [
    ['FDP Limits (Table B/C §117.15/17)',                                      fdpFail === 0   ? 'PASS' : `${fdpFail} EXCEEDED`,           fdpFail === 0],
    [`Pre-FDP Rest ≥${prov.minRestHours}h (§117.25)${provTag('minRestHours')}`,       restFail === 0  ? 'PASS' : `${restFail} DEFICIENT`,          restFail === 0],
    [`${prov.minWeeklyRestHours}h Rest in 168h (§117.25)${provTag('minWeeklyRestHours')}`, rest30Fail === 0 ? 'PASS' : `${rest30Fail} NOT MET`,     rest30Fail === 0],
    [`28-day Block ≤${prov.maxBlock28Hours}h (§117.23)${provTag('maxBlock28Hours')}`,  r28ok ? `${fmtHrs(snap.rolling28)} — OK` : `${fmtHrs(snap.rolling28)} EXCEEDED`, r28ok],
    [`365-day Block ≤${prov.maxBlock365Hours.toLocaleString()}h (§117.23)${provTag('maxBlock365Hours')}`, r365ok ? `${fmtHrs(snap.rolling365)} — OK` : `${fmtHrs(snap.rolling365)} EXCEEDED`, r365ok],
    [`7-day FDP ≤${prov.maxFdp168Hours}h (§117.23)${provTag('maxFdp168Hours')}`,       f168ok ? `${fmtHrs(snap.fdpHours168)} — OK` : `${fmtHrs(snap.fdpHours168)} EXCEEDED`, f168ok],
    [`28-day FDP ≤${prov.maxFdp672Hours}h (§117.23)${provTag('maxFdp672Hours')}`,      f672ok ? `${fmtHrs(snap.fdpHours672)} — OK` : `${fmtHrs(snap.fdpHours672)} EXCEEDED`, f672ok],
  ].map(([req, result, ok]) => {
    const bg  = ok === null ? '#f8fafc' : ok ? '#f0fdf4' : '#fef2f2'
    const col = ok === null ? '#555'    : ok ? '#16a34a' : '#dc2626'
    return `<tr style="background:${bg}"><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${req}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:700;color:${col}">${result}</td></tr>`
  }).join('')

  const vRows = violations.length
    ? violations.map(v => `<tr><td>${v.date}</td><td>${v.pilot || '—'}</td><td style="color:#dc2626;font-weight:600">${v.type}</td><td>${v.detail}</td></tr>`).join('')
    : `<tr><td colspan="4" style="color:#16a34a;padding:10px">No violations in the selected period.</td></tr>`

  const logRows = filtered.map(e => {
    const c    = compute(e, entries, prov)
    const crew = e.augmented ? `${e.position} Aug-${e.crewCount}/${e.restFacility}` : e.position
    const fdpColor = c.fdpOk === false ? '#dc2626' : 'inherit'
    return `<tr>
      <td>${fmtDT(e.fdpStart)}</td>
      <td>${fmtDT(e.fdpEnd)}</td>
      <td>${e.pilot || '—'}</td>
      <td>${crew}</td>
      <td>${(e.dep || '—').toUpperCase()}→${(e.arr || '—').toUpperCase()}</td>
      <td style="text-align:center">${e.segments}</td>
      <td>${fmtHrs(e.blockTime)}</td>
      <td style="color:${fdpColor};font-weight:${c.fdpOk === false ? '700' : '400'}">${fmtHrs(c.fdpActual)} / ${c.fdpLimit}h${c.woclFlag ? ' ⚑' : ''}</td>
      <td style="color:${fdpColor}">${flag(c.fdpOk)}</td>
      <td>${fmtHrs(c.consRest)}</td>
      <td style="color:${c.restOk === false ? '#dc2626' : 'inherit'}" title="Required: ${prov.minRestHours}h">${flag(c.restOk)}</td>
      <td style="color:${c.weekly30Ok === false ? '#dc2626' : 'inherit'}">${flag(c.weekly30Ok)}</td>
      <td>${e.reason || '—'}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<title>FAR 117 Compliance Report — ${periodLabel}</title>
<style>
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#1a1a2e; padding:32px; font-size:13px; }
h1 { font-size:1.3rem; margin-bottom:4px; }
h2 { font-size:0.95rem; margin:24px 0 8px; border-bottom:2px solid #e5e7eb; padding-bottom:5px; }
.meta { color:#666; font-size:0.8rem; margin-bottom:20px; }
.status { background:${overallOk ? '#f0fdf4' : '#fef2f2'}; border:2px solid ${statusColor}; border-radius:8px; padding:12px 18px; color:${statusColor}; font-weight:700; font-size:1rem; margin-bottom:20px; }
.stat-box { background:#f8fafc; border-radius:7px; padding:12px 16px; display:inline-block; margin:0 8px 8px 0; min-width:160px; }
.stat-box .val { font-size:1.4rem; font-weight:700; }
.stat-box .lbl { font-size:0.72rem; color:#888; margin-top:3px; }
table { width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:8px; }
th { background:#f8fafc; padding:7px 10px; text-align:left; font-weight:700; color:#555; border-bottom:2px solid #e5e7eb; white-space:nowrap; }
td { padding:7px 10px; border-bottom:1px solid #f1f5f9; vertical-align:middle; white-space:nowrap; }
.note { margin-top:28px; font-size:0.72rem; color:#aaa; border-top:1px solid #e5e7eb; padding-top:10px; }
.print-btn { margin-bottom:20px; padding:8px 20px; background:#312e81; color:white; border:none; border-radius:7px; font-size:0.88rem; font-weight:600; cursor:pointer; }
@media print { .no-print { display:none; } body { padding:16px; } }
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
<button class="print-btn no-print" onclick="window.close()" style="background:#6b7280;margin-left:8px">✕ Close</button>
<h1>FAR 117 / 121 Compliance Report</h1>
<div class="meta">Period: <strong>${periodLabel}</strong> &nbsp;|&nbsp; Pilot(s): <strong>${pilots}</strong> &nbsp;|&nbsp; FDPs: <strong>${filtered.length}</strong> &nbsp;|&nbsp; Generated: ${generated}</div>
<div class="status">${overallOk ? '✓' : '⚠'} Overall Status: ${statusText}${!overallOk && totalViolations > 0 ? ` — ${totalViolations} violation(s) in selected period` : ''}</div>
<div style="margin-bottom:20px">
  <div class="stat-box"><div class="val" style="color:${snap.hours28Ok===false?'#dc2626':'#2563eb'}">${fmtHrs(snap.rolling28)}</div><div class="lbl">28-day block / ${prov.maxBlock28Hours}h</div></div>
  <div class="stat-box"><div class="val" style="color:${snap.hours365Ok===false?'#dc2626':'#2563eb'}">${fmtHrs(snap.rolling365)}</div><div class="lbl">365-day block / ${prov.maxBlock365Hours.toLocaleString()}h</div></div>
  <div class="stat-box"><div class="val" style="color:${snap.fdp168Ok===false?'#dc2626':'#2563eb'}">${fmtHrs(snap.fdpHours168)}</div><div class="lbl">7-day FDP / ${prov.maxFdp168Hours}h</div></div>
  <div class="stat-box"><div class="val" style="color:${snap.fdp672Ok===false?'#dc2626':'#2563eb'}">${fmtHrs(snap.fdpHours672)}</div><div class="lbl">28-day FDP / ${prov.maxFdp672Hours}h</div></div>
</div>
<h2>Scorecard</h2><table><thead><tr><th>Requirement</th><th>Result</th></tr></thead><tbody>${scRows}</tbody></table>
<h2>Violations in Period</h2><table><thead><tr><th>FDP Start</th><th>Pilot</th><th>Type</th><th>Detail</th></tr></thead><tbody>${vRows}</tbody></table>
<h2>FDP Log</h2>
<table><thead><tr>
  <th>FDP Start</th><th>FDP End</th><th>Pilot</th><th>Crew</th><th>Route</th><th>Segs</th>
  <th>Block</th><th>FDP / Limit</th><th>FDP✓</th><th>Rest After</th><th>${prov.minRestHours}h✓</th><th>${prov.minWeeklyRestHours}h✓</th><th>Notes</th>
</tr></thead><tbody>${logRows}</tbody></table>
<div class="note">⑦ = WOCL overlap — Table B limit reduced 30 min. &nbsp;Rolling-window totals computed as of the most recent FDP in the full dataset (not limited to the selected period).<br>
${Object.keys(DEFAULT_PROVISIONS).some(k => prov[k as keyof ContractProvisions] !== DEFAULT_PROVISIONS[k as keyof ContractProvisions]) ? '<strong style="color:#7c3aed">Contract provisions active:</strong> ' + [
  prov.minRestHours !== DEFAULT_PROVISIONS.minRestHours ? `rest min ${prov.minRestHours}h` : '',
  prov.minWeeklyRestHours !== DEFAULT_PROVISIONS.minWeeklyRestHours ? `weekly rest min ${prov.minWeeklyRestHours}h` : '',
  prov.maxBlock28Hours !== DEFAULT_PROVISIONS.maxBlock28Hours ? `28-day block max ${prov.maxBlock28Hours}h` : '',
  prov.maxBlock365Hours !== DEFAULT_PROVISIONS.maxBlock365Hours ? `365-day block max ${prov.maxBlock365Hours}h` : '',
  prov.maxFdp168Hours !== DEFAULT_PROVISIONS.maxFdp168Hours ? `7-day FDP max ${prov.maxFdp168Hours}h` : '',
  prov.maxFdp672Hours !== DEFAULT_PROVISIONS.maxFdp672Hours ? `28-day FDP max ${prov.maxFdp672Hours}h` : '',
].filter(Boolean).join(', ') + '.<br>' : ''}
This report is for reference and record-keeping only. Always verify compliance with your OpSpec, POI, and company manual. Generated by FAR 117 / 121 Duty &amp; Flight Time Tracker.</div>
</body></html>`
}

export function exportCSV(entries: Entry[], prov: ContractProvisions = DEFAULT_PROVISIONS): void {
  if (!entries.length) { alert('No data to export.'); return }

  const hdr = [
    'FDP Start', 'FDP End', 'Pilot', 'Position', 'Augmented', 'Crew Count', 'Rest Facility',
    'DEP', 'ARR', 'Segments', 'Block Time (h)', 'FDP Actual (h)', 'FDP Limit (h)',
    'FDP OK', 'FDP Exceedance (h)', 'Rolling 28-day (h)', 'Rolling 365-day (h)',
    'FDP Hrs 168h', 'FDP Hrs 672h', 'Consecutive Rest (h)', 'Rest OK',
    '30h Rest (168h) OK', 'WOCL', 'Reason',
  ].join(',')

  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const rows = entries.map(e => {
    const c = compute(e, entries, prov)
    return [
      q(e.fdpStart), q(e.fdpEnd), q(e.pilot), q(e.position),
      q(e.augmented ? 'Yes' : 'No'), q(e.crewCount), q(e.restFacility),
      q((e.dep || '').toUpperCase()), q((e.arr || '').toUpperCase()),
      q(e.segments), q(e.blockTime.toFixed(2)),
      q(c.fdpActual  !== null ? c.fdpActual.toFixed(2)  : ''),
      q(c.fdpLimit.toFixed(1)),
      q(c.fdpOk  === null ? 'N/A' : c.fdpOk  ? 'OK' : 'EXCEEDED'),
      q(c.fdpExc.toFixed(2)),
      q(c.rolling28   !== null ? c.rolling28.toFixed(2)   : ''),
      q(c.rolling365  !== null ? c.rolling365.toFixed(2)  : ''),
      q(c.fdpHours168 !== null ? c.fdpHours168.toFixed(2) : ''),
      q(c.fdpHours672 !== null ? c.fdpHours672.toFixed(2) : ''),
      q(c.consRest !== null ? c.consRest.toFixed(2) : ''),
      q(c.restOk    === null ? 'N/A' : c.restOk    ? 'OK' : 'DEFICIENT'),
      q(c.weekly30Ok === null ? 'N/A' : c.weekly30Ok ? 'OK' : 'CHECK'),
      q(c.woclFlag ? 'Yes' : 'No'),
      q(e.reason || ''),
    ].join(',')
  })

  const csv  = [hdr, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `far117_log_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
