import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pencil, X } from 'lucide-react'
import { compute, fmtDT, fmtHrs } from '@/lib/calculations'
import type { Entry, ContractProvisions } from '@/types/entry'

interface Props {
  entries: Entry[]
  provisions: ContractProvisions
  onEdit: (entry: Entry) => void
  onDelete: (id: string) => void
}

function OkBadge({ flag, okText, warnText }: { flag: boolean | null; okText: string; warnText: string }) {
  if (flag === null) return <Badge className="bg-slate-100 text-slate-400 text-[0.68rem]">N/A</Badge>
  return flag
    ? <Badge className="bg-green-50 text-green-700 text-[0.68rem]">✓ {okText}</Badge>
    : <Badge className="bg-red-50 text-red-700 text-[0.68rem]">⚠ {warnText}</Badge>
}

function crewLabel(e: Entry): string {
  if (!e.augmented) return e.position
  return `${e.position} · Aug ${e.crewCount}/${e.restFacility}`
}

export default function FlightLog({ entries, provisions, onEdit, onDelete }: Props) {
  if (!entries.length) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">FDP Log</CardTitle></CardHeader>
        <CardContent>
          <p className="text-center py-12 text-slate-400">No entries yet — log your first FDP above.</p>
        </CardContent>
      </Card>
    )
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.fdpStart).getTime() - new Date(b.fdpStart).getTime()
  )

  const headers = [
    'FDP Start', 'FDP End', 'Pilot', 'Crew', 'Route', 'Segs', 'Block',
    'FDP / Limit', 'FDP OK?',
    '28-day Flt', '365-day Flt', '168h FDP', '672h FDP',
    'Rest After', 'Rest OK?', '30h/168h', 'WOCL', 'Reason', '',
  ]

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">FDP Log</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                {headers.map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 border-b-2 border-slate-200 dark:border-slate-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(e => {
                const c = compute(e, entries, provisions)
                const fdpOver = c.fdpOk === false

                return (
                  <tr key={e.id} className={fdpOver ? 'bg-red-50/40 dark:bg-red-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap font-mono text-[0.75rem]">{fmtDT(e.fdpStart)}</td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap font-mono text-[0.75rem]">{fmtDT(e.fdpEnd)}</td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 font-semibold whitespace-nowrap">{e.pilot || '—'}</td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap text-[0.72rem]">{crewLabel(e)}</td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      {(e.dep || '—').toUpperCase()} → {(e.arr || '—').toUpperCase()}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-center">{e.segments}</td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 font-semibold whitespace-nowrap">{fmtHrs(e.blockTime)}</td>

                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <span className={fdpOver ? 'text-red-600 font-semibold' : 'font-semibold'}>
                        {fmtHrs(c.fdpActual)}
                      </span>
                      <span className="text-slate-400 text-[0.68rem]"> / {c.fdpLimit}h</span>
                      {c.woclFlag && <span className="ml-1 text-[0.65rem] text-amber-600">WOCL−30m</span>}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <OkBadge flag={c.fdpOk} okText="OK" warnText="EXCEEDED" />
                      {fdpOver && c.fdpExc > 0 && (
                        <div className="text-[0.65rem] text-red-600 mt-0.5 whitespace-nowrap">+{fmtHrs(c.fdpExc)} over</div>
                      )}
                    </td>

                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <span className={c.hours28Ok === false ? 'text-red-600 font-semibold' : ''}>{fmtHrs(c.rolling28)}</span>
                      <br /><span className="text-[0.68rem] text-slate-400">/ {provisions.maxBlock28Hours}h</span>
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <span className={c.hours365Ok === false ? 'text-red-600 font-semibold' : ''}>{fmtHrs(c.rolling365)}</span>
                      <br /><span className="text-[0.68rem] text-slate-400">/ {provisions.maxBlock365Hours.toLocaleString()}h</span>
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <span className={c.fdp168Ok === false ? 'text-red-600 font-semibold' : ''}>{fmtHrs(c.fdpHours168)}</span>
                      <br /><span className="text-[0.68rem] text-slate-400">/ {provisions.maxFdp168Hours}h</span>
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <span className={c.fdp672Ok === false ? 'text-red-600 font-semibold' : ''}>{fmtHrs(c.fdpHours672)}</span>
                      <br /><span className="text-[0.68rem] text-slate-400">/ {provisions.maxFdp672Hours}h</span>
                    </td>

                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      {fmtHrs(c.consRest)}
                      <br /><span className="text-[0.68rem] text-slate-400">Req: {provisions.minRestHours}h</span>
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <OkBadge flag={c.restOk} okText="OK" warnText="DEFICIENT" />
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <OkBadge flag={c.weekly30Ok} okText="OK" warnText="CHECK" />
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-center">
                      {c.woclFlag
                        ? <Badge className="bg-amber-50 text-amber-700 text-[0.68rem]">WOCL</Badge>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap text-[0.72rem]">
                      {e.reason || '—'}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <button onClick={() => onEdit(e)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded p-1 mr-0.5"><Pencil size={13} /></button>
                      <button onClick={() => { if (confirm('Delete this entry?')) onDelete(e.id) }} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded p-1"><X size={13} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
