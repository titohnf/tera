import type { KesiapanMurid } from '@/lib/pengukuran/kesiapan'

/**
 * "Bab hari ini mengukur topik apa, dan murid sudah sampai mana."
 *
 * Kartu ini satu-satunya tempat kedua kurikulum bertemu di layar. Jadwal
 * menjawab apa yang diajarkan hari ini; peta menjawab apa yang sudah dikuasai
 * murid, berurut menurut prasyarat. Keduanya tetap tabel terpisah dengan
 * pekerjaan terpisah — yang disandingkan di sini cuma bacaannya.
 *
 * "Sampai C2", bukan "bisa C2". Kata kedua akan berbohong: kriteria tuntas
 * (FR13) berpangkal pada Skor Putaran 1, yang sengaja tidak dikirim ke layar
 * ini. Yang benar-benar diketahui halaman ini adalah paket mana yang sudah
 * pernah diselesaikan.
 *
 * Tidak dirender sama sekali kalau bab sesi ini belum terpetakan ke topik peta
 * mana pun — dan itu keadaan yang sangat umum: `topik_grup` diisi tangan, dan
 * hari ini baru D-01 yang punya baris.
 */
export default function KesiapanTopik({ kesiapan }: { kesiapan: KesiapanMurid[] }) {
  if (kesiapan.length === 0) return null

  const topik = [...new Map(kesiapan.map(k => [k.topikId, k])).values()]

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Kesiapan Peta Kompetensi
      </p>

      {topik.map(t => {
        const murid = kesiapan.filter(k => k.topikId === t.topikId)

        return (
          <div key={t.topikId} className="mt-3">
            <p className="text-sm text-gray-700">
              Bab ini mengukur{' '}
              <span className="font-medium text-gray-900">
                {t.topikId} — {t.topikNama}
              </span>
            </p>

            <ul className="mt-2 divide-y divide-slate-100">
              {murid.map(m => (
                <li
                  key={m.profileId}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-gray-700">{m.nama}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {m.paketLatihanSelesai === 0
                      ? 'belum mulai'
                      : `sampai C${m.levelTertinggi ?? '?'} · ${m.paketLatihanSelesai}/${m.paketLatihanTotal} paket`}
                    {m.skorUjian !== null && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-gray-700">
                        ujian {Math.round(m.skorUjian * 100)}%
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
