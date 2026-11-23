import Link from 'next/link'
import CincinPersen from '@/components/belajar/CincinPersen'
import type { SesiTertunda } from '@/lib/belajar/sesi'

/**
 * Kartu "Lanjutkan latihan" di puncak beranda siswa: sesi latihan yang
 * ditinggalkan di tengah jalan (`sesiTertunda`). Cincin persennya menjawab
 * "masih jauh, atau tinggal sedikit lagi". Tautan ke `/belajar/[sesiId]` tidak
 * perlu `?anak=`: sesi tahu sendiri milik siapa.
 */
export default function KartuLanjutkan({ sesi }: { sesi: SesiTertunda }) {
  const persen = sesi.jumlahSoal > 0 ? Math.min(100, Math.round((sesi.sudahDijawab / sesi.jumlahSoal) * 100)) : 0
  const keterangan = [sesi.mapel, sesi.jenjang, sesi.topik].filter(Boolean).join(' · ')
  return (
    <Link
      href={`/belajar/${sesi.sesiId}`}
      className="flex items-center gap-3.5 rounded-xl bg-white p-4 shadow ring-1 ring-blue-200 transition active:bg-slate-50"
    >
      <CincinPersen persen={persen} selesai={sesi.tinggalHasil} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900">
          {sesi.tinggalHasil ? 'Lihat hasil latihan terakhir' : 'Lanjutkan latihan'}
        </span>
        {keterangan && <span className="mt-0.5 block truncate text-sm text-gray-600">{keterangan}</span>}
        <span className="mt-0.5 block text-xs tabular-nums text-gray-400">
          {sesi.tinggalHasil
            ? `${sesi.jumlahSoal} soal terjawab, hasilnya belum dibuka`
            : `${sesi.sudahDijawab} dari ${sesi.jumlahSoal} soal terjawab`}
        </span>
      </span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-gray-300" aria-hidden>
        <path d="m9 5 7 7-7 7" />
      </svg>
    </Link>
  )
}
