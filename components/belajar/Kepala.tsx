'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import PemilihAnak from '@/components/keluarga/PemilihAnak'
import type { Anak } from '@/lib/keluarga'

/**
 * Kepala permukaan belajar, beserta tombol kembalinya.
 *
 * Tombol kembali tinggal di header, bukan di badan halaman: langkah-langkah
 * memilih latihan seluruhnya hidup di browser (`PemilihLatihan`), jadi tidak
 * ada URL yang bisa ditautkan — dan "← Ganti mapel" yang menumpang di atas
 * daftar adalah kendali navigasi yang berpura-pura jadi isi. Di header ia
 * berada di tempat yang sama untuk setiap langkah.
 *
 * Header dirender oleh layout, sedangkan yang tahu ada tidaknya langkah untuk
 * dimundurkan adalah komponen jauh di bawahnya. Konteks ini jembatannya: yang
 * punya langkah memanggil `useTombolKembali(fn)`, dan header menampilkannya.
 *
 * Tanpa langkah, tombolnya TIDAK hilang melainkan berubah jadi tautan keluar.
 * Ia satu-satunya jalan pulang sejak tombol "Selesai" dihapus, dan header yang
 * kosong di layar pertama berarti anak yang membuka permukaan ini terkurung di
 * dalamnya.
 *
 * Ujung kanannya menampung pemilih anak, untuk keluarga beranak lebih dari
 * satu — pemilih yang sama persis dengan yang ada di header portal. Permukaan
 * ini dipakai atas nama SEORANG pelajar, dan tanpa pemilih itu satu-satunya
 * cara berpindah anak adalah pulang ke portal dulu, memilih di sana, lalu
 * masuk lagi. Yang memasangnya `usePemilihKepala()`, dipanggil dari halaman
 * yang tahu daftar anaknya — layout ini tidak, dan tidak boleh tahu: ia
 * dipakai pelanggan langganan juga, yang `keluargaContext()`-nya akan menolak.
 *
 * Kecuali kalau ada jalan pulang lain di layar. Keluarga bimbel membuka
 * permukaan ini lewat tab "Latihan", dan bilah navigasi portalnya ikut terbawa
 * ke sini (`BilahKeluarga`) — di layar itu tautan keluar di header adalah
 * kendali kedua menuju tempat yang sama, di pojok yang justru dipakai untuk
 * mundur selangkah. `useTanpaPulang()` melepasnya; tombol MUNDUR tidak pernah
 * ikut dilepas, karena langkah-langkah `PemilihLatihan` tidak punya alamat
 * sendiri dan bilah bawah tidak bisa memundurkannya.
 */
type Kembali = (() => void) | null

/** Daftar anak keluarga beserta yang sedang dibuka — null untuk pelanggan. */
type Pemilih = { anak: Anak[]; aktif: string } | null

const KonteksKepala = createContext<{
  kembali: Kembali
  pasang: (fn: Kembali) => void
  judul: string | null
  pasangJudul: (judul: string | null) => void
  pulang: boolean
  pasangPulang: (ada: boolean) => void
  pemilih: Pemilih
  pasangPemilih: (p: Pemilih) => void
}>({
  kembali: null,
  pasang: () => {},
  judul: null,
  pasangJudul: () => {},
  pulang: true,
  pasangPulang: () => {},
  pemilih: null,
  pasangPemilih: () => {},
})

