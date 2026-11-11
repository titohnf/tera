import type { AnakTangga, Kesetaraan } from '@/lib/reports/kesetaraan-kelas'

/**
 * "Kelas X, kemampuan setara kelas Y" untuk seorang siswa, di atas daftar topik
 * Ketuntasan Materi. Angkanya dari `rapor_kesetaraan()` (migrasi 181).
 *
 * `setara` kosong dikatakan terus terang sebagai "belum bisa dinilai", bukan
 * ditulis kelas 0 atau dibulatkan ke bawah: klaimnya menuntut SELURUH topik
 * dari kelas 1 sampai Y tuntas, dan angka yang tampak seperti hasil ukur untuk
 * sesuatu yang belum pernah diukur adalah kekeliruan yang fungsi database-nya
 * sengaja dibangun untuk mencegah.
 */
export default function KartuKesetaraan({
  ks,
  tangga,
}: {
  ks: Kesetaraan | null
  /** Tangga kelas 1–12 (migrasi 212); null selama migrasi itu belum jalan. */
  tangga: AnakTangga[] | null
}) {
  if (!ks) {
    return (
      <p className="rounded-xl bg-white p-4 text-sm text-gray-500 shadow-kartu">
        Kesetaraan kelasnya belum bisa dibaca sekarang. Coba muat ulang sebentar lagi.
      </p>
    )
  }

  const selisih = ks.terdaftar !== null && ks.setara !== null ? ks.setara - ks.terdaftar : null

  return (
    <div className="rounded-xl bg-white p-4 shadow-kartu">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <p className="text-xs text-gray-400">Kelas sekarang</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900">
            {ks.terdaftar !== null ? `Kelas ${ks.terdaftar}` : <span className="text-gray-300">—</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Kemampuan setara</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900">
            {ks.setara !== null ? `Kelas ${ks.setara}` : <span className="text-gray-300">Belum ada</span>}
          </p>
        </div>
        {selisih !== null && (
          <p
            className={`rounded px-2 py-1 text-xs font-medium ${
              selisih >= 0
                ? 'bg-green-50 text-green-800'
                : selisih >= -2
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-red-50 text-red-800'
            }`}
          >
            {selisih === 0 ? 'Sesuai kelasnya' : `${selisih > 0 ? '+' : '−'}${Math.abs(selisih)} kelas dari kelasnya`}
          </p>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        {ks.setara !== null ? (
          <>Seluruh topik dari kelas 1 sampai kelas {ks.setara} sudah tuntas.</>
        ) : (
          <>
            Belum ada kelas yang seluruh topiknya (mulai kelas 1) sudah tuntas, jadi klaim kemampuan
            setara kelas tertentu belum bisa dibuat. Ini bukan penilaian bahwa siswa belum mampu.
          </>
        )}{' '}
        {ks.tuntas} dari {ks.total} topik tuntas
        {ks.batasBukti !== null
          ? `; klaim berlaku sampai kelas ${ks.batasBukti} (seluruh topik sampai kelas itu sudah punya soal).`
          : '; belum ada kelas yang seluruh topiknya sudah punya soal, jadi klaim belum boleh dibuat.'}
      </p>

      {/* Tangga: kemajuan menuju klaim kelas berikutnya. Klaim kelas Y menuntut
          SEMUA anak tangga dari kelas 1 sampai Y penuh, jadi tangga yang
          berhenti di tengah menunjukkan persis anak tangga mana yang menahan. */}
      {tangga && tangga.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium text-gray-500">Topik tuntas per kelas</p>
          {tangga.map(a => {
            const persen = a.total > 0 ? (a.tuntas / a.total) * 100 : 0
            const penuh = a.tuntas >= a.total
            const kurangSoal = a.terukur < a.total
            return (
              <div
                key={a.kelas}
                className="flex items-center gap-3 text-xs"
                title={
                  kurangSoal
                    ? `${a.terukur} dari ${a.total} topik kelas ini sudah punya soal`
                    : undefined
                }
              >
                <span className="w-14 shrink-0 text-gray-600">Kelas {a.kelas}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className={`block h-full rounded-full ${penuh ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${persen}%` }}
                  />
                </span>
                <span className="w-12 shrink-0 text-right tabular-nums text-gray-500">
                  {a.tuntas}/{a.total}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
