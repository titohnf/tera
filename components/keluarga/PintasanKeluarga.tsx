import Link from 'next/link'

/**
 * Empat pintasan di beranda: Belajar, Laporan, Jadwal, Tagihan.
 *
 * Belajar dulu tinggal di bilah bawah, sejajar dengan Beranda dan Profil.
 * Ia permukaan yang dibuka hampir setiap kunjungan, jadi satu layar lagi
 * bukan penghalang, dan meninggalkannya di bilah menyesakkan layar 390px
 * dengan tujuan yang justru dibuka sesekali. Mencuri satu kolom baris ini
 * mengembalikan bilah bawah ke empat tujuan portal — lihat `BottomNav`.
 *
 * Tautannya bukan di bawah `/keluarga/[id]`: permukaan belajar dipakai
 * bersama pelanggan langganan, jadi ia membuka `/belajar?anak=`. Di beranda
 * ia pintu TETAP permukaan itu; kartu "Lanjutkan latihan" di bawah hanya
 * muncul saat ada sesi yang belum selesai, dan menuntut kartu itulah yang
 * dulu membuat petak sejenis terasa pengulangan.
 *
 * Keempatnya sebelumnya berupa daftar bertumpuk di dalam halaman Profil —
 * ikon, judul, dan satu kalimat penjelas per baris. Susunan itu memakan hampir
 * separuh layar untuk empat tujuan, dan menaruhnya di bawah Profil berarti
 * setiap kunjungan ke Tagihan lewat dua ketukan dan satu halaman yang sama
 * sekali tidak dicari.
 *
 * Laporan dan Penguasaan dahulu dua pintasan terpisah; kini satu menu
 * "Laporan" yang membuka halaman bertab (Aktivitas Kelas dan Kompetensi).
 *
 * Di sini semuanya jadi petak ikon di beranda: satu baris, satu ketukan.
 * Kalimat penjelasnya sengaja dilepas — pada nama-nama sependek ini ia lebih
 * banyak menambah tinggi daripada kejelasan, dan orang tua yang sudah pernah
 * membukanya mengenali petaknya dari bentuk ikonnya, bukan dari kalimatnya.
 *
 * Warnanya semua turunan satu biru: biru merek `#026bf5` dari logo
 * `public/logo-icon.png`, dicampur putih pada empat kadar — 0%, 50%
 * (`#80b5fa`), 80% (`#cce1fd`), dan 92% (`#eaf3fe`, warna lingkaran petak).
 *
 * Laporan dan Tagihan digambar sebagai siluet: badannya biru merek
 * penuh, detailnya `#cce1fd` — pucat, tapi masih jelas biru. Keduanya ikon
 * benda — kotak statistik, gulungan — yang seluruh detailnya berada
 * di dalam badan, jadi nada pucat itu selalu punya alas biru dan tidak pernah
 * hilang ke lingkaran.
 *
 * Detailnya sempat diberi garis tepi tipis, meniru celah antara orang dan papan
 * di ikon Kelas. Di 28px garis itu cuma membuat goresannya berbulu; celah di
 * Kelas bekerja karena jaraknya nyata, bukan karena ada garisnya.
 *
 * Kelas sendiri tidak ikut jadi siluet. Ikonnya orang di depan papan, dan
 * kepalanya berdiri di luar badan; kalau dimudakan ia lenyap ke latar. Petak itu
 * tetap dua nada — badan `#80b5fa`, detail biru merek.
 *
 * Logonya sebenarnya berpasangan biru dengan tosca `#20c5b5`, dan versi dengan
 * badan tosca sempat dicoba. Di ukuran 28px toscanya menang sendiri: yang
 * terbaca lebih dulu warnanya, bukan bentuk ikonnya, padahal bentuk itulah
 * satu-satunya yang membedakan keempat petak sekarang.
 *
 * Sebelumnya empat ikon garis dengan empat warna berlainan: ungu, amber,
 * emerald, biru. Baris pelangi itu jadi bagian paling ramai di beranda yang
 * sudah berisi kartu Jadwal, Latihan, dan Tagihan. Sekarang semuanya satu
 * keluarga warna, dan yang membedakan petak adalah bentuk ikonnya.
 *
 * Ikonnya dari set Streamline "Plump color" (varian flat), berlisensi CC BY 4.0
 * — atribusinya belum dipasang di mana pun dan masih jadi utang. Warnanya
 * ditukar ke palet merek: bentuknya sama sekali tidak disentuh, cuma dua nada
 * birunya yang digeser dari biru bawaan Streamline ke biru Tera. Disalin inline
 * ke sini alih-alih lewat
 * paket ikon: cuma beberapa gambar, dan menariknya dari CDN saat render berarti
 * petak kosong di detik pertama tiap kunjungan.
 *
 * Materi pernah tinggal di sini dan pergi sebelum Belajar datang: isinya
 * hidup di `/belajar` dan ditautkan dari tiap kartu sesi di Jadwal, di topik
 * yang tepat — dan petak Materi yang menuju tempat yang sama dengan kartu
 * lanjutan di bawah memang pengulangan. Belajar berbedanya ada dua: petaknya
 * yang ini pintu permukaannya, dan kartu di beranda cuma muncul kalau ada
 * yang belum selesai.
 */

