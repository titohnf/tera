'use client'

import { useState, useTransition } from 'react'
import type { MapelLatihan, TopikLatihan } from '@/lib/belajar/sesi'
import type { MateriTopik } from '@/lib/belajar/sematan'
import { muatTopik, mulaiLatihan } from '@/app/belajar/actions'
import Materi from './Materi'

const PILIHAN_JUMLAH = [5, 10, 20]
const JUMLAH_BAKU = 10

/**
 * Memilih mapel, lalu topiknya, lalu berapa soal.
 *
 * Dua langkah, bukan satu layar panjang: daftar topik satu mapel bisa puluhan
 * baris, dan menampilkan semuanya sekaligus membuat langkah pertama tenggelam.
 *
 * Sesi belum ada sampai tombol terakhir ditekan. Itu sebabnya seluruh keadaan
 * di sini boleh hidup di browser — tidak ada yang hilang kalau halamannya
 * ditutup di tengah, karena belum ada yang tercatat. Begitu sesi terbuka,
 * tempatnya bukan di sini lagi melainkan di `/belajar/[sesiId]`, yang bisa
 * dibuka ulang.
 */
export default function PemilihLatihan({
  mapel,
  anak,
}: {
  mapel: MapelLatihan[]
  /** Diteruskan apa adanya ke aksi; yang memeriksa haknya tetap database. */
  anak?: string
}) {
  const [dipilih, setDipilih] = useState<MapelLatihan | null>(null)
  const [topik, setTopik] = useState<TopikLatihan[]>([])
  const [materi, setMateri] = useState<MateriTopik[]>([])
  const [terpilih, setTerpilih] = useState<string[]>([])
  const [jumlah, setJumlah] = useState(JUMLAH_BAKU)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  function pilihMapel(m: MapelLatihan) {
    setGalat(null)
    mulai(async () => {
      const daftar = await muatTopik(anak, m.subject_id)
      setTopik(daftar.topik)
      setMateri(daftar.materi)
      setTerpilih([])
      setDipilih(m)
    })
  }

  function mulaiSesi() {
    if (!dipilih) return
    setGalat(null)
    mulai(async () => {
      const hasil = await mulaiLatihan(anak, dipilih.subject_id, terpilih, jumlah)
      // Hanya tercapai kalau aksinya TIDAK mengalihkan halaman.
      if (hasil?.error) setGalat(hasil.error)
    })
  }

  if (mapel.length === 0) {
    return (
      <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
        <p className="text-sm text-gray-500 leading-relaxed">
          Belum ada soal yang siap dilatih. Kalau kamu berlangganan, soal baru muncul di sini
          begitu admin membukanya untuk langganan.
        </p>
      </div>
    )
  }

  if (!dipilih) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Mau latihan mapel apa?</p>
        {mapel.map(m => (
          <button
            key={m.subject_id}
            type="button"
            disabled={sibuk}
            onClick={() => pilihMapel(m)}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-white p-4 text-left shadow ring-1 ring-gray-900/5 transition hover:ring-blue-300 active:bg-slate-50 disabled:opacity-60"
          >
            <span className="font-semibold tracking-tight text-gray-900">{m.subject_name}</span>
            <span className="shrink-0 text-xs text-gray-400">{m.question_count} soal</span>
          </button>
        ))}
      </div>
    )
  }

  const tersedia = topik.filter(t => t.question_count > 0)
  // Tanpa centang, soalnya diambil dari SELURUH topik mapel ini — dan
  // menumpahkan seluruh materi mapel ke layar bukan menolong siapa pun, cuma
  // kebisingan sebelum tombol mulai. Materi baru muncul begitu anaknya
  // menyebutkan topik yang ia maksud.
  const materiTerpilih = terpilih.length
    ? materi.filter(m => terpilih.includes(m.group_id))
    : []

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setDipilih(null)}
        className="text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        ← Ganti mapel
      </button>

      <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
        <p className="font-semibold tracking-tight text-gray-900">{dipilih.subject_name}</p>
        <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">
          Pilih topik yang mau dilatih. Kalau tidak memilih apa pun, soalnya diambil dari semua
          topik mapel ini.
        </p>

        <div className="mt-3 flex flex-col divide-y divide-gray-100 border-t border-gray-100">
          {tersedia.length === 0 && (
            <p className="pt-3 text-sm text-gray-500">Belum ada topik bersoal di mapel ini.</p>
          )}
          {tersedia.map(t => {
            const aktif = terpilih.includes(t.group_id)
            return (
              <label key={t.group_id} className="flex cursor-pointer items-start gap-3 py-3">
                <input
                  type="checkbox"
                  checked={aktif}
                  onChange={() =>
                    setTerpilih(
                      aktif ? terpilih.filter(id => id !== t.group_id) : [...terpilih, t.group_id]
                    )
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-gray-900">{t.topic}</span>
                  {/* Jenjang dan semester sengaja tidak ditampilkan: mapelnya
                      sudah dipilih, dan untuk kurikulum seperti TKA yang tidak
                      mengenal semester, angkanya cuma kebisingan. */}
                  <span className="block text-xs text-gray-400">
                    {t.theme ? `${t.theme} · ` : ''}
                    {t.question_count} soal
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Tepat di bawah daftar topiknya, bukan di ujung layar: mencentang
          sebuah topik membuat bahannya muncul persis di tempat centangnya
          ditekan. */}
      <Materi materi={materiTerpilih} />

      <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
        <span className="text-sm text-gray-700">Jumlah soal</span>
        <div className="ml-auto flex gap-1.5">
          {PILIHAN_JUMLAH.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setJumlah(n)}
              aria-pressed={jumlah === n}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                jumlah === n
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      <button
        type="button"
        disabled={sibuk}
        onClick={mulaiSesi}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
      >
        {sibuk ? 'Menyiapkan…' : 'Mulai Latihan'}
      </button>
    </div>
  )
}
