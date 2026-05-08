# Changelog

All notable changes to the FAR 117 / 121 Duty & Flight Time Tracker will be documented here.

## [1.0.0] — 2026-05-08

### Initial release

**FDP limit calculations**
- §117.15 Table B lookup for unaugmented operations (10 start-time rows × 7 segment columns)
- §117.17 Table C lookup for augmented operations (5 start-time rows × 6 rest-facility/crew-count columns: C1/C2/C3 × 3-pilot/4-pilot)
- Automatic WOCL detection: any FDP overlapping 0200–0559 local time has its Table B limit reduced by 30 minutes per §117.7
- WOCL flag shown inline in the FDP log and in the compliance report

**§117.23 rolling cumulative limits**
- 100 block hours in any 672 consecutive hours (28 days)
- 1,000 block hours in any 365 consecutive days
- 60 FDP hours in any 168 consecutive hours (7 days)
- 190 FDP hours in any 672 consecutive hours (28 days)
- All windows are rolling (not calendar-anchored) and include boundary entries

**§117.25 rest requirements**
- Pre-FDP consecutive rest tracking: flags any rest period under 10 hours
- §117.25(c) weekly rest check: verifies a 30-consecutive-hour duty-free period exists within the preceding 168 hours

**Augmented crew**
- Position (CA/FO), augmented toggle, crew count (3/4), and rest facility (C1/C2/C3) captured per FDP
- Acclimated status and reserve type (none/airport/short-call) recorded for reference

**Dashboard**
- Last FDP duration vs table limit
- Last pre-FDP rest vs 10h requirement
- Active violations count (FDP, rest, weekly rest, and all four §117.23 rolling limits)
- Four rolling-window stat cards updated as of the most recent FDP

**FDP log**
- One row per flight duty period; sorted by FDP start time
- Columns: FDP start/end, pilot, crew config, route, segments, block time, FDP actual/limit, FDP OK, 28-day block, 365-day block, 7-day FDP hours, 28-day FDP hours, pre-FDP rest, rest OK, 30h/168h weekly rest, WOCL flag, notes

**Compliance report**
- HTML report (printable / save as PDF) with configurable period: last 28 days, 90 days, 365 days, or all entries
- Scorecard table covering all §117.23 and §117.25 requirements
- Violations detail section and full FDP log for the selected period
- Rolling-window totals computed as of the most recent FDP across all data

**Export**
- CSV export of all FDP entries with all computed fields including weekly rest status

**App infrastructure**
- Data stored in browser localStorage (`far117_v1` key); never leaves the device
- PWA: installable on iOS, Android, and desktop; fully offline-capable via service worker
- In-app update banner when a new version is deployed
- Dark mode with persistent preference (`far117_theme` key)
- All times interpreted as local time at the departure point (§117.5)
