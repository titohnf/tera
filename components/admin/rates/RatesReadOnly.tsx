import type { SessionRate } from '@/lib/actions/admin/session-rates'

const JENJANG = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum'] as const
const JENIS = ['Reguler', 'Fokus'] as const
const TYPES = [
  {
    key: 'group' as const,
    label: 'Kelas Grup',
    subtitle: 'Lebih dari 1 siswa',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    key: 'private' as const,
    label: 'Kelas Privat',
    subtitle: '1 siswa',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
]

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function RatesReadOnly({ rates }: { rates: SessionRate[] }) {
  const rateMap: Record<string, number> = {}
  for (const r of rates) {
    rateMap[`${r.class_type}|${r.jenjang}|${r.jenis}`] = r.rate_per_session
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      {TYPES.map(({ key: ct, label, subtitle, icon }) => (
        <div key={ct} className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{label}</p>
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
              {JENJANG.map(jenjang =>
                JENIS.filter(jenis => !(jenjang === 'Calistung' && jenis === 'Fokus')).map(jenis => {
                  const rate = rateMap[`${ct}|${jenjang}|${jenis}`] ?? 0
                  return (
                    <tr key={`${jenjang}|${jenis}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{jenjang}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                          jenis === 'Fokus' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {jenis}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-700">
                        {rate === 0 ? <span className="text-gray-300">—</span> : formatRp(rate)}
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
}
