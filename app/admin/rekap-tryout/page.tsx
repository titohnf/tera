import Link from 'next/link'
import { muatRekap, saring } from '@/lib/reports/rekap-tryout'
import { urutMapel } from '@/lib/tryout/paket'

export const metadata = { title: 'Rekap Skor Try Out' }
export const dynamic = 'force-dynamic'

const fmt = (n: number | null, d = 1) => (n === null ? '—' : n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }))

/**
 * Rekap Skor: seluruh peserta try out dalam satu tabel. Satu baris per peserta per jenjang, kolom
 * nilai (0-100) per mata pelajaran, rata-rata, dan durasi; bisa disaring per jenjang, diurutkan, dan
 * diunduh sebagai Excel. Hanya terlihat oleh admin (layout admin), dan hanya memuat percobaan yang sudah
 * dikirim. Admin selalu bisa melihat skor, terlepas dari tombol "Buka hasil untuk peserta".
 */
export default async function RekapTryOutPage({
  searchParams,
}: {
  searchParams: Promise<{ jenjang?: string; urut?: string; arah?: string }>
}) {
  const sp = await searchParams
  const rekap = await muatRekap()
  const jenjang = sp.jenjang && rekap.jenjang.includes(sp.jenjang) ? sp.jenjang : null
  const kolomMapel = [...new Set(rekap.mapel.filter((m) => !jenjang || m.jenjang === jenjang).map((m) => m.nama))].sort(
    (a, b) => urutMapel(a) - urutMapel(b) || a.localeCompare(b, 'id'),
  )
  const urut = sp.urut === 'nama' || sp.urut === 'rata' || (sp.urut && kolomMapel.includes(sp.urut)) ? sp.urut : 'rata'
  const naik = sp.arah ? sp.arah === 'naik' : urut === 'nama'
  const baris = saring(rekap, jenjang, urut, naik)

  const q = (o: { jenjang?: string | null; urut?: string; arah?: string }) => {
    const p = new URLSearchParams()
    const j = o.jenjang === undefined ? jenjang : o.jenjang
    if (j) p.set('jenjang', j)
    p.set('urut', o.urut ?? urut)
    p.set('arah', o.arah ?? (naik ? 'naik' : 'turun'))
    return p.toString()
  }
  /** Mengklik judul kolom yang sama membalik arah; kolom baru dimulai dari nilai tertinggi (nama: A-Z). */
  const urutLink = (kolom: string) => q({ urut: kolom, arah: urut === kolom ? (naik ? 'turun' : 'naik') : kolom === 'nama' ? 'naik' : 'turun' })
  const panah = (kolom: string) => (urut === kolom ? (naik ? ' ▲' : ' ▼') : '')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Rekap Skor Try Out</h1>
          <p className="mt-1 text-sm text-gray-500">
            Nilai (0–100) seluruh peserta yang sudah mengirim jawaban. Admin selalu bisa melihatnya, terlepas dari apakah hasilnya sudah dibuka untuk peserta.
          </p>
        </div>
        <a
          href={`/admin/rekap-tryout/unduh?${q({})}`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Unduh Excel
        </a>
      </div>

      {/* Ringkasan per paket */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rekap.paket
          .filter((p) => !jenjang || p.jenjang === jenjang)
          .map((p) => (
            <div key={p.judul} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-gray-500">
                {p.jenjang} · {p.mapel}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{fmt(p.rata)}</p>
              <p className="text-xs text-gray-500">rata-rata nilai · {p.peserta} peserta</p>
            </div>
          ))}
      </div>

      {/* Saringan jenjang */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Jenjang:</span>
        {[null, ...rekap.jenjang].map((j) => (
          <Link
            key={j ?? 'semua'}
            href={`/admin/rekap-tryout?${q({ jenjang: j })}`}
            className={`rounded-full px-3 py-1 ${j === jenjang ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            {j ?? 'Semua'}
          </Link>
        ))}
        <span className="ml-auto text-xs text-gray-500">{baris.length} peserta</span>
      </div>

      {baris.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-gray-500">Belum ada peserta yang mengirim jawaban.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">No.</th>
                <th className="px-4 py-2 font-medium">
                  <Link href={`/admin/rekap-tryout?${urutLink('nama')}`} className="hover:underline">Nama{panah('nama')}</Link>
                </th>
                <th className="px-4 py-2 font-medium">Asal</th>
                <th className="px-4 py-2 font-medium">Jenjang</th>
                {kolomMapel.map((m) => (
                  <th key={m} className="px-4 py-2 text-right font-medium">
                    <Link href={`/admin/rekap-tryout?${urutLink(m)}`} className="hover:underline">{m}{panah(m)}</Link>
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-medium">
                  <Link href={`/admin/rekap-tryout?${urutLink('rata')}`} className="hover:underline">Rata-rata{panah('rata')}</Link>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {baris.map((b, i) => (
                <tr key={b.kunci}>
                  <td className="px-4 py-2 tabular-nums text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{b.nama}</td>
                  <td className="px-4 py-2 text-gray-600">{b.asal}</td>
                  <td className="px-4 py-2 text-gray-600">{b.jenjang}</td>
                  {kolomMapel.map((m) => {
                    const n = b.nilai[m]
                    return (
                      <td key={m} className="px-4 py-2 text-right tabular-nums">
                        {n ? (
                          <>
                            <span className="font-semibold text-gray-900">{fmt(n.nilai)}</span>
                            <span className="block text-xs text-gray-400">
                              {n.skor !== null ? `${fmt(n.skor)} / ${fmt(n.bobot, 0)}` : 'menunggu nilai'}
                              {n.durasiMenit !== null ? ` · ${Math.round(n.durasiMenit)} mnt` : ''}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-blue-800">{fmt(b.rata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400">
        Di bawah tiap nilai: skor mentah dari total, dan lama mengerjakan. Peserta yang belum mengerjakan satu mapel tampil dengan strip. Rincian per kompetensi ada di{' '}
        <Link href="/admin/hasil-tryout" className="underline">Hasil Try Out</Link>.
      </p>
    </div>
  )
}
