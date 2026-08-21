import { createClient } from '@/lib/supabase/server'
import { coversSession } from '@/lib/enrollment'

/**
 * Kelas dan sesi seorang anak, dirakit sekali untuk dipakai beberapa halaman
 * portal keluarga.
 *
 * Sampai sebelum ini semuanya tinggal di badan `app/keluarga/[studentId]/page.tsx`,
 * karena memang cuma satu halaman yang memerlukannya. Begitu halaman bertab itu
 * dipecah jadi Beranda, Jadwal, dan Profil, kuerinya harus disalin ke tiga
 * tempat — dan salinan yang paling gampang menyimpang justru saringan
 * `coversSession` di bawah: yang lupa memasangnya akan menampilkan sesi kelas
 * dari masa sebelum anaknya bergabung, lalu persentase kehadirannya berbeda
 * dengan yang dilihat admin.
 *
 * Semua kuerinya lewat klien ber-RLS, sama seperti sisa portal ini (lihat
 * alasannya di `keluargaContext`).
 */

export type SesiAnak = {
  id: string
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
  subject_id: string | null
  tutor_id: string | null
}

export type KelasAnak = {
  class_id: string
  is_active: boolean
  enrolled_at: string | null
  unenrolled_at: string | null
  classes: { name: string; schedule_days: number[] | null; schedule_time: string | null } | null
}

export async function muatKelasDanSesi(studentId: string) {
  const supabase = await createClient()

  const { data: kelasRows } = await supabase
    .from('class_students')
    .select('class_id, is_active, enrolled_at, unenrolled_at, classes(name, schedule_days, schedule_time)')
    .eq('student_id', studentId)

  const kelas = (kelasRows ?? []) as unknown as KelasAnak[]
  const classIds = kelas.map((k) => k.class_id)

  const { data: sesiRows } = classIds.length
    ? await supabase
        .from('sessions')
        .select('id, class_id, scheduled_at, topic, status, subject_id, tutor_id')
        .in('class_id', classIds)
        .order('scheduled_at', { ascending: false })
    : { data: null }
  const semuaSesi = (sesiRows ?? []) as unknown as SesiAnak[]

  // Sesi di luar masa anak ini ikut kelasnya dibuang — aturan yang sama dengan
  // halaman detail siswa admin (`inWindow` di sana). Kelas hidup lebih lama
  // daripada keanggotaan muridnya: anak yang baru masuk Agustus tidak punya
  // urusan dengan sesi Juli kelasnya.
  const rentangKelas = new Map(kelas.map((k) => [k.class_id, k] as const))
  const sesi = semuaSesi.filter((s) => {
    const rentang = rentangKelas.get(s.class_id)
    return rentang ? coversSession(rentang, s.scheduled_at) : false
  })

  const { data: hadirRows } = await supabase
    .from('attendances')
    .select('session_id, status')
    .eq('student_id', studentId)
  const attendanceMap: Record<string, string> = {}
  for (const a of hadirRows ?? []) attendanceMap[a.session_id as string] = a.status as string

  const { data: mapelRows } = await supabase.from('subjects').select('id, name')
  const subjectNameMap: Record<string, string> = {}
  for (const m of mapelRows ?? []) subjectNameMap[m.id as string] = m.name as string

  const idTutor = [...new Set(sesi.map((s) => s.tutor_id).filter(Boolean))] as string[]
  const { data: tutorRows } = idTutor.length
    ? await supabase.from('profiles').select('id, full_name').in('id', idTutor)
    : { data: null }
  const namaTutor = new Map((tutorRows ?? []).map((t) => [t.id as string, t.full_name as string]))
  const sessionTutorMap: Record<string, string> = {}
  for (const s of sesi) if (s.tutor_id) sessionTutorMap[s.id] = namaTutor.get(s.tutor_id) ?? ''

  const kelasAktif = kelas.filter((k) => k.is_active)
  const kelasLampau = kelas.filter((k) => !k.is_active)
  const idKelasAktif = new Set(kelasAktif.map((k) => k.class_id))
  const sesiAktif = sesi.filter((s) => idKelasAktif.has(s.class_id))

  // Mapel per kelas disimpulkan dari sesinya — sama seperti yang dilakukan
  // halaman admin, karena kelas tidak menyimpan daftar mapelnya sendiri.
  const mapelPerKelas = new Map<string, string[]>()
  for (const s of sesi) {
    if (!s.subject_id) continue
    const nama = subjectNameMap[s.subject_id]
    if (!nama) continue
    const daftar = mapelPerKelas.get(s.class_id) ?? []
    if (!daftar.includes(nama)) daftar.push(nama)
    mapelPerKelas.set(s.class_id, daftar)
  }

  return {
    kelas,
    kelasAktif,
    kelasLampau,
    sesi,
    sesiAktif,
    attendanceMap,
    subjectNameMap,
    sessionTutorMap,
    mapelPerKelas,
  }
}

/**
 * Sesi terjadwal TERDEKAT milik anak ini, atau null.
 *
 * Beranda cuma perlu satu baris ini, jadi ia tidak memanggil
 * `muatKelasDanSesi()` — kartu paling atas portal tidak perlu menunggu seluruh
 * riwayat sesi, kehadiran, dan nama tutor selesai dibaca.
 */
export async function sesiBerikutnya(studentId: string, sekarangIso: string) {
  const supabase = await createClient()

  const { data: kelasRows } = await supabase
    .from('class_students')
    .select('class_id, is_active, enrolled_at, unenrolled_at')
    .eq('student_id', studentId)
    .eq('is_active', true)

  const kelas = (kelasRows ?? []) as {
    class_id: string
    is_active: boolean
    enrolled_at: string | null
    unenrolled_at: string | null
  }[]
  if (kelas.length === 0) return null

  const { data: sesiRows } = await supabase
    .from('sessions')
    .select('id, class_id, scheduled_at, topic, subject_id, tutor_id')
    .in('class_id', kelas.map((k) => k.class_id))
    .eq('status', 'scheduled')
    .gte('scheduled_at', sekarangIso)
    .order('scheduled_at', { ascending: true })

  const rentangKelas = new Map(kelas.map((k) => [k.class_id, k] as const))
  const sesi = ((sesiRows ?? []) as unknown as (SesiAnak & { class_id: string })[]).find((s) => {
    const rentang = rentangKelas.get(s.class_id)
    return rentang ? coversSession(rentang, s.scheduled_at) : false
  })
  if (!sesi) return null

  const [{ data: mapel }, { data: tutor }, { data: kls }] = await Promise.all([
    sesi.subject_id
      ? supabase.from('subjects').select('name').eq('id', sesi.subject_id).maybeSingle()
      : Promise.resolve({ data: null }),
    sesi.tutor_id
      ? supabase.from('profiles').select('full_name').eq('id', sesi.tutor_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('classes').select('name').eq('id', sesi.class_id).maybeSingle(),
  ])

  return {
    scheduled_at: sesi.scheduled_at,
    topik: sesi.topic,
    mapel: (mapel?.name as string | null) ?? null,
    tutor: (tutor?.full_name as string | null) ?? null,
    kelas: (kls?.name as string | null) ?? null,
  }
}

/**
 * Sisa tagihan anak ini: yang sudah terbit, belum lunas, belum dibatalkan.
 * Aturan yang sama dipakai di halaman Tagihan dan Profil.
 */
export async function sisaTagihan(studentId: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('total_due, status')
    .eq('student_id', studentId)
    .neq('status', 'draft')

  return ((data ?? []) as { total_due: number; status: string }[])
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((s, i) => s + Number(i.total_due), 0)
}
