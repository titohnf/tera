export function getSessionDisplayStatus(
  sessionStatus: string,
  hasPendingChangeRequest: boolean
): { label: string; color: string } {
  if (sessionStatus === 'cancelled') {
    return { label: 'Dibatalkan', color: 'bg-red-100 text-red-600' }
  }
  if (hasPendingChangeRequest) {
    return { label: 'Menunggu Verifikasi Admin', color: 'bg-amber-100 text-amber-700' }
  }
  return { label: 'Sesuai Jadwal', color: 'bg-blue-100 text-blue-700' }
}

export const SESSION_DISPLAY_STATUS_OPTIONS = [
  { key: '', label: 'Semua Status' },
  { key: 'on_schedule', label: 'Sesuai Jadwal' },
  { key: 'awaiting_admin', label: 'Menunggu Verifikasi Admin' },
  { key: 'cancelled', label: 'Dibatalkan' },
]
