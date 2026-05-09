import type { Entry, ContractProvisions } from '@/types/entry'
import { DEFAULT_PROVISIONS } from '@/types/entry'

const KEY      = 'far117_v1'
const PROV_KEY = 'far117_provisions_v1'

export function loadEntries(): Entry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function saveEntries(entries: Entry[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function loadProvisions(): ContractProvisions {
  try {
    const stored = JSON.parse(localStorage.getItem(PROV_KEY) || 'null')
    return stored ? { ...DEFAULT_PROVISIONS, ...stored } : DEFAULT_PROVISIONS
  } catch { return DEFAULT_PROVISIONS }
}

export function saveProvisions(p: ContractProvisions): void {
  localStorage.setItem(PROV_KEY, JSON.stringify(p))
}