export function PenyediaKepala({ children }: { children: React.ReactNode }) {
  const [kembali, setKembali] = useState<Kembali>(null)
  const [judul, setJudul] = useState<string | null>(null)
  const [pulang, setPulang] = useState(true)
  const [pemilih, setPemilih] = useState<Pemilih>(null)
  // Pembungkus fungsi: `setState` menganggap fungsi sebagai pembaru, jadi
  // menyimpan fungsi harus lewat satu lapis lagi.
  const pasang = useCallback((fn: Kembali) => setKembali(() => fn), [])
  const pasangJudul = useCallback((j: string | null) => setJudul(j), [])
  const pasangPulang = useCallback((ada: boolean) => setPulang(ada), [])
  const pasangPemilih = useCallback((p: Pemilih) => setPemilih(p), [])
  return (
    <KonteksKepala
      value={{
        kembali,
        pasang,
        judul,
        pasangJudul,
        pulang,
        pasangPulang,
        pemilih,
        pasangPemilih,
      }}
    >
      {children}
    </KonteksKepala>
  )
}

/** Memasang (atau melepas) tombol kembali di header selama komponen terpasang. */
export function useTombolKembali(fn: Kembali) {
  const { pasang } = useContext(KonteksKepala)
  useEffect(() => {
    pasang(fn)
    return () => pasang(null)
  }, [pasang, fn])
}

/**
 * Melepas tautan keluar dari header selama komponen terpasang — dipakai layar
 * yang sudah punya jalan pulangnya sendiri.
 */
export function useTanpaPulang() {
  const { pasangPulang } = useContext(KonteksKepala)
  useEffect(() => {
    pasangPulang(false)
    return () => pasangPulang(true)
  }, [pasangPulang])
}

/**
 * Memasang pemilih anak di ujung kanan header selama komponen terpasang.
 *
 * Yang disimpan datanya, bukan simpulnya: sebuah `ReactNode` punya identitas
 * baru setiap render, dan efek yang bergantung padanya akan memasang ulang
 * tanpa henti.
 */
export function usePemilihKepala(anak: Anak[], aktif: string) {
  const { pasangPemilih } = useContext(KonteksKepala)
  useEffect(() => {
    pasangPemilih({ anak, aktif })
    return () => pasangPemilih(null)
  }, [pasangPemilih, anak, aktif])
}

const GAYA_KEMBALI =
  '-ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-slate-100 hover:text-gray-900'

/**
 * Mengganti judul header selama komponen terpasang.
 *
 * Judul yang ikut berpindah membuat header jadi keterangan tempat, bukan papan
 * nama: begitu sebuah mapel dibuka, yang perlu dibaca anak adalah ia sedang di
 * mana — "Matematika Kelas 7" — bukan bahwa ini halaman latihan soal, yang
 * sudah jelas dari isinya.
 */
export function useJudulKepala(judul: string | null) {
  const { pasangJudul } = useContext(KonteksKepala)
  useEffect(() => {
    pasangJudul(judul)
    return () => pasangJudul(null)
  }, [pasangJudul, judul])
}

export function KepalaBelajar() {
  const { kembali, judul, pulang, pemilih } = useContext(KonteksKepala)
  return (
    <header className="flex h-14 items-center gap-1 border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6">
      {kembali ? (
        <button type="button" onClick={kembali} aria-label="Kembali" className={GAYA_KEMBALI}>
          <span className="text-xl leading-none" aria-hidden>
            ‹
          </span>
        </button>
      ) : pulang ? (
        <Link href="/" aria-label="Keluar dari latihan" className={GAYA_KEMBALI}>
          <span className="text-xl leading-none" aria-hidden>
            ‹
          </span>
        </Link>
      ) : null}
      <h1 className="truncate text-base font-semibold text-gray-900">
        {judul ?? 'Latihan Soal'}
      </h1>

      {pemilih && pemilih.anak.length > 1 && (
        <div className="ml-auto pl-2">
          {/* Berpindah anak TETAP di permukaan belajar — `?anak=` yang
              berganti, bukan alamatnya. Yang ditinggalkan cuma pilihan mapel
              dan topik yang sedang disusun, dan memang harus: keduanya milik
              anak yang tadi. */}
          <PemilihAnak
            anak={pemilih.anak}
            aktif={pemilih.aktif}
            tautan={(id) => `/belajar?anak=${id}`}
          />
        </div>
      )}
    </header>
  )
}
