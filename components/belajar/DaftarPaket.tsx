'use client'

import { useEffect, useState, useTransition } from 'react'
import type { PaketTopik } from '@/lib/belajar/sesi'
import type { PaketPeta } from '@/lib/belajar/topik-peta'
import { namaPaket } from '@/lib/belajar/nama-paket'
import { mulaiPaket, mulaiPaketPeta, muatPaket, muatPaketPeta } from '@/app/belajar/actions'
import { persenDari } from '@/lib/belajar/penilaian'
import { SOAL_PER_PAKET } from '@/lib/belajar/aturan'

/**
 * Paket-paket sebuah topik, dan keadaan masing-masing.
 *
 * Sebuah paket BUKAN undian: isinya potongan tetap dari bank soal topiknya —
 * Paket 1 selalu sepuluh soal yang sama, bagi siapa pun, kapan pun. Karena itu
 * layar ini daftar, bukan satu tombol "Mulai Latihan": yang dipilih anak bukan
 * "sepuluh soal entah yang mana", melainkan bagian mana dari topik ini yang
 * mau ia hadapi.
 *
 * Tiap baris menyebutkan tiga hal, dan ketiganya menentukan apakah baris itu
 * masih bisa diketuk:
 *
 *   berapa benar    keadaan sekarang dari soal-soal paket itu — hanya bisa naik
 *   putaran         sudah berapa kali dikerjakan sampai tuntas
 *   terkunci        kuncinya sudah dibuka, jadi nilainya berhenti di situ
 *
 * Paket yang sudah benar semua juga tidak bisa diketuk lagi, dan itu bukan
 * hukuman melainkan kabar baik yang tidak perlu diulang.
 *
 * MELAYANI DUA JALUR. `sumber` menentukan paket ini milik topik kurikulum
 * (latihan bebas) atau topik peta kompetensi. Yang berbeda cuma dari mana
 * datanya datang dan bagaimana barisnya dinamai — "Paket 3" versus "Paket C2 —
 * Memahami" — sedangkan aturan apa yang boleh diketuk sama persis untuk
 * keduanya. Menyalin komponen ini demi perbedaan sebesar itu berarti dua tempat
 * yang harus diingat bersamaan setiap kali aturannya berubah.
 */
/** Kunci sebuah baris paket: nomor untuk jalur grup, id untuk jalur peta. */
type Sumber = { jenis: 'grup'; groupId: string } | { jenis: 'peta'; topikId: string }

/** Bentuk seragam yang dirender layar ini, apa pun jalurnya. */
interface Baris extends PaketTopik {
  /** Yang diteruskan ke aksi pembuka — nomor paket, atau id paket. */
  kunci: string
  judul: string
}

/** Satu paket peta jadi baris layar. Dipakai dua kali: dari server, dan dari browser. */
function dariPeta(p: PaketPeta): Baris {
  return {
    nomor: p.nomor,
    total: p.total,
    benar: p.benar,
    sebagian: p.sebagian,
    salah: p.salah,
    belum: p.belum,
    skor: p.skor,
    maks: p.maks,
    putaran: p.putaran,
    terkunci: p.terkunci,
    kunci: p.paketId,
    judul: namaPaket(p),
  }
}

