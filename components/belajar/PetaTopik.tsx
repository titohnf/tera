'use client'

import { useState } from 'react'
import type { PaketPeta, TopikPeta } from '@/lib/belajar/topik-peta'
import DaftarPaket from './DaftarPaket'

/**
 * Peta kompetensi: topik yang boleh dikerjakan anak ini, berurut menurut
 * prasyarat — bukan menurut bab buku teks.
 *
 * Ini permukaan yang menggantikan pemilihan lewat topik kurikulum untuk
 * Matematika. Bedanya bukan tampilan melainkan pertanyaannya: pemilih lama
 * bertanya "mau latihan bab yang mana", peta ini bertanya "kamu siap belajar
 * apa". Bab menyusul jadwal les dan berbeda antar program; kesiapan tidak.
 *
 * DAFTARNYA DATANG DARI SERVER, bukan dijemput sendiri sesudah komponennya
 * hidup. Versi pertama memanggil `muatPeta()` di dalam `useEffect`, dan itu
 * punya dua akibat yang cuma kelihatan setelah dipakai: petanya baru muncul
 * satu perjalanan jaringan sesudah sisa halaman — sering terbaca sebagai "harus
 * dimuat ulang dulu baru muncul" — dan setiap kegagalan panggilan berakhir
 * sebagai layar yang diam, karena tidak adanya topik dan gagalnya pertanyaan
 * menghasilkan tampilan yang sama persis: tidak ada apa-apa.
 *
 * Halaman `/belajar` sudah tahu atas nama siapa ia dibuka, jadi ia pula yang
 * bertanya. Yang tersisa di browser cuma yang memang milik browser: topik mana
 * yang sedang dibentangkan.
 *
 * PRASYARAT MEMBERI TAHU, BUKAN MEMBLOKIR. Topik yang prasyaratnya belum
 * tuntas tetap bisa diketuk, cuma disertai keterangan. Tanpa placement test,
 * satu-satunya yang sistem tahu adalah apa yang sudah pernah ia ukur sendiri —
 * dan mengunci anak dari topik yang mungkin sudah ia kuasai di sekolah, hanya
 * karena kita belum sempat mengukurnya, adalah menghukum orang atas kekurangan
 * kita sendiri.
 */
export default function PetaTopik({
  anak,
  topik,
  paketAwal,
}: {
  anak: string | undefined
  topik: TopikPeta[]
  /** Paket topik yang terbentang sejak awal, dibawa server bersama halamannya. */
  paketAwal?: PaketPeta[]
}) {
  // Satu topik saja: tidak ada yang perlu dipilih, jadi jangan menyuruh orang
  // mengetuk untuk membuka satu-satunya pintu yang ada.
  const [terbuka, setTerbuka] = useState<string | null>(
    topik.length === 1 ? topik[0].id : null
  )

  // Tidak ada topik berisi: layar ini tidak punya apa pun untuk ditawarkan, dan
  // yang benar adalah tidak muncul sama sekali — bukan menampilkan kerangka
  // kosong yang terbaca seperti aplikasi rusak.
  if (topik.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Matematika</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Urutannya mengikuti apa yang perlu dikuasai lebih dulu, bukan urutan bab di sekolah.
        </p>
      </div>

      <div className="space-y-2">
        {topik.map(t => {
          const aktif = terbuka === t.id
          return (
            <div key={t.id} className="overflow-hidden rounded-xl bg-white shadow-kartu">
              <button
                type="button"
                onClick={() => setTerbuka(aktif ? null : t.id)}
                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{t.nama}</span>
                  <span className="mt-0.5 block text-xs text-gray-400">
                    Kelas {t.jenjangKelas} · {t.jumlahPaket} paket
                  </span>
                  {!t.prasyaratTerpenuhi && (
                    // Kalimatnya sengaja tidak melarang. Yang disampaikan
                    // sebuah saran urutan, bukan pintu yang tertutup.
                    <span className="mt-1 block text-xs text-amber-700">
                      Lebih mudah kalau {t.prasyaratKurang.join(' dan ')} sudah dituntaskan dulu
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-gray-300" aria-hidden>
                  {aktif ? '▾' : '▸'}
                </span>
              </button>

              {aktif && (
                <div className="border-t border-slate-100 bg-slate-50/60 p-3">
                  <DaftarPaket
                    anak={anak}
                    sumber={{ jenis: 'peta', topikId: t.id }}
                    jumlahSoal={t.jumlahPaket * 8}
                    awal={topik.length === 1 ? paketAwal : undefined}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
