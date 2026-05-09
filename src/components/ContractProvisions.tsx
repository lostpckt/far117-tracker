import { useState } from 'react'
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ContractProvisions } from '@/types/entry'
import { DEFAULT_PROVISIONS } from '@/types/entry'

interface Props {
  provisions: ContractProvisions
  onChange: (p: ContractProvisions) => void
}

interface FieldDef {
  key: keyof ContractProvisions
  label: string
  cite: string
  farDefault: number
  unit: string
  step: number
  min: number
}

const FIELDS: FieldDef[] = [
  { key: 'minRestHours',       label: 'Min pre-FDP rest',          cite: '§117.25', farDefault: 10,   unit: 'h', step: 0.5, min: 0.5 },
  { key: 'minWeeklyRestHours', label: 'Min weekly free time',       cite: '§117.25', farDefault: 30,   unit: 'h', step: 1,   min: 1   },
  { key: 'maxBlock28Hours',    label: '28-day block limit',         cite: '§117.23', farDefault: 100,  unit: 'h', step: 1,   min: 1   },
  { key: 'maxBlock365Hours',   label: '365-day block limit',        cite: '§117.23', farDefault: 1000, unit: 'h', step: 10,  min: 10  },
  { key: 'maxFdp168Hours',     label: '7-day FDP hours limit',      cite: '§117.23', farDefault: 60,   unit: 'h', step: 1,   min: 1   },
  { key: 'maxFdp672Hours',     label: '28-day FDP hours limit',     cite: '§117.23', farDefault: 190,  unit: 'h', step: 1,   min: 1   },
]

function isModified(p: ContractProvisions) {
  return FIELDS.some(f => p[f.key] !== f.farDefault)
}

function modifiedCount(p: ContractProvisions) {
  return FIELDS.filter(f => p[f.key] !== f.farDefault).length
}

export default function ContractProvisions({ provisions, onChange }: Props) {
  const [open, setOpen] = useState(false)
  // Local draft strings so clearing/mid-typing don't force an immediate commit
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  function handleChange(key: keyof ContractProvisions, raw: string) {
    setDrafts(d => ({ ...d, [key]: raw }))
  }

  function handleBlur(key: keyof ContractProvisions, raw: string) {
    const v = parseFloat(raw)
    if (isNaN(v) || v <= 0) {
      // Revert draft to last committed value
      setDrafts(d => ({ ...d, [key]: '' }))
    } else {
      setDrafts(d => ({ ...d, [key]: '' }))
      if (v !== provisions[key]) onChange({ ...provisions, [key]: v })
    }
  }

  // When Reset is clicked, clear drafts too
  function reset() {
    setDrafts({})
    onChange({ ...DEFAULT_PROVISIONS })
  }

  const modified = isModified(provisions)
  const count    = modifiedCount(provisions)

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          className="flex items-center gap-2 w-full text-left"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <ChevronDown size={15} className="text-slate-400 shrink-0" /> : <ChevronRight size={15} className="text-slate-400 shrink-0" />}
          <CardTitle className="text-sm font-bold">Contract Provisions</CardTitle>
          {modified && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[0.65rem] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              {count} modified
            </span>
          )}
        </button>
      </CardHeader>

      {open && (
        <CardContent className="pt-0">
          <p className="text-[0.78rem] text-slate-500 dark:text-slate-400 mb-3">
            Override FAR minimums with contract-specified limits. Leave at defaults if your contract provides no stricter requirement.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {FIELDS.map(f => {
              const changed    = provisions[f.key] !== f.farDefault
              const draftVal   = drafts[f.key]
              const displayVal = draftVal !== undefined ? draftVal : String(provisions[f.key])
              return (
                <div key={f.key} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[0.75rem] font-medium text-slate-700 dark:text-slate-300 leading-snug">
                      {f.label}
                      <span className="ml-1 text-[0.68rem] text-slate-400 font-normal">{f.cite}</span>
                    </label>
                    <div className="text-[0.68rem] text-slate-400">FAR default: {f.farDefault.toLocaleString()}{f.unit}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      value={displayVal}
                      min={f.min}
                      step={f.step}
                      onChange={e => handleChange(f.key, e.target.value)}
                      onBlur={e => handleBlur(f.key, e.target.value)}
                      className={[
                        'w-20 text-right text-sm px-2 py-1 rounded border focus:outline-none focus:ring-1',
                        changed
                          ? 'border-violet-400 bg-violet-50 text-violet-800 focus:ring-violet-400 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-500'
                          : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-600 focus:ring-blue-400',
                      ].join(' ')}
                    />
                    <span className="text-[0.75rem] text-slate-500 w-4">{f.unit}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {modified && (
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="text-slate-600 border-slate-200 h-7 text-xs gap-1.5"
              >
                <RotateCcw size={12} />
                Reset to FAR Defaults
              </Button>
              <span className="text-[0.72rem] text-violet-600 dark:text-violet-400">
                {count} provision{count !== 1 ? 's' : ''} differ from FAR defaults
              </span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
