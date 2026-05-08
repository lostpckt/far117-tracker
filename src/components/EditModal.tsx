import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { parseDTPair, splitDT, ms } from '@/lib/calculations'
import type { Entry, Position, RestFacility, ReserveType } from '@/types/entry'

interface Props {
  entry: Entry
  onSave: (updated: Entry) => void
  onClose: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full text-[0.68rem] font-bold uppercase tracking-widest text-slate-400 mt-2">
      {children}
    </div>
  )
}

function DTField({ label, date, time, onDate, onTime, placeholder = '00:00' }: {
  label: string; date: string; time: string
  onDate: (v: string) => void; onTime: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs font-semibold text-slate-500">{label}</Label>
      <div className="flex gap-1.5">
        <Input type="date" value={date} onChange={e => onDate(e.target.value)} className="text-sm h-8 flex-[1.5] appearance-none" />
        <Input value={time} onChange={e => onTime(e.target.value)} placeholder={placeholder} maxLength={5} className="text-sm h-8 flex-1 min-w-0" />
      </div>
    </div>
  )
}

export default function EditModal({ entry, onSave, onClose }: Props) {
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

  useEffect(() => {
    setPilot(entry.pilot || '')
    setPosition(entry.position || 'CA')
    setAugmented(!!entry.augmented)
    setCrewCount((entry.crewCount === 4 ? 4 : 3) as 3 | 4)
    setRestFac(entry.restFacility || 'C1')
    setDep(entry.dep || '')
    setArr(entry.arr || '')
    setSegments(String(entry.segments || 1))
    setBlockTime(entry.blockTime != null ? String(entry.blockTime) : '')
    setAcclimated(entry.acclimated !== false)
    setReserveType(entry.reserveType || 'none')
    setReason(entry.reason || '')

    const fs = splitDT(entry.fdpStart);  setFdpSDate(fs.d); setFdpSTime(fs.t)
    const fe = splitDT(entry.fdpEnd);    setFdpEDate(fe.d); setFdpETime(fe.t)
    const rs = splitDT(entry.restStart); setRsDate(rs.d);   setRsTime(rs.t)
    const re = splitDT(entry.restEnd);   setReDate(re.d);   setReTime(re.t)
    setErr('')
  }, [entry])

  function handleSave() {
    setErr('')

    const fdpStart = parseDTPair(fdpSDate, fdpSTime)
    const fdpEnd   = parseDTPair(fdpEDate, fdpETime)
    if (!fdpStart) { setErr('FDP Start is required.'); return }
    if (!fdpEnd)   { setErr('FDP End is required.'); return }
    if ((ms(fdpEnd) ?? 0) <= (ms(fdpStart) ?? 0)) { setErr('FDP End must be after FDP Start.'); return }

    const segs  = parseInt(segments, 10)
    if (isNaN(segs) || segs < 1) { setErr('Segments must be at least 1.'); return }

    const block = parseFloat(blockTime)
    if (isNaN(block) || block <= 0) { setErr('Block time must be a positive number.'); return }

    onSave({
      ...entry,
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
      restStart: parseDTPair(rsDate, rsTime),
      restEnd:   parseDTPair(reDate, reTime),
      reason,
    })
  }

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Edit FDP Entry</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5 py-2">

          <SectionLabel>Identification</SectionLabel>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Pilot Name / ID</Label>
            <Input value={pilot} onChange={e => setPilot(e.target.value)} className="text-sm h-8" />
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
              <Checkbox id="e-aug" checked={augmented} onCheckedChange={v => setAugmented(!!v)} />
              <label htmlFor="e-aug" className="text-sm cursor-pointer">Augmented crew (§117.17)</label>
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
          <DTField label="FDP Start (Report / On-Duty)" date={fdpSDate} time={fdpSTime} onDate={setFdpSDate} onTime={setFdpSTime} placeholder="08:00" />
          <DTField label="FDP End (Off-Duty)"            date={fdpEDate} time={fdpETime} onDate={setFdpEDate} onTime={setFdpETime} placeholder="18:30" />

          <SectionLabel>Flight Details</SectionLabel>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Departure ICAO</Label>
            <Input value={dep} onChange={e => setDep(e.target.value.toUpperCase())} maxLength={4} className="text-sm h-8 uppercase" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Arrival ICAO</Label>
            <Input value={arr} onChange={e => setArr(e.target.value.toUpperCase())} maxLength={4} className="text-sm h-8 uppercase" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Flight Segments</Label>
            <Input type="number" value={segments} onChange={e => setSegments(e.target.value)} min={1} max={20} className="text-sm h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Total Block Time (hours)</Label>
            <Input type="number" value={blockTime} onChange={e => setBlockTime(e.target.value)} step="0.1" min="0" className="text-sm h-8" />
          </div>

          <SectionLabel>Conditions &amp; Reserve</SectionLabel>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox id="e-acc" checked={acclimated} onCheckedChange={v => setAcclimated(!!v)} />
              <label htmlFor="e-acc" className="text-sm cursor-pointer">Acclimated to local time zone (§117.5)</label>
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
          <DTField label="Rest Start"             date={rsDate} time={rsTime} onDate={setRsDate} onTime={setRsTime} placeholder="19:00" />
          <DTField label="Rest End (Next Report)" date={reDate} time={reTime} onDate={setReDate} onTime={setReTime} placeholder="06:00" />

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-slate-500">Exceedance / Notes</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Weather divert" className="text-sm h-8" />
          </div>

        </div>

        {err && <p className="text-red-600 text-xs mt-1">{err}</p>}

        <DialogFooter className="gap-2 mt-2">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-sm h-8">Save Changes</Button>
          <Button variant="secondary" onClick={onClose} className="text-sm h-8">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
