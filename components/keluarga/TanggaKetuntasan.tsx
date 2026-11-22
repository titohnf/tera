import { BilahRapor } from '@/components/keluarga/BilahRapor'
import type { RangkumanKetuntasan } from '@/lib/reports/ringkasan-laporan'

/**
 * Posisi seorang anak pada satu mapel: ke kelas mana ia sedang menuju, dan tangga kelas 1–12 yang
 * membuat posisi itu bisa diperiksa. Satu mapel satu tangga; topik mapel lain tidak ikut dihitung.
 */
export default function TanggaKetuntasan({ k }: { k: RangkumanKetuntasan }) {
  // Anak tangga pertama yang belum penuh: ke sanalah anaknya sedang menuju. Hanya untuk aturan
  // `resmi` (kumulatif dari kelas 1); aturan `lama` tidak kumulatif sehingga "menuju" tidak bermakna.
  const menuju = k.aturan === 'resmi' ? k.jenjang.find((j) => j.tuntas < j.topik) : undefined
  return (
    <div className="space-y-3">
      {menuju && (
        <p className="text-sm leading-relaxed text-gray-700">
          Sedang mengerjakan materi kelas {menuju.label}:{' '}
          <span className="font-semibold text-gray-900">
            {menuju.tuntas} dari {menuju.topik} topik
          </span>{' '}
          sudah tuntas.
        </p>
      )}
      <div className="space-y-2">
        {k.jenjang.map((j) => (
          <BilahRapor key={j.label} nama={`Kelas ${j.label}`} nilai={j.topik > 0 ? (j.tuntas / j.topik) * 100 : 0} teks={`${j.tuntas}/${j.topik}`} />
        ))}
      </div>
    </div>
  )
}
