import type { SupabaseClient } from '@supabase/supabase-js'
import { buildRateMap, resolveAmounts } from '@/lib/salary'
import type { SalarySchemeRow } from '@/lib/types/database'
import type { MonthlyTotals } from './laba-rugi'

/**
 * Proyeksi laba rugi satu semester dalam KEADAAN IDEAL.
 *
 * Pertanyaan yang dijawab: "kalau semua siswa lanjut sampai akhir semester,
 * semua membayar tepat di bulan tagihannya, dan gaji tutor dibayar di bulan
 * yang sama dengan sesinya — berapa labanya?"
 *
 * Karena itu angkanya SELURUHNYA sintetis, termasuk untuk bulan yang sudah
 * lewat. Juli di tabel proyeksi bisa berbeda dari Juli yang sesungguhnya, dan
 * itu memang tujuannya: yang ditampilkan adalah kemampuan bimbel ini kalau
 * berjalan mulus, bukan catatan apa yang terjadi. Untuk yang terakhir, matikan
 * toggle-nya.
 *
 * Tiga penyusunnya:
 *
 *   PEMASUKAN — apa yang seharusnya ditagih di bulan itu, bukan apa yang masuk
 *   ke rekening. Kelas privat: sesi terjadwal bulan itu × tarif per pertemuan.
 *   Kelas grup: tarif per bulan × jumlah siswa aktif, untuk setiap bulan kelas
 *   itu berjalan. Kelas yayasan tidak pernah ditagih, jadi nol.
 *
 *   Invoice yang sudah terbit sengaja TIDAK dipakai. Tagihan nyata memuat
 *   tunggakan, cicilan, dan penagihan di muka enam bulan sekaligus — persis
 *   hal-hal yang ingin dihilangkan dari simulasi ideal.
 *
 *   GAJI TUTOR — sesi terjadwal bulan itu × tarif per sesi, memakai
 *   resolveAmounts() yang sama dengan pembuatan slip gaji, dengan asumsi
 *   seluruh siswa terdaftar hadir sehingga bonus jumlah siswa ikut terhitung.
 *   Tidak ada carry-over: sesi Juli dibayar di Juli, bukan 1 Agustus seperti
 *   praktik sebenarnya. Slip gaji yang sudah ada juga tidak dipakai, karena
 *   tanggal gajiannya membawa carry-over itu kembali.
 *
 *   BIAYA OPERASIONAL — bulan yang sudah diisi memakai angkanya sendiri; bulan
 *   yang kosong meniru bulan terisi yang paling akhir. Selama belum ada satu
 *   pun biaya dicatat, seluruh bulan tetap nol.
 *
 * Yang TIDAK diperhitungkan: siswa baru yang mungkin masuk di tengah semester,
 * dan kelas yang mungkin ditambah. Proyeksi ini hanya menjalankan kelas dan
 * jadwal yang sudah ada di kalender hari ini, jadi cenderung konservatif.
 */

export type ProjectionRow = MonthlyTotals & {
  /** Selalu true: seluruh baris proyeksi adalah simulasi, bukan kejadian. */
  projected: boolean
}

type SessionForProjection = {
  scheduled_at: string
  tutor_id: string | null
  class_id: string
  classes: { class_type: string | null; level: string | null; jenis: string | null } | null
}

type ClassForProjection = {
  id: string
  class_type: string | null
  level: string | null
  jenis: string | null
  start_date: string | null
  end_date: string | null
}

type BillingRate = { class_type: string; jenjang: string; jenis: string; amount: number }

/** Tarif bimbel memakai 'Reguler'/'Fokus', kolom kelas memakai huruf kecil. */
function billingJenisOf(jenis: string | null | undefined): string | null {
  return jenis === 'reguler' ? 'Reguler' : jenis === 'fokus' ? 'Fokus' : null
}

/**
 * Baris tren berisi angka simulasi untuk seluruh bulan semester.
 *
 * `months` harus bulan-bulan satu semester (lihat semesterMonths), terbaru
 * dulu. `actuals` hanya dipakai untuk biaya operasional — satu-satunya
 * komponen yang angkanya diambil apa adanya.
 */
