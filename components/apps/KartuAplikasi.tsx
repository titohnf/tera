import Link from 'next/link'
import { KARTU } from '@/components/ui/desain'
import Ikon3D, { type NamaIkon3D } from '@/components/ui/Ikon3D'

/**
 * Kartu satu aplikasi di beranda — hari ini cuma SORA, di beranda pelanggan
 * langganan.
 *
 * Diangkat dari dalam `app/keluarga/[studentId]/page.tsx` supaya kedua beranda
 * memakai kartu yang sama persis — dua salinan yang pelan-pelan menyimpang akan
 * membuat SORA terlihat seperti dua hal berbeda tergantung siapa yang
 * membukanya. Beranda keluarga sejak itu berhenti memakainya sama sekali:
 * SORA-nya jadi permukaan "Belajar", dijangkau dari petak beranda; GAMA-nya
 * dilepas sampai pengerjaannya dimulai. Yang tersisa satu pemanggil, dan alasan di atas tetap
 * berlaku begitu ada yang kedua.
 *
 * `href` null berarti kartunya tampil tapi tidak bisa diketuk — dipakai kartu
 * GAMA selama ia masih "Segera hadir", dan dulu untuk SORA saat
 * `NEXT_PUBLIC_SORA_URL` kosong. Lebih jujur daripada menautkannya ke alamat
 * tebakan yang berujung 404. Tidak ada yang memakainya hari ini; ia ditahan
 * karena kartu produk berikutnya akan melewati keadaan yang sama.
 *
 * Tautan internal memakai `Link`, tautan keluar memakai `<a>` biasa: prefetch
 * milik Next hanya berlaku untuk rute aplikasi ini, dan memaksanya ke alamat
 * luar berarti memuat halaman orang lain tanpa diminta.
 */
export default function KartuAplikasi({
  nama,
  keterangan,
  teks,
  href,
  ikon,
  terkunci = false,
}: {
  nama: string
  /** Catatan kecil di samping nama, mis. "Segera hadir". */
  keterangan?: string
  teks: string
  href: string | null
  ikon: NamaIkon3D
  /** Ikon diredupkan dan abu-abu: fiturnya belum terbuka untuk akun ini. */
  terkunci?: boolean
}) {
  const isi = (
    <>
      <Ikon3D nama={ikon} ukuran={56} kelas={terkunci ? 'opacity-50 grayscale' : ''} />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold tracking-tight text-slate-900">
          {nama}
          {keterangan && (
            <span className="ml-1.5 text-xs font-medium text-gray-400 align-middle">
              {keterangan}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-slate-500">{teks}</span>
      </span>
      {href && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-slate-300" aria-hidden>
          <path d="m9 5 7 7-7 7" />
        </svg>
      )}
    </>
  )

  const dasar = `flex items-center gap-3.5 ${KARTU} p-4`

  if (!href) {
    return <div className={`${dasar} opacity-60`}>{isi}</div>
  }

  const kelas = `${dasar} transition active:bg-slate-100`

  if (href.startsWith('/')) {
    return (
      <Link href={href} className={kelas}>
        {isi}
      </Link>
    )
  }

  return (
    <a href={href} className={kelas}>
      {isi}
    </a>
  )
}
