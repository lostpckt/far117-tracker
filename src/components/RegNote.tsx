export default function RegNote() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
      <strong>Regulatory reference:</strong> 14 CFR Part 117 — Flight and Duty Limitations and Rest Requirements: Flightcrew Members (applicable to Part 121 certificate holders).{' '}
      This tool is for <strong>reference and record-keeping only</strong>. Always verify compliance with your OpSpec, POI, and company manual.{' '}
      All times must be <strong>local time at the departure point</strong> for acclimated crew (§117.5). Uncheck "Acclimated" when operating without 36+ consecutive hours rest in the new time zone.
    </div>
  )
}