export async function buildProjection(
  admin: SupabaseClient,
  months: string[],
  actuals: MonthlyTotals[],
): Promise<ProjectionRow[]> {
  const ascending = [...months].sort()
  const firstMonth = ascending[0]
  const lastMonth = ascending[ascending.length - 1]

  const [
    { data: sessions },
    { data: activePeriod },
    { data: schemes },
    { data: enrollments },
    { data: billingRates },
    { data: classes },
  ] = await Promise.all([
    admin
      .from('sessions')
      .select('scheduled_at, tutor_id, class_id, classes(class_type, level, jenis)')
      .neq('status', 'cancelled')
      .gte('scheduled_at', `${firstMonth}-01T00:00:00.000Z`)
      .lt('scheduled_at', `${nextMonthStart(lastMonth)}T00:00:00.000Z`)
      .limit(5000) as unknown as Promise<{ data: SessionForProjection[] | null }>,
    admin.from('rate_periods').select('id').eq('is_active', true).limit(1).maybeSingle(),
    admin.from('salary_schemes').select('*') as unknown as Promise<{ data: SalarySchemeRow[] | null }>,
    admin.from('class_students').select('class_id').eq('is_active', true) as unknown as Promise<{
      data: { class_id: string }[] | null
    }>,
    admin
      .from('billing_rates')
      .select('class_type, jenjang, jenis, amount, billing_rate_periods!inner(is_active)')
      .eq('billing_rate_periods.is_active', true) as unknown as Promise<{ data: BillingRate[] | null }>,
    admin
      .from('classes')
      .select('id, class_type, level, jenis, start_date, end_date')
      .eq('is_active', true) as unknown as Promise<{ data: ClassForProjection[] | null }>,
  ])

  const { data: rates } = activePeriod?.id
    ? await admin
        .from('session_rates')
        .select('class_type, jenjang, jenis, rate_per_session')
        .eq('period_id', activePeriod.id) as unknown as { data: Parameters<typeof buildRateMap>[0] | null }
    : { data: null }

  const rateMap = buildRateMap(rates ?? [])
  const schemeByKey = Object.fromEntries((schemes ?? []).map(s => [`${s.class_id}:${s.tutor_id}`, s]))
  const billingMap = new Map(
    (billingRates ?? []).map(r => [`${r.class_type}|${r.jenjang}|${r.jenis}`, Number(r.amount) || 0]),
  )

  const studentsByClass = new Map<string, number>()
  for (const e of enrollments ?? []) {
    studentsByClass.set(e.class_id, (studentsByClass.get(e.class_id) ?? 0) + 1)
  }

  const sessionsByClassMonth = new Map<string, number>()
  const payrollByMonth = new Map<string, number>()
  for (const s of sessions ?? []) {
    const month = s.scheduled_at.slice(0, 7)
    sessionsByClassMonth.set(
      `${s.class_id}__${month}`,
      (sessionsByClassMonth.get(`${s.class_id}__${month}`) ?? 0) + 1,
    )
    if (!s.tutor_id) continue
    const { baseAmount, bonusAmount } = resolveAmounts({
      scheme: schemeByKey[`${s.class_id}:${s.tutor_id}`],
      cls: s.classes,
      studentsPresent: studentsByClass.get(s.class_id) ?? 0,
      rateMap,
    })
    // Tanpa carry-over: gaji jatuh di bulan sesinya sendiri.
    payrollByMonth.set(month, (payrollByMonth.get(month) ?? 0) + baseAmount + bonusAmount)
  }

  const incomeByMonth = new Map<string, number>()
  for (const cls of classes ?? []) {
    if (cls.class_type === 'yayasan') continue
    const jenis = billingJenisOf(cls.jenis)
    if (!cls.class_type || !cls.level || !jenis) continue
    const rate = billingMap.get(`${cls.class_type}|${cls.level}|${jenis}`) ?? 0
    if (rate === 0) continue

    for (const month of ascending) {
      const amount = cls.class_type === 'private'
        // Privat ditagih per pertemuan, jadi bulan tanpa sesi memang nol tagihan.
        ? rate * (sessionsByClassMonth.get(`${cls.id}__${month}`) ?? 0)
        // Grup ditagih per bulan selama kelasnya berjalan, ada sesi atau tidak.
        : classRunsIn(cls, month) ? rate * (studentsByClass.get(cls.id) ?? 0) : 0
      if (amount > 0) incomeByMonth.set(month, (incomeByMonth.get(month) ?? 0) + amount)
    }
  }

  // Biaya operasional: satu-satunya komponen yang memakai angka sungguhan.
  const actualByMonth = new Map(actuals.map(a => [a.month, a]))
  const filledMonths = ascending.filter(m => (actualByMonth.get(m)?.operational ?? 0) > 0)
  const templateOperational = filledMonths.length > 0
    ? actualByMonth.get(filledMonths[filledMonths.length - 1])!.operational
    : 0

  return months.map(month => {
    const cashIn = incomeByMonth.get(month) ?? 0
    const payroll = payrollByMonth.get(month) ?? 0
    const actualOperational = actualByMonth.get(month)?.operational ?? 0
    const operational = actualOperational > 0 ? actualOperational : templateOperational
    return {
      month,
      cashIn,
      payroll,
      payrollUnpaid: 0,
      operational,
      netProfit: cashIn - payroll - operational,
      projected: true,
    }
  })
}

function nextMonthStart(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
}

/** Apakah kelas berjalan di bulan itu, menurut tanggal mulai/selesainya. */
function classRunsIn(cls: ClassForProjection, month: string): boolean {
  if (cls.start_date && month < cls.start_date.slice(0, 7)) return false
  if (cls.end_date && month > cls.end_date.slice(0, 7)) return false
  return true
}
