'use client'

import { useState } from 'react'
import type {
  OpsiMenjodohkan,
  OpsiPernyataan,
  OpsiPilihan,
  OpsiUrutan,
} from '@/lib/belajar/tipe-soal'
import type { SoalSesi } from '@/lib/belajar/sesi'
import IsiSoal from './IsiSoal'
import RumusTeks from './RumusTeks'

/**
 * Widget menjawab untuk tiap tipe soal.
 *
 * Sejajar dengan `src/lib/QuestionInput.tsx` di Sora, dan harus tetap sejajar:
 * satu soal harus berperilaku sama di mana pun murid menemuinya. Yang berbeda
 * hanya rupanya — di sini ia memakai kosakata visual portal keluarga (kartu
 * putih, sudut membulat, ring tipis) alih-alih fieldset bergaris.
 *
 * `essay` dan `upload_file` tidak punya cabang di sini, dan itu disengaja:
 * keduanya tidak pernah diundi ke permukaan ini karena tidak bisa dinilai
 * otomatis. Lihat `TIPE_TANPA_NILAI_OTOMATIS`.
 */
export default function InputSoal({
  soal,
  nilai,
  onChange,
}: {
  soal: SoalSesi
  nilai: unknown
  onChange: (nilai: unknown) => void
}) {
  const opsiPilihan = (soal.opsi as OpsiPilihan | null)?.choices ?? []

  // `fieldset` tanpa `disabled`: dulu ia mengunci jawaban sesudah diperiksa,
  // dan sejak umpan balik per soal dihapus tidak ada lagi keadaan "sudah
  // diperiksa tapi masih di layar". Yang tersisa dari fieldset cuma
  // pengelompokannya, dan itu memang yang dibutuhkan pembaca layar.
  return (
    <fieldset className="min-w-0">
      {soal.tipe !== 'fill_blank' && (
        // Gambar dan tabel ikut di dalam `prompt`, di posisi yang dipilih
        // penyusun soalnya — lihat `IsiSoal`.
        <IsiSoal text={soal.prompt} className="text-[15px] leading-relaxed text-gray-900" />
      )}

      {soal.tipe === 'mcq_single' && (
        <div className="mt-4 flex flex-col gap-2">
          {opsiPilihan.map(pilihan => (
            <PilihanKartu
              key={pilihan}
              terpilih={nilai === pilihan}
              onClick={() => onChange(pilihan)}
            >
              <IsiSoal text={pilihan} />
            </PilihanKartu>
          ))}
        </div>
      )}

      {soal.tipe === 'mcq_multi' && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-gray-400">Jawaban benar bisa lebih dari satu.</p>
          {opsiPilihan.map(pilihan => {
            const dipilih = Array.isArray(nilai) ? (nilai as string[]) : []
            const aktif = dipilih.includes(pilihan)
            return (
              <PilihanKartu
                key={pilihan}
                terpilih={aktif}
                kotak
                onClick={() =>
                  onChange(aktif ? dipilih.filter(p => p !== pilihan) : [...dipilih, pilihan])
                }
              >
                <IsiSoal text={pilihan} />
              </PilihanKartu>
            )
          })}
        </div>
      )}

      {soal.tipe === 'true_false' && (
        <div className="mt-4 flex flex-col gap-2">
          {(['true', 'false'] as const).map(v => (
            <PilihanKartu key={v} terpilih={nilai === v} onClick={() => onChange(v)}>
              {v === 'true' ? 'Benar' : 'Salah'}
            </PilihanKartu>
          ))}
        </div>
      )}

      {soal.tipe === 'short_answer' && (
        // TERKENDALI, bukan `defaultValue`. Kotaknya menempati posisi yang sama
        // di pohon React untuk setiap soal, jadi React memakai ulang simpul DOM
        // yang sama — dan `defaultValue` cuma dipasang sekali saat lahir.
        // Akibatnya jawaban soal sebelumnya tertinggal terbaca di kotak soal
        // berikutnya, sementara `jawaban` di `PelariSesi` sudah kosong: anak
        // melihat jawaban di layar dan tombol "Lanjut" yang mati, tanpa satu pun
        // petunjuk kenapa. Yang lebih buruk, mengetik di atasnya menyambung ke
        // sisa jawaban lama. Nilai yang tampil sekarang selalu nilai yang akan
        // dikirim.
        <input
          value={typeof nilai === 'string' ? nilai : ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Jawaban singkat"
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
        />
      )}

      {soal.tipe === 'statement_grid' && (
        <KisiPernyataan soal={soal} nilai={nilai} onChange={onChange} />
      )}

      {soal.tipe === 'matching' && (
        <Menjodohkan soal={soal} nilai={nilai} onChange={onChange} />
      )}

      {soal.tipe === 'ordering' && <Mengurutkan soal={soal} nilai={nilai} onChange={onChange} />}

      {soal.tipe === 'fill_blank' && (
        <IsiRumpang soal={soal} nilai={nilai} onChange={onChange} />
      )}
    </fieldset>
  )
}

/**
 * Satu pilihan sebagai kartu yang bisa diketuk seluruh badannya, bukan sebagai
 * radio kecil di samping teks. Permukaan ini dipakai di ponsel oleh anak SD;
 * sasaran ketuk sebesar 16 piksel adalah jawaban salah yang tidak disengaja.
 */
