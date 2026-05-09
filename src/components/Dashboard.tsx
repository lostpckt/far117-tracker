import { Card, CardContent } from '@/components/ui/card'
import { compute, fmtHrs } from '@/lib/calculations'
import type { Entry, ContractProvisions } from '@/types/entry'

interface Props {
  entries: Entry[]
  provisions: ContractProvisions
}

function StatCard({
  label, value, sub, color,
}: {
  label: string
  value: string | number
  sub: string
  color: 'green' | 'red' | 'blue' | 'amber'
}) {
  const valueClass = {
    green: 'text-green-600',
    red:   'text-red-600',
    blue:  'text-blue-600',
    amber: 'text-amber-600',
  }[color]

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-[0.7rem] text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
        <p className={`text-2xl font-bold leading-none ${valueClass}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

export default function Dashboard({ entries, provisions }: Props) {
  type Color = 'green' | 'red' | 'blue' | 'amber'

  const lastEntry = entries.length
    ? [...entries].sort((a, b) => (new Date(b.fdpStart).getTime()) - (new Date(a.fdpStart).getTime()))[0]
    : null
  const lastCalc = lastEntry ? compute(lastEntry, entries, provisions) : null

  const allWarnings = entries.filter(e => {
    const c = compute(e, entries, provisions)
    return (
      c.fdpOk      === false ||
      c.restOk     === false ||
      c.weekly30Ok === false ||
      c.hours28Ok  === false ||
      c.hours365Ok === false ||
      c.fdp168Ok   === false ||
      c.fdp672Ok   === false
    )
  }).length

  const topCards: { label: string; value: string | number; sub: string; color: Color }[] = [
    {
      label: 'FDPs Logged',
      value: entries.length,
      sub:   entries.length === 1 ? '1 flight duty period' : `${entries.length} flight duty periods`,
      color: 'blue',
    },
    {
      label: 'Last FDP Duration',
      value: lastCalc ? fmtHrs(lastCalc.fdpActual) : '—',
      sub:   lastCalc ? `Limit: ${lastCalc.fdpLimit}h` : 'No entries yet',
      color: !lastCalc ? 'blue' : lastCalc.fdpOk === false ? 'red' : 'green',
    },
    {
      label: 'Last Pre-FDP Rest',
      value: lastCalc ? fmtHrs(lastCalc.consRest) : '—',
      sub:   `Required: ${provisions.minRestHours}h consecutive`,
      color: !lastCalc ? 'blue' : lastCalc.restOk === false ? 'red' : lastCalc.restOk === true ? 'green' : 'blue',
    },
    {
      label: 'Active Violations',
      value: allWarnings,
      sub:   allWarnings === 0 ? 'All entries compliant' : 'Review flagged rows',
      color: allWarnings === 0 ? 'green' : 'red',
    },
  ]

  const r28   = lastCalc?.rolling28   ?? null
  const r365  = lastCalc?.rolling365  ?? null
  const r168  = lastCalc?.fdpHours168 ?? null
  const r672  = lastCalc?.fdpHours672 ?? null

  const { maxBlock28Hours: lim28, maxBlock365Hours: lim365, maxFdp168Hours: lim168, maxFdp672Hours: lim672 } = provisions
  const warn28  = lim28  * 0.9
  const warn365 = lim365 * 0.95
  const warn168 = lim168 * 0.92
  const warn672 = lim672 * 0.92

  const cumulativeCards: { label: string; value: string; sub: string; color: Color }[] = [
    {
      label: '28-day Block (§117.23)',
      value: r28 !== null ? fmtHrs(r28) : '—',
      sub:   r28 !== null
        ? (r28 > lim28 ? `⚠ ${lim28}h limit EXCEEDED` : `${fmtHrs(lim28 - r28)} remaining of ${lim28}h`)
        : 'No data',
      color: r28 === null ? 'blue' : r28 > lim28 ? 'red' : r28 > warn28 ? 'amber' : 'green',
    },
    {
      label: '365-day Block (§117.23)',
      value: r365 !== null ? fmtHrs(r365) : '—',
      sub:   r365 !== null
        ? (r365 > lim365 ? `⚠ ${lim365.toLocaleString()}h limit EXCEEDED` : `${fmtHrs(lim365 - r365)} remaining of ${lim365.toLocaleString()}h`)
        : 'No data',
      color: r365 === null ? 'blue' : r365 > lim365 ? 'red' : r365 > warn365 ? 'amber' : 'green',
    },
    {
      label: '7-day FDP Hours (§117.23)',
      value: r168 !== null ? fmtHrs(r168) : '—',
      sub:   r168 !== null
        ? (r168 > lim168 ? `⚠ ${lim168}h limit EXCEEDED` : `${fmtHrs(lim168 - r168)} remaining of ${lim168}h`)
        : 'No data',
      color: r168 === null ? 'blue' : r168 > lim168 ? 'red' : r168 > warn168 ? 'amber' : 'green',
    },
    {
      label: '28-day FDP Hours (§117.23)',
      value: r672 !== null ? fmtHrs(r672) : '—',
      sub:   r672 !== null
        ? (r672 > lim672 ? `⚠ ${lim672}h limit EXCEEDED` : `${fmtHrs(lim672 - r672)} remaining of ${lim672}h`)
        : 'No data',
      color: r672 === null ? 'blue' : r672 > lim672 ? 'red' : r672 > warn672 ? 'amber' : 'green',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {topCards.map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {cumulativeCards.map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  )
}
