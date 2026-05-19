import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HowToUse() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('far117_howto_collapsed') !== 'false'
  )

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('far117_howto_collapsed', String(next))
  }

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer select-none" onClick={toggle}>
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          How to Use This Tool
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          />
        </CardTitle>
      </CardHeader>
      {!collapsed && (
        <CardContent>
          <p className="text-[0.78rem] text-slate-500 dark:text-slate-400 leading-relaxed">
            Log one entry per FDP. Enter the report time as FDP Start and off-duty release as FDP End. Block time is total airborne hours for the FDP (decimal, e.g. 4.5 = 4h 30m). Rest Start/End are optional but required for rest compliance tracking. All times are local.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
