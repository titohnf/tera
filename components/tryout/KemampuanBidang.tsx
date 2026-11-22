import type { Simpul } from '@/lib/reports/kompetensi-tryout'

const f = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 0 })

/** Tingkat kemampuan dalam kata, supaya orang tua dan anak tidak perlu menafsirkan angka. */
function tingkat(p: number | null): { label: string; warna: string; batang: string } {
  if (p === null) return { label: 'Belum ada data', warna: 'text-gray-500', batang: 'bg-gray-300' }
  if (p >= 75) return { label: 'Sudah kuat', warna: 'text-green-700', batang: 'bg-green-600' }
  if (p >= 50) return { label: 'Cukup', warna: 'text-amber-700', batang: 'bg-amber-500' }
  return { label: 'Perlu dilatih', warna: 'text-red-700', batang: 'bg-red-500' }
}

/**
 * Kemampuan anak per bidang (tingkat paling atas pohon kompetensi), hanya milik anak itu sendiri:
 * tanpa pembanding nasional atau rata-rata peserta, tanpa rincian indikator dan nomor soal.
 * Pembandingan dan rincian adalah untuk admin bimbel.
 */
export default function KemampuanBidang({ pohon }: { pohon: Simpul[] }) {
  return (
    <div className="space-y-4">
      {pohon.map((s) => {
        const t = tingkat(s.persen)
        return (
          <div key={s.kunci}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-gray-900">{s.nama}</p>
              <p className={`shrink-0 text-sm font-semibold ${t.warna}`}>{t.label}</p>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-gray-100" role="img" aria-label={`${s.nama}: ${t.label}${s.persen !== null ? `, ${f(s.persen)} persen` : ''}`}>
              {s.persen !== null && <div className={`h-full rounded-full ${t.batang}`} style={{ width: `${Math.max(2, Math.min(100, s.persen))}%` }} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Topik yang paling perlu dilatih: satu tingkat di bawah bidang (sub-elemen) bila ada, kalau tidak
 * bidangnya sendiri. Hanya yang capaiannya di bawah 70%, paling lemah dulu, paling banyak tiga.
 */
export function topikPerluLatihan(pohon: Simpul[], maks = 3): Simpul[] {
  const sub = pohon.flatMap((e) => e.anak)
  const dasar = sub.length > 0 ? sub : pohon
  return dasar
    .filter((s) => s.persen !== null && s.persen < 70)
    .sort((a, b) => (a.persen ?? 0) - (b.persen ?? 0))
    .slice(0, maks)
}
