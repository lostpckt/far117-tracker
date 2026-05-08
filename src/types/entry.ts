export type Position = 'CA' | 'FO'
export type RestFacility = 'C1' | 'C2' | 'C3'
export type ReserveType = 'none' | 'airport' | 'short-call'

export interface Entry {
  id: string
  pilot: string
  position: Position
  augmented: boolean
  crewCount: 2 | 3 | 4
  restFacility: RestFacility
  fdpStart: string        // "YYYY-MM-DDTHH:MM" local time
  fdpEnd: string          // "YYYY-MM-DDTHH:MM" local time
  segments: number        // number of flight segments in this FDP
  blockTime: number       // total block flight hours (decimal)
  dep: string             // first departure ICAO
  arr: string             // final arrival ICAO
  acclimated: boolean     // acclimated to local time zone (§117.5)
  reserveType: ReserveType
  restStart: string       // "YYYY-MM-DDTHH:MM"
  restEnd: string         // "YYYY-MM-DDTHH:MM"
  reason: string
}

export interface Computed {
  fdpActual: number | null    // actual FDP duration (hours)
  fdpLimit: number            // §117.15/117.17 table limit
  fdpOk: boolean | null
  fdpExc: number              // hours over FDP limit
  rolling28: number | null    // block hrs in past 672 consecutive hours
  rolling365: number | null   // block hrs in past 365 calendar days
  hours28Ok: boolean | null   // ≤100h
  hours365Ok: boolean | null  // ≤1000h
  fdpHours168: number | null  // FDP hrs in past 168 consecutive hours
  fdpHours672: number | null  // FDP hrs in past 672 consecutive hours
  fdp168Ok: boolean | null    // ≤60h
  fdp672Ok: boolean | null    // ≤190h
  consRest: number | null     // consecutive rest after this FDP
  restOk: boolean | null      // ≥10h
  weekly30Ok: boolean | null  // 30+ consecutive hours free in past 168h
  woclFlag: boolean           // FDP starts in WOCL (0200–0559)
}
