import { anakOrRedirect } from '@/lib/keluarga'
import { ringkasanTagihan, sesiBerikutnya } from '@/lib/keluarga-anak'
import { learnerAnak, sesiTertunda } from '@/lib/belajar/sesi'
import { sekarangIso } from '@/lib/waktu'
import { todayWib } from '@/lib/daily-message'
import BannerPromosi from '@/components/keluarga/BannerPromosi'
import KartuSaran from '@/components/keluarga/KartuSaran'
import PintasanKeluarga from '@/components/keluarga/PintasanKeluarga'
import KartuJadwal from '@/components/keluarga/beranda/KartuJadwal'
import KartuLatihan from '@/components/keluarga/beranda/KartuLatihan'
import KartuTagihan from '@/components/keluarga/beranda/KartuTagihan'

/**
 * Beranda seorang anak — layar pertama yang dilihat orang tua.
 *
 * Isinya sengaja sedikit. Versi sebelumnya menaruh seluruh portal di sini:
 * kartu identitas, ringkasan, empat tab berisi daftar sesi, tagihan, laporan,
 * dan bahan belajar. Semuanya benar-benar dipakai, tapi bukan pada kunjungan
 * yang sama — dan menumpuknya di satu layar membuat yang paling sering dicari
 * ("kapan les berikutnya") harus dicari juga. Yang lain sekarang punya rutenya
 * sendiri di bilah navigasi bawah dan di petak pintasan.
 *
 * Yang tersisa di halaman ini tinggal urutannya, dan urutan itu bukan selera:
 *
 *   1. Jadwal berikutnya — pertanyaan yang membuat orang membuka portal ini.
 *      Satu-satunya kartu berwarna penuh di halaman, supaya ada yang memimpin.
 *   2. Tagihan, kalau memang sedang perlu ditagih.
 *   3. Latihan yang tertinggal, kalau ada.
 *   4. Petak pintasan — pintu ke empat layar yang dibuka sesekali.
 *   5. Banner referal, lalu kartu kritik & saran — dua isi halaman ini yang
 *      tidak ditanyakan siapa pun, jadi keduanya paling bawah.
 *
 * Nomor 2 dan 3 keduanya bisa tidak ada, dan halaman ini harus tetap masuk akal
 * saat keduanya hilang — itulah sebabnya nomor 1 yang jadi jangkar, bukan salah
 * satu dari keduanya.
 *
 * Alasan tiap kartu tinggal di kartunya masing-masing (`beranda/Kartu*`), bukan
 * di sini: yang perlu dijawab halaman ini cuma "apa saja yang tampil, dalam
 * urutan apa".
 *
 * Kartu SORA dan GAMA pernah ada di sini. SORA turun jadi tab "Latihan" di
 * bilah bawah — nama produknya tidak memberi tahu siapa pun apa yang ada di
 * baliknya, dan sebuah kartu di ujung beranda menuntut gulir untuk sesuatu yang
 * dituju langsung. GAMA dilepas sampai pengerjaannya benar-benar dimulai;
 * bentuk kartunya masih utuh di riwayat git.
 */

export default async function AnakBeranda({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak, user } = await anakOrRedirect(studentId)

  const sekarang = await sekarangIso()
  // Hari WIB yang sama dengan halaman Tagihan dan halaman admin: keterlambatan
  // yang berbeda sehari di pagi buta berujung telepon yang tidak perlu. Kartu
  // jadwal memakainya juga, untuk memutuskan "Hari ini" atau "Besok".
  const hariIni = todayWib()
  const [sesi, tagihan, learnerId] = await Promise.all([
    sesiBerikutnya(studentId, sekarang),
    ringkasanTagihan(studentId, hariIni),
    learnerAnak(studentId),
  ])
  // Menyusul, bukan sebarisan: id pelajarnya baru diketahui dari kueri di atas.
  // Anak yang belum pernah berlatih tidak punya baris `learners`, dan tidak
  // punya apa-apa untuk dilanjutkan — kueri keduanya dilewati sama sekali.
  const tertunda = learnerId ? await sesiTertunda(learnerId) : null

  return (
    <div className="space-y-4">
      <KartuJadwal
        studentId={studentId}
        namaAnak={anak.full_name}
        sesi={sesi}
        hariIniWib={hariIni}
      />

      {tagihan.tampil && <KartuTagihan studentId={studentId} tagihan={tagihan} />}

      {tertunda && (
        <KartuLatihan
          sesiId={tertunda.sesiId}
          jumlahSoal={tertunda.jumlahSoal}
          sudahDijawab={tertunda.sudahDijawab}
          tinggalHasil={tertunda.tinggalHasil}
          mapel={tertunda.mapel}
          jenjang={tertunda.jenjang}
          topik={tertunda.topik}
        />
      )}

      <PintasanKeluarga studentId={studentId} />

      <BannerPromosi profileId={user.id} />

      <KartuSaran />
    </div>
  )
}
