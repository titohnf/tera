'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { mulaiLangkahTopik, ulangiPaket } from '@/app/belajar/actions'
import TombolKunciJawaban from '@/components/belajar/TombolKunciJawaban'

/**
 * Jalan keluar sesudah satu putaran — dan di sinilah taruhan seluruh alurnya.
 *
 * Dua pilihan yang saling meniadakan: mengerjakan lagi soal yang masih salah,
 * ATAU melihat kuncinya. Yang kedua MENGUNCI paketnya; sesudah itu nilainya
 * berhenti di angka yang sekarang, selamanya. Kalau keduanya bisa diambil
 * berurutan, "lihat kunci lalu ulangi" jadi jalan pintas menuju seratus persen
 * yang tidak mengajarkan apa pun — jadi harganya disebutkan di tombolnya, bukan
 * disembunyikan di dialog yang muncul sesudah ditekan.
 *
 * Komponen browser karena kedua tombolnya memanggil server action yang bisa
 * gagal. Kegagalan seperti itu bukan layar rusak, jadi yang muncul kalimat.
 *
 * HANYA LANGKAH, BUKAN NAVIGASI. "Pilih Paket Lain" dan "Pilih Latihan Lain"
 * pernah berdiri paling bawah di sini, dan keduanya sudah pergi: lima tombol
 * bertumpuk membuat anak membaca daftar alih-alih memilih, dan yang paling
 * mahal justru yang paling penting — "Kerjakan Lagi" di puncaknya kehilangan
 * bobotnya begitu ia cuma satu dari lima kotak seukuran.
 *
 * Keduanya juga bukan jenis yang sama dengan tetangganya. Sisa tombol di sini
 * MELAKUKAN sesuatu pada paket yang barusan dikerjakan — mengulang, melangkah,
 * membuka kunci. Dua itu cuma berpindah tempat, dan kendali navigasi yang
 * menyamar jadi isi halaman adalah pola yang sudah lama ditolak permukaan ini
 * (lihat `Kepala.tsx`: tombol kembali tinggal di header). Arah pulangnya
 * sekarang dipasang halaman hasil lewat `PulangKe` — panah kembali di header
 * mendarat di halaman topiknya, bukan di beranda.
 */
