'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { bukaKunciJawaban, ulangiPaket } from '@/app/belajar/actions'

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
 */
export default function PilihanSesudahSkor({
  sesiId,
  sisa,
  terkunci,
  kunciTerbuka,
  daftarPaket,
  kembali,
  materi,
  probe = false,
}: {
  sesiId: string
  /** Soal paket ini yang masih salah. Nol berarti paketnya sudah benar semua. */
  sisa: number
  /** Kuncinya sudah pernah dibuka, jadi paket ini tidak bisa dikerjakan lagi. */
  terkunci: boolean
  /** Layar ini sedang menampilkan kuncinya, jadi tombolnya tidak perlu lagi. */
  kunciTerbuka: boolean
  /** Daftar paket topik ini, untuk kembali memilih. Null kalau topiknya tak diketahui. */
  daftarPaket: string | null
  /** Daftar mapel, atas nama anak yang sama. */
  kembali: string
  /** Materi topik yang barusan dikerjakan, kalau topiknya punya materi. */
  materi: string | null
  /**
   * Sesi ini probe retest (FR11), jadi tidak ada yang bisa diulang dan tidak
   * ada kunci yang boleh dibuka. Bukan karena pelit: kolam probe sebuah topik
   * kecil dan dipakai berkali-kali sepanjang berbulan-bulan, dan butir yang
   * kuncinya pernah terlihat berhenti mengukur apa pun selamanya.
   */
  probe?: boolean
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
    'block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-kartu transition hover:bg-slate-50 disabled:text-gray-400'

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

      {/* Harganya ditulis di tombolnya. Sebuah tombol bernama "Lihat Kunci
          Jawaban" yang diam-diam menghentikan paket adalah tombol yang
          berbohong, dan yang hilang karenanya tidak bisa dikembalikan. */}
      {!probe && !kunciTerbuka && !terkunci && (
        <button
          type="button"
          disabled={sibuk}
          onClick={() => jalankan(() => bukaKunciJawaban(sesiId))}
          className={bisaDiulang ? biasa : utama}
        >
          <span className="block">Lihat Kunci Jawaban</span>
          <span className="mt-0.5 block text-xs font-normal text-gray-500">
            Paket ini terkunci sesudahnya — nilainya berhenti di sini
          </span>
        </button>
      )}

      {/* Sudah terkunci: kuncinya boleh dibuka lagi kapan saja, karena yang
          hilang sudah hilang. Tidak ada peringatan kedua untuk harga yang sudah
          dibayar. */}
      {!probe && terkunci && !kunciTerbuka && (
        <Link href={`/belajar/${sesiId}/hasil?kunci=1`} className={utama}>
          Lihat Kunci Jawaban
        </Link>
      )}

      {daftarPaket && (
        <Link href={daftarPaket} className={biasa}>
          Pilih Paket Lain
        </Link>
      )}

      <Link href={kembali} className={biasa}>
        Pilih Latihan Lain
      </Link>

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
