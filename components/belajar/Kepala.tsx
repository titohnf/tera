'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GAYA_KEMBALI, JudulBilah, KELAS_BILAH, PanahKiri } from '@/components/ui/BilahJudul'
import PemilihAnak from '@/components/keluarga/PemilihAnak'
import type { Anak } from '@/lib/keluarga'

/**
 * Kepala permukaan belajar, beserta tombol kembalinya.
 *
 * Tombol kembali tinggal di header, bukan di badan halaman: "← Ganti mapel"
 * yang menumpang di atas daftar adalah kendali navigasi yang berpura-pura jadi
 * isi. Di header ia berada di tempat yang sama untuk setiap langkah.
 *
 * Yang dipanggilnya `history.back()` — langkah-langkah `PemilihLatihan` punya
 * alamat sendiri (`?mapel=`, `?topik=`) meski tidak berpindah halaman. Tombol
 * ini dan tombol kembali perangkat karena itu menempuh jalan yang sama.
 *
 * Header dirender oleh layout, sedangkan yang tahu ada tidaknya langkah untuk
 * dimundurkan adalah komponen jauh di bawahnya. Konteks ini jembatannya: yang
 * punya langkah memanggil `useTombolKembali(fn)`, dan header menampilkannya.
 *
 * Tanpa langkah, tombolnya TIDAK hilang melainkan berubah jadi tautan kembali
 * ke halaman sebelumnya. Ia satu-satunya jalan pulang sejak tombol "Selesai"
 * dihapus, dan header yang kosong di layar pertama berarti anak yang membuka
 * permukaan ini terkurung di dalamnya.
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
 * permukaan ini dari beranda portal, dan tombol kembali harus mengembalikan
 * ke sana — bukan ke "/". `usePulangKe(href)` mengarahkannya; tombol MUNDUR
 * tidak pernah ikut dilepas, karena bilah bawah menuju halaman lain — ia
 * tidak bisa memundurkan langkah di dalam permukaan ini.
 */
type Kembali = (() => void) | null

/** Daftar anak keluarga beserta yang sedang dibuka — null untuk pelanggan. */
type Pemilih = { anak: Anak[]; aktif: string } | null

const KonteksKepala = createContext<{
  kembali: Kembali
  pasang: (fn: Kembali) => void
  judul: string | null
  pasangJudul: (judul: string | null) => void
  pulang: string | boolean
  pasangPulang: (v: string | boolean) => void
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
  const [pulang, setPulang] = useState<string | boolean>(true)
  const [pemilih, setPemilih] = useState<Pemilih>(null)
  // Pembungkus fungsi: `setState` menganggap fungsi sebagai pembaru, jadi
  // menyimpan fungsi harus lewat satu lapis lagi.
  const pasang = useCallback((fn: Kembali) => setKembali(() => fn), [])
  const pasangJudul = useCallback((j: string | null) => setJudul(j), [])
  const pasangPulang = useCallback((v: string | boolean) => setPulang(v), [])
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
 * Mengarahkan tautan kembali di header ke halaman tertentu selama komponen
 * terpasang — misalnya beranda portal untuk keluarga bimbel.
 */
export function usePulangKe(href: string) {
  const { pasangPulang } = useContext(KonteksKepala)
  useEffect(() => {
    pasangPulang(href)
    return () => pasangPulang(true)
  }, [pasangPulang, href])
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

/**
 * Judul bawaan menurut layar, dipakai selama layar tidak memasang judulnya
 * sendiri (`useJudulKepala`). Ia dihitung dari alamat supaya judul header
 * selalu sama dengan nama kartu yang baru saja disentuh — dulu semuanya
 * "Belajar Mandiri", termasuk layar yang kartunya bernama "Latihan Soal".
 */
function judulBawaan(pathname: string): string {
  const [, , kedua, ketiga] = pathname.split('/')
  if (!kedua) return 'Latihan Soal'
  if (kedua === 'misi') return 'Misi'
  if (kedua === 'materi') return 'Materi'
  if (kedua === 'asesmen') return 'Asesmen'
  if (ketiga === 'hasil') return 'Hasil Latihan'
  return 'Latihan'
}

export function KepalaBelajar() {
  const { kembali, judul, pulang, pemilih } = useContext(KonteksKepala)
  const pathname = usePathname()
  return (
    <header className={KELAS_BILAH}>
      {kembali ? (
        <button type="button" onClick={kembali} aria-label="Kembali" className={GAYA_KEMBALI}>
          <PanahKiri />
        </button>
      ) : pulang ? (
        <Link href={typeof pulang === 'string' ? pulang : '/'} aria-label="Kembali ke beranda" className={GAYA_KEMBALI}>
          <PanahKiri />
        </Link>
      ) : null}
      <JudulBilah>{judul ?? judulBawaan(pathname)}</JudulBilah>

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
