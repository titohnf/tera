export type WorkloadLevel = 'idle' | 'light' | 'normal' | 'heavy' | 'inactive'

export function getWorkloadLevel(studentCount: number, isActive: boolean): WorkloadLevel {
  if (!isActive) return 'inactive'
  if (studentCount === 0) return 'idle'
  if (studentCount < 8) return 'light'
  if (studentCount <= 15) return 'normal'
  return 'heavy'
}

export const WORKLOAD_CONFIG: Record<WorkloadLevel, {
  label: string
  color: string
  bgColor: string
  description: string
}> = {
  inactive: { label: 'Tidak Aktif', color: 'text-gray-500', bgColor: 'bg-gray-100', description: 'Tutor tidak aktif' },
  idle:     { label: 'Idle',        color: 'text-gray-500', bgColor: 'bg-gray-100', description: 'Aktif tapi belum mengajar' },
  light:    { label: 'Ringan',      color: 'text-green-700', bgColor: 'bg-green-100', description: 'Beban ideal, masih bisa tambah siswa' },
  normal:   { label: 'Normal',      color: 'text-yellow-700', bgColor: 'bg-yellow-100', description: 'Beban sehat' },
  heavy:    { label: 'Berat',       color: 'text-red-700', bgColor: 'bg-red-100', description: 'Di atas batas ideal, pertimbangkan tambah tutor' },
}

export interface TutorWorkloadData {
  id: string
  name: string
  studentCount: number
  isActive: boolean
}

export interface TutorInsight {
  id: string
  severity: 'danger' | 'warning' | 'info'
  message: string
  action?: { label: string; href: string }
}

export function getTutorInsights(tutors: TutorWorkloadData[]): TutorInsight[] {
  const insights: TutorInsight[] = []
  const activeTutors = tutors.filter(t => t.isActive)
  const totalStudents = activeTutors.reduce((s, t) => s + t.studentCount, 0)

  // TI-01: satu tutor menanggung semua siswa
  if (activeTutors.length === 1 && totalStudents > 0) {
    insights.push({
      id: 'TI-01',
      severity: 'warning',
      message: `${activeTutors[0].name} menanggung semua ${totalStudents} siswa sendirian — pertimbangkan mengaktifkan tutor lain atau rekrut baru`,
      action: { label: 'Tambah Tutor', href: '/admin/users/new' },
    })
  }

  // TI-02: tutor overload (>15 siswa)
  for (const t of activeTutors.filter(t => t.studentCount > 15)) {
    insights.push({
      id: `TI-02-${t.id}`,
      severity: 'danger',
      message: `${t.name} mengajar ${t.studentCount} siswa — di atas batas ideal 15`,
      action: { label: 'Lihat Detail', href: `/admin/users/${t.id}` },
    })
  }

  // TI-03: tutor aktif tapi tanpa kelas
  for (const t of activeTutors.filter(t => t.studentCount === 0)) {
    insights.push({
      id: `TI-03-${t.id}`,
      severity: 'info',
      message: `${t.name} aktif tapi belum mengajar kelas manapun`,
      action: { label: 'Kelola Kelas', href: '/admin/classes' },
    })
  }

  // TI-04: beban tidak seimbang antar tutor
  if (activeTutors.length >= 2) {
    const counts = activeTutors.map(t => t.studentCount)
    const diff = Math.max(...counts) - Math.min(...counts)
    if (diff > 10) {
      insights.push({
        id: 'TI-04',
        severity: 'warning',
        message: `Beban mengajar tidak merata — selisih ${diff} siswa antar tutor`,
      })
    }
  }

  const order: Record<string, number> = { danger: 0, warning: 1, info: 2 }
  return insights.sort((a, b) => order[a.severity] - order[b.severity])
}
