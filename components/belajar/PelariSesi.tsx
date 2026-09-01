'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { SoalSesi } from '@/lib/belajar/sesi'
import { acakOpsi } from '@/lib/belajar/acak-opsi'
import { periksaJawaban, selesaikanLatihan } from '@/app/belajar/actions'
import InputSoal from './InputSoal'

/**
 * Mengerjakan satu sesi: satu soal sekaligus, sampai habis, baru nilainya.
 *
 * TIDAK ADA umpan balik per soal, dan itu berubah dengan sengaja. Dulu tiap
 * jawaban langsung dibalas "Benar"/"Belum tepat" beserta pembahasannya, dan
 * bentuk itu punya dua akibat yang baru terlihat setelah dipakai: anak
 * mengerjakan sepuluh soal sambil terus-menerus diberi tahu jawabannya, jadi
 * tidak pernah ada satu titik pun ia menghadapi sepuluh soal dengan kepalanya
 * sendiri; dan kesempatan MENGERJAKAN ULANG soal yang salah jadi tidak ada
 * artinya, karena kuncinya sudah lewat di layar.
 *
 * Sekarang sepuluh soal dikerjakan tanpa balasan, nilainya dibuka di akhir, dan
 * kuncinya baru sesudah anaknya memilih untuk melihatnya. Lihat
 * `PilihanSesudahSkor`.
 *
 * Jawabannya tetap DICATAT satu per satu, tidak ditumpuk sampai akhir: sesi
 * yang ditinggalkan di tengah harus bisa dilanjutkan dari tempatnya berhenti
 * (migrasi 114), dan itu cuma mungkin kalau tiap jawaban sudah mendarat di
 * database. Yang ditahan cuma HASILNYA, di layar.
 *
 * Dimulai dari soal PERTAMA YANG BELUM DIJAWAB, bukan dari soal pertama:
 * anak yang menutup tab di soal keenam membukanya lagi di soal keenam.
 *
 * Penilaian tidak pernah terjadi di sini. `periksaJawaban` mengambil kuncinya
 * di server, jadi kunci jawaban tidak pernah ada di dalam bundel yang dikirim
 * ke browser — termasuk untuk soal yang belum dijawab.
 *
 * WAKTU DAN JEDA (FR6). Tiap butir membawa kapan ia mulai terlihat dan berapa
 * lama halamannya sempat tidak terlihat selagi terbuka. Yang kedua itu yang
 * membuat angkanya berarti: tanpa memotong jeda, satu anak yang ditinggal
 * makan siang dengan layar menyala akan tercatat mengerjakan satu soal selama
 * empat puluh menit, dan Protokol Uji Coba memakai rata-rata ini untuk
 * memperkirakan beban produksi konten.
 *
 * Yang TIDAK dihitung sebagai jeda: layar yang menyala tapi tidak disentuh.
 * Anak yang menatap soal selama tiga menit memang sedang mengerjakan soal itu,
 * dan menebak kapan ia "sebenarnya berhenti berpikir" bukan hal yang bisa
 * diketahui browser mana pun.
 */
