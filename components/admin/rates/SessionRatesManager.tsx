'use client'

import { useState, forwardRef, useImperativeHandle } from 'react'
import { saveSessionRates, type SessionRate } from '@/lib/actions/admin/session-rates'

const JENJANG = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum'] as const
const JENIS = ['Reguler', 'Fokus'] as const
const TYPES = [
  {
    key: 'group' as const,
    label: 'Kelas Grup',
    subtitle: 'Lebih dari 1 siswa',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    jenjangList: JENJANG,
    jenisList: JENIS,
  },
  {
    key: 'private' as const,
    label: 'Kelas Privat',
    subtitle: '1 siswa',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    jenjangList: JENJANG,
    jenisList: JENIS,
  },
  {
    key: 'yayasan' as const,
    label: 'Kelas Yayasan',
    subtitle: 'Tanpa invoice orang tua',
    icon: 'M12 21v-8m0 0L4.5 9.5 12 5l7.5 4.5L12 13zM4.5 9.5V16L12 20.5 19.5 16V9.5',
    jenjangList: ['Yayasan'] as const,
    jenisList: ['Reguler'] as const,
  },
]

type RateMap = Record<string, number>

function buildRateMap(rates: SessionRate[]): RateMap {
  const map: RateMap = {}
  for (const r of rates) {
    map[`${r.class_type}|${r.jenjang}|${r.jenis}`] = r.rate_per_session
  }
  return map
}

function buildPayload(map: RateMap): SessionRate[] {
  const rows: SessionRate[] = []
  for (const { key: ct, jenjangList, jenisList } of TYPES) {
    for (const jenjang of jenjangList) {
      for (const jenis of jenisList) {
        if (jenjang === 'Calistung' && jenis === 'Fokus') continue
        const k = `${ct}|${jenjang}|${jenis}`
        rows.push({ class_type: ct, jenjang, jenis, rate_per_session: map[k] ?? 0 })
      }
    }
  }
  return rows
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export interface SessionRatesManagerHandle {
  save: () => Promise<{ error?: string }>
  cancel: () => void
}

const SessionRatesManager = forwardRef<
  SessionRatesManagerHandle,
  { periodId: string; initialRates: SessionRate[]; editing: boolean }
>(({ periodId, initialRates, editing }, ref) => {
  const [rateMap, setRateMap] = useState<RateMap>(() => buildRateMap(initialRates))

  useImperativeHandle(ref, () => ({
    async save() {
      const res = await saveSessionRates(buildPayload(rateMap), periodId)
      return res?.error ? { error: res.error } : {}
    },
    cancel() {
      setRateMap(buildRateMap(initialRates))
    },
  }), [rateMap, periodId, initialRates])

  function updateRate(key: string, value: number) {
    setRateMap(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {TYPES.map(({ key: ct, label, subtitle, icon, jenjangList, jenisList }) => (
        <div key={ct} className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5 w-24">Jenjang</th>
                <th className="text-left px-3 py-2.5">Jenis</th>
                <th className="text-right px-3 py-2.5 w-36">Gaji / Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jenjangList.map(jenjang =>
                jenisList.filter(jenis => !(jenjang === 'Calistung' && jenis === 'Fokus')).map(jenis => {
                  const k = `${ct}|${jenjang}|${jenis}`
                  const rate = rateMap[k] ?? 0
                  return (
                    <tr key={k} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-800 font-medium">{jenjang}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                          jenis === 'Fokus' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {jenis}
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
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
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
  )
})

SessionRatesManager.displayName = 'SessionRatesManager'
export default SessionRatesManager
