import { createAdminClient } from '@/lib/supabase/server-admin'
import { coversSession } from '@/lib/enrollment'

/**
 * Ringkasan Progres Kelas untuk BANYAK siswa sekaligus atas satu periode bebas
 * (satu bulan, rentang bulan, atau seluruh waktu): kehadiran dan rata-rata
 * nilai asesmen per mapel.
 *
 * Aturannya disalin persis dari `getLaporanBulananData()` — sesi yang dihitung
 * adalah sesi SELESAI di kelas siswa yang jatuh di dalam masa keanggotaannya
 * (`coversSession`), kehadiran = (hadir + terlambat) / jumlah sesi itu, dan
 * nilai = rata-rata persen skor per mapel (dibulatkan) dari asesmen yang punya
 * skor dan bobot bukan nol. Kembarnya sengaja, bukan kebetulan: fungsi itu
 * melayani satu siswa dan satu bulan dengan belasan kueri, terlalu mahal untuk
 * dipanggil per siswa per bulan selama bertahun-tahun. Kesamaan hasilnya
 * diperiksa terhadap fungsi itu pada data nyata saat ini ditulis — kalau salah
 * satunya diubah, ubah keduanya.
 *
 * Kuerinya dipotong-potong dan diambil berhalaman: daftar id yang panjang
 * melewati batas panjang alamat, dan satu permintaan dibatasi 1000 baris.
 */

export type RingkasanSiswa = {
  /** Sesi selesai di masa keanggotaan siswa, pada periode itu. */
  sesi: number
  /** Hadir + terlambat. */
  hadir: number
  /** Persen kehadiran; null kalau tidak ada sesi. */
  pct: number | null
  /** Rata-rata nilai asesmen per mapel, persen. Mapel tanpa nilai tidak ada. */
  nilai: Record<string, number>
  /** Bulan (YYYY-MM, waktu lokal server) sesi terakhirnya; null kalau tidak ada sesi. */
  bulanTerakhir: string | null
}

export type PeriodeProgres = { startIso?: string; endIso?: string }

const POTONGAN = 100
const HALAMAN = 1000

function potong<T>(arr: T[], n: number): T[][] {
  const hasil: T[][] = []
  for (let i = 0; i < arr.length; i += n) hasil.push(arr.slice(i, i + n))
  return hasil
}

type Halaman = PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>

/** Mengambil semua baris sebuah kueri, halaman demi halaman. */
async function semuaBaris<T>(bangun: (dari: number, sampai: number) => Halaman): Promise<T[]> {
  const hasil: T[] = []
  for (let dari = 0; ; dari += HALAMAN) {
    const { data, error } = await bangun(dari, dari + HALAMAN - 1)
    if (error) throw new Error(error.message)
    const baris = (data ?? []) as T[]
    hasil.push(...baris)
    if (baris.length < HALAMAN) break
  }
  return hasil
}

