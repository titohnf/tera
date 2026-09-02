'use client'

import { useSyncExternalStore } from 'react'
import AjakWhatsapp from '@/components/keluarga/AjakWhatsapp'
import TombolSalinKode from '@/components/keluarga/TombolSalinKode'
import { kodeReferal } from '@/lib/referal'

/**
 * Banner referal di dasar beranda keluarga.
 *
 * Tempatnya di DASAR, bukan di puncaknya. Ia satu-satunya isi halaman ini yang
 * tidak ditanyakan siapa pun — orang tua membuka portal untuk jadwal, tagihan,
 * dan kemajuan anaknya, bukan untuk diajak mengajak teman. Di puncak layar ia
 * menunda ketiganya demi sesuatu yang paling banter menarik sesekali; di dasar
 * ia tetap ditemukan oleh yang menggulir sampai habis, yaitu justru orang yang
 * sedang tidak terburu-buru.
 *
 * Bentuknya kartu berkupon: garis tepinya putus-putus, dan sepasang takik
 * setengah lingkaran menggigit sisi kiri-kanannya tepat di garis pemisah antara
 * tawaran dan tombolnya — bentuk karcis yang dirobek di perforasinya. Ia
 * satu-satunya kartu di portal ini yang bergaris tepi, dan itu disengaja: aturan
 * di `app/keluarga/layout.tsx` menyuruh kartu memakai bayang supaya lima kotak
 * beruntun tidak terbaca sebagai formulir, sementara kartu INI justru perlu
 * dibedakan dari empat kartu di atasnya — ia bukan kabar tentang anaknya.
 *
 * Takiknya dicat `bg-white` mengikuti latar PORTAL, bukan latar kartu — ia
 * lubang yang menembus kartu, jadi yang terlihat dari sana adalah halaman di
 * belakangnya. Kalau latar portal berubah, kedua `bg-white` itu harus ikut
 * berubah, atau takiknya jadi bidang putih yang mengambang.
 *
 * Yang jadi pusat kartu ini bukan kalimatnya, melainkan KODENYA: ia dicetak di
 * petak putih di atas bidang hijau, karena sebagian orang tua menyebutkannya
 * langsung saat mengobrol dan yang tidak terlihat tidak bisa disebutkan. Tombol WhatsApp
 * selebar kartu di bawahnya untuk yang memilih jalan cepat — pesannya sudah
 * lengkap dengan kode yang sama.
 *
 * Ada silang penutup di pojok kanan atas, dan penutupannya diingat di
 * `localStorage` PERANGKAT INI — bukan di basis data. Alasannya sepadan dengan
 * taruhannya: yang ditutup cuma sebuah tawaran, jadi kolom baru di `profiles`
 * plus satu jalur tulis dari portal keluarga adalah harga yang terlalu mahal
 * untuk itu. Konsekuensinya jujur saja: orang tua yang berganti ponsel atau
 * membersihkan data peramban akan melihatnya lagi.
 *
 * Di server, jawabannya dianggap "sudah ditutup", jadi banner tidak ikut
 * terkirim dalam HTML dan baru muncul sesudah penyimpanan terbaca di peramban.
 * Cara sebaliknya — kirim dulu, sembunyikan setelah dibaca — membuat yang sudah
 * menutupnya melihat banner itu berkedip sekali setiap kali beranda dibuka,
 * persis hal yang dihindari dengan menutupnya.
 *
 * Yang penting benar di kalimatnya: vouchernya untuk KEDUA belah pihak,
 * Rp50.000 masing-masing, dan baru berlaku saat temannya berhasil mendaftar.
 * Versi pertama banner ini menjanjikannya kepada pihak yang salah — salah-tulis
 * semacam itu bukan cuma tidak menarik, ia menjanjikan sesuatu kepada orang
 * yang tidak akan menerimanya.
 */
const KUNCI = 'tera:banner-referal-ditutup'

/* Penyimpanannya dibaca lewat `useSyncExternalStore`, bukan `useState` +
   `useEffect`. Dua alasan: `localStorage` tidak ada di server, jadi membacanya
   sebagai nilai awal state akan menabrak hidrasi; dan menuliskannya lewat
   `setState` di dalam effect dilarang lint `react-hooks/set-state-in-effect`.
   Yang di bawah ini memang bentuk yang dimaksud kait tersebut: satu sumber di
   luar React, dibaca apa adanya, dengan pendengar supaya penutupan di satu
   tempat langsung terlihat di semua. */
const pendengar = new Set<() => void>()

/* Cadangan untuk peramban yang menolak `localStorage`: tanpa ini, ketukan pada
   silang tidak menyembunyikan apa pun di sana, karena satu-satunya sumber
   jawabannya adalah penyimpanan yang gagal ditulis. */
let ditutupSesiIni = false

function berlangganan(ubah: () => void) {
  pendengar.add(ubah)
  // Peristiwa `storage` datang dari TAB LAIN: orang tua yang membuka portal di
  // dua tab tidak seharusnya menutup banner dua kali.
  window.addEventListener('storage', ubah)
  return () => {
    pendengar.delete(ubah)
    window.removeEventListener('storage', ubah)
  }
}

