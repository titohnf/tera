'use client'

import { useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'

/**
 * Saringan portal keluarga: satu ikon di ujung kanan bilah judul, dan satu
 * lembar pilihan yang naik dari sisi bawah layar saat ikon itu ditekan.
 *
 * Satu ikon, bukan sederet kendali. Kendali saringan yang berdiri di atas
 * daftar memakan baris penuh yang selalu ada — padahal ia dipakai sesekali,
 * sementara yang dicari orang tua (sesi berikutnya) selalu ada di bawahnya.
 * Diringkas jadi ikon, baris itu kembali ke daftar; titik biru di sudut ikon
 * menahan satu-satunya harga yang timbul: tanpa penanda itu, daftar yang
 * tersaring terbaca seperti "sesinya memang cuma segini".
 *
 * Semua kelompok saringan masuk ke SATU lembar. Dua tombol berdampingan
 * memaksa pembaca menebak yang mana isinya apa; satu lembar memperlihatkan
 * seluruh pilihan sekaligus, dan di ponsel tingginya memang muat.
 *
 * Ikonnya berlabuh di bilah judul lewat `createPortal` ke slot `#aksi-layar`
 * milik `HeaderKeluarga`. Bilah itu dirakit di layout terluar, jauh dari
 * keadaan saringan yang tinggal di halaman jadwal — dan menaikkan keadaan itu
 * ke layout berarti seluruh portal ikut memikirkannya. Portal menaruh simpulnya
 * di sana tanpa memindahkan pemiliknya.
 *
 * Lembarnya menempel di bawah, bukan kotak di tengah layar seperti
 * `components/ui/dialog`: jempol memegang ponsel di sisi bawah, dan daftar
 * pilihan yang muncul persis di sana bisa ditekan tanpa memindahkan tangan.
 *
 * `z-50` menaruhnya di atas bilah navigasi bawah (`z-40`), jadi pilihan
 * terakhir tidak tertutup menu.
 */

export type Opsi = { nilai: string; label: string }

export type GrupSaring = {
  judul: string
  opsi: Opsi[]
  nilai: string
  onPilih: (nilai: string) => void
  /** Nilai yang berarti "tidak menyaring apa-apa". */
  bawaan: string
}

export default function SaringSheet({ grup }: { grup: GrupSaring[] }) {
  const [buka, setBuka] = useState(false)
  // Slotnya dibaca sebagai sumber di luar React: di server tidak ada DOM sama
  // sekali, jadi render pertama harus menghasilkan `null` di kedua sisi supaya
  // hidrasinya cocok. `getElementById` mengembalikan simpul yang sama setiap
  // dipanggil, jadi cuplikannya stabil dan tidak memicu render berulang.
  const slot = useSyncExternalStore(
    () => () => {},
    () => document.getElementById('aksi-layar'),
    () => null,
  )

  const adaYangAktif = grup.some((g) => g.nilai !== g.bawaan)

  function aturUlang() {
    for (const g of grup) g.onPilih(g.bawaan)
  }

  const isi = (
    <DialogPrimitive.Root open={buka} onOpenChange={setBuka}>
      <DialogPrimitive.Trigger
        aria-label="Saring jadwal"
        /* `lg:hidden` karena portal melompati pembungkus `lg:hidden` milik
           pemanggilnya: tanpa ini, ikon saringan tetap terlihat di layar lebar
           padahal daftar yang disaringnya sedang disembunyikan dan yang tampak
           adalah tabel dengan saringannya sendiri. */
        className="relative -mr-2 p-2 text-gray-500 transition-colors hover:text-gray-900 lg:hidden"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h18M6 12h12M10 20h4"
          />
        </svg>
        {adaYangAktif && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        )}
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="sheet-tirai fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Popup className="sheet-bawah fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl outline-none">
          {/* Batang kecil di puncak: penanda yang sudah dikenal bahwa lembar ini
              datang dari bawah dan bisa ditutup. */}
          <div className="flex justify-center pt-2.5 pb-1">
            <span className="h-1 w-9 rounded-full bg-slate-300" />
          </div>

          <div className="flex items-center justify-between px-4 pb-2 pt-1">
            <DialogPrimitive.Title className="text-base font-semibold text-gray-900">
              Saring
            </DialogPrimitive.Title>
            {/* Hanya muncul kalau memang ada yang bisa dilepas: tombol yang
                selalu ada tapi sering tidak melakukan apa-apa mengajarkan
                pembaca untuk mengabaikannya. */}
            {adaYangAktif && (
              <button
                type="button"
                onClick={aturUlang}
                className="text-sm font-medium text-blue-600"
              >
                Atur ulang
              </button>
            )}
          </div>

          {/* Daftar panjang digulir di dalam lembar, jadi tombol Selesai di
              dasarnya tetap terjangkau. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {grup.map((g) => (
              <div key={g.judul} className="border-t border-slate-100 py-1 first:border-t-0">
                <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {g.judul}
                </p>
                {g.opsi.map((o) => {
                  const ini = o.nilai === g.nilai
                  return (
                    <button
                      key={o.nilai}
                      type="button"
                      onClick={() => g.onPilih(o.nilai)}
                      aria-pressed={ini}
                      className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm active:bg-slate-50 ${
                        ini ? 'font-semibold text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <span className="min-w-0 truncate">{o.label}</span>
                      {ini && (
                        <svg
                          className="w-4 h-4 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Memilih langsung menyaring daftar di belakang lembar, jadi tombol
              ini menutup — bukan menerapkan. Ia tetap ada karena menutup lembar
              dengan menekan latar di luarnya bukan gerakan yang semua orang
              tahu. */}
          <div className="border-t border-slate-100 p-3">
            <button
              type="button"
              onClick={() => setBuka(false)}
              className="min-h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white active:bg-blue-700"
            >
              Selesai
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )

  return slot ? createPortal(isi, slot) : null
}
