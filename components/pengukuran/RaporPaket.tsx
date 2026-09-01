import type { PaketPengukuran } from '@/lib/pengukuran/tutor'

const NAMA_BLOOM: Record<number, string> = {
  1: 'Mengingat',
  2: 'Memahami',
  3: 'Menerapkan',
  4: 'Menganalisis',
  5: 'Mengevaluasi',
  6: 'Mencipta',
}

function labelPaket(p: PaketPengukuran): string {
  if (p.jenis === 'ujian') return 'Ujian'
  if (p.levelBloom === null) return `Latihan ${p.nomor}`
  return `C${p.levelBloom} — ${NAMA_BLOOM[p.levelBloom] ?? 'Latihan'}`
}

const persen = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`)

/**
 * Rapor pengukuran satu murid: satu baris per paket, dua kolom skor
 * berdampingan.
 *
 * DUA KOLOM ITU ALASAN HALAMAN INI ADA. Skor akhir menjawab "sudah bisa
 * belum"; Putaran 1 menjawab "bisa sejak awal, atau bisa setelah dicoba
 * berkali-kali". Anak dengan akhir 100% dan Putaran 1 40% bukan anak yang
 * sudah menguasai materi — ia anak yang gigih, dan itu dua kabar berbeda yang
 * cuma terlihat kalau angkanya disandingkan (dokumen fondasi Bagian 3.4).
 *
 * Ambang tidak diwarnai merah/hijau di sini. Yang tahu ambangnya berapa adalah
 * `pengaturan.ambang_mastery`, dan mewarnai baris dengan angka yang ditanam di
 * komponen berarti suatu hari layar ini akan berkata "gagal" untuk skor yang
 * menurut database lulus.
 */
export default function RaporPaket({ paket }: { paket: PaketPengukuran[] }) {
  if (paket.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
        Belum ada paket pengukuran yang tersusun untuk topik mana pun.
      </p>
    )
  }

  const topik = [...new Set(paket.map(p => p.topikId))]

  return (
    <div className="space-y-6">
      {topik.map(id => {
        const baris = paket.filter(p => p.topikId === id)
        const latihan = baris.filter(p => p.jenis === 'latihan' && p.skorPutaran1 !== null)
        const ujian = baris.find(p => p.jenis === 'ujian' && p.skorAkhir !== null)

        // Selisih latihan–ujian (dokumen fondasi Bagian 4.2): rata-rata Putaran 1
        // paket latihan dibanding skor ujian. Keduanya sama-sama "percobaan
        // pertama", jadi ini perbandingan yang setara — memakai skor akhir
        // latihan akan membandingkan hasil yang boleh diulang dengan hasil yang
        // tidak.
        const rataLatihan =
          latihan.length > 0
            ? latihan.reduce((t, p) => t + (p.skorPutaran1 ?? 0), 0) / latihan.length
            : null
        const selisih =
          rataLatihan !== null && ujian?.skorAkhir != null ? ujian.skorAkhir - rataLatihan : null

        return (
          <section key={id} className="rounded-xl bg-white shadow ring-1 ring-gray-900/5">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {id} · {baris[0].topikNama}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-5 py-2 font-medium">Paket</th>
                    <th className="px-5 py-2 font-medium">Putaran</th>
                    <th className="px-5 py-2 font-medium">Putaran 1</th>
                    <th className="px-5 py-2 font-medium">Skor akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {baris.map(p => (
                    <tr key={p.paketId} className="border-t border-gray-50">
                      <td className="px-5 py-2.5 text-gray-900">{labelPaket(p)}</td>
                      <td className="px-5 py-2.5 text-gray-500">
                        {p.putaran === 0 ? 'Belum dikerjakan' : `${p.putaran}×`}
                        {p.putaran > 0 && p.butirTerjawabPutaran1 < p.butirPaket && (
                          <span className="ml-1 text-xs text-amber-600">
                            ({p.butirTerjawabPutaran1}/{p.butirPaket} butir)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 font-medium text-gray-900">
                        {persen(p.skorPutaran1)}
                      </td>
                      <td className="px-5 py-2.5 text-gray-700">{persen(p.skorAkhir)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selisih !== null && (
              <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
                Selisih latihan–ujian: {selisih >= 0 ? '+' : ''}
                {Math.round(selisih * 100)} poin — skor ujian dibanding rata-rata Putaran 1 paket
                latihannya.
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}
