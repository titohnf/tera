import { redirect } from 'next/navigation'
import { anakOrRedirect } from '@/lib/keluarga'
import {
  isiPaket,
  keadaanPaket,
  learnerAnak,
  paketSesi,
  pemilikSesi,
  tinjauanSesi,
} from '@/lib/belajar/sesi'
import TinjauanSesi from '@/components/belajar/TinjauanSesi'

/**
 * Satu soal, ditinjau ORANG TUA — dan rute ini ada justru supaya peninjauan itu
 * tidak menghukum anaknya.
 *
 * Di rute anak (`/belajar/[sesiId]/hasil`), kunci jawaban cuma terbuka untuk
 * paket yang sudah terkunci: satu-satunya jalan ke sana adalah tombol yang
 * menyerahkan kesempatan memperbaiki. Aturan itu benar untuk anak dan salah
 * untuk orang tua — yang membuka rincian topik sedang memeriksa pekerjaan yang
 * sudah lewat, dan tidak ada alasan pemeriksaan itu menutup paket yang masih
 * boleh dikerjakan.
 *
 * Karena itu dua rute, bukan satu dengan pengecualian: pengecualian di dalam
 * satu rute berarti gerbangnya bergantung pada siapa yang sedang membuka, dan
 * gerbang seperti itu cepat atau lambat terbuka untuk yang salah.
 *
 * Yang TIDAK dilakukan di sini: mengunci, menutup sesi, mengubah apa pun.
 * Halaman ini hanya membaca.
 *
 * Dan karena ia tidak mengunci, ia juga TIDAK MENAMPILKAN KUNCI untuk paket
 * yang belum terkunci. Portal ini dibuka dengan akun yang sama dengan yang
 * dipakai anaknya berlatih — kunci yang bebas dibaca di sini membatalkan
 * seluruh taruhan di sisi sana. Yang tetap terbaca orang tua: soalnya, jawaban
 * anaknya, dan benar atau tidaknya. Itu yang ia cari; jawaban yang benar bukan.
 */
export default async function TinjauSoal({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string; groupId: string }>
  searchParams: Promise<{ sesi?: string; item?: string }>
}) {
  const { studentId, groupId } = await params
  const { sesi: sesiId, item: itemId } = await searchParams
  await anakOrRedirect(studentId)

  const kembali = `/keluarga/${studentId}/penguasaan/${groupId}`
  if (!sesiId || !itemId) redirect(kembali)

  // Sesi itu harus milik ANAK YANG SEDANG DIBUKA, bukan sekadar milik keluarga
  // ini. `practice_actor()` melonggarkan sampai batas keluarga — cukup untuk
  // menjaga orang luar, tidak cukup untuk menjaga agar halaman seorang anak
  // tidak menampilkan pekerjaan adiknya.
  const [pemilik, learnerId] = await Promise.all([pemilikSesi(sesiId), learnerAnak(studentId)])
  if (!pemilik || !learnerId || pemilik.learnerId !== learnerId) redirect(kembali)

  const [tinjauan, isi, paket] = await Promise.all([
    tinjauanSesi(sesiId),
    isiPaket(learnerId, groupId),
    paketSesi(sesiId),
  ])

  const semuaPaket = paket ? await keadaanPaket(learnerId, paket.groupId) : []
  const paketIni = paket ? (semuaPaket.find(p => p.nomor === paket.nomor) ?? null) : null
  // Sesi lama tanpa paket dibiarkan terbuka: tidak ada paket yang bisa dikunci,
  // jadi tidak ada yang bisa dipertaruhkan.
  const kunciTampil = !paket || (paketIni?.terkunci ?? false)

  const ordPaket = new Map(isi.map(b => [b.itemId, b.ord]))
  const mentah = tinjauan.find(t => t.id === itemId)
  if (!mentah) redirect(kembali)

  // Nomornya nomor PAKET, sama dengan petak yang barusan diketuk. Nomor putaran
  // tidak berarti apa-apa di luar putarannya, dan mendarat di "Soal 2" sesudah
  // mengetuk petak nomor 5 membuat pembacanya mengira ia salah ketuk.
  const soal = { ...mentah, nomor: ordPaket.get(mentah.id) ?? mentah.nomor }

  return (
    <div className="space-y-4">
      {/* Tanpa tautan "kembali ke topik" di badan halaman: panah di bilah atas
          sudah menuju ke sana (lihat `LAYAR_DALAM` di `HeaderKeluarga`), dan
          dua pintu ke tempat yang sama di satu layar sependek ini cuma membuat
          pembacanya memilih. */}
      <p className="px-1 font-semibold tracking-tight text-gray-900">
        Soal {soal.nomor}
        {paket && <span className="font-normal text-gray-500"> · Paket {paket.nomor}</span>}
      </p>

      <TinjauanSesi soal={[soal]} nama={pemilik.nama} kunciTampil={kunciTampil} />
    </div>
  )
}
