import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  {
    title: 'Table B — Unaugmented FDP Limits (§117.15)',
    body: 'Maximum FDP varies by report time (local) and number of flight segments. Peak window 0700–1159: up to 14h for 1–2 segs, dropping to 11.5h at 7+ segs. Overnight starts (0000–0359) are capped at 9h regardless of segments. The limit shown in the log already reflects any WOCL reduction.',
  },
  {
    title: 'Table C — Augmented FDP Limits (§117.17)',
    body: 'Augmented operations extend the FDP limit based on the onboard rest facility class and crew count. C1 (flat bed) + 4 pilots allows up to 19h in the 0700–1259 window. C3 (economy seat) + 3 pilots is limited to 13–15h. Select the correct facility class when logging an augmented FDP.',
  },
  {
    title: 'WOCL — Window of Circadian Low (§117.7)',
    body: 'The WOCL is 0200–0559 local time. Any FDP that overlaps this window (starts before 0600 or runs past 0200) has its Table B limit reduced by 30 minutes. The tracker applies this automatically and labels affected rows "WOCL−30m". Augmented Table C limits are not further reduced.',
  },
  {
    title: 'Pre-FDP Rest (§117.25)',
    body: 'A flightcrew member must receive at least 10 consecutive hours of rest immediately before beginning an FDP. Enter Rest Start and Rest End after each FDP to track this requirement. The "Rest OK?" column flags any rest period shorter than 10 hours.',
  },
  {
    title: 'Weekly Rest (§117.25)',
    body: 'No certificate holder may schedule, and no flightcrew member may accept, an FDP unless the crewmember has had 30 consecutive hours free from all duty within the preceding 168 consecutive hours. The tracker checks gaps between logged FDPs to assess this requirement.',
  },
  {
    title: '§117.23 Cumulative Flight Time Limits',
    body: '100 block hours in any 672 consecutive hours (28 days). 1,000 block hours in any 365 consecutive days. These are rolling windows, not calendar-anchored. The dashboard shows your running totals as of the most recent FDP.',
  },
  {
    title: '§117.23 Cumulative FDP Limits',
    body: '60 FDP hours in any 168 consecutive hours (7 days). 190 FDP hours in any 672 consecutive hours (28 days). FDP hours are the total on-duty time from report to off-duty, not just block time. Both are tracked as rolling windows.',
  },
  {
    title: 'How to Use This Tool',
    body: 'Log one entry per FDP. Enter the report time as FDP Start and off-duty release as FDP End. Block time is total airborne hours for the FDP (decimal, e.g. 4.5 = 4h 30m). Rest Start/End are optional but required for rest compliance tracking. All times are local.',
  },
]

export default function QuickReference() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">§117 Quick Reference</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3.5">
          {sections.map(s => (
            <div key={s.title} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3.5 py-3 border-l-[3px] border-blue-500">
              <h3 className="text-[0.8rem] font-bold text-slate-800 dark:text-slate-100 mb-1">{s.title}</h3>
              <p className="text-[0.78rem] text-slate-500 dark:text-slate-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
