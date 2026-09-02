import Link from 'next/link'
import BilahJawaban, { KeteranganJawaban } from '@/components/belajar/BilahJawaban'
import Keyakinan from '@/components/belajar/Keyakinan'

/**
 * Satu baris penguasaan, apa pun lapisan asalnya.
 *
 * Dipakai dua seksi (Kompetensi dan Ketuntasan Materi) lewat kartu yang sama.
 * Agar angka di kedua tempat tidak bisa diam-diam digambar dengan aturan yang
 * berbeda, definisi barisnya diturunkan dari pembangunnya masing-masing —
 * komponen ini hanya menerima apa yang sudah jadi.
 */
export interface BarisPenguasaan {
  /** Id grup kurikulum (uuid) atau kode topik peta (`D-01`). Keduanya alamat. */
  kunci: string
  subjectId: string | null
  mapel: string
  nama: string
  keterangan: string | null
  persen: number | null
  label: string | null
  pitaKunci: string | null
  /** Null di jalur Misi — lihat `lib/belajar/topik-rapor.ts`. */
  awal: number | null
  paketTuntas: number
  paketSempurna: number
  paketTotal: number
  dikerjakan: number
  total: number
  tuntas: boolean
  rincian: { correct: number; partial: number; wrong: number; belum: number }
}

/**
 * Kartu baris Penguasaan, dipakai dua seksi.
 *
 * Satu komponen, bukan dua yang mirip: begitu keduanya melewati kartu yang
 * sama, angka jalur grup dan jalur peta tidak bisa diam-diam digambar dengan
 * aturan berbeda. Yang membedakan keduanya sudah diselesaikan di pembangun
 * barisnya, bukan di sini.
 */
export default function KartuPenguasaan({ b, studentId }: { b: BarisPenguasaan; studentId: string }) {
  return (
    <li>
      {/* Seluruh kartunya tautan, bukan cuma namanya: sasaran
          sentuh setinggi kartunya sendiri adalah satu-satunya
          ukuran yang masuk akal di ponsel. */}
      <Link
        href={`/keluarga/${studentId}/penguasaan/${b.kunci}`}
        className="block rounded-xl bg-white p-4 shadow-kartu transition hover:shadow-kartu-naik active:bg-slate-50"
      >
        {b.keterangan && <p className="text-xs text-gray-400">{b.keterangan}</p>}
        <div className="flex items-start justify-between gap-3">
          <p className="mt-0.5 min-w-0 font-semibold tracking-tight text-gray-900">
            {b.nama}
          </p>
          <span className="shrink-0 text-gray-300" aria-hidden>
            ›
          </span>
        </div>

        {/* Angka penguasaannya berdiri sendiri dan besar. Ia
            jawaban atas pertanyaan yang membawa orang ke layar
            ini, dan sebagai ekor di ujung baris judul ia harus
            dicari dulu. */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-gray-900">
            {b.persen == null ? '—' : `${b.persen}%`}
          </span>
          {b.label && (
            <span className="text-sm font-medium text-gray-500">{b.label}</span>
          )}
          {/* Keyakinan menempel pada angkanya, bukan di ujung
              baris: ia mengubah arti angka itu. Bentuk ringkas —
              titiknya saja — karena di daftar sepanjang ini
              kalimat "3 paket dikerjakan" di tiap baris jadi
              kebisingan; kalimat lengkapnya tetap terbaca pembaca
              layar lewat `aria-label`. */}
          <Keyakinan
            tuntas={b.paketTuntas}
            sempurna={b.paketSempurna}
            total={b.paketTotal}
            ringkas
            className="ml-1"
          />
          <span className="ml-auto shrink-0 text-xs text-gray-400 tabular-nums">
            {b.dikerjakan}/{b.total} soal dikerjakan
          </span>
        </div>

        <BilahJawaban rincian={b.rincian} total={b.total} className="mt-2" />
        <KeteranganJawaban rincian={b.rincian} className="mt-2.5" />

        {b.awal != null && b.persen != null && (
          <p className="mt-2 text-xs text-gray-400">
            {b.awal < b.persen
              ? `Naik dari ${b.awal}% saat soal-soalnya pertama dijawab.`
              : `Saat pertama dijawab ${b.awal}%.`}
          </p>
        )}
      </Link>
    </li>
  )
}