interface CriticalMetricCardProps {
  totalCritical: number
  byLevel: { level1: number; level2: number; level3: number }
  mostCommonCondition: string
}

const CONDITION_LABELS: Record<string, string> = {
  'KC-01': 'Jarang Hadir',
  'KC-02': 'Nilai Turun Drastis',
  'KC-03': 'Tren Nilai Menurun',
  'KC-04': 'Tidak Ada Sesi',
  'KL-01': 'Belum di Kelas',
  'KL-02': 'Kelas Tanpa Jadwal',
  'KL-03': 'Tutor Tidak Aktif',
  'KK-01': 'Tagihan Sangat Terlambat',
  'KK-02': 'Tagihan Menumpuk',
}

export default function CriticalMetricCard({
  totalCritical,
  byLevel,
  mostCommonCondition,
}: CriticalMetricCardProps) {
  const hasAny = totalCritical > 0

  return (
    <div className={`rounded-xl border p-4 ${hasAny ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Siswa Kritis</p>
          <p className={`text-3xl font-bold mt-0.5 ${hasAny ? 'text-red-600' : 'text-gray-800'}`}>
            {totalCritical}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasAny ? 'bg-red-100' : 'bg-gray-100'}`}>
          <svg className={`w-5 h-5 ${hasAny ? 'text-red-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>

      {hasAny ? (
        <>
          <div className="flex gap-2 mb-3">
            {byLevel.level1 > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {byLevel.level1} churn
              </span>
            )}
            {byLevel.level2 > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {byLevel.level2} layanan
              </span>
            )}
            {byLevel.level3 > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                {byLevel.level3} keuangan
              </span>
            )}
          </div>
          {mostCommonCondition && (
            <p className="text-xs text-gray-500">
              Paling umum:{' '}
              <span className="font-medium text-gray-700">
                {CONDITION_LABELS[mostCommonCondition] ?? mostCommonCondition}
              </span>
            </p>
          )}
          <a
            href="/admin/siswa?filter=kritis"
            className="mt-3 block text-center text-xs font-medium text-red-600 hover:text-red-800 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
          >
            Lihat siswa kritis →
          </a>
        </>
      ) : (
        <p className="text-xs text-gray-400">Semua siswa dalam kondisi baik</p>
      )}
    </div>
  )
}
