import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'
import { sesiBerikutnya, sisaTagihan } from '@/lib/keluarga-anak'
import { sekarangIso } from '@/lib/waktu'
import BannerPromosi from '@/components/keluarga/BannerPromosi'

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
 */

// Sora tinggal di aplikasi terpisah (repo `form`) yang berbagi database dengan
// Tera, jadi tautannya tidak bisa ditulis sebagai rute Next. Kalau env ini
// kosong, kartunya tetap tampil tapi tidak bisa diketuk — lebih jujur daripada
// menautkannya ke alamat tebakan yang berujung halaman 404.
const SORA_URL = process.env.NEXT_PUBLIC_SORA_URL ?? ''

function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function KartuAplikasi({
  nama,
  keterangan,
  teks,
  href,
  warna,
  ikon,
}: {
  nama: string
  keterangan?: string
  teks: string
  href: string | null
  warna: string
  ikon: React.ReactNode
}) {
  const isi = (
    <>
      <span className={`w-11 h-11 rounded-xl ${warna} flex items-center justify-center shrink-0`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {ikon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold tracking-tight text-gray-900">
          {nama}
          {keterangan && (
            <span className="ml-1.5 text-xs font-medium text-gray-400 align-middle">
              {keterangan}
            </span>
          )}
        </span>
        <span className="block text-sm text-gray-500 mt-0.5 leading-relaxed">{teks}</span>
      </span>
    </>
  )

  const dasar = 'flex items-start gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5'

  if (!href) {
    return <div className={`${dasar} opacity-60`}>{isi}</div>
  }

  return (
    <a
      href={href}
      className={`${dasar} active:bg-slate-50 hover:ring-blue-300 transition`}
    >
      {isi}
    </a>
  )
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

      <KartuAplikasi
        nama="SORA"
        teks="Kumpulan materi dan soal latihan."
        href={SORA_URL || null}
        warna="bg-blue-50 text-blue-600"
        ikon={
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        }
      />

      <KartuAplikasi
        nama="GAMA"
        keterangan="Segera hadir"
        teks="Game matematika."
        href={null}
        warna="bg-slate-100 text-slate-400"
        ikon={
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm2.498-6.75h.007v.008h-.007V6.75zm-2.498 0h.008v.008H8.25V6.75zM12 12h.008v.008H12V12zm0 2.25h.008v.008H12v-.008zM9.75 18h.008v.008H9.75V18zm-2.25-2.25h.008v.008H7.5v-.008zM12 6.75V4.5m-7.5 15h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z" />
        }
      />
    </div>
  )
}
