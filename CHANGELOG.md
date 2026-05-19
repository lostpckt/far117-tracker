# Changelog

All notable changes to the FAR 117 / 121 Duty & Flight Time Tracker will be documented here.

## [1.2.2] — 2026-05-19

### Added
- **Collapsible quick reference** — the §117 Quick Reference card at the bottom of the page can now be expanded/collapsed by tapping the header; defaults to collapsed and remembers the preference across sessions
- **Install banner** — users viewing the app in a browser (mobile or desktop) see a one-time dismissible prompt with platform-specific instructions for adding the app to their home screen; hidden automatically when already running as an installed PWA

### Changed
- **FDP Start date defaults to today** — the date field now pre-fills with today's local date instead of being blank
- **Native time picker on all time fields** — FDP Start, FDP End, Rest Start, and Rest End now use `type="time"` in both the Log FDP form and Edit modal, bringing up the OS scroll-wheel/clock picker on mobile instead of the keyboard; also fixes the height mismatch between date and time fields

## [1.2.1] — 2026-05-15

### Fixed
- Compliance report page had no way to return to the app — added a Close button alongside the Print button

## [1.2.0] — 2026-05-14

### Added
- Form draft autosave: all Log FDP fields are continuously saved to localStorage as you type; the form is fully restored if the app is closed, refreshed, or the phone sleeps mid-entry. A "Clear form" link discards the draft without submitting.
- What's new: button in the header opens an in-app changelog modal so users can see what has changed without leaving the app
- Check for update: button in the header manually triggers a service worker refresh

## [1.1.0] — 2026-05-08

### Contract Provisions

Pilots can now configure contractual limits that are more restrictive than the FAR 117 defaults. Settings are stored in localStorage and persist across sessions.

**Six configurable limits**
- Minimum pre-FDP rest (§117.25) — default 10h; supports 0.5h increments (e.g., 11h at base)
- Minimum weekly duty-free time (§117.25) — default 30h consecutive in 168h
- 28-day block limit (§117.23) — default 100h
- 365-day block limit (§117.23) — default 1,000h
- 7-day FDP hours limit (§117.23) — default 60h
- 28-day FDP hours limit (§117.23) — default 190h

**UI**
- Collapsible "Contract Provisions" card between the FDP log and quick reference section
- Inputs highlight violet and a "X modified" badge appears on the card header whenever any value differs from the FAR default
- "Reset to FAR Defaults" button restores all six values at once
- Input values commit on blur; invalid entries (blank, zero) revert to the last saved value

**Effect on calculations**
- All compliance checks — FDP log row flags, Dashboard stat cards, violation tallies — use the contractual limits in real time
- Dashboard remaining-hours sub-labels and amber warning thresholds scale to the contractual limit
- FDP log "Req: Xh" and "/ Xh" sub-labels update to reflect active provisions
- Compliance report scorecard labels updated with contractual values; modified rows tagged "(contract)"
- Report stat boxes, violation detail text, and FDP log column headers all reflect active provisions
- Report footer lists active provisions when any differ from FAR defaults
- CSV export and compliance report generation both respect active provisions

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