const PINTASAN = [
  {
    ke: 'belajar',
    judul: 'Belajar',
    /* Bukan sub-path portal: permukaan belajar dipakai bersama pelanggan
       langganan, jadi jalannya keluar lewat `?anak=`. */
    to: (id: string) => `/belajar?anak=${id}`,
    ikon: (
      <>
        <path fill="#80b5fa" d="M24 21.5C19.5 18 14.5 16.8 10.5 17.8 7.6 18.6 5.5 20.6 5.5 22.7L5.5 31.8C5.5 35.2 8.3 37.8 11.7 37.7 15 37.6 18.2 38.7 20.9 40.5 22.4 41.4 24 40.4 24 38.8Z"/>
        <path fill="#80b5fa" d="M24 21.5C28.5 18 33.5 16.8 37.5 17.8 40.4 18.6 42.5 20.6 42.5 22.7L42.5 31.8C42.5 35.2 39.7 37.8 36.3 37.7 33 37.6 29.8 38.7 27.1 40.5 25.6 41.4 24 40.4 24 38.8Z"/>
        <path fill="#026bf5" d="M23.6 22.4c.2 0 .4.2.4.4v6c0 .2-.2.4-.4.4s-.4-.2-.4-.4v-6c0-.2.2-.4.4-.4z"/>
        <path fill="#026bf5" d="M10 24.3h8.4c.7 0 1.3.6 1.3 1.3s-.6 1.3-1.3 1.3H10c-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3z"/>
        <path fill="#026bf5" d="M10 29.6h6c.7 0 1.3.6 1.3 1.3s-.6 1.3-1.3 1.3h-6c-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3z"/>
        <path fill="#026bf5" d="M38 24.3h-8.4c-.7 0-1.3.6-1.3 1.3s.6 1.3 1.3 1.3H38c.7 0 1.3-.6 1.3-1.3s-.6-1.3-1.3-1.3z"/>
        <path fill="#026bf5" d="M38 29.6h-6c-.7 0-1.3.6-1.3 1.3s.6 1.3 1.3 1.3h6c.7 0 1.3-.6 1.3-1.3s-.6-1.3-1.3-1.3z"/>
        <path fill="#026bf5" d="M21.6 40.6h4.8v4.2c0 .8-.9 1.3-1.6.8l-.8-.6-.8.6c-.7.5-1.6 0-1.6-.8v-4.2z"/>
      </>
    ),
  },
  {
    ke: 'laporan',
    judul: 'Laporan',
    ikon: (
      <>
        <path fill="#026bf5" d="M24 1.531c-7.401 0-12.593.278-15.864.544c-3.288.267-5.825 2.804-6.092 6.092C1.778 11.439 1.5 16.63 1.5 24.03s.278 12.593.544 15.865c.267 3.287 2.804 5.824 6.092 6.091c3.271.266 8.463.544 15.864.544s12.593-.278 15.864-.544c3.288-.267 5.825-2.804 6.092-6.092c.266-3.271.544-8.462.544-15.864c0-7.401-.278-12.592-.544-15.864c-.267-3.288-2.804-5.825-6.092-6.092C36.593 1.808 31.402 1.53 24 1.53"/>
        <path fill="#cce1fd" fillRule="evenodd" d="M26.686 36.176a3.72 3.72 0 0 0 4.973-.524c3.776-4.244 6.2-8.03 7.411-10.118c.635-1.093.804-2.448-.143-3.285a6 6 0 0 0-.824-.61c-1.224-.755-2.593-.004-3.51 1.103c-1.503 1.816-3.897 4.667-5.618 6.52a.95.95 0 0 1-1.274.116c-1.53-1.151-3.436-2.79-4.958-4.138c-1.522-1.349-3.815-1.4-5.274.018c-2.497 2.427-5.075 5.272-7.224 7.789c-1.368 1.6-1.53 3.94.047 5.335a13 13 0 0 0 1.323 1.021c1.857 1.24 4.17.264 5.344-1.636c1.007-1.63 2.259-3.585 3.385-5.137a.98.98 0 0 1 1.402-.185c1.039.812 2.96 2.296 4.94 3.73" clipRule="evenodd"/>
        <path fill="#cce1fd" d="M11 17a2 2 0 1 0 0 4h6a2 2 0 1 0 0-4zm-2-6a2 2 0 0 1 2-2h10a2 2 0 1 1 0 4H11a2 2 0 0 1-2-2"/>
      </>
    ),
  },
  {
    ke: 'jadwal',
    judul: 'Jadwal',
    ikon: (
      <>
        <path fill="#80b5fa" d="m22.985 31.499l.308-4.415l5.412-.736c2.072-.281 4.115-1.813 4.567-4.287c.34-1.856.261-3.344.012-4.481c-.583-2.665-2.956-3.645-4.545-3.736a213 213 0 0 0-8.184-.305A9.46 9.46 0 0 0 22 8.5c0-3.33-1.714-6.26-4.307-7.956A429 429 0 0 1 24 .5c8.57 0 14.298.227 17.6.418c2.747.158 5.064 2.137 5.395 4.98c.259 2.23.505 5.549.505 10.102s-.246 7.871-.505 10.102c-.33 2.843-2.648 4.822-5.395 4.98c-3.302.191-9.03.418-17.6.418l-1.014-.001Z"/>
        <path fill="#026bf5" d="M6 8.5a6.5 6.5 0 1 0 13 0a6.5 6.5 0 0 0-13 0m.506 8.23c6.975-.34 14.874-.303 22.062.11c.766.043 1.589.48 1.786 1.381c.16.725.24 1.81-.032 3.3c-.187 1.022-1.048 1.723-2.02 1.855l-7.428 1.01a.5.5 0 0 0-.431.46l-1.281 18.361c-.111 1.592-1.296 2.933-2.923 3.098q-.478.049-1.021.09a1.48 1.48 0 0 1-1.585-1.425l-.345-8.99a.5.5 0 0 0-.5-.48h-.575a.5.5 0 0 0-.5.48l-.345 8.975a1.48 1.48 0 0 1-1.593 1.425a41 41 0 0 1-.943-.088c-1.665-.175-2.86-1.575-2.92-3.21l-.377-10.15a.52.52 0 0 0-.484-.492a29 29 0 0 1-1.688-.174c-1.138-.154-1.872-1.14-1.843-2.237c.104-3.894.596-7.462 1.003-9.823c.339-1.968 2.006-3.38 3.983-3.477Z"/>
      </>
    ),
  },
  {
    ke: 'tagihan',
    judul: 'Tagihan',
    ikon: (
      <>
        <path fill="#026bf5" d="M30.237 45.926c-2.823.295-6.692.574-11.237.574c-4.814 0-8.87-.313-11.726-.627a80 80 0 0 1-3.336-.433a36 36 0 0 1-1.217-.201H2.72A1.5 1.5 0 0 1 3 42.264c.465 0 1.713-.228 2.767-1.067c.96-.766 1.893-2.14 1.736-4.755a573 573 0 0 1-.963-25.52C6.463 5.683 10.71 1.5 15.91 1.5H39c3.71 0 7.5 2.753 7.5 7.598v.648c0 2.012-1.375 3.872-3.528 4.175c-1.667.234-4.24.486-7.87.559c.173 4.085.414 7.763.648 11.335l.029.438c.272 4.147.53 8.17.65 12.503c.101 3.63-2.513 6.785-6.192 7.17"/>
        <path fill="#cce1fd" fillRule="evenodd" d="M14.5 32.5a1.5 1.5 0 0 0 0 3h14a1.5 1.5 0 0 0 0-3z" clipRule="evenodd"/>
        <path fill="#cce1fd" d="M14 25.5a1.5 1.5 0 0 0 0 3h14a1.5 1.5 0 0 0 0-3zM12 20a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 0 3h-14A1.5 1.5 0 0 1 12 20m5.5-8.5a1.5 1.5 0 0 0 0 3h10a1.5 1.5 0 0 0 0-3zm20.523 2.875c.02-1.206.134-2.54.477-3.734c.495-1.73 1.358-2.847 2.829-3.177a1.5 1.5 0 0 0-.657-2.927c-2.987.67-4.41 3.022-5.056 5.277c-.453 1.579-.58 3.266-.595 4.668a89 89 0 0 0 3.002-.107"/>
      </>
    ),
  },
]

