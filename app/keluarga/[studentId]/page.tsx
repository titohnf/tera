import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'
import { sesiBerikutnya, sisaTagihan } from '@/lib/keluarga-anak'
import { sekarangIso } from '@/lib/waktu'
import BannerPromosi from '@/components/keluarga/BannerPromosi'
import PintasanKeluarga from '@/components/keluarga/PintasanKeluarga'
import KartuAplikasi, { IKON_GAMA, IKON_SORA } from '@/components/apps/KartuAplikasi'

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
 * tindakan tidak boleh menunggu diketuk untuk terlihat. Ia hilang sendiri
 * begitu lunas.
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
  const [sesi, belumBayar] = await Promise.all([
    sesiBerikutnya(studentId, sekarang),
    sisaTagihan(studentId),
  ])

  return (
    <div className="space-y-4">
      <BannerPromosi />

      {belumBayar > 0 && (
        <Link
          href={`/keluarga/${studentId}/tagihan`}
          className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-red-200 active:bg-slate-50 transition"
        >
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Belum dibayar
            </span>
            <span className="block text-lg font-bold text-red-600 tabular-nums mt-0.5">
              {rupiah(belumBayar)}
            </span>
          </span>
          <span className="text-sm font-medium text-blue-600 shrink-0">Lihat →</span>
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

      {/* Sesudah "jadwal berikutnya", sebelum kartu aplikasi: keempatnya bagian
          dari halaman ini, sementara SORA dan GAMA adalah tempat lain. */}
      <PintasanKeluarga studentId={studentId} />

      {/* SORA dulu menautkan keluar ke `NEXT_PUBLIC_SORA_URL` — aplikasi latihan
          di repo `form`. Latihannya sekarang ada di `/belajar` milik repo ini,
          permukaan yang sama yang dipakai pelanggan langganan. Itu menutup
          perbedaan yang paling sulit dijelaskan: kartu yang sama membawa
          keluarga ke aplikasi lain dan pelanggan ke halaman sendiri.

          `?anak=` wajib untuk jalur keluarga — `belajarContext()` perlu tahu
          atas nama siapa, dan memeriksanya lagi lewat `practice_start_as_child()`
          di database, jadi id yang dikarang tidak menghasilkan apa pun. */}
      <KartuAplikasi
        nama="SORA"
        teks="Latihan soal per topik, dengan pembahasan langsung."
        href={`/belajar?anak=${studentId}`}
        warna="bg-blue-50 text-blue-600"
        ikon={IKON_SORA}
      />

      <KartuAplikasi
        nama="GAMA"
        keterangan="Segera hadir"
        teks="Game matematika."
        href={null}
        warna="bg-slate-100 text-slate-400"
        ikon={IKON_GAMA}
      />
    </div>
  )
}