export default function PilihanSesudahSkor({
  sesiId,
  sisa,
  terkunci,
  kunciTerbuka,
  materi,
  probe = false,
  lanjut = null,
  ujian = null,
  namaPaket = null,
  kunciDiKartu = false,
}: {
  sesiId: string
  /** Soal paket ini yang masih salah. Nol berarti paketnya sudah benar semua. */
  sisa: number
  /** Kuncinya sudah pernah dibuka, jadi paket ini tidak bisa dikerjakan lagi. */
  terkunci: boolean
  /** Layar ini sedang menampilkan kuncinya, jadi tombolnya tidak perlu lagi. */
  kunciTerbuka: boolean
  /** Materi topik yang barusan dikerjakan, kalau topiknya punya materi. */
  materi: string | null
  /**
   * Sesi ini probe retest (FR11), jadi tidak ada yang bisa diulang dan tidak
   * ada kunci yang boleh dibuka. Bukan karena pelit: kolam probe sebuah topik
   * kecil dan dipakai berkali-kali sepanjang berbulan-bulan, dan butir yang
   * kuncinya pernah terlihat berhenti mengukur apa pun selamanya.
   */
  probe?: boolean
  /**
   * Langkah berikutnya topik ini (migrasi 190), atau null kalau tidak ada.
   *
   * NULL PUNYA DUA ARTI YANG SENGAJA TIDAK DIBEDAKAN di sini: sesi ini bukan
   * paket peta, atau paket barusan belum lolos ambang sehingga langkahnya masih
   * paket yang sama. Keduanya berujung pada layar yang sama — tanpa tombol
   * lanjut — dan membedakannya berarti menyeberangkan kabar "nilaimu kurang"
   * yang tidak diminta siapa pun. Yang kurang sudah punya kalimatnya sendiri:
   * "Kerjakan Lagi N Soal yang Salah".
   */
  lanjut?: {
    topikId: string
    anak: string | null
    label: string
    /** Diisi untuk ujian: dilewatkan halaman topik dulu, tidak dibuka langsung. */
    alamatTopik: string | null
  } | null
  /**
   * Tantangan Akhir sebagai pilihan KEDUA, saat yang direkomendasikan pengayaan
   * (migrasi 220). Selalu lewat halaman topik, yang menyebut bahwa ujian hanya
   * sekali sebelum tombol pembukanya ada.
   */
  ujian?: { alamatTopik: string } | null
  /** Nama paket yang barusan dikerjakan (mis. "Level 2"), supaya tombol kuncinya menyebut kunci yang mana. */
  namaPaket?: string | null
  /** Tombol kunci jawabannya sudah dipasang di kartu paket, jadi jangan dobel di sini. */
  kunciDiKartu?: boolean
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  function jalankan(aksi: () => Promise<{ error: string } | void>) {
    setGalat(null)
    mulai(async () => {
      const hasil = await aksi()
      if (hasil && 'error' in hasil) setGalat(hasil.error)
    })
  }

  const utama =
    'block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300'
  const biasa =
    'block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-kartu transition hover:bg-slate-100 disabled:text-gray-400'

  const bisaDiulang = !probe && sisa > 0 && !terkunci

  return (
    <div className="space-y-2">
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      {bisaDiulang && (
        <button
          type="button"
          disabled={sibuk}
          onClick={() => jalankan(() => ulangiPaket(sesiId))}
          className={utama}
        >
          Kerjakan Lagi {sisa} Soal yang Salah
        </button>
      )}

      {/* Melangkah maju berdiri SESUDAH "kerjakan lagi" dan SEBELUM kunci
          jawaban. Urutannya bukan selera: yang paling atas adalah yang paling
          kita harapkan dilakukan anak, dan memperbaiki yang salah lebih
          berharga daripada menambah paket baru. Tapi ia tetap di atas kunci
          jawaban — melangkah maju selalu lebih baik daripada mengakhiri paket
          ini dengan melihat kuncinya. */}
      {lanjut &&
        (lanjut.alamatTopik ? (
          <Link href={lanjut.alamatTopik} className={bisaDiulang ? biasa : utama}>
            {lanjut.label}
          </Link>
        ) : (
          <button
            type="button"
            disabled={sibuk}
            onClick={() =>
              jalankan(() => mulaiLangkahTopik(lanjut.anak ?? undefined, lanjut.topikId))
            }
            className={bisaDiulang ? biasa : utama}
          >
            {lanjut.label}
          </button>
        ))}

      {ujian && (
        <div className="space-y-1.5 pt-2">
          <p className="text-center text-sm text-gray-600">
            Sudah siap untuk menghadapi Tantangan Akhir?
          </p>
          <Link href={ujian.alamatTopik} className={biasa}>
            Lanjut ke Tantangan Akhir
          </Link>
        </div>
      )}

      {/* Kunci jawaban: di sesi jalur peta ia tinggal DI DALAM kartu paketnya
          (hasil/page.tsx, `kunciDiKartu`), karena kunci itu milik paket yang
          kartunya baru ditampilkan. Di sesi lain yang tidak punya kartu itu ia
          berdiri di sini, sebagai tombol sekunder. */}
      {!probe && !kunciTerbuka && !kunciDiKartu && (
        <div className="border-t border-gray-200 pt-4">
          <TombolKunciJawaban sesiId={sesiId} terkunci={terkunci} namaPaket={namaPaket} />
        </div>
      )}

      {materi && (
        <p className="pt-1 text-center">
          <Link href={materi} className="text-sm font-medium text-blue-600">
            Baca materinya dulu
          </Link>
        </p>
      )}
    </div>
  )
}
