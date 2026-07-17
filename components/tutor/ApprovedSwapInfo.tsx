import Link from 'next/link'

export default function ApprovedSwapInfo({
  id,
  classId,
  fromTutorName,
  toTutorName,
}: {
  id: string
  classId: string
  fromTutorName: string | null
  toTutorName: string | null
}) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
      <p className="text-sm font-medium text-green-800">
        Admin menyetujui pergantian tutor untuk sesi ini.
      </p>
      <div className="bg-white/70 border border-green-200/70 rounded-lg px-3 py-2">
        <p className="text-xs text-gray-600">
          Dari: {fromTutorName ?? '—'} → Ke: {toTutorName ?? '—'}
        </p>
      </div>
      <Link
        href={`/tutor/classes/${classId}?previewSwap=${id}`}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
      >
        Lihat detail & riwayat kelas ini
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}