function PilihanKartu({
  terpilih,
  kotak,
  onClick,
  children,
}: {
  terpilih: boolean
  kotak?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={terpilih}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${
        terpilih
          ? 'border-blue-500 bg-blue-50 text-gray-900'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
      } disabled:opacity-70`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
          kotak ? 'rounded' : 'rounded-full'
        } ${terpilih ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}
      >
        {terpilih && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

function KisiPernyataan({
  soal,
  nilai,
  onChange,
}: {
  soal: SoalSesi
  nilai: unknown
  onChange: (nilai: unknown) => void
}) {
  const opsi = soal.opsi as OpsiPernyataan | null
  const pernyataan = opsi?.statements ?? []
  const [labelBenar, labelSalah] = opsi?.answer_labels ?? ['Benar', 'Salah']
  const judulBaris = opsi?.statement_label?.trim()
  const jawaban = Array.isArray(nilai) ? (nilai as (boolean | null)[]) : []

  // Bentuk jawabannya sama dengan bentuk kuncinya — array sejajar indeks, null
  // untuk baris yang belum dijawab — supaya penilaiannya perbandingan posisi.
  function set(i: number, v: boolean) {
    const berikut = pernyataan.map((_, j) => jawaban[j] ?? null)
    berikut[i] = v
    onChange(berikut)
  }

  return (
    <div className="mt-4 flex flex-col divide-y divide-gray-100 rounded-xl border border-gray-200">
      {/* Di sini grid-nya berupa kartu bertumpuk, bukan tabel — jadi judul
          kolom pernyataan tampil sebagai judul daftarnya. */}
      {judulBaris && (
        <p className="px-3 pt-3 pb-1 text-xs font-medium text-gray-500">
          <RumusTeks text={judulBaris} />
        </p>
      )}
      {pernyataan.map((p, i) => (
        <div key={i} className="flex flex-col gap-2 p-3">
          <span className="text-sm text-gray-800">
            <RumusTeks text={p} />
          </span>
          <div className="flex gap-2">
            {([true, false] as const).map(v => (
              <button
                key={String(v)}
                type="button"
                onClick={() => set(i, v)}
                aria-pressed={jawaban[i] === v}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  jawaban[i] === v
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {v ? labelBenar : labelSalah}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Menjodohkan({
  soal,
  nilai,
  onChange,
}: {
  soal: SoalSesi
  nilai: unknown
  onChange: (nilai: unknown) => void
}) {
  const pasangan = (soal.opsi as OpsiMenjodohkan | null)?.pairs ?? []
  // Diacak sekali saat komponennya lahir: mengacak tiap render berarti daftar
  // pilihan berubah urutan di bawah jari yang sedang memilihnya.
  const [pilihanKanan] = useState(() =>
    [...pasangan].map(p => p.right).sort(() => Math.random() - 0.5)
  )
  const peta = (nilai as Record<string, string>) ?? {}

  return (
    <div className="mt-4 flex flex-col gap-2">
      {pasangan.map(p => (
        <div key={p.left} className="flex items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 text-gray-800">
            <RumusTeks text={p.left} />
          </span>
          <select
            value={peta[p.left] ?? ''}
            onChange={e => onChange({ ...peta, [p.left]: e.target.value })}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1.5 disabled:bg-gray-50"
          >
            <option value="">— pilih —</option>
            {pilihanKanan.map(k => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

function Mengurutkan({
  soal,
  nilai,
  onChange,
}: {
  soal: SoalSesi
  nilai: unknown
  onChange: (nilai: unknown) => void
}) {
  const item = (soal.opsi as OpsiUrutan | null)?.items ?? []
  const [urutan, setUrutan] = useState<string[]>(() =>
    Array.isArray(nilai) ? (nilai as string[]) : [...item].sort(() => Math.random() - 0.5)
  )

  function geser(i: number, arah: -1 | 1) {
    const berikut = [...urutan]
    const tukar = i + arah
    if (tukar < 0 || tukar >= berikut.length) return
    ;[berikut[i], berikut[tukar]] = [berikut[tukar], berikut[i]]
    setUrutan(berikut)
    onChange(berikut)
  }

  return (
    <div className="mt-4 flex flex-col gap-1.5">
      {urutan.map((item, i) => (
        <div
          key={item}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <span className="min-w-0 flex-1 text-gray-800">
            <span className="text-gray-400">{i + 1}.</span> <RumusTeks text={item} />
          </span>
          <button
            type="button"
            onClick={() => geser(i, -1)}
            disabled={i === 0}
            aria-label="Naikkan"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => geser(i, 1)}
            disabled={i === urutan.length - 1}
            aria-label="Turunkan"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
          >
            ▼
          </button>
        </div>
      ))}
    </div>
  )
}

function IsiRumpang({
  soal,
  nilai,
  onChange,
}: {
  soal: SoalSesi
  nilai: unknown
  onChange: (nilai: unknown) => void
}) {
  const bagian = soal.prompt.split('___')
  const isian = Array.isArray(nilai)
    ? (nilai as string[])
    : Array(Math.max(bagian.length - 1, 0)).fill('')

  function set(i: number, teks: string) {
    const berikut = [...isian]
    berikut[i] = teks
    onChange(berikut)
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] leading-relaxed text-gray-900">
      {bagian.map((b, i) => (
        <span key={i} className="flex items-center gap-2">
          <RumusTeks text={b} />
          {i < bagian.length - 1 && (
            // Terkendali, dengan alasan yang sama dengan `short_answer` di
            // atas: dua soal rumpang berturut-turut yang jumlah kotaknya sama
            // memakai ulang simpul DOM yang sama persis.
            <input
              value={isian[i] ?? ''}
              onChange={e => set(i, e.target.value)}
              className="w-28 rounded-lg border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50"
            />
          )}
        </span>
      ))}
    </div>
  )
}
