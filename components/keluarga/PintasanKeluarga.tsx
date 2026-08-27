import Link from 'next/link'

/**
 * Empat pintasan di beranda: Tagihan, Laporan Bulanan, Materi, Penguasaan.
 *
 * Keempatnya sebelumnya berupa daftar bertumpuk di dalam halaman Profil —
 * ikon, judul, dan satu kalimat penjelas per baris. Susunan itu memakan hampir
 * separuh layar untuk empat tujuan, dan menaruhnya di bawah Profil berarti
 * setiap kunjungan ke Tagihan lewat dua ketukan dan satu halaman yang sama
 * sekali tidak dicari.
 *
 * Di sini keempatnya jadi petak ikon di beranda: satu baris, satu ketukan.
 * Kalimat penjelasnya sengaja dilepas — pada empat nama yang sependek ini ia
 * lebih banyak menambah tinggi daripada kejelasan, dan orang tua yang sudah
 * pernah membukanya mengenali petaknya dari warna dan bentuk, bukan dari
 * kalimatnya.
 *
 * Warnanya berbeda per petak, bukan seragam biru: yang membuat susunan ikon
 * bisa dipindai sekali lihat justru warnanya, dan empat petak biru menuntut
 * pembacanya membaca keempat labelnya setiap kali.
 */

const PINTASAN: {
  ke: string
  /** Tujuan di luar `/keluarga/[id]`; tanpa ini, `ke` yang dipakai. */
  href?: (id: string) => string
  judul: string
  warna: string
  ikon: React.ReactNode
}[] = [
  {
    ke: 'tagihan',
    judul: 'Tagihan',
    warna: 'bg-blue-50 text-blue-600',
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    ),
  },
  {
    ke: 'laporan',
    judul: 'Laporan',
    warna: 'bg-violet-50 text-violet-600',
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    ),
  },
  {
    // Satu-satunya pintasan yang keluar dari `/keluarga/[id]`, karena materi
    // memang tidak lagi tinggal di sana. Halaman materi milik portal keluarga
    // dulu menyaring katalog ke topik yang benar-benar dibahas anak — berguna,
    // tapi ia membaca sumber yang sama dengan `/belajar` dan berakhir sebagai
    // daftar tautan tanpa lanjutan. `/belajar` menawarkan bahan yang sama plus
    // soal untuk dikerjakan sesudah membacanya.
    //
    // Penyaringan "topik yang sudah dibahas" tidak hilang, ia pindah ke tempat
    // yang lebih tepat: kartu sesi di Jadwal, yang menyebut topik pertemuan itu
    // beserta materinya dan menuju `/belajar` di topik yang tepat. Itu jawaban
    // yang lebih baik atas "kemarin anak saya belajar apa" daripada satu daftar
    // panjang tanpa tanggal.
    ke: 'materi',
    href: (id: string) => `/belajar?anak=${id}`,
    judul: 'Materi',
    warna: 'bg-amber-50 text-amber-600',
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
  },
  {
    ke: 'penguasaan',
    judul: 'Penguasaan',
    warna: 'bg-emerald-50 text-emerald-600',
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    ),
  },
]

export default function PintasanKeluarga({ studentId }: { studentId: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
      <div className="grid grid-cols-4 gap-2">
        {PINTASAN.map((p) => (
          <Link
            key={p.ke}
            href={p.href ? p.href(studentId) : `/keluarga/${studentId}/${p.ke}`}
            className="flex flex-col items-center gap-1.5 rounded-lg py-1 active:bg-slate-50 transition-colors"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${p.warna}`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {p.ikon}
              </svg>
            </span>
            {/* `leading-tight` dan `break-words`: "Penguasaan" tidak muat dalam
                satu baris di lebar 375px, dan label yang terpotong lebih buruk
                daripada label dua baris. */}
            <span className="text-center text-[11px] leading-tight text-gray-600 break-words">
              {p.judul}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
