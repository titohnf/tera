import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'
import { ringkasanTagihan, sesiBerikutnya } from '@/lib/keluarga-anak'
import { learnerAnak, sesiTertunda } from '@/lib/belajar/sesi'
import { sekarangIso } from '@/lib/waktu'
import { todayWib } from '@/lib/daily-message'
import BannerPromosi from '@/components/keluarga/BannerPromosi'
import PintasanKeluarga from '@/components/keluarga/PintasanKeluarga'

/**
 * Beranda seorang anak — layar pertama yang dilihat orang tua.
 *
 * Isinya sengaja sedikit. Versi sebelumnya menaruh seluruh portal di sini:
 * kartu identitas, ringkasan, empat tab berisi daftar sesi, tagihan, laporan,
 * dan bahan belajar. Semuanya benar-benar dipakai, tapi bukan pada kunjungan
 * yang sama — dan menumpuknya di satu layar membuat yang paling sering dicari
 * ("kapan les berikutnya") harus dicari juga. Yang lain sekarang punya
 * rutenya sendiri di bilah navigasi bawah.
 *
 * Sisa tagihan tetap ikut, meski Tagihan sudah punya halaman sendiri: ia satu-
 * satunya hal di portal ini yang menuntut tindakan, dan hal yang menuntut
 * tindakan tidak boleh menunggu diketuk untuk terlihat.
 *
 * Tapi ia TIDAK berdiri di sini sepanjang semester. Invoice diterbitkan satu
 * semester sekaligus, jadi "masih ada sisa" adalah keadaan normal berbulan-
 * bulan — dan pengingat yang selalu ada berhenti dibaca jauh sebelum ia jadi
 * relevan. Kapan ia muncul diputuskan `ringkasanTagihan`, dan `tampil` itulah
 * syaratnya, bukan `sisa > 0`.
 *
 * Kartunya TIDAK lagi selalu merah dan tidak lagi berbunyi "Belum dibayar".
 * Invoice kelas reguler diterbitkan satu semester sekaligus sementara hampir
 * semua orang tua membayarnya bulanan — jadi keadaan yang paling lazim di
 * portal ini adalah tagihan yang belum lunas dan memang belum waktunya lunas.
 * Menandainya merah dan menyebutnya belum dibayar menuduh keluarga yang justru
 * sedang menepati kesepakatannya, dan itu berbalik jadi protes ke admin.
 *
 * Yang merah tinggal satu keadaan: lewat jatuh tempo tanpa pembayaran sama
 * sekali. Pembedaan itu bukan karangan halaman ini — ia aturan yang sama persis
 * dengan lencana di halaman Tagihan (`lib/tagihan.ts`), tempat tagihan yang
 * sudah dicicil disebut "Angsuran", bukan tunggakan.
 *
 * Kartu "Lanjutkan latihan" datang dari puncak `/belajar`, tempat ia ikut
 * terbawa ke setiap langkah pemilihan mapel dan topik — menawarkan sesi lain
 * tepat selagi seseorang menyusun sesi baru. Di sini ia berdiri sekali, dan di
 * layar yang memang dibuka untuk memutuskan mau apa. Ia hilang sendiri begitu
 * sesinya diselesaikan, sama seperti sisa tagihan.
 *
 * Kartu SORA pernah ada di sini, di bawah petak pintasan, menautkan ke
 * `/belajar?anak=`. Ia sekarang tab "Latihan" di bilah bawah: latihan soal
 * adalah salah satu dari dua alasan anak membuka portal ini sendiri, dan
 * sebuah kartu di ujung beranda menuntut gulir untuk sesuatu yang dituju
 * langsung. Nama produknya ikut ditinggalkan — "SORA" tidak memberi tahu
 * siapa pun apa yang ada di baliknya.
 *
 * Kartu GAMA menyusul turun, dan dengan itu halaman ini tidak lagi memakai
 * `KartuAplikasi` sama sekali. Ia sebuah janji tanpa tanggal — "Segera hadir"
 * untuk sesuatu yang pengerjaannya belum dimulai — dan janji semacam itu makin
 * lama makin terbaca sebagai bagian aplikasi yang rusak. Ia dipasang lagi kalau
 * GAMA benar-benar dikerjakan; bentuk kartunya masih utuh di riwayat git.
 *
 * Empat pintasan — Tagihan, Laporan, Materi, Penguasaan — pindah ke sini dari
 * dalam halaman Profil. Sebagai petak ikon keempatnya cuma memakan satu baris,
 * jadi "isinya sengaja sedikit" di atas tetap berlaku; yang berubah adalah
 * jaraknya, dari dua ketukan lewat halaman yang tidak dicari, jadi satu.
 */

