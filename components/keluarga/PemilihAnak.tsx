'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Avatar from '@/components/admin/availability/Avatar'
import type { Anak } from '@/lib/keluarga'

/**
 * Pemilih anak di pojok kanan bilah atas portal keluarga.
 *
 * Menggantikan bilah tab yang dulu berdiri sendiri di bawah header
 * (`AnakTabs`). Tab itu benar isinya tapi mahal tempatnya: ia satu baris penuh
 * selebar layar, permanen di setiap halaman, untuk saklar yang dipakai
 * sekali-dua kali per kunjungan — dan pada keluarga beranak tiga, tab ketiga
 * hanya ketahuan ada kalau bilahnya digeser mendatar, gerakan yang jarang
 * ditemukan sendiri. Sebagai satu tombol di ujung kanan header, ia memakai
 * ruang yang memang sudah kosong, dan popupnya menampung berapa pun anaknya
 * dalam bentuk daftar tegak yang tidak perlu digeser.
 *
 * Yang tampak di tombol adalah avatar dan nama panggilan: avatarnya yang
 * membuat "sedang atas nama siapa" terbaca sekali lihat, namanya yang
 * memastikan dua anak berfoto mirip tidak jadi tebak-tebakan. Nama LENGKAPnya
 * muncul di dalam popup, tempat ruangnya ada.
 *
 * Berpindah anak MEMPERTAHANKAN halaman yang sedang dibuka — dari Tagihan anak
 * pertama mendarat di Tagihan anak kedua, bukan di berandanya. Itulah
 * pertanyaan yang sebenarnya sedang dijawab orang tua saat berpindah, "kalau
 * yang ini bagaimana?". Query string sengaja dibuang: `?month=2026-07` masih
 * masuk akal untuk anak lain, tapi id sesi atau tagihan di query tidak, dan
 * yang aman untuk semua kasus adalah membuka halaman itu dalam keadaan awalnya.
 *
 * Tidak dirender sama sekali untuk keluarga beranak satu — 20 dari 23 keluarga
 * — dan `HeaderKeluarga` yang memutuskannya.
 *
 * Ke mana pilihan itu membawa ditentukan PEMANGGIL, lewat `tautan`. Di dalam
 * portal jawabannya "halaman yang sama, anak lain", dan itulah bawaannya. Di
 * permukaan belajar — yang alamatnya `/belajar?anak=`, di luar `/keluarga` —
 * aturan itu tidak berlaku sama sekali; tanpa `tautan`, memilih anak di sana
 * berarti keluar dari latihan, yang bukan maksud siapa pun yang menyentuhnya.
 */
export default function PemilihAnak({
  anak,
  aktif,
  tautan,
}: {
  anak: Anak[]
  aktif: string
  /** Tujuan tiap pilihan. Bawaannya: halaman yang sedang dibuka, anak lain. */
  tautan?: (id: string) => string
}) {
  const pathname = usePathname()
  const [buka, setBuka] = useState(false)
  const wadah = useRef<HTMLDivElement>(null)

  const awalan = `/keluarga/${aktif}`
  const sisa = pathname.startsWith(awalan) ? pathname.slice(awalan.length) : ''
  const ini = anak.find((a) => a.id === aktif)

  /* Ketukan di luar dan tombol Esc keduanya menutup. Di ponsel yang pertama
     itu satu-satunya cara membatalkan yang terpikir orang — tanpa ia, popup
     yang tidak sengaja terbuka hanya bisa ditutup dengan memilih anak, yaitu
     dengan melakukan justru hal yang tidak diinginkan. */
  useEffect(() => {
    if (!buka) return
    const luar = (e: MouseEvent) => {
      if (!wadah.current?.contains(e.target as Node)) setBuka(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBuka(false)
    }
    document.addEventListener('mousedown', luar)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', luar)
      document.removeEventListener('keydown', esc)
    }
  }, [buka])

  if (!ini) return null

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-haspopup="menu"
        aria-expanded={buka}
        aria-label={`Anak yang dibuka: ${ini.full_name}. Ganti anak`}
        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 active:bg-slate-200"
      >
        {/* Avatar disuapi nama pendek, bukan nama lengkap: `getInitials`
            memulangkan dua huruf untuk nama berkata banyak — "MA" untuk
            "Muhammad Alif" — sementara tulisan di sebelahnya cuma "Muhammad".
            Satu kata masuk, satu huruf keluar, dan keduanya bercerita hal yang
            sama. Nama lengkapnya tetap dibawa `aria-label` di tombol ini. */}
        <Avatar name={ini.nama_pendek} avatarUrl={ini.avatar_url} size={28} />
        {/* `max-w-24 truncate`: nama panggilan biasanya sependek "Nadia", tapi
            yang belum mengisi panggilan memakai kata pertama nama lengkapnya,
            dan satu kata pun bisa panjang. */}
        <span className="max-w-24 truncate text-sm font-medium text-gray-700">
          {ini.nama_pendek}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${buka ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {buka && (
        <div
          role="menu"
          aria-label="Pilih anak"
          /* Melebar ke KIRI dari tepi kanan (`right-0`): tombolnya menempel di
             tepi layar, jadi popup yang melebar ke kanan akan terpotong.

             Berbayang, meski kartu-kartu di portal ini tidak: bayangnya yang
             mengatakan popup ini berada DI ATAS halaman, bukan bagian darinya.
             Lihat aturannya di `app/keluarga/layout.tsx`. */
          className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-900/10"
        >
          {anak.map((a) => {
            const dibuka = a.id === aktif
            return (
              <Link
                key={a.id}
                href={tautan ? tautan(a.id) : `/keluarga/${a.id}${sisa}`}
                role="menuitem"
                /* Ditutup di sini, bukan lewat efek yang mengintai perubahan
                   `pathname`: komponen ini dirakit di layout terluar, jadi ia
                   TIDAK dilepas-pasang saat anaknya berganti — tanpa ini
                   popupnya tetap menganga di halaman tujuan. */
                onClick={() => setBuka(false)}
                aria-current={dibuka ? 'true' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors active:bg-slate-100 ${
                  dibuka ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <Avatar name={a.nama_pendek} avatarUrl={a.avatar_url} size={36} />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      dibuka ? 'text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    {a.nama_pendek}
                  </span>
                  {/* Nama lengkapnya cuma ditampilkan kalau memang berbeda dari
                      panggilannya — mengulang "Nadia" dua baris beruntun bukan
                      keterangan, cuma tinggi. */}
                  {a.full_name !== a.nama_pendek && (
                    <span className="block truncate text-xs text-gray-500">{a.full_name}</span>
                  )}
                </span>
                {dibuka && (
                  <svg
                    className="h-4 w-4 shrink-0 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
