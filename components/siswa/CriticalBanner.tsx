interface CriticalBannerProps {
  totalCritical: number
  byLevel: { level1: number; level2: number; level3: number }
  isFiltered?: boolean
}

export default function CriticalBanner({ totalCritical, byLevel, isFiltered = false }: CriticalBannerProps) {
  if (totalCritical === 0) return null

  return (
    <div className={`rounded-lg border px-4 py-3 mb-4 flex items-center justify-between gap-4 ${
      isFiltered
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-800">
          {totalCritical} siswa butuh perhatian
        </span>
        <div className="flex items-center gap-2 text-xs">
          {byLevel.level1 > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {byLevel.level1} churn
            </span>
          )}
          {byLevel.level2 > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              {byLevel.level2} layanan
            </span>
          )}
          {byLevel.level3 > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              {byLevel.level3} keuangan
            </span>
          )}
        </div>
      </div>
      {!isFiltered && (
        <a
          href="/admin/siswa?filter=kritis"
          className="text-xs font-medium text-red-600 hover:text-red-800 whitespace-nowrap"
        >
          Lihat semua →
        </a>
      )}
    </div>
  )
}
