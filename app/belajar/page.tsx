import { belajarContext } from '@/lib/belajar'

/**
 * Pintu masuk permukaan belajar.
 *
 * Sengaja masih kerangka. Yang sudah benar dan sudah bisa diuji di sini adalah
 * SIAPA yang boleh masuk dan ATAS NAMA SIAPA — keluarga bimbel lewat `?anak=`,
 * pelanggan lewat langganan aktif, keduanya keluar dari `belajarContext()`
 * sebagai `learnerId` dan `hanyaPublik`.
 *
 * Isi halamannya — memilih mapel, memilih topik, mengerjakan soal, pembahasan,
 * ringkasan penguasaan — dibangun di tahap berikutnya di atas
 * `lib/belajar/sesi.ts`, satu-satunya tempat yang boleh memanggil RPC
 * `practice_*`. Dipisahkan begitu supaya tidak ada halaman yang tergoda
 * memanggil RPC-nya langsung dengan learner id yang datang dari browser.
 */
export default async function BelajarBeranda({
  searchParams,
}: {
  searchParams: Promise<{ anak?: string }>
}) {
  const { anak } = await searchParams
  const { namaPelajar, hanyaPublik } = await belajarContext(anak)

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
        <p className="text-sm font-semibold text-gray-900">Berlatih sebagai {namaPelajar}</p>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {hanyaPublik
            ? 'Soal-soal yang terbuka untuk langganan.'
            : 'Seluruh bank soal bimbel.'}
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
        <p className="text-sm text-gray-500 leading-relaxed">
          Pemilihan mapel dan topiknya sedang disiapkan. Sementara ini latihan masih dikerjakan
          lewat Sora.
        </p>
      </div>
    </div>
  )
}