function sudahDitutup() {
  if (ditutupSesiIni) return true
  try {
    return window.localStorage.getItem(KUNCI) === '1'
  } catch {
    // Peramban yang menolak penyimpanan (mode privat, izin dimatikan) tetap
    // melihat bannernya — itu keadaan sebelum tombol ini ada, bukan kerusakan.
    return false
  }
}

/* Di server jawabannya selalu "sudah ditutup", jadi banner tidak ikut terkirim
   dalam HTML dan yang sudah menutupnya tidak pernah melihatnya berkedip. */
function sudahDitutupDiServer() {
  return true
}

export default function BannerPromosi({ profileId }: { profileId: string }) {
  const kode = kodeReferal(profileId)
  const ditutup = useSyncExternalStore(berlangganan, sudahDitutup, sudahDitutupDiServer)

  function tutup() {
    ditutupSesiIni = true
    try {
      window.localStorage.setItem(KUNCI, '1')
    } catch {
      // Tidak tersimpan: tertutup untuk kunjungan ini saja, dan muncul lagi
      // pada pemuatan halaman berikutnya.
    }
    pendengar.forEach((ubah) => ubah())
  }

  if (ditutup) return null

  return (
    <div className="relative rounded-xl border border-dashed border-gray-300 bg-gradient-to-br from-emerald-50 via-emerald-50 to-teal-100 p-4">
      {/* Dua gelembung di pojok kanan bawah, saling bertindih dan sebagian keluar
          bingkai. Isinya semi-tembus, jadi yang menggambar bentuknya adalah
          perpotongan keduanya — satu nada lebih pekat di tempat mereka
          bertumpuk. Sempat sembilan dan tersebar ke seluruh kartu: pada bidang
          sekecil ini yang muncul bukan tekstur melainkan keramaian, dan kartu
          paling tidak mendesak di halaman jadi yang paling ramai.

          Bukan ikon apa pun — ikon di sudut menuntut dikenali ("kado?
          terompet?"), gelembung cuma memecah warna datar lalu diam. Karena itu
          ia boleh lewat di belakang teks, asal kadarnya serendah ini.

          Petak pemotongnya terpisah dari kartu (`inset-0` + `overflow-hidden`),
          BUKAN `overflow-hidden` di kartunya: kartu yang memotong akan ikut
          menggunting takik perforasi di tepinya sampai mulut takiknya tertutup
          lagi. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
        <span className="absolute -bottom-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/[0.12]" />
        <span className="absolute -right-4 bottom-8 h-20 w-20 rounded-full bg-teal-500/[0.12]" />
      </span>

      {/* Silang penutup, melayang di sudut (`absolute`) supaya bidang ketuknya
          yang 32px tidak mendorong judul ke bawah; `pr-8` di judul yang menjaga
          kalimat tidak pernah lewat di bawahnya. */}
      <button
        onClick={tutup}
        aria-label="Tutup"
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 active:bg-black/10"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative flex flex-col gap-2">
        {/* Emoji ditulis di dalam kalimatnya, bukan sebagai ikon terpisah:
            pembaca layar membacanya sebagai bagian judul, dan tidak ada
            perataan yang bisa meleset di ponsel. */}
        <p className="pr-8 text-base font-semibold text-gray-900">Puas Belajar di Bimbel Tera? 🎉</p>

        <p className="text-sm leading-relaxed text-gray-700">
          Ajak temanmu belajar bersama dan dapatkan{' '}
          <span className="font-medium text-gray-900">voucher Rp50.000</span> untuk kalian berdua
          dengan memasukkan kode referal saat dia mendaftar.
        </p>

        {/* Kodenya petak putih di atas kartu berwarna — kebalikan dari
            sebelumnya, sejak seluruh kartu berwarna. Yang berbentuk kupon tetap kartunya:
            dua bingkai kupon bersarang saling melemahkan. */}
        <div className="mt-1 flex h-10 items-center justify-between gap-2 rounded-lg bg-white px-3">
          <span className="font-mono text-sm font-semibold tracking-wider text-emerald-900">
            {kode}
          </span>
          <TombolSalinKode
            kode={kode}
            className="shrink-0 px-2 py-1 text-blue-600 active:bg-blue-100"
          />
        </div>

        {/* Perforasinya: garis putus-putus melintang, dan dua takik setengah
            lingkaran yang menggigit tepi kartu di ketinggian yang sama. Takiknya
            digeser sejauh padding kartu plus tebal garisnya (`17px`) supaya
            duduk tepat di tepi, dan sisi datarnya tanpa garis supaya mulutnya
            terbaca terbuka. */}
        <div className="relative border-t border-dashed border-gray-300">
          <span className="absolute -left-[17px] top-1/2 h-4 w-2 -translate-y-1/2 rounded-r-full border border-l-0 border-dashed border-gray-300 bg-white" />
          <span className="absolute -right-[17px] top-1/2 h-4 w-2 -translate-y-1/2 rounded-l-full border border-r-0 border-dashed border-gray-300 bg-white" />
        </div>

        <AjakWhatsapp
          kode={kode}
          className="h-10 w-full justify-center bg-emerald-600 active:bg-emerald-700"
        />
      </div>
    </div>
  )
}