function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default async function AnakBeranda({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)

  const sekarang = await sekarangIso()
  const [sesi, tagihan, learnerId] = await Promise.all([
    sesiBerikutnya(studentId, sekarang),
    // Hari WIB yang sama dengan halaman Tagihan dan halaman admin: keterlambatan
    // yang berbeda sehari di pagi buta berujung telepon yang tidak perlu.
    ringkasanTagihan(studentId, todayWib()),
    learnerAnak(studentId),
  ])
  // Menyusul, bukan sebarisan: id pelajarnya baru diketahui dari kueri di atas.
  // Anak yang belum pernah berlatih tidak punya baris `learners`, dan tidak
  // punya apa-apa untuk dilanjutkan — kueri keduanya dilewati sama sekali.
  const tertunda = learnerId ? await sesiTertunda(learnerId) : null

  return (
    <div className="space-y-4">
      <BannerPromosi />

      {tagihan.tampil && (
        <Link
          href={`/keluarga/${studentId}/tagihan`}
          className={`flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow ring-1 active:bg-slate-50 transition ${
            tagihan.terlambat ? 'ring-red-200' : 'ring-gray-900/5'
          }`}
        >
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
              {tagihan.terlambat ? 'Terlambat' : 'Belum lunas'}
            </span>
            <span
              className={`block text-lg font-bold tabular-nums mt-0.5 ${
                tagihan.terlambat ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {rupiah(tagihan.sisa)}
            </span>
          </span>
          <span className="text-sm font-medium text-blue-600 shrink-0">Lihat →</span>
        </Link>
      )}

      {/* Satu-satunya pintu menuju sesi yang belum selesai. Undiannya tersimpan
          sejak migrasi 114, tapi rute sesi tidak ditautkan dari mana pun —
          tanpa kartu ini, anak yang menutup tab kehilangan sesinya bukan karena
          datanya hilang melainkan karena tidak ada jalan kembali.

          `?anak=` tidak perlu di sini: `/belajar/[sesiId]` tahu sendiri sesi itu
          milik siapa, dan justru menolak ditanyai dua kali. */}
      {tertunda && (
        <Link
          href={`/belajar/${tertunda.sesiId}`}
          className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 shadow ring-1 ring-blue-200 transition hover:ring-blue-300 active:bg-blue-100"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-blue-900">
              {tertunda.tinggalHasil ? 'Lihat hasil latihan terakhir' : 'Lanjutkan latihan'}
            </span>
            <span className="block text-sm text-blue-700/80">
              {tertunda.tinggalHasil
                ? `${tertunda.jumlahSoal} soal sudah dijawab, hasilnya belum dibuka.`
                : `${tertunda.sudahDijawab} dari ${tertunda.jumlahSoal} soal sudah dijawab.`}
            </span>
          </span>
          <span className="shrink-0 text-blue-600" aria-hidden>
            →
          </span>
        </Link>
      )}

      <Link
        href={`/keluarga/${studentId}/jadwal`}
        className="block rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5 active:bg-slate-50 hover:ring-blue-300 transition"
      >
        <p className="text-sm font-semibold text-gray-900">Jadwal bimbel berikutnya</p>
        {sesi ? (
          <>
            <p className="text-base text-gray-900 mt-2">
              {new Date(sesi.scheduled_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              {', '}
              {new Date(sesi.scheduled_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {[sesi.mapel, sesi.topik, sesi.tutor && `bersama ${sesi.tutor}`]
                .filter(Boolean)
                .join(' · ') || 'Belum ada rincian materi'}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400 mt-2">
            Belum ada sesi terjadwal untuk {anak.full_name}.
          </p>
        )}
      </Link>

      <PintasanKeluarga studentId={studentId} />
    </div>
  )
}
