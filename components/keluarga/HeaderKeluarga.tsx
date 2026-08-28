'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import PemilihAnak from '@/components/keluarga/PemilihAnak'
import type { Anak } from '@/lib/keluarga'

/**
 * Bilah atas portal keluarga: logo di beranda, nama layar di halaman lain.
 *
 * Sebelumnya isinya selalu logo dan tulisan "Bimbel Tera". Di beranda itu
 * benar — layar pertama memang harus menyebut ini aplikasi siapa — tapi di
 * halaman lain ia jadi 56px yang tidak mengatakan apa-apa, sementara satu-
 * satunya penanda "saya sedang di mana" cuma ikon kecil yang menyala di dasar
 * layar. Nama layar di puncaknya menjawab itu tanpa menambah apa pun.
 *
 * Peta di bawah lebih halus daripada pengelompokan bilah navigasi bawah, dan
 * memang disengaja. Bilah bawah menaungi Tagihan, Materi, dan Penguasaan di
 * bawah satu ikon "Profil" karena tempatnya cuma empat; puncak layar tidak
 * punya batas itu, dan halaman yang judulnya "Tagihan" tidak sepatutnya
 * berkepala "Profil".
 *
 * Halaman yang namanya muncul di sini TIDAK lagi menulis `h1` sendiri — dua
 * judul yang sama, bertumpuk, adalah harga yang tidak perlu dibayar di layar
 * setinggi 640px.
 *
 * Empat halaman yang dibuka dari petak ikon di beranda — Tagihan, Laporan,
 * Materi, Penguasaan — membawa panah kembali ke beranda di sebelah judulnya.
 * Panahnya sendirian, tanpa tulisan: yang ditinggalkan sudah jelas karena cuma
 * dari sanalah keempatnya bisa dibuka, dan panah bertulisan di puncak layar
 * bersaing dengan judul yang berdiri tepat di sebelahnya. Keempatnya tidak
 * punya tempat di bilah navigasi bawah, jadi tanpa panah ini satu-satunya
 * jalan pulang adalah tombol kembali milik browser — yang di ponsel berarti
 * gerakan geser dari tepi, dan tidak semua orang memakainya.
 *
 * Ujung kanannya adalah slot kosong `#aksi-layar`: halaman boleh menaruh satu
 * aksi miliknya sendiri sejajar dengan judul lewat `createPortal` (lihat
 * `components/keluarga/SaringSheet`).
 *
 * Paling kanan lagi — sesudah slot itu — duduk pemilih anak, untuk keluarga
 * yang anaknya lebih dari satu. Ia dulu sebuah bilah tab tersendiri di bawah
 * header; alasan pemindahannya ditulis di `PemilihAnak`. Tempatnya di header
 * TERLUAR, bukan di rangka `[studentId]`, supaya ia tidak ikut dipasang ulang
 * setiap kali anaknya berganti — dan karena itu satu-satunya alasan daftar
 * anaknya diturunkan sampai ke sini.
 */

type Layar = {
  judul: string
  /**
   * Sub-path tujuan panah kembali, lengkap dengan garis miringnya; string
   * kosong berarti beranda anak. Tanpa kunci ini, tidak ada panah.
   */
  kembali?: string
}

const LAYAR: Record<string, Layar> = {
  // `kembali: ''` ikut sejak Jadwal turun dari bilah bawah jadi petak di
  // beranda: pintu masuknya sekarang beranda, jadi panah kembali harus pulang
  // ke sana. Tanpa itu, layar yang dibuka dari sebuah petak tidak punya jalan
  // mundur ke petak-petaknya.
  jadwal: { judul: 'Riwayat Kelas', kembali: '' },
  notifikasi: { judul: 'Notifikasi' },
  profil: { judul: 'Profil' },
  tagihan: { judul: 'Tagihan', kembali: '' },
  laporan: { judul: 'Laporan Bulanan', kembali: '' },
  penguasaan: { judul: 'Penguasaan', kembali: '' },
}

export default function HeaderKeluarga({ anak }: { anak: Anak[] }) {
  const pathname = usePathname()
  const cocok = pathname.match(/^\/keluarga\/([^/]+)\/([^/]+)/)
  const studentId = cocok?.[1]
  const layar = cocok ? LAYAR[cocok[2]] : undefined
  /* Beranda anak (`/keluarga/<id>`) tidak punya sub-path, jadi `cocok` di atas
     tidak menangkapnya — sementara pemilih anak justru paling sering dipakai
     dari sana. Id-nya ditelusuri sendiri. */
  const anakDibuka = pathname.match(/^\/keluarga\/([^/]+)/)?.[1]

  return (
    <header className="h-14 bg-white border-b border-gray-100 shadow-sm flex items-center px-4 sm:px-6">
      {layar ? (
        <div className="flex items-center gap-1">
          {layar.kembali !== undefined && (
            <Link
              href={`/keluarga/${studentId}${layar.kembali}`}
              aria-label="Kembali"
              /* `-ml-2` menarik panahnya kembali ke garis tepi isi halaman:
                 tanpa itu, padding tombol yang dibutuhkan ibu jari membuat
                 judulnya tampak menjorok dibanding layar-layar lain. */
              className="-ml-2 p-2 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <h1 className="text-base font-semibold text-gray-900">{layar.judul}</h1>
        </div>
      ) : (
        /* Ikonnya saja, teksnya ditulis sendiri. `logo-tera.png` sudah memuat
           tulisan "Bimbel" di atas "Tera" — bertumpuk, dan pada tinggi bilah
           14 (56px) tulisan itu mengecil sampai nyaris tidak terbaca di
           ponsel. `logo-icon.png` adalah lambangnya tanpa teks. */
        <Link href="/keluarga" className="flex items-center gap-2" aria-label="Beranda Bimbel Tera">
          <Image
            src="/logo-icon.png"
            alt=""
            width={1103}
            height={1086}
            priority
            className="h-7 w-auto"
          />
          <span className="text-base text-gray-900">
            Bimbel <span className="font-semibold">Tera</span>
          </span>
        </Link>
      )}

      {/* Tempat halaman menaruh aksinya sendiri — saringan jadwal, misalnya —
          lewat `createPortal`. Slotnya selalu ada dan biasanya kosong: bilah
          ini dirakit di layout terluar, sementara yang tahu aksi apa yang
          pantas di sini adalah halaman yang sedang dibuka. */}
      <div id="aksi-layar" className="ml-auto flex items-center" />

      {anak.length > 1 && anakDibuka && (
        /* `ml-1` hanya kalau ada tetangga; slot aksi di atas sudah memakai
           `ml-auto`, jadi jarak ini yang memisahkan keduanya. */
        <div className="ml-1 flex items-center">
          <PemilihAnak anak={anak} aktif={anakDibuka} />
        </div>
      )}
    </header>
  )
}
