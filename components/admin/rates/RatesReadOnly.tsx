import type { SessionRate } from '@/lib/actions/admin/session-rates'

const JENJANG = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum'] as const
const JENIS = ['Reguler', 'Fokus'] as const
const TYPES = [
  { key: 'group' as const, label: 'Kelas Grup', subtitle: 'Lebih dari 1 siswa' },
  { key: 'private' as const, label: 'Kelas Privat', subtitle: '1 siswa' },
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
    <div className="grid grid-cols-2 gap-4 p-4">
      {TYPES.map(({ key: ct, label, subtitle }) => (
        <div key={ct} className="rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100">
            <p className="text-xs font-semibold text-blue-800">{label}</p>
            <p className="text-xs text-blue-400">{subtitle}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-gray-50">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400 w-24">Jenjang</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-400">Jenis</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-400 w-36">Gaji / Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {JENJANG.map(jenjang =>
                JENIS.filter(jenis => !(jenjang === 'Calistung' && jenis === 'Fokus')).map(jenis => {
                  const rate = rateMap[`${ct}|${jenjang}|${jenis}`] ?? 0
                  return (
                    <tr key={`${jenjang}|${jenis}`} className="text-xs">
                      <td className="px-4 py-2 text-gray-700 font-medium">{jenjang}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          jenis === 'Fokus' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {jenis === 'Fokus' ? 'Fokus [TKA/US/UTBK/OSN]' : 'Reguler'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-700">
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
