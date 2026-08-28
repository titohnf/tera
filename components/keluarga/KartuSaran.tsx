/**
 * Kartu "Kritik & Saran" di dasar beranda, di bawah banner referal.
 *
 * Isinya sebuah tautan keluar ke Google Form, bukan formulir di dalam aplikasi.
 * Itu keputusan sadar dan bukan kemalasan: masukan orang tua dibaca dan dibalas
 * manusia, jadi yang dibutuhkan cuma satu kotak teks yang sampai ke tempat yang
 * dibaca staf — sementara formulir sendiri berarti tabel baru, halaman admin
 * untuk membacanya, dan seseorang yang mengingat untuk membukanya.
 *
 * Bentuknya kartu putih ber-`shadow-kartu`, sama dengan Tagihan dan Latihan di
 * atasnya, dan sengaja TIDAK berwarna: banner referal tepat di atasnya sudah
 * berupa bidang hijau, dan dua ajakan berwarna beruntun di dasar halaman
 * membuat keduanya sama-sama terbaca sebagai iklan.
 *
 * Tanpa ikon panah-keluar di ujung kanan, meski tujuannya memang meninggalkan
 * aplikasi: pada kartu sependek ini panah itu menambah satu hal untuk dilihat
 * demi keterangan yang tidak mengubah keputusan siapa pun.
 *
 * Kalau `URL_FORMULIR` dikosongkan, kartunya tidak muncul sama sekali — lebih
 * baik tidak ada daripada mengantar orang ke tautan yang tidak menuju ke mana
 * pun.
 */

// SEMENTARA: tautan contoh supaya kartunya terlihat saat dikembangkan. Ganti
// dengan Google Form Bimbel Tera yang sebenarnya SEBELUM dirilis — tautan ini
// menuju formulir kosong milik Google, bukan milik kami, dan masukan yang
// dikirim ke sana tidak akan pernah dibaca siapa pun. Kosongkan kembali kalau
// formulirnya batal dibuat; kartunya akan hilang sendiri.
const URL_FORMULIR = 'https://docs.google.com/forms/d/e/1FAIpQLSf_CONTOH_GANTI_SEBELUM_RILIS/viewform'

export default function KartuSaran() {
  if (!URL_FORMULIR) return null

  return (
    <a
      href={URL_FORMULIR}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-kartu transition active:bg-slate-50"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900">Kritik &amp; Saran</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-gray-500">
          Ceritakan apa yang bisa kami perbaiki.
        </span>
      </span>

    </a>
  )
}
