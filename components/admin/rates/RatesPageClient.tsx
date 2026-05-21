'use client'

import { useState, useTransition } from 'react'
import DatePicker from '@/components/ui/DatePicker'
import SessionRatesManager from './SessionRatesManager'
import {
  createRatePeriod, setActivePeriod, deleteRatePeriod,
  type SessionRate, type RatePeriod,
} from '@/lib/actions/admin/session-rates'
import RatesReadOnly from './RatesReadOnly'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RatesPageClient({
  periods,
  allRates,
}: {
  periods: RatePeriod[]
  allRates: (SessionRate & { period_id: string })[]
}) {
  const activePeriod = periods.find(p => p.is_active) ?? periods[0] ?? null
  const olderPeriods = periods.filter(p => p.id !== activePeriod?.id)

  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [copyFrom, setCopyFrom] = useState<string>(activePeriod?.id ?? 'none')
  const [formError, setFormError] = useState<string | null>(null)
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function toggleAccordion(id: string) {
    setOpenAccordions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handleCreatePeriod() {
    setFormError(null)
    const sourceId = copyFrom === 'none' ? null : copyFrom
    startTransition(async () => {
      const res = await createRatePeriod(newName, newStart, newEnd || null, sourceId)
      if ('error' in res) { setFormError(res.error); return }
      setShowNewForm(false)
      setNewName(''); setNewStart(''); setNewEnd('')
    })
  }

  function handleSetActive(periodId: string) {
    startTransition(async () => { await setActivePeriod(periodId) })
  }

  function handleDelete(periodId: string) {
    if (!confirm('Hapus periode ini beserta semua tarifnya?')) return
    startTransition(async () => {
      const res = await deleteRatePeriod(periodId)
      if (res?.error) alert(res.error)
    })
  }

  return (
    <div className="space-y-6">

      {/* ── New period form / button ── */}
      {showNewForm ? (
        <div className="bg-white border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800">Buat Periode Tarif Baru</p>
            <button onClick={() => { setShowNewForm(false); setFormError(null) }}
              className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Periode <span className="text-red-500">*</span></label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Sem. Ganjil 2026/2027"
                className="w-full pl-3 pr-9 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Mulai <span className="text-red-500">*</span></label>
              <DatePicker value={newStart} onChange={setNewStart} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Selesai <span className="text-gray-400 font-normal">(opsional)</span></label>
              <DatePicker value={newEnd} onChange={setNewEnd} />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Salin tarif dari</label>
            <select value={copyFrom} onChange={e => setCopyFrom(e.target.value)}
              className="pl-3 pr-9 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.is_active ? ' (aktif)' : ''}</option>
              ))}
              <option value="none">— Mulai kosong</option>
            </select>
          </div>
          {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreatePeriod} disabled={isPending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              {isPending ? 'Membuat...' : 'Buat Periode'}
            </button>
            <button onClick={() => { setShowNewForm(false); setFormError(null) }}
              className="px-4 py-2 border text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              Batal
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Periode Tarif Baru
        </button>
      )}

      {/* ── Active / current period ── */}
      {activePeriod ? (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">{activePeriod.name}</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Berlaku</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(activePeriod.start_date)}
                {activePeriod.end_date ? ` – ${formatDate(activePeriod.end_date)}` : ' · Tanpa batas'}
              </p>
            </div>
          </div>
          <SessionRatesManager
            key={activePeriod.id}
            periodId={activePeriod.id}
            initialRates={allRates.filter(r => r.period_id === activePeriod.id)}
          />
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed rounded-xl p-12 text-center">
          <p className="text-sm text-gray-400">Belum ada periode tarif. Buat periode baru untuk memulai.</p>
        </div>
      )}

      {/* ── Older periods accordion ── */}
      {olderPeriods.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Periode Sebelumnya</p>
          <div className="space-y-2">
            {olderPeriods.map(p => {
              const isOpen = openAccordions.has(p.id)
              const rates = allRates.filter(r => r.period_id === p.id)
              return (
                <div key={p.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(p.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-blue-50/50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(p.start_date)}
                        {p.end_date ? ` – ${formatDate(p.end_date)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100">
                      <div className="px-5 py-3 flex items-center justify-between bg-gray-50/50">
                        <p className="text-xs text-gray-500">Tarif hanya dapat dilihat. Buat periode baru untuk mengubah tarif.</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSetActive(p.id)}
                            disabled={isPending}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition-colors"
                          >
                            Jadikan Aktif
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={isPending}
                            className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                      <RatesReadOnly rates={rates} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
