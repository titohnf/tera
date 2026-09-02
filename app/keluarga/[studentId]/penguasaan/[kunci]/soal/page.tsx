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
import { keadaanPaketTopik, paketTopikSesi } from '@/lib/belajar/topik-peta'
import { adalahKodeTopik, isiPaketTopikSemua } from '@/lib/belajar/topik-rapor'
import { namaPaket } from '@/lib/belajar/nama-paket'
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
 *
 * Aturan itu berlaku dua kali lipat di jalur Misi: kunci yang terbuka di sana
 * mencemari sebuah PENGUKURAN, bukan cuma satu putaran latihan.
 *
 * SATU BERKAS, DUA LAPISAN — berbeda dari halaman rincian, yang sengaja
 * disalin. Di sini yang penting justru semuanya bersama: pemeriksaan pemilik
 * sesi, `tinjauanSesi()` yang berkunci SESI dan karena itu jalan apa adanya
 * untuk kedua lapisan, dan `TinjauanSesi` yang menggambarnya. Yang berbeda
 * cuma tiga baris — dari mana nomor urutnya datang, paket apa yang memuat
 * sesi itu, dan apakah kuncinya sudah dibuka — dan menyalin seluruh berkas
 * demi tiga baris berarti dua tempat yang harus sama-sama diingat saat aturan
 * kuncinya berubah.
 */
export default async function TinjauSoal({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string; kunci: string }>
  searchParams: Promise<{ sesi?: string; item?: string }>
}) {
  const { studentId, kunci } = await params
  const { sesi: sesiId, item: itemId } = await searchParams
  await anakOrRedirect(studentId)

  const misi = adalahKodeTopik(kunci)
  const kembali = `/keluarga/${studentId}/penguasaan/${kunci}`
  if (!sesiId || !itemId) redirect(kembali)

  // Sesi itu harus milik ANAK YANG SEDANG DIBUKA, bukan sekadar milik keluarga
  // ini. `practice_actor()` melonggarkan sampai batas keluarga — cukup untuk
  // menjaga orang luar, tidak cukup untuk menjaga agar halaman seorang anak
  // tidak menampilkan pekerjaan adiknya.
  const [pemilik, learnerId] = await Promise.all([pemilikSesi(sesiId), learnerAnak(studentId)])
  if (!pemilik || !learnerId || pemilik.learnerId !== learnerId) redirect(kembali)

  const [tinjauan, isi, paket, paketMisi] = await Promise.all([
    tinjauanSesi(sesiId),
    misi ? isiPaketTopikSemua(learnerId, kunci) : isiPaket(learnerId, kunci),
    misi ? Promise.resolve(null) : paketSesi(sesiId),
    misi ? paketTopikSesi(sesiId) : Promise.resolve(null),
  ])

  // Paket yang memuat sesi ini, di lapisan mana pun ia hidup — dan apakah
  // kuncinya sudah dibuka. Jalur grup berkunci nomor urut; jalur peta berkunci
  // id paket, karena paketnya dibedakan jenis dan level Bloom, bukan urutan.
  let kunciTampil: boolean
  let labelPaket: string | null = null
  if (misi) {
    const semua = paketMisi ? await keadaanPaketTopik(learnerId, kunci) : []
    const ini = paketMisi ? (semua.find(p => p.paketId === paketMisi.paketId) ?? null) : null
    kunciTampil = !paketMisi || (ini?.terkunci ?? false)
    labelPaket = ini ? namaPaket({ jenis: ini.jenis, levelBloom: ini.levelBloom, nomor: ini.nomor }) : null
  } else {
    const semua = paket ? await keadaanPaket(learnerId, paket.groupId) : []
    const ini = paket ? (semua.find(p => p.nomor === paket.nomor) ?? null) : null
    // Sesi lama tanpa paket dibiarkan terbuka: tidak ada paket yang bisa
    // dikunci, jadi tidak ada yang bisa dipertaruhkan.
    kunciTampil = !paket || (ini?.terkunci ?? false)
    labelPaket = paket ? `Paket ${paket.nomor}` : null
  }

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
        {labelPaket && <span className="font-normal text-gray-500"> · {labelPaket}</span>}
      </p>

      <TinjauanSesi soal={[soal]} nama={pemilik.nama} kunciTampil={kunciTampil} />
    </div>
  )
}
