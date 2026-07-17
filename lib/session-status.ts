export function getSessionDisplayStatus(
  sessionStatus: string,
  hasPendingChangeRequest: boolean
): { label: string; color: string } {
  if (sessionStatus === 'cancelled') {
    return { label: 'Dibatalkan', color: 'bg-red-100 text-red-600' }
  }
  if (hasPendingChangeRequest) {
    return { label: 'Menunggu Verifikasi', color: 'bg-amber-100 text-amber-700' }
  }
  return { label: 'Sesuai Jadwal', color: 'bg-blue-100 text-blue-700' }
}

export const SESSION_DISPLAY_STATUS_OPTIONS = [
  { key: '', label: 'Semua Jadwal' },
  { key: 'on_schedule', label: 'Sesuai Jadwal' },
  { key: 'awaiting_admin', label: 'Menunggu Verifikasi' },
  { key: 'cancelled', label: 'Dibatalkan' },
]

// Urutan dari yang paling belum-selesai ke yang paling selesai — dipakai untuk
// meringkas status payroll banyak sesi jadi satu status "titik terlemah".
export const PAYROLL_STATUS_ORDER = ['unavailable', 'incomplete', 'pending', 'rejected', 'approved', 'paid'] as const

export const PAYROLL_STATUS_BADGE: Record<string, { label: string; color: string }> = {
  unavailable: { label: 'Belum Tersedia', color: 'bg-gray-100 text-gray-500' },
  incomplete: { label: 'Belum Lengkap', color: 'bg-orange-100 text-orange-700' },
  pending: { label: 'Menunggu Review', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
  paid: { label: 'Dibayar', color: 'bg-blue-100 text-blue-700' },
}

// Status "titik terlemah" di antara sesi-sesi sebuah kelas — kelas belum
// sepenuhnya terbayar selama masih ada satu sesi yang belum di tahap akhir.
export function summarizePayrollStatus(statuses: string[]): string {
  if (statuses.length === 0) return 'unavailable'
  return statuses.reduce((weakest, s) => {
    const weakestIdx = PAYROLL_STATUS_ORDER.indexOf(weakest as typeof PAYROLL_STATUS_ORDER[number])
    const idx = PAYROLL_STATUS_ORDER.indexOf(s as typeof PAYROLL_STATUS_ORDER[number])
    return idx >= 0 && idx < weakestIdx ? s : weakest
  }, statuses[0])
}
