import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { uid, parseDTPair, ms, exportCSV, generateReport } from '@/lib/calculations'
import type { Entry, Position, RestFacility, ReserveType } from '@/types/entry'

interface Props {
  entries: Entry[]
  onAdd: (updated: Entry[]) => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full text-[0.68rem] font-bold uppercase tracking-widest text-slate-400 mt-2">
      {children}
    </div>
  )
}

function DTField({
  label, date, time, onDate, onTime, hint, placeholder = '00:00',
}: {
  label: string; date: string; time: string
  onDate: (v: string) => void; onTime: (v: string) => void
  hint?: string; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs font-semibold text-slate-500">{label}</Label>
      <div className="flex gap-1.5">
        <Input type="date" value={date} onChange={e => onDate(e.target.value)} className="text-sm h-8 flex-[1.5] appearance-none" />
        <Input value={time} onChange={e => onTime(e.target.value)} placeholder={placeholder} maxLength={5} className="text-sm h-8 flex-1 min-w-0" />
      </div>
      {hint && <span className="text-[0.68rem] text-slate-400">{hint}</span>}
    </div>
  )
}

export default function AddEntryForm({ entries, onAdd }: Props) {
  const [pilot,       setPilot]       = useState('')
  const [position,    setPosition]    = useState<Position>('CA')
  const [augmented,   setAugmented]   = useState(false)
  const [crewCount,   setCrewCount]   = useState<3 | 4>(3)
  const [restFac,     setRestFac]     = useState<RestFacility>('C1')
  const [fdpSDate,    setFdpSDate]    = useState('')
  const [fdpSTime,    setFdpSTime]    = useState('')
  const [fdpEDate,    setFdpEDate]    = useState('')
  const [fdpETime,    setFdpETime]    = useState('')
  const [dep,         setDep]         = useState('')
  const [arr,         setArr]         = useState('')
  const [segments,    setSegments]    = useState('1')
  const [blockTime,   setBlockTime]   = useState('')
  const [acclimated,  setAcclimated]  = useState(true)
  const [reserveType, setReserveType] = useState<ReserveType>('none')
  const [rsDate,      setRsDate]      = useState('')
  const [rsTime,      setRsTime]      = useState('')
  const [reDate,      setReDate]      = useState('')
  const [reTime,      setReTime]      = useState('')
  const [reason,      setReason]      = useState('')
  const [err,         setErr]         = useState('')
  const [rptPeriod,   setRptPeriod]   = useState('28')

  function resetForm() {
    setFdpSDate(''); setFdpSTime(''); setFdpEDate(''); setFdpETime('')
    setDep(''); setArr(''); setSegments('1'); setBlockTime('')
    setAugmented(false); setCrewCount(3); setRestFac('C1')
    setAcclimated(true); setReserveType('none')
    setRsDate(''); setRsTime(''); setReDate(''); setReTime('')
    setReason(''); setErr('')
  }

  function handleAdd() {
    setErr('')

    const fdpStart = parseDTPair(fdpSDate, fdpSTime)
    const fdpEnd   = parseDTPair(fdpEDate, fdpETime)
    if (!fdpStart) { setErr('FDP Start is required.'); return }
    if (!fdpEnd)   { setErr('FDP End is required.'); return }
    if ((ms(fdpEnd) ?? 0) <= (ms(fdpStart) ?? 0)) { setErr('FDP End must be after FDP Start.'); return }

    const segs = parseInt(segments, 10)
    if (isNaN(segs) || segs < 1) { setErr('Segments must be at least 1.'); return }

    const block = parseFloat(blockTime)
    if (isNaN(block) || block <= 0) { setErr('Block time must be a positive number.'); return }

    const restStart = parseDTPair(rsDate, rsTime)
    const restEnd   = parseDTPair(reDate, reTime)

    const entry: Entry = {
      id: uid(),
      pilot,
      position,
      augmented,
      crewCount: augmented ? crewCount : 2,
      restFacility: augmented ? restFac : 'C1',
      fdpStart,
      fdpEnd,
      segments: segs,
      blockTime: block,
      dep: dep.toUpperCase().trim(),
      arr: arr.toUpperCase().trim(),
      acclimated,
      reserveType,
      restStart,
      restEnd,
      reason,
    }

    onAdd([...entries, entry])
    resetForm()
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">Log FDP</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">

          <SectionLabel>Identification</SectionLabel>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Pilot Name / ID</Label>
            <Input value={pilot} onChange={e => setPilot(e.target.value)} placeholder="e.g. J. Smith" className="text-sm h-8" />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Position</Label>
            <Select value={position} onValueChange={v => setPosition(v as Position)}>
              <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CA">CA — Captain</SelectItem>
                <SelectItem value="FO">FO — First Officer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SectionLabel>Crew Configuration</SectionLabel>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox id="f-aug" checked={augmented} onCheckedChange={v => setAugmented(!!v)} />
              <label htmlFor="f-aug" className="text-sm cursor-pointer">Augmented crew (§117.17)</label>
            </div>
          </div>

          {augmented && (
            <>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-slate-500">Crew Count</Label>
                <Select value={String(crewCount)} onValueChange={v => setCrewCount(parseInt(v) as 3 | 4)}>
                  <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3-pilot crew</SelectItem>
                    <SelectItem value="4">4-pilot crew</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-slate-500">Rest Facility (Table C)</Label>
                <Select value={restFac} onValueChange={v => setRestFac(v as RestFacility)}>
                  <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C1">C1 — Flat bed / business class</SelectItem>
                    <SelectItem value="C2">C2 — Seat reclines ≥40°</SelectItem>
                    <SelectItem value="C3">C3 — Economy / coach seat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <SectionLabel>FDP Times (local)</SectionLabel>

          <DTField
            label="FDP Start (Report / On-Duty)"
            date={fdpSDate} time={fdpSTime}
            onDate={setFdpSDate} onTime={setFdpSTime}
            placeholder="08:00"
            hint="When duty began (24-hr local)"
          />

          <DTField
            label="FDP End (Off-Duty)"
            date={fdpEDate} time={fdpETime}
            onDate={setFdpEDate} onTime={setFdpETime}
            placeholder="18:30"
            hint="When FDP officially ended (24-hr local)"
          />

          <SectionLabel>Flight Details</SectionLabel>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Departure ICAO</Label>
            <Input value={dep} onChange={e => setDep(e.target.value.toUpperCase())} maxLength={4} placeholder="KSFO" className="text-sm h-8 uppercase" />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Arrival ICAO</Label>
            <Input value={arr} onChange={e => setArr(e.target.value.toUpperCase())} maxLength={4} placeholder="KLAX" className="text-sm h-8 uppercase" />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Flight Segments</Label>
            <Input
              type="number"
              value={segments}
              onChange={e => setSegments(e.target.value)}
              min={1}
              max={20}
              className="text-sm h-8"
            />
            <span className="text-[0.68rem] text-slate-400">Number of takeoff-to-landing legs in this FDP</span>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Total Block Time (hours)</Label>
            <Input
              type="number"
              value={blockTime}
              onChange={e => setBlockTime(e.target.value)}
              placeholder="4.5"
              step="0.1"
              min="0"
              className="text-sm h-8"
            />
            <span className="text-[0.68rem] text-slate-400">Decimal hours (e.g. 4.5 = 4h 30m)</span>
          </div>

          <SectionLabel>Conditions &amp; Reserve</SectionLabel>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox id="f-acc" checked={acclimated} onCheckedChange={v => setAcclimated(!!v)} />
              <label htmlFor="f-acc" className="text-sm cursor-pointer">Acclimated to local time zone (§117.5)</label>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Reserve Status</Label>
            <Select value={reserveType} onValueChange={v => setReserveType(v as ReserveType)}>
              <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not on reserve</SelectItem>
                <SelectItem value="airport">Airport reserve</SelectItem>
                <SelectItem value="short-call">Short-call reserve</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SectionLabel>Rest Period After This FDP</SectionLabel>

          <DTField
            label="Rest Start"
            date={rsDate} time={rsTime}
            onDate={setRsDate} onTime={setRsTime}
            placeholder="19:00"
            hint="When rest began after off-duty (24-hr)"
          />

          <DTField
            label="Rest End (Next Report)"
            date={reDate} time={reTime}
            onDate={setReDate} onTime={setReTime}
            placeholder="06:00"
          />

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Exceedance / Notes</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Weather divert, ATC delay" className="text-sm h-8" />
          </div>

        </div>

        {err && <p className="text-red-600 text-xs mt-3">{err}</p>}

        <div className="flex flex-wrap gap-2.5 mt-4 items-center">
          <Button onClick={handleAdd} className="bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm h-8">
            Add FDP Entry
          </Button>

          <Button variant="outline" onClick={() => exportCSV(entries)} className="text-green-700 border-green-200 bg-green-50 hover:bg-green-600 hover:text-white text-sm h-8">
            Export CSV
          </Button>

          <div className="flex items-center gap-2">
            <Select value={rptPeriod} onValueChange={setRptPeriod}>
              <SelectTrigger className="text-sm h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="28">Last 28 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 365 days</SelectItem>
                <SelectItem value="0">All entries</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                const days = parseInt(rptPeriod, 10) || null
                const html = generateReport(entries, days === 0 ? null : days)
                if (!html) { alert('No entries found for the selected period.'); return }
                const w = window.open('', '_blank')
                w?.document.write(html)
                w?.document.close()
              }}
              className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white text-sm h-8"
            >
              Compliance Report
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => { if (confirm('Delete ALL FDP entries? This cannot be undone.')) onAdd([]) }}
            className="text-red-600 border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-sm h-8"
          >
            Clear All Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
