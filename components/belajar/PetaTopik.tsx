'use client'

import { useState } from 'react'
import type { PaketPeta, TopikPeta } from '@/lib/belajar/topik-peta'
import DaftarPaket from './DaftarPaket'

/**
 * Peta kompetensi: topik yang boleh dikerjakan anak ini, berurut menurut
 * prasyarat — bukan menurut bab buku teks.
 *
 * Permukaan yang menggantikan pemilihan lewat topik kurikulum untuk
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
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 pt-4 pb-1">
        <h2 className="font-semibold tracking-tight text-gray-900">Paket Topik</h2>
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
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {/* KODENYA IKUT TAMPIL. Keterangan prasyarat di bawah
                        menyebut topik dengan kodenya ("D-01"), dan kode itu
                        tidak muncul di mana pun lain — jadi anak membaca nama
                        sebuah topik yang tidak bisa ia temukan di daftarnya
                        sendiri. Satu-satunya cara menutup jurang itu tanpa
                        memanjangkan keterangannya adalah menampilkan kodenya
                        di sini. */}
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-500">
                      {t.id}
                    </span>
                    <span className="min-w-0 text-sm font-semibold text-gray-900">{t.nama}</span>
                    <LabelStatus status={t.status} />
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-400">
                    {t.jumlahPaket} paket
                  </span>
                  {!t.prasyaratTerpenuhi && t.status !== 'tuntas' && (
                    // Kalimatnya sengaja tidak melarang. Yang disampaikan
                    // sebuah saran urutan, bukan pintu yang tertutup.
                    //
                    // Dan tidak disampaikan sama sekali kalau topiknya sudah
                    // TUNTAS: sarannya berbunyi "lebih mudah kalau X dulu",
                    // sedangkan anak ini sudah menuntaskannya tanpa X. Saran
                    // untuk pekerjaan yang sudah selesai bukan cuma mubazir —
                    // ia berdiri tepat di sebelah label "Tuntas" dan membuat
                    // keduanya saling membantah.
                    <span className="mt-1 block text-xs text-amber-700">
                      Lebih mudah kalau {t.prasyaratKurang.join(' dan ')} sudah dituntaskan dulu
                    </span>
                  )}
                  {t.status === 'tuntas' && t.retestBerikutnya && (
                    // KAPAN, bukan cuma BAHWA. Pengecekan ulang muncul sendiri
                    // pada harinya sebagai kartu di atas peta; sebelum hari itu
                    // tidak ada satu pun tempat yang menyebutkan ia akan datang.
                    // Anak yang menuntaskan sebuah topik lalu tidak melihat
                    // apa-apa lagi wajar mengira urusannya selesai selamanya.
                    //
                    // Ditulis sebagai kabar, bukan tenggat: dokumen Retest
                    // Terjadwal Bagian 4.3 melarang penalti keterlambatan, jadi
                    // tidak ada hitung mundur dan tidak ada kata "harus".
                    <span className="mt-1 block text-xs text-gray-400">
                      Dicek ulang sekitar {tanggalPendek(t.retestBerikutnya)}
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

/**
 * Enam keadaan FR13 dalam satu label kecil.
 *
 * `terkunci` sengaja TIDAK punya label, dan itu bukan kelalaian: topiknya tetap
 * bisa diketuk dan dikerjakan (lihat catatan prasyarat di atas), jadi kata
 * "terkunci" di layar anak akan berbohong tentang pintu yang sebenarnya
 * terbuka. Yang perlu ia tahu sudah dikatakan keterangan prasyaratnya.
 *
 * Status null juga tidak berlabel — itu topik yang belum pernah disentuh, dan
 * cetakan statusnya memang belum ditulis.
 *
 * `eskalasi_tutor` diberi kalimat yang menawarkan bantuan, bukan yang
 * mengumumkan kegagalan. Yang membacanya anak, bukan tutornya.
 */
function LabelStatus({ status }: { status: string | null }) {
  const label: Record<string, { teks: string; kelas: string }> = {
    tuntas: { teks: 'Tuntas', kelas: 'bg-emerald-50 text-emerald-700' },
    sedang_dikerjakan: { teks: 'Sedang dikerjakan', kelas: 'bg-blue-50 text-blue-700' },
    siap_dikerjakan: { teks: 'Siap dikerjakan', kelas: 'bg-slate-100 text-gray-600' },
    butuh_pengulangan: { teks: 'Perlu diulang', kelas: 'bg-amber-50 text-amber-700' },
    eskalasi_tutor: { teks: 'Tutor akan membantu', kelas: 'bg-violet-50 text-violet-700' },
  }
  const l = status ? label[status] : undefined
  if (!l) return null
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${l.kelas}`}>
      {l.teks}
    </span>
  )
}

/**
 * "16 September" dari "2026-09-16".
 *
 * Dirakit sendiri alih-alih memakai `toLocaleDateString`: komponen ini dirender
 * di server DAN di browser, dan keduanya tidak dijamin punya locale yang sama —
 * beda satu huruf saja sudah cukup untuk melahirkan ketidakcocokan hidrasi.
 */
function tanggalPendek(iso: string): string {
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  const [, b, h] = iso.split('-')
  return `${Number(h)} ${bulan[Number(b) - 1] ?? ''}`.trim()
}
