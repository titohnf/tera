import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import RequestActions from '@/components/admin/session-requests/RequestActions'
import { getTutorGroupsForDate, buildWhatsappShareUrl, buildDailyMessageText, formatDateLabel, todayWib } from '@/lib/daily-message'

type RequestRow = {
  id: string
  request_type: 'cancel' | 'reschedule' | 'change_tutor' | 'change_subject'
  reason: string
  new_scheduled_at: string | null
  new_tutor_id: string | null
  new_tutor_confirmed: boolean | null
  new_subject_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  session_id: string
  sessions: { scheduled_at: string; classes: { name: string } | null } | null
  requester: { full_name: string } | null
  new_tutor: { full_name: string } | null
  new_subject: { name: string } | null
}

const REQUEST_LABEL: Record<string, string> = {
  cancel: 'Pembatalan Sesi',
  reschedule: 'Reschedule',
  change_tutor: 'Ganti Tutor',
  change_subject: 'Ganti Mapel',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

const DEFAULT_PENGAJUAN_LIMIT = 3

export default async function SessionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; all?: string }>
}) {
  const { status: statusFilter = 'pending', all } = await searchParams
  const admin = createAdminClient()
  const showAll = all === '1'

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Jadwal</h1>

      {await renderPengajuanSegment(admin, statusFilter, showAll, fmtDate)}
      {await renderTodaySegment(admin)}
    </div>
  )
}

async function renderPengajuanSegment(
  admin: ReturnType<typeof createAdminClient>,
  statusFilter: string,
  showAll: boolean,
  fmtDate: (iso: string) => string,
) {
  let query = admin
    .from('session_change_requests')
    .select(`
      id, request_type, reason, new_scheduled_at, new_tutor_id, new_tutor_confirmed, new_subject_id, status, admin_note, created_at, session_id,
      sessions(scheduled_at, classes(name)),
      requester:profiles!requested_by(full_name),
      new_tutor:profiles!new_tutor_id(full_name),
      new_subject:subjects!new_subject_id(name)
    `)
    .order('created_at', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter)

  const fetchLimit = showAll ? 100 : DEFAULT_PENGAJUAN_LIMIT + 1
  const { data: allRequests } = await query.limit(fetchLimit) as unknown as { data: RequestRow[] | null }

  const hasMore = !showAll && (allRequests?.length ?? 0) > DEFAULT_PENGAJUAN_LIMIT
  const requests = showAll ? allRequests : (allRequests ?? []).slice(0, DEFAULT_PENGAJUAN_LIMIT)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-0">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Pengajuan Jadwal</h2>
        <div className="flex gap-2">
          {[
            { key: 'pending', label: 'Menunggu' },
            { key: 'approved', label: 'Disetujui' },
            { key: 'rejected', label: 'Ditolak' },
            { key: '', label: 'Semua' },
          ].map(tab => (
            <Link
              key={tab.key}
              href={tab.key ? `/admin/session-requests?status=${tab.key}` : '/admin/session-requests?status='}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-5 pt-3">
        {!requests || requests.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            Tidak ada pengajuan.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-900">{REQUEST_LABEL[req.request_type]}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status]}`}>
                        {STATUS_LABEL[req.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {req.sessions?.classes?.name ?? 'Kelas'}
                      {req.sessions && ` — ${fmtDate(req.sessions.scheduled_at)}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Diajukan oleh: {req.requester?.full_name ?? '—'}</p>
                    {req.request_type === 'reschedule' && req.new_scheduled_at && (
                      <p className="text-xs text-gray-500">
                        Ke: {new Date(req.new_scheduled_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                      </p>
                    )}
                    {req.request_type === 'change_tutor' && req.new_tutor && (
                      <p className="text-xs text-gray-500">
                        Ke: {req.new_tutor.full_name}
                        {req.status === 'pending' && (
                          req.new_tutor_confirmed === true
                            ? <span className="text-green-600"> · sudah konfirmasi bersedia</span>
                            : <span className="text-amber-600"> · menunggu konfirmasi tutor pengganti</span>
                        )}
                      </p>
                    )}
                    {req.request_type === 'change_subject' && req.new_subject && (
                      <p className="text-xs text-gray-500">Ke: {req.new_subject.name}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-2 bg-white rounded-lg px-3 py-2">{req.reason}</p>
                    {req.admin_note && (
                      <p className="text-xs text-gray-500 mt-1">Catatan admin: {req.admin_note}</p>
                    )}
                    <Link
                      href={`/admin/sessions/${req.session_id}`}
                      className="inline-block text-xs text-blue-600 hover:underline mt-2"
                    >
                      Lihat sesi →
                    </Link>
                  </div>
                  {req.status === 'pending' && (req.request_type !== 'change_tutor' || req.new_tutor_confirmed === true) && (
                    <RequestActions requestId={req.id} />
                  )}
                </div>
              </div>
            ))}
            {hasMore && (
              <Link
                href={`/admin/session-requests?status=${statusFilter}&all=1`}
                className="block text-center text-sm text-blue-600 hover:underline py-2"
              >
                Lihat semua
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

async function renderTodaySegment(admin: ReturnType<typeof createAdminClient>) {
  const today = todayWib()
  const dateLabel = formatDateLabel(today)
  const tutorGroups = await getTutorGroupsForDate(admin, today)
  const message = buildDailyMessageText(dateLabel, tutorGroups)
  const totalSessions = tutorGroups.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-0">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Jadwal Hari Ini</h2>
        <a
          href={buildWhatsappShareUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Bagikan ke WhatsApp
        </a>
      </div>

      <div className="p-5 pt-3">
        <p className="text-sm font-semibold text-gray-900">{dateLabel}</p>
        <p className="text-xs text-gray-500 mb-4">{totalSessions} sesi terjadwal hari ini</p>

        {tutorGroups.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Tidak ada sesi terjadwal hari ini.</p>
        ) : (
          <div className="space-y-4">
            {tutorGroups.map(group => (
              <div key={group.tutorId}>
                <p className="text-sm font-semibold text-gray-900 mb-1.5">{group.tutorName}</p>
                <div className="space-y-1">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-900 w-12 shrink-0">{item.time}</span>
                      <span>{item.className}</span>
                      {item.subjectName && <span className="text-gray-400">· {item.subjectName}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
