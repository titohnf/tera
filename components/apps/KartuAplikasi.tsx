import Link from 'next/link'
import { KARTU } from '@/components/ui/desain'

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
  warna,
  ikon,
}: {
  nama: string
  /** Catatan kecil di samping nama, mis. "Segera hadir". */
  keterangan?: string
  teks: string
  href: string | null
  warna: string
  ikon: React.ReactNode
}) {
  const isi = (
    <>
      <span className={`h-12 w-12 rounded-xl ${warna} flex items-center justify-center shrink-0`}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          {ikon}
        </svg>
      </span>
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

  const kelas = `${dasar} transition active:translate-y-0.5 active:border-b-2`

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

/**
 * Ikon SORA — buku terbuka. Bentuk yang sama juga dipakai tab "Latihan" di
 * bilah bawah portal keluarga, ditulis ulang di sana: yang ini sebuah simpul
 * React siap pakai, sementara `BottomNav` menyimpan ikon-ikonnya sebaris dalam
 * satu daftar dan tidak memungut simpul dari luar.
 */
export const IKON_SORA = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
)


/** Ikon Misi — empat kotak, sama dengan tab "Misi" di bilah bawah portal keluarga. */
export const IKON_MISI = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
)

/** Ikon Materi — lembar dengan garis teks. */
export const IKON_MATERI = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
)

/** Ikon Try Out — lencana dengan tanda centang. */
export const IKON_TRYOUT = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
)
