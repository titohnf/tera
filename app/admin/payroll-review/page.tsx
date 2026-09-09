import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server-admin'
import MetricCard from '@/components/dashboard/MetricCard'
import PayrollReviewFilters from '@/components/admin/payroll/PayrollReviewFilters'
import PayrollReviewTable, { type PayrollReviewGroup } from '@/components/admin/payroll/PayrollReviewTable'

type SessionRow = {
  id: string
  scheduled_at: string
  duration_minutes: number | null
  topic: string | null
  tutor_id: string | null
  status: string
  payroll_status: string
  payroll_rejection_reason: string | null
  payroll_tutor_note: string | null
  classes: { id: string; name: string } | null
  profiles: { id: string; full_name: string } | null
}

export default async function PayrollReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>
}) {
  const { month, status } = await searchParams
  const now = new Date()
  const selectedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  // Tanpa parameter status, admin langsung melihat antrean yang perlu dikerjakan.
  const selectedStatus = status === undefined ? 'pending' : status

  const [year, mon] = selectedMonth.split('-').map(Number)
  const monthStart = new Date(year, mon - 1, 1).toISOString()
  const monthEnd = new Date(year, mon, 1).toISOString()
  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    }
  })

  const admin = createAdminClient()
  const { data: sessions } = await admin
    .from('sessions')
    .select('id, scheduled_at, duration_minutes, topic, tutor_id, status, payroll_status, payroll_rejection_reason, payroll_tutor_note, classes(id, name), profiles!tutor_id(id, full_name)')
    .neq('status', 'cancelled')
    .gte('scheduled_at', monthStart)
    .lt('scheduled_at', monthEnd)
    .order('scheduled_at', { ascending: true }) as unknown as { data: SessionRow[] | null }

  // Sesi yang belum `completed` berarti jurnalnya belum lengkap — belum bisa
  // direview sama sekali. Ditampilkan sebagai status tersendiri supaya sesi
  // yang mandek tidak menghilang begitu saja dari layar admin.
  const allSessions = (sessions ?? []).map(s => ({
    ...s,
    reviewStatus: s.status === 'completed' ? s.payroll_status : 'incomplete',
  }))

  // Dua sesi di kelas dan tanggal yang sama hampir selalu berarti satu
  // pertemuan tercatat dua kali — biasanya karena jadwal kelas disunting dan
  // sesi lama ikut terbawa. Kalau tidak ditandai di sini, keduanya disetujui
  // berurutan tanpa disadari dan tutornya dibayar dua kali untuk satu
  // pertemuan. Bukan larangan: kelas memang boleh bertemu dua kali sehari,
  // jadi yang diberikan cuma peringatan yang minta admin melihat sekali lagi.
  //
  // Dihitung dari seluruh sesi bulan itu, bukan hanya yang lolos filter
  // status: kembarannya sering sudah disetujui saat yang ini masih pending.
  const dateKey = (iso: string) =>
    new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const sameSlot = new Map<string, typeof allSessions>()
  for (const s of allSessions) {
    if (!s.classes?.id) continue
    const key = `${s.classes.id}|${dateKey(s.scheduled_at)}`
    const bucket = sameSlot.get(key)
    if (bucket) bucket.push(s)
    else sameSlot.set(key, [s])
  }
  const kembaranDari = (s: (typeof allSessions)[number]) => {
    if (!s.classes?.id) return []
    const bucket = sameSlot.get(`${s.classes.id}|${dateKey(s.scheduled_at)}`) ?? []
    return bucket
      .filter(other => other.id !== s.id)
      .map(other => ({
        id: other.id,
        scheduled_at: other.scheduled_at,
        payrollStatus: other.reviewStatus,
      }))
  }

  const counts = {
    total: allSessions.length,
    incomplete: allSessions.filter(s => s.reviewStatus === 'incomplete').length,
    pending: allSessions.filter(s => s.reviewStatus === 'pending').length,
    approved: allSessions.filter(s => s.reviewStatus === 'approved').length,
    rejected: allSessions.filter(s => s.reviewStatus === 'rejected').length,
  }

  const visible = selectedStatus
    ? allSessions.filter(s => s.reviewStatus === selectedStatus)
    : allSessions

  const groupMap = new Map<string, PayrollReviewGroup>()
  for (const s of visible) {
    const tutorId = s.profiles?.id ?? s.tutor_id
    if (!tutorId) continue
    if (!groupMap.has(tutorId)) {
      groupMap.set(tutorId, {
        tutorId,
        tutorName: s.profiles?.full_name ?? 'Tutor tanpa nama',
        sessions: [],
      })
    }
    groupMap.get(tutorId)!.sessions.push({
      id: s.id,
      scheduled_at: s.scheduled_at,
      duration_minutes: s.duration_minutes,
      topic: s.topic,
      classId: s.classes?.id ?? null,
      className: s.classes?.name ?? 'Kelas',
      payrollStatus: s.reviewStatus,
      rejectionReason: s.payroll_rejection_reason,
      tutorNote: s.payroll_tutor_note,
      duplicates: kembaranDari(s),
    })
  }
  const groups = [...groupMap.values()].sort((a, b) => a.tutorName.localeCompare(b.tutorName, 'id'))

  // Dihitung sekali untuk banner: berapa hari yang tercatat lebih dari sekali,
  // di seluruh bulan — termasuk yang sedang tersaring keluar dari layar.
  const hariDobel = [...sameSlot.values()].filter(v => v.length > 1).length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Review Gaji Sesi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sesi {monthLabel} — slip gaji dihitung dari sesi yang jurnalnya sudah lengkap;
            review di sini untuk kontrol kualitas jurnalnya.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PayrollReviewFilters monthOptions={monthOptions} month={selectedMonth} status={selectedStatus} />
          <Link
            href={`/admin/payslips?month=${selectedMonth}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Buat Slip Gaji
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Total Sesi" value={counts.total} sub="di luar yang dibatalkan" />
        <MetricCard
          label="Jurnal Belum Lengkap"
          value={counts.incomplete}
          valueColor="text-orange-600"
          tooltip="Sesi yang jurnalnya belum diisi tuntas oleh tutor. Belum bisa direview dan belum masuk hitungan slip gaji."
        />
        <MetricCard label="Menunggu Review" value={counts.pending} valueColor="text-yellow-600" />
        <MetricCard label="Disetujui" value={counts.approved} valueColor="text-green-600" />
        <MetricCard label="Ditolak" value={counts.rejected} valueColor="text-red-600" />
      </div>

      {hariDobel > 0 && (
        <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-6">
          <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-orange-700">
            {hariDobel === 1 ? '1 hari' : `${hariDobel} hari`} di {monthLabel} punya lebih dari satu
            sesi di kelas yang sama. Biasanya itu satu pertemuan yang tercatat dua kali, dan kalau
            keduanya disetujui tutornya dibayar dua kali. Barisnya ditandai <strong>Dobel</strong>
            {' '}di bawah — buka detailnya dulu sebelum menyetujui.
          </p>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 py-16">
          <p className="text-sm text-gray-400 text-center">
            {counts.total === 0
              ? `Belum ada sesi terlaksana di ${monthLabel}.`
              : 'Tidak ada sesi dengan status ini.'}
          </p>
        </div>
      ) : (
        <PayrollReviewTable groups={groups} />
      )}
    </div>
  )
}
