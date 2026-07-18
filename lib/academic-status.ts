export const KKM = 80

export type AcademicSeverity = 'darurat' | 'waspada' | 'aman'

// darurat >=50% pertemuan di bawah KKM, waspada 20-49%, aman <20%
export function severityOf(pctBelowKkm: number): AcademicSeverity {
  if (pctBelowKkm >= 50) return 'darurat'
  if (pctBelowKkm >= 20) return 'waspada'
  return 'aman'
}

export const SEVERITY_LABEL: Record<AcademicSeverity, string> = {
  darurat: 'Darurat',
  waspada: 'Waspada',
  aman: 'Aman',
}

export const SEVERITY_BADGE_CLASS: Record<AcademicSeverity, string> = {
  darurat: 'bg-red-100 text-red-700',
  waspada: 'bg-amber-100 text-amber-700',
  aman: 'bg-green-100 text-green-700',
}
