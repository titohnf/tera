import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'

type RecentSession = {
  id: string
  scheduled_at: string
  topic: string | null
  status: string
  classes: { name: string } | null
  profiles: { full_name: string } | null
}

export default async function AdminDashboard() {
  const admin = createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: tutorCount },
    { count: studentCount },
    { count: activeClassCount },
    { count: sessionCount },
    { data: pendingPayments },
    { data: recentSessions },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    admin.from('classes').select('*', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('sessions').select('*', { count: 'exact', head: true })
      .eq('status', 'completed').gte('scheduled_at', startOfMonth),
    admin.from('session_payments').select('total_amount').eq('status', 'pending'),
    admin.from('sessions')
      .select('id, scheduled_at, topic, status, classes(name), profiles!tutor_id(full_name)')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(5) as unknown as Promise<{ data: RecentSession[] | null }>,
  ])

  const totalPending = (pendingPayments ?? []).reduce((sum, p) => sum + p.total_amount, 0)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Admin</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Tutor" value={String(tutorCount ?? 0)} sub="tutor terdaftar" color="blue" />
        <StatCard label="Total Siswa" value={String(studentCount ?? 0)} sub="siswa terdaftar" color="blue" />
        <StatCard label="Kelas Aktif" value={String(activeClassCount ?? 0)} sub="kelas berjalan" color="green" />
        <StatCard label="Sesi Selesai" value={String(sessionCount ?? 0)} sub="bulan ini" color="yellow" />
        <StatCard label="Tagihan Pending" value={formatRupiah(totalPending)} sub="belum dibayar ke tutor" color="red" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Sesi Terbaru</h2>
          <Link href="/admin/classes" className="text-xs text-blue-600 hover:underline">Kelola kelas</Link>
        </div>

        {!recentSessions || recentSessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 text-center text-sm text-gray-500">
            Belum ada sesi yang selesai.
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map(session => {
              const date = new Date(session.scheduled_at)
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-4 py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.classes?.name ?? 'Kelas'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {session.topic ?? 'Topik belum ditentukan'} &bull; {session.profiles?.full_name ?? ''}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string
  color: 'blue' | 'green' | 'yellow' | 'red'
}) {
  const dots: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  }
  const valueColors: Record<string, string> = {
    blue: 'text-blue-600',
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    yellow: 'text-amber-600',
    red: 'text-red-600',
  }
  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dots[color]}`} />
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueColors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}
