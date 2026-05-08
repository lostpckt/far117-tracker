import { Card, CardContent } from '@/components/ui/card'
import { compute, fmtHrs } from '@/lib/calculations'
import type { Entry } from '@/types/entry'

interface Props {
  entries: Entry[]
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

export default function Dashboard({ entries }: Props) {
  type Color = 'green' | 'red' | 'blue' | 'amber'

  const lastEntry = entries.length
    ? [...entries].sort((a, b) => (new Date(b.fdpStart).getTime()) - (new Date(a.fdpStart).getTime()))[0]
    : null
  const lastCalc = lastEntry ? compute(lastEntry, entries) : null

  const allWarnings = entries.filter(e => {
    const c = compute(e, entries)
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
      sub:   'Required: 10h consecutive',
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

  const cumulativeCards: { label: string; value: string; sub: string; color: Color }[] = [
    {
      label: '28-day Block (§117.23)',
      value: r28 !== null ? fmtHrs(r28) : '—',
      sub:   r28 !== null
        ? (r28 > 100 ? '⚠ 100h limit EXCEEDED' : `${fmtHrs(100 - r28)} remaining of 100h`)
        : 'No data',
      color: r28 === null ? 'blue' : r28 > 100 ? 'red' : r28 > 90 ? 'amber' : 'green',
    },
    {
      label: '365-day Block (§117.23)',
      value: r365 !== null ? fmtHrs(r365) : '—',
      sub:   r365 !== null
        ? (r365 > 1000 ? '⚠ 1,000h limit EXCEEDED' : `${fmtHrs(1000 - r365)} remaining of 1,000h`)
        : 'No data',
      color: r365 === null ? 'blue' : r365 > 1000 ? 'red' : r365 > 950 ? 'amber' : 'green',
    },
    {
      label: '7-day FDP Hours (§117.23)',
      value: r168 !== null ? fmtHrs(r168) : '—',
      sub:   r168 !== null
        ? (r168 > 60 ? '⚠ 60h limit EXCEEDED' : `${fmtHrs(60 - r168)} remaining of 60h`)
        : 'No data',
      color: r168 === null ? 'blue' : r168 > 60 ? 'red' : r168 > 55 ? 'amber' : 'green',
    },
    {
      label: '28-day FDP Hours (§117.23)',
      value: r672 !== null ? fmtHrs(r672) : '—',
      sub:   r672 !== null
        ? (r672 > 190 ? '⚠ 190h limit EXCEEDED' : `${fmtHrs(190 - r672)} remaining of 190h`)
        : 'No data',
      color: r672 === null ? 'blue' : r672 > 190 ? 'red' : r672 > 175 ? 'amber' : 'green',
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
