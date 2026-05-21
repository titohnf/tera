'use client'

import { useState, useTransition } from 'react'
import { saveBillingRates, type BillingRate } from '@/lib/actions/admin/billing-rates'

const JENJANG = ['Calistung', 'SD', 'SMP', 'SMA'] as const
const JENIS = ['Reguler', 'Fokus'] as const
const TYPES = [
  { key: 'group' as const, label: 'Kelas Grup', unit: 'Per Bulan', subtitle: 'Lebih dari 1 siswa' },
  { key: 'private' as const, label: 'Kelas Privat', unit: 'Per Pertemuan', subtitle: '1 siswa' },
]

type RateMap = Record<string, number>

function buildRateMap(rates: BillingRate[]): RateMap {
  const map: RateMap = {}
  for (const r of rates) {
    map[`${r.class_type}|${r.jenjang}|${r.jenis}`] = r.amount
  }
  return map
}

function buildPayload(map: RateMap): BillingRate[] {
  const rows: BillingRate[] = []
  for (const { key: ct } of TYPES) {
    for (const jenjang of JENJANG) {
      for (const jenis of JENIS) {
        if (jenjang === 'Calistung' && jenis === 'Fokus') continue
        const k = `${ct}|${jenjang}|${jenis}`
        rows.push({ class_type: ct, jenjang, jenis, amount: map[k] ?? 0 })
      }
    }
  }
  return rows
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function BillingRatesManager({ periodId, initialRates }: { periodId: string; initialRates: BillingRate[] }) {
  const [rateMap, setRateMap] = useState<RateMap>(() => buildRateMap(initialRates))
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function updateRate(key: string, value: number) {
    setRateMap(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await saveBillingRates(buildPayload(rateMap), periodId)
      if (res?.error) setError(res.error)
      else { setSaved(true); setEditing(false) }
    })
  }

  function handleCancel() {
    setRateMap(buildRateMap(initialRates))
    setEditing(false)
    setError(null)
    setSaved(false)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Tarif
          </button>
        )}
        {saved && <span className="text-sm text-green-600 font-medium">Tersimpan</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {TYPES.map(({ key: ct, label, unit, subtitle }) => (
          <div key={ct} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b">
              <p className="text-sm font-semibold text-blue-800">{label}</p>
              <p className="text-xs text-blue-500">{subtitle}</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-24">Jenjang</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Jenis</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-gray-500 w-36">{unit}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {JENJANG.map(jenjang =>
                  JENIS.filter(jenis => !(jenjang === 'Calistung' && jenis === 'Fokus')).map(jenis => {
                    const k = `${ct}|${jenjang}|${jenis}`
                    const rate = rateMap[k] ?? 0
                    return (
                      <tr key={k} className="hover:bg-blue-50/40">
                        <td className="px-4 py-2.5 text-gray-800 font-medium text-xs">{jenjang}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            jenis === 'Fokus'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {jenis === 'Fokus' ? 'Fokus [TKA/US/UTBK/OSN]' : 'Reguler'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 w-36">
                          {editing ? (
                            <input
                              type="number"
                              value={rate}
                              min={0}
                              step={1000}
                              onChange={e => updateRate(k, Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          ) : (
                            <p className={`text-right font-medium text-sm pr-1 ${rate === 0 ? 'text-gray-300' : 'text-gray-800'}`}>
                              {rate === 0 ? '—' : formatRp(rate)}
                            </p>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
