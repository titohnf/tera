'use client'

import type { TopikPeta } from '@/lib/belajar/topik-peta'
import type { PaketRingkas } from '@/lib/belajar/langkah'
import { namaTemaAnak } from '@/lib/belajar/tema-topik'
import { TigaBintang } from './Gambar'
import { gayaTema, hitungBintang, hitungLevel } from './gaya'

/**
 * Topik yang siap dikerjakan, SATU daftar menurut urutan dari server.
 *
 * URUTANNYA REKOMENDASI SISTEM, dan tidak boleh disusun ulang di sini — bukan
 * per tema, bukan per kemajuan. `fringe.ts` menjelaskan alasannya: letak sebuah
 * topik harus tetap dari kunjungan ke kunjungan, dan urutan kurikulum itulah
 * yang membawa saran "kerjakan ini dulu". Versi sebelumnya mengelompokkan per
 * tema dan memecah urutan itu; itu keliru dan sudah dicabut. Tema cukup tampil
 * sebagai warna dan nama kecil di tiap ubin.
 */
export default function DaftarTopik({
  topik,
  paketTopik,
  sekarangId,
  kunci = false,
  bernomor = true,
  nomorAwal = 0,
  onBuka,
}: {
  topik: TopikPeta[]
  paketTopik: Map<string, PaketRingkas[]>
  sekarangId: string | null
  /**
   * Rute "Ikuti urutan": semua baris selain `sekarangId` tampil terkunci dan tidak
   * bisa diketuk. Kuncinya milik rute ini saja — topiknya tidak dikunci di sistem,
   * dan rute "Pilih sendiri" membukanya semua.
   */
  kunci?: boolean
  /** Nomor dan garis penghubung hanya untuk rute berurutan; rute bebas tanpa keduanya. */
  bernomor?: boolean
  /** Banyaknya topik sebelum daftar ini, supaya nomor berlanjut antar checkpoint. */
  nomorAwal?: number
  onBuka: (t: TopikPeta) => void
}) {
  return (
    <ol>
      {topik.map((t, i) => (
        <li
          key={t.id}
          className={
            bernomor
              ? `relative flex items-center gap-3 py-1.5 before:absolute before:left-[13px] before:w-0.5 before:bg-slate-200 ${
                  topik.length === 1
                    ? 'before:hidden'
                    : i === 0
                      ? 'before:top-1/2 before:bottom-0'
                      : i === topik.length - 1
                        ? 'before:top-0 before:bottom-1/2'
                        : 'before:inset-y-0'
                }`
              : 'flex items-center py-1.5'
          }
        >
          {/* Nomor urut di jalur sebelah kiri: urutan adalah rekomendasi sistem,
              dan nomor serta garis penghubungnya yang membuat itu terbaca. */}
          {bernomor && (
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ring-4 ring-slate-50 ${
                t.id === sekarangId
                  ? 'bg-amber-400 text-amber-950'
                  : t.status === 'tuntas'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
              }`}
              aria-hidden
            >
              {t.status === 'tuntas' ? '✓' : nomorAwal + i + 1}
            </span>
          )}
          <Baris
            topik={t}
            paket={paketTopik.get(t.id) ?? []}
            giliran={t.id === sekarangId}
            terkunci={kunci && t.id !== sekarangId && t.status !== 'tuntas'}
            onKetuk={() => onBuka(t)}
          />
        </li>
      ))}
    </ol>
  )
}

function Baris({
  topik: t,
  paket,
  giliran,
  terkunci,
  onKetuk,
}: {
  topik: TopikPeta
  paket: PaketRingkas[]
  giliran: boolean
  terkunci: boolean
  onKetuk: () => void
}) {
  const g = gayaTema(t.elemen)
  const bintang = hitungBintang(t, paket)
  const { lolos, total } = hitungLevel(paket)

  return (
    <button
      type="button"
      onClick={onKetuk}
      disabled={terkunci}
      aria-label={
        terkunci
          ? `${t.nama}, terkunci, kerjakan topik sebelumnya dulu`
          : `${t.nama}, ${lolos} dari ${total} level, ${bintang} dari 3 bintang`
      }
      className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-3.5 text-left transition ${
        terkunci ? 'bg-slate-100' : 'bg-white shadow-kartu active:scale-[0.98]'
      }`}
      style={giliran ? { boxShadow: '0 0 0 2px #FBBF24' } : undefined}
    >
      <span className="min-w-0 flex-1">
        <span
          className="block text-[10px] font-extrabold uppercase tracking-wide"
          style={{ color: terkunci ? '#94A3B8' : g.tua }}
        >
          {namaTemaAnak(t.elemen)}
        </span>
        <span
          className={`line-clamp-2 text-[15px] font-bold leading-snug ${terkunci ? 'text-slate-400' : 'text-slate-800'}`}
        >
          {t.nama}
        </span>
      </span>

      {terkunci ? (
        <span className="shrink-0 text-xs font-bold text-slate-400">Terkunci</span>
      ) : (
        <span className="flex shrink-0 flex-col items-end gap-1">
          <TigaBintang jumlah={bintang} ukuran={14} />
          <span className="text-xs font-bold text-slate-400">
            {giliran ? 'Lanjut' : t.status === 'tuntas' ? 'Tuntas' : total > 0 ? `${lolos}/${total}` : ''}
          </span>
        </span>
      )}
    </button>
  )
}
