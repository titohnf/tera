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
 * Kalimat penjelasnya sengaja dilepas — pada nama-nama sependek ini ia lebih
 * banyak menambah tinggi daripada kejelasan, dan orang tua yang sudah pernah
 * membukanya mengenali petaknya dari warna dan bentuk, bukan dari kalimatnya.
 *
 * Warnanya berbeda per petak, bukan seragam biru: yang membuat susunan ikon
 * bisa dipindai sekali lihat justru warnanya, dan petak-petak sewarna menuntut
 * pembacanya membaca setiap labelnya lagi.
 *
 * Materi dilepas dari sini. Ia tidak lagi punya halaman di portal keluarga —
 * bahannya hidup di `/belajar`, yang sudah punya kartunya sendiri di beranda
 * ini dan sudah ditautkan dari tiap kartu sesi di Jadwal, di topik yang tepat.
 * Petak keempat yang menuju tempat yang sama dengan kartu di bawahnya bukan
 * pintasan, cuma pengulangan.
 */

const PINTASAN = [
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
    ke: 'jadwal',
    judul: 'Riwayat Kelas',
    warna: 'bg-amber-50 text-amber-600',
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
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
            href={`/keluarga/${studentId}/${p.ke}`}
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
