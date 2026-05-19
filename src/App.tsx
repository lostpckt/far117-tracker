import { useState, useEffect } from 'react'
import { loadEntries, saveEntries, loadProvisions, saveProvisions } from '@/lib/storage'
import { ms } from '@/lib/calculations'
import type { Entry, ContractProvisions } from '@/types/entry'
import Header from '@/components/Header'
import RegNote from '@/components/RegNote'
import Dashboard from '@/components/Dashboard'
import AddEntryForm from '@/components/AddEntryForm'
import FlightLog from '@/components/FlightLog'
import EditModal from '@/components/EditModal'
import QuickReference from '@/components/QuickReference'
import ContractProvisionsCard from '@/components/ContractProvisions'
import UpdateBanner from '@/components/UpdateBanner'
import InstallBanner from '@/components/InstallBanner'

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(loadEntries)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [dark, setDark] = useState(() => localStorage.getItem('far117_theme') === 'dark')
  const [provisions, setProvisions] = useState<ContractProvisions>(loadProvisions)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('far117_theme', dark ? 'dark' : 'light')
  }, [dark])

  function updateProvisions(p: ContractProvisions) {
    setProvisions(p)
    saveProvisions(p)
  }

  function updateEntries(next: Entry[]) {
    const sorted = [...next].sort(
      (a, b) => (ms(a.fdpStart) ?? 0) - (ms(b.fdpStart) ?? 0)
    )
    setEntries(sorted)
    saveEntries(sorted)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
      <Header dark={dark} onToggleDark={() => setDark(d => !d)} />
      <div className="max-w-screen-2xl mx-auto p-5 space-y-5">
        <InstallBanner />
        <RegNote />
        <Dashboard entries={entries} provisions={provisions} />
        <AddEntryForm entries={entries} onAdd={updateEntries} provisions={provisions} />
        <FlightLog
          entries={entries}
          provisions={provisions}
          onEdit={setEditingEntry}
          onDelete={id => updateEntries(entries.filter(e => e.id !== id))}
        />
        <ContractProvisionsCard provisions={provisions} onChange={updateProvisions} />
        <QuickReference />
      </div>

      <UpdateBanner />

      {editingEntry && (
        <EditModal
          entry={editingEntry}
          onSave={updated => {
            updateEntries(entries.map(e => e.id === updated.id ? updated : e))
            setEditingEntry(null)
          }}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  )
}