export default function PintasanKeluarga({ studentId }: { studentId: string }) {
  return (
    /* Tanpa kotak: tiga ikon berlingkaran warna sudah merupakan bentuk utuh,
       dan membungkusnya lagi dengan kartu berbayang berarti dua bingkai untuk
       satu benda. Yang tersisa cuma jaraknya. */
    <div className="px-1 py-1">
      <div className="grid grid-cols-4 gap-2">
        {PINTASAN.map((p) => (
          <Link
            key={p.ke}
            href={p.to ? p.to(studentId) : `/keluarga/${studentId}/${p.ke}`}
            className="flex flex-col items-center gap-1.5 rounded-lg py-1 active:bg-slate-50 transition-colors"
          >
            {/* Lingkaran, bukan petak bersudut: ikonnya sendiri sudah penuh
                warna, dan bentuk bulat menahannya supaya tidak terbaca sebagai
                tombol. Warnanya ada di dalam ikon, jadi wadahnya cukup polos. */}
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf3fe]">
              <svg className="h-7 w-7" viewBox="0 0 48 48" fill="none">
                {p.ikon}
              </svg>
            </span>
            {/* `leading-tight` dan `break-words`: "Penguasaan" tidak muat dalam
                satu baris di lebar 375px, dan label yang terpotong lebih buruk
                daripada label dua baris.

                Petak Kelas bernama "Kelas", bukan "Riwayat Kelas": halaman itu
                memuat sesi yang akan datang sekaligus yang sudah lewat, dan
                "Riwayat" mengunci ke belakang. Nama ini juga sama dengan tab
                untuk rute yang sama di portal admin. */}
            <span className="text-center text-[11px] leading-tight text-gray-600 break-words">
              {p.judul}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
