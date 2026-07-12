import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import RequestActions from '@/components/admin/session-requests/RequestActions'

type RequestRow = {
  id: string
  request_type: 'cancel' | 'reschedule' | 'change_tutor'
  reason: string
  new_scheduled_at: string | null
  new_tutor_id: string | null
  new_tutor_confirmed: boolean | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  session_id: string
  sessions: { scheduled_at: string; classes: { name: string } | null } | null
  requester: { full_name: string } | null
  new_tutor: { full_name: string } | null
}

const REQUEST_LABEL: Record<string, string> = {
  cancel: 'Pembatalan Sesi',
  reschedule: 'Reschedule',
  change_tutor: 'Ganti Tutor',
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

export default async function SessionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusFilter = 'pending' } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('session_change_requests')
    .select(`
      id, request_type, reason, new_scheduled_at, new_tutor_id, new_tutor_confirmed, status, admin_note, created_at, session_id,
      sessions(scheduled_at, classes(name)),
      requester:profiles!requested_by(full_name),
      new_tutor:profiles!new_tutor_id(full_name)
    `)
    .order('created_at', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter)

  const { data: requests } = await query.limit(100) as unknown as { data: RequestRow[] | null }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Pengajuan Perubahan Jadwal</h1>
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

      {!requests || requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Tidak ada pengajuan.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
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
                  <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{req.reason}</p>
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
        </div>
      )}
    </div>
  )
}
