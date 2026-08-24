import Link from 'next/link'

/**
 * Kartu satu aplikasi — SORA, GAMA — di beranda.
 *
 * Diangkat dari dalam `app/keluarga/[studentId]/page.tsx` supaya beranda
 * pelanggan langganan (`app/mandiri`) memakai kartu yang sama persis. Keduanya
 * menampilkan tiga produk yang sama; dua salinan yang pelan-pelan menyimpang
 * akan membuat SORA terlihat seperti dua hal berbeda tergantung siapa yang
 * membukanya.
 *
 * `href` null berarti kartunya tampil tapi tidak bisa diketuk — dipakai untuk
 * GAMA yang belum ada, dan dulu untuk SORA saat `NEXT_PUBLIC_SORA_URL` kosong.
 * Lebih jujur daripada menyembunyikan kartunya (pembaca tidak tahu ada apa yang
 * belum datang) atau menautkannya ke alamat tebakan yang berujung 404.
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

  const kelas = `${dasar} active:bg-slate-50 hover:ring-blue-300 transition`

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

/** Ikon SORA — buku terbuka. Dipakai kedua beranda, jadi ia tinggal di sini. */
export const IKON_SORA = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
)

/** Ikon GAMA — stik game. */
export const IKON_GAMA = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm2.498-6.75h.007v.008h-.007V6.75zm-2.498 0h.008v.008H8.25V6.75zM12 12h.008v.008H12V12zm0 2.25h.008v.008H12v-.008zM9.75 18h.008v.008H9.75V18zm-2.25-2.25h.008v.008H7.5v-.008zM12 6.75V4.5m-7.5 15h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z" />
)