export default function DaftarPaket({
  anak,
  sumber,
  jumlahSoal,
  awal,
}: {
  anak: string | undefined
  sumber: Sumber
  /** Soal di topik ini — dipakai menggambar kerangka sebelum datanya datang. */
  jumlahSoal: number
  /**
   * Daftar paket yang sudah dibawa server, kalau ada.
   *
   * Topik yang terbentang sejak halaman dibuka tidak perlu menjemput isinya
   * sendiri: menjemput berarti kerangka abu-abu dulu, lalu satu perjalanan
   * jaringan, lalu isinya — dan setiap kegagalan perjalanan itu berakhir
   * sebagai kartu kosong yang tidak bisa dibedakan dari topik yang memang belum
   * punya soal. Topik yang dibuka dengan ketukan tetap menjemput sendiri, dan
   * di situ jeda memang wajar: orangnya baru saja meminta.
   */
  awal?: PaketPeta[]
}) {
  const [paket, setPaket] = useState<Baris[] | null>(awal ? awal.map(dariPeta) : null)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  const kunciSumber = sumber.jenis === 'grup' ? sumber.groupId : sumber.topikId

  useEffect(() => {
    // Sudah dibawa server; tidak ada yang perlu dijemput.
    if (awal) return
    let hidup = true
    const muat: Promise<Baris[]> =
      sumber.jenis === 'grup'
        ? muatPaket(anak, sumber.groupId).then(d =>
            d.map(p => ({ ...p, kunci: String(p.nomor), judul: `Paket ${p.nomor}` }))
          )
        : muatPaketPeta(anak, sumber.topikId).then(d => d.map(dariPeta))

    muat
      .then(d => {
        if (hidup) setPaket(d)
      })
      .catch(() => {
        if (hidup) setPaket([])
      })
    return () => {
      hidup = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anak, sumber.jenis, kunciSumber])

  function buka(kunci: string) {
    setGalat(null)
    mulai(async () => {
      const hasil =
        sumber.jenis === 'grup'
          ? await mulaiPaket(anak, sumber.groupId, Number(kunci))
          : await mulaiPaketPeta(anak, kunci)
      if (hasil && 'error' in hasil) setGalat(hasil.error)
    })
  }

  if (paket === null) {
    // Kerangka sebanyak paket yang PASTI ada, dihitung dari jumlah soalnya.
    // Kerangka yang jumlahnya asal membuat layar melompat begitu data datang.
    const perkiraan = Math.max(1, Math.ceil(jumlahSoal / SOAL_PER_PAKET))
    return (
      <div className="space-y-2">
        {Array.from({ length: perkiraan }, (_, i) => (
          <div key={i} className="h-[68px] animate-pulse rounded-xl bg-white shadow-kartu" />
        ))}
      </div>
    )
  }

  if (paket.length === 0) {
    return (
      <p className="rounded-xl bg-white p-4 text-sm leading-relaxed text-gray-500 shadow-kartu">
        Topik ini belum punya soal, jadi latihannya belum bisa dimulai.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      {paket.map(p => {
        const tuntas = p.benar >= p.total
        const bisa = !p.terkunci && !tuntas
        const persen = p.maks > 0 ? persenDari(p.skor, p.maks) : null
        const belumTersentuh = p.putaran === 0

        const isi = (
          <>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">{p.judul}</span>
                <span className="text-xs text-gray-400">{p.total} soal</span>
              </span>
              <span className="mt-0.5 block text-sm text-gray-500">
                {belumTersentuh
                  ? 'Belum dikerjakan'
                  : `${p.benar} dari ${p.total} benar${
                      p.putaran > 1 ? ` · ${p.putaran} putaran` : ''
                    }`}
              </span>
              {p.terkunci && (
                <span className="mt-0.5 block text-xs text-gray-400">
                  Terkunci — kuncinya sudah dibuka
                </span>
              )}
              {tuntas && !p.terkunci && (
                <span className="mt-0.5 block text-xs text-emerald-600">Benar semua</span>
              )}
            </span>
            {persen != null && !belumTersentuh && (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {persen}%
              </span>
            )}
          </>
        )

        const gaya = 'flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-kartu'

        return bisa ? (
          <button
            key={p.kunci}
            type="button"
            disabled={sibuk}
            onClick={() => buka(p.kunci)}
            className={`${gaya} transition hover:bg-slate-50 disabled:opacity-60`}
          >
            {isi}
          </button>
        ) : (
          // Bukan tombol mati melainkan bukan tombol sama sekali: sasaran ketuk
          // yang tidak melakukan apa-apa membuat orang mengetuknya berkali-kali
          // untuk memastikan.
          <div key={p.kunci} className={`${gaya} opacity-70`}>
            {isi}
          </div>
        )
      })}
    </div>
  )
}