export default function PelariSesi({
  sesiId,
  soal,
  batasWaktu,
}: {
  sesiId: string
  soal: SoalSesi[]
  /** ISO, hanya untuk paket ujian. Null berarti sesi ini tidak berbatas waktu. */
  batasWaktu?: string | null
}) {
  const mulaiDari = Math.max(
    soal.findIndex(s => !s.sudahDijawab),
    0
  )
  const [indeks, setIndeks] = useState(mulaiDari)
  const [jawaban, setJawaban] = useState<unknown>(undefined)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()
  const [mulaiButir, setMulaiButir] = useState(() => new Date().toISOString())

  // Ref, bukan state: keduanya berubah karena peristiwa di luar render dan tidak
  // satu pun mengubah tampilan. Menyimpannya sebagai state cuma membuat halaman
  // dirender ulang setiap kali anak berpindah tab.
  const jedaMs = useRef(0)
  const hilangSejak = useRef<number | null>(null)

  useEffect(() => {
    function ubah() {
      if (document.hidden) {
        hilangSejak.current = Date.now()
      } else if (hilangSejak.current !== null) {
        jedaMs.current += Date.now() - hilangSejak.current
        hilangSejak.current = null
      }
    }
    document.addEventListener('visibilitychange', ubah)
    return () => document.removeEventListener('visibilitychange', ubah)
  }, [])

  const sekarang = soal[indeks]
  const terakhir = indeks + 1 >= soal.length

  // Diacak sekali per butir, bukan tiap render: daftar yang berubah urutan di
  // bawah jari yang sedang memilihnya adalah cara tercepat membuat anak salah
  // menekan.
  const { soal: tampil, urutan } = useMemo(() => acakOpsi(sekarang), [sekarang])

  /**
   * Mencatat jawaban lalu maju. Hasil penilaiannya dibuang di sini dengan
   * sengaja — yang dibutuhkan cuma kepastian bahwa jawabannya TERCATAT, dan
   * null dari server berarti tidak tercatat.
   */
  function lanjut() {
    setGalat(null)
    mulai(async () => {
      // Jeda yang sedang berjalan ikut dihitung: anak yang menjawab lalu
      // langsung berpindah tab meninggalkan `hilangSejak` terisi, dan tanpa ini
      // waktu itu menempel ke butir BERIKUTNYA.
      const jedaBerjalan =
        hilangSejak.current === null ? 0 : Date.now() - hilangSejak.current

      const tercatat = await periksaJawaban(sesiId, sekarang.id, jawaban ?? null, {
        waktuMulai: mulaiButir,
        jedaMs: jedaMs.current + jedaBerjalan,
        urutanOpsi: urutan,
      })
      if (!tercatat) {
        setGalat('Jawabanmu belum tersimpan. Coba tekan sekali lagi.')
        return
      }
      if (!terakhir) {
        setIndeks(indeks + 1)
        setJawaban(undefined)
        setMulaiButir(new Date().toISOString())
        jedaMs.current = 0
        hilangSejak.current = null
        return
      }
      await selesaikanLatihan(sesiId)
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-gray-700">
            Soal {indeks + 1} dari {soal.length}
          </p>
          <p className="text-xs text-gray-400">{Math.round((indeks / soal.length) * 100)}%</p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${(indeks / soal.length) * 100}%` }}
          />
        </div>
      </div>

      {batasWaktu && <HitungMundur batas={batasWaktu} />}

      <div className="rounded-xl bg-white p-4 shadow-kartu">
        <InputSoal soal={tampil} nilai={jawaban} onChange={setJawaban} />
      </div>

      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      <button
        type="button"
        disabled={sibuk || jawaban === undefined}
        onClick={lanjut}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
      >
        {sibuk ? 'Menyimpan…' : terakhir ? 'Selesai & Lihat Nilai' : 'Lanjut'}
      </button>
    </div>
  )
}

/**
 * Sisa waktu paket ujian (FR4).
 *
 * MEMBERI TAHU, TIDAK MEMAKSA. Waktu habis tidak mengirim jawaban, tidak
 * mengunci tombol, dan tidak memindahkan halaman — PRD FR4 menetapkan itu untuk
 * Tahap 0 dengan alasan yang eksplisit, dan ada alasan kedua yang lebih
 * mendesak: pilot ini sedang mengumpulkan berapa lama sebuah soal dikerjakan
 * (FR6), dan submit paksa di tengah kalimat merusak angka yang justru sedang
 * diukur.
 *
 * Dihitung ulang dari `batas` tiap detik, bukan dengan mengurangi satu dari
 * angka sebelumnya. Penghitung yang mengurangi dirinya sendiri akan melenceng
 * setiap kali tab-nya tidak aktif — dan tab yang tidak aktif justru hal yang
 * paling sering terjadi pada layar yang dibuka anak.
 */
function HitungMundur({ batas }: { batas: string }) {
  const akhir = new Date(batas).getTime()
  const [sisa, setSisa] = useState(() => akhir - Date.now())

  useEffect(() => {
    const jam = setInterval(() => setSisa(akhir - Date.now()), 1000)
    return () => clearInterval(jam)
  }, [akhir])

  const habis = sisa <= 0
  const detik = Math.max(0, Math.floor(sisa / 1000))
  const menit = Math.floor(detik / 60)
  const mendesak = !habis && sisa < 5 * 60 * 1000

  return (
    <p
      aria-live="off"
      className={`rounded-xl px-3 py-2 text-sm ring-1 ${
        habis
          ? 'bg-amber-50 text-amber-800 ring-amber-100'
          : mendesak
            ? 'bg-amber-50 text-amber-700 ring-amber-100'
            : 'bg-white text-gray-600 shadow-kartu ring-transparent'
      }`}
    >
      {habis ? (
        <>Waktu ujiannya sudah habis. Jawabanmu tetap tersimpan — selesaikan saja.</>
      ) : (
        <>
          Sisa waktu{' '}
          <span className="font-semibold tabular-nums">
            {String(menit).padStart(2, '0')}:{String(detik % 60).padStart(2, '0')}
          </span>
        </>
      )}
    </p>
  )
}