export async function ringkasanProgresKelas(
  studentIds: string[],
  periode: PeriodeProgres,
): Promise<Map<string, RingkasanSiswa>> {
  const kosong = (): RingkasanSiswa => ({ sesi: 0, hadir: 0, pct: null, nilai: {}, bulanTerakhir: null })
  const hasil = new Map<string, RingkasanSiswa>(studentIds.map(id => [id, kosong()]))
  if (studentIds.length === 0) return hasil

  const admin = createAdminClient()

  type Keanggotaan = {
    student_id: string
    enrolled_at: string | null
    unenrolled_at: string | null
    is_active: boolean
    classes: { id: string } | null
  }
  const keanggotaan = (
    await semuaBaris<Keanggotaan>((dari, sampai) =>
      admin
        .from('class_students')
        .select('student_id, enrolled_at, unenrolled_at, is_active, classes(id)')
        .in('student_id', studentIds)
        .range(dari, sampai) as unknown as Halaman,
    )
  ).filter(e => e.classes !== null)

  // Masa keanggotaan per siswa per kelas. Kalau satu kelas tercatat lebih dari
  // sekali, yang terakhir menang — sama dengan `windowByClass` di laporan bulanan.
  const masa = new Map<string, Map<string, Keanggotaan>>()
  for (const e of keanggotaan) {
    const perKelas = masa.get(e.student_id) ?? new Map<string, Keanggotaan>()
    perKelas.set(e.classes!.id, e)
    masa.set(e.student_id, perKelas)
  }

  const kelasIds = [...new Set(keanggotaan.map(e => e.classes!.id))]
  if (kelasIds.length === 0) return hasil

  type Sesi = { id: string; class_id: string; scheduled_at: string; subjects: { name: string } | null }
  const sesi: Sesi[] = []
  for (const kelas of potong(kelasIds, POTONGAN)) {
    sesi.push(
      ...(await semuaBaris<Sesi>((dari, sampai) => {
        let q = admin
          .from('sessions')
          .select('id, class_id, scheduled_at, subjects(name)')
          .in('class_id', kelas)
          .eq('status', 'completed')
        if (periode.startIso) q = q.gte('scheduled_at', periode.startIso)
        if (periode.endIso) q = q.lt('scheduled_at', periode.endIso)
        return q.order('scheduled_at', { ascending: true }).range(dari, sampai) as unknown as Halaman
      })),
    )
  }
  if (sesi.length === 0) return hasil

  const sesiIds = sesi.map(s => s.id)
  const mapelSesi = new Map(sesi.map(s => [s.id, s.subjects?.name ?? 'Tanpa mapel']))

  const kehadiran = new Map<string, string>() // `${siswa}|${sesi}` → status
  const asesmen: { id: string; session_id: string; max_score: number }[] = []
  for (const bagian of potong(sesiIds, POTONGAN)) {
    const [absen, nilai] = await Promise.all([
      semuaBaris<{ session_id: string; student_id: string; status: string }>((dari, sampai) =>
        admin
          .from('attendances')
          .select('session_id, student_id, status')
          .in('session_id', bagian)
          .in('student_id', studentIds)
          .range(dari, sampai) as unknown as Halaman,
      ),
      semuaBaris<{ id: string; session_id: string; max_score: number }>((dari, sampai) =>
        admin
          .from('assessments')
          .select('id, session_id, max_score')
          .in('session_id', bagian)
          .range(dari, sampai) as unknown as Halaman,
      ),
    ])
    for (const a of absen) kehadiran.set(`${a.student_id}|${a.session_id}`, a.status)
    asesmen.push(...nilai)
  }

  const skor = new Map<string, number | null>() // `${siswa}|${asesmen}` → skor
  for (const bagian of potong(
    asesmen.map(a => a.id),
    POTONGAN,
  )) {
    const baris = await semuaBaris<{ assessment_id: string; student_id: string; score: number | null }>(
      (dari, sampai) =>
        admin
          .from('assessment_results')
          .select('assessment_id, student_id, score')
          .in('assessment_id', bagian)
          .in('student_id', studentIds)
          .range(dari, sampai) as unknown as Halaman,
    )
    for (const r of baris) skor.set(`${r.student_id}|${r.assessment_id}`, r.score)
  }

  const asesmenPerSesi = new Map<string, typeof asesmen>()
  for (const a of asesmen) {
    const ada = asesmenPerSesi.get(a.session_id) ?? []
    ada.push(a)
    asesmenPerSesi.set(a.session_id, ada)
  }

  // Bulan sebuah sesi dibaca dengan waktu lokal server, sama dengan `monthRange()`
  // di laporan bulanan.
  const bulanDari = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  for (const studentId of studentIds) {
    const masaSiswa = masa.get(studentId)
    if (!masaSiswa) continue

    const miliknya = sesi.filter(s => {
      const jendela = masaSiswa.get(s.class_id)
      return jendela ? coversSession(jendela, s.scheduled_at) : false
    })
    if (miliknya.length === 0) continue

    const hadir = miliknya.filter(s => {
      const status = kehadiran.get(`${studentId}|${s.id}`)
      return status === 'present' || status === 'late'
    }).length

    const perMapel = new Map<string, { total: number; jumlah: number }>()
    for (const s of miliknya) {
      for (const a of asesmenPerSesi.get(s.id) ?? []) {
        const nilai = skor.get(`${studentId}|${a.id}`) ?? null
        if (nilai === null || a.max_score === 0) continue
        const mapel = mapelSesi.get(s.id) ?? 'Tanpa mapel'
        const cur = perMapel.get(mapel) ?? { total: 0, jumlah: 0 }
        cur.total += (nilai / a.max_score) * 100
        cur.jumlah += 1
        perMapel.set(mapel, cur)
      }
    }

    // `sesi` terurut naik menurut waktu, jadi yang terakhir di `miliknya` terbaru.
    const terakhir = miliknya[miliknya.length - 1]
    hasil.set(studentId, {
      sesi: miliknya.length,
      hadir,
      pct: Math.round((hadir / miliknya.length) * 100),
      nilai: Object.fromEntries(
        [...perMapel].map(([mapel, v]) => [mapel, Math.round(v.total / v.jumlah)]),
      ),
      bulanTerakhir: bulanDari(terakhir.scheduled_at),
    })
  }

  return hasil
}
