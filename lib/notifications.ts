import { createAdminClient } from '@/lib/supabase/server-admin'
import { daftarEskalasi } from '@/lib/pengukuran/tutor'
import type { NotificationItem } from '@/components/layout/HeaderNotifications'

const REQUEST_LABEL: Record<string, string> = {
  cancel: 'Pembatalan Sesi',
  reschedule: 'Reschedule Sesi',
  change_tutor: 'Ganti Tutor',
}

function classSubjectLabel(classes: { name: string } | null, subjects: { name: string } | null): string {
  const className = classes?.name ?? 'Kelas'
  return subjects?.name ? `${className} — ${subjects.name}` : className
}

export async function getTutorNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = createAdminClient()

  const [{ data: swapRequestsRaw }, { data: resolvedNoticesRaw }, { data: swapOutcomeRaw }] = await Promise.all([
    supabase
      .from('session_change_requests')
      .select('id, session_id, created_at, sessions(classes(name), subjects(name)), requester:profiles!requested_by(full_name)')
      .eq('new_tutor_id', userId)
      .eq('status', 'pending')
      .is('new_tutor_confirmed', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('session_change_requests')
      .select('id, session_id, request_type, status, reviewed_at, created_at, sessions(classes(name), subjects(name))')
      .eq('requested_by', userId)
      .in('status', ['approved', 'rejected'])
      .is('acknowledged_at', null)
      .order('reviewed_at', { ascending: true }),
    supabase
      .from('session_change_requests')
      .select('id, session_id, status, reviewed_at, created_at, sessions(classes(name), subjects(name))')
      .eq('new_tutor_id', userId)
      .in('status', ['approved', 'rejected'])
      .eq('new_tutor_confirmed', true)
      .not('reviewed_by', 'is', null)
      .is('new_tutor_acknowledged_at', null)
      .order('reviewed_at', { ascending: true }),
  ])

  const items: NotificationItem[] = []

  for (const r of (swapRequestsRaw ?? []) as unknown as {
    id: string; session_id: string; created_at: string
    sessions: { classes: { name: string } | null; subjects: { name: string } | null } | null
    requester: { full_name: string } | null
  }[]) {
    items.push({
      id: `swap-${r.id}`,
      title: `${r.requester?.full_name ?? 'Tutor lain'} mengajukan agar kamu menggantikan sesi`,
      subtitle: classSubjectLabel(r.sessions?.classes ?? null, r.sessions?.subjects ?? null),
      createdAt: r.created_at,
      href: `/tutor/sessions/${r.session_id}`,
    })
  }

  for (const r of (resolvedNoticesRaw ?? []) as unknown as {
    id: string; session_id: string; created_at: string; reviewed_at: string | null
    request_type: 'cancel' | 'reschedule' | 'change_tutor'; status: 'approved' | 'rejected'
    sessions: { classes: { name: string } | null; subjects: { name: string } | null } | null
  }[]) {
    items.push({
      id: `resolved-${r.id}`,
      title: `Pengajuan ${REQUEST_LABEL[r.request_type]} ${r.status === 'approved' ? 'disetujui' : 'ditolak'}`,
      subtitle: classSubjectLabel(r.sessions?.classes ?? null, r.sessions?.subjects ?? null),
      createdAt: r.reviewed_at ?? r.created_at,
      href: `/tutor/sessions/${r.session_id}`,
    })
  }

  for (const r of (swapOutcomeRaw ?? []) as unknown as {
    id: string; session_id: string; status: 'approved' | 'rejected'; created_at: string; reviewed_at: string | null
    sessions: { classes: { name: string } | null; subjects: { name: string } | null } | null
  }[]) {
    items.push({
      id: `swap-outcome-${r.id}`,
      title: r.status === 'approved'
        ? 'Admin menyetujui pengajuan ganti tutor yang sebelumnya kamu setujui'
        : 'Admin menolak pengajuan ganti tutor yang sebelumnya kamu setujui',
      subtitle: classSubjectLabel(r.sessions?.classes ?? null, r.sessions?.subjects ?? null),
      createdAt: r.reviewed_at ?? r.created_at,
      href: `/tutor/sessions/${r.session_id}`,
    })
  }

  // Eskalasi pengukuran (PRD FR7).
  //
  // Sampai di sini, eskalasi cuma jejak: `notifikasi_eskalasi` lahir sendiri
  // saat putaran pertama paket kedua berturut-turut selesai di bawah ambang,
  // dan `waktu_notifikasi_terkirim` diisi `now()` saat itu juga — artinya jam
  // SLA 24 jam kerja mulai berdetak. Tanpa baris di bawah ini, satu-satunya
  // cara tutor tahu adalah membuka `/tutor/pengukuran` atas inisiatif sendiri,
  // dan ia bisa berstatus `terlambat` tanpa pernah dikabari. Lonceng inilah
  // "kanal yang disepakati" di FR7; ia dipilih karena sudah berdiri, sehingga
  // tidak ada layanan luar yang harus dipercaya membawa data anak.
  //
  // LEWAT RPC, BUKAN KUERI LANGSUNG. Fungsi lain di berkas ini memakai klien
  // admin dan menyaring sendiri dengan `.eq(...)`; di sini tidak boleh —
  // `learners` tertutup bagi tutor, dan menyatukannya dengan nama murid adalah
  // persis pekerjaan `tutor_eskalasi` yang gerbangnya sudah ditulis di migrasi
  // 150. Memakai klien admin di sini berarti menulis ulang gerbang itu dengan
  // tangan, di tempat yang tidak akan ikut berubah kalau gerbangnya berubah.
  // Konsekuensinya `userId` tidak dipakai untuk bagian ini: yang menentukan
  // adalah `auth.uid()` milik sesi yang sedang berjalan, dan di layar ini
  // keduanya orang yang sama.
  //
  // Untuk admin, `tutor_eskalasi` mengembalikan SELURUH eskalasi terbuka —
  // sesuai kontraknya, karena admin memang penanggung jawab terakhir semuanya.
  for (const e of await daftarEskalasi(true)) {
    items.push({
      id: `eskalasi-${e.id}`,
      // Tanpa angka. Yang perlu dibawa lonceng adalah "siapa" dan "sekarang";
      // skor Putaran 1 dan ambangnya ada di halaman tujuannya, di layar yang
      // memang bergerbang untuk itu.
      title: `${e.nama} perlu didampingi${e.statusSla === 'terlambat' ? ' — sudah lewat batas respons' : ''}`,
      subtitle: e.labelPemicu
        ? `Dua paket berturut di bawah ambang: ${e.labelPemicu}`
        : 'Dua paket berturut di bawah ambang',
      createdAt: e.waktuTerkirim,
      href: `/tutor/pengukuran/${e.learnerId}`,
    })
  }

  return items
}

export async function getAdminNotifications(): Promise<NotificationItem[]> {
  const supabase = createAdminClient()

  // A change_tutor request isn't actionable by admin until the proposed
  // tutor has confirmed — cancel/reschedule requests have no such step and
  // are always actionable once pending.
  const { data } = await supabase
    .from('session_change_requests')
    .select('id, request_type, created_at, sessions(classes(name), subjects(name)), requester:profiles!requested_by(full_name)')
    .eq('status', 'pending')
    .or('request_type.neq.change_tutor,new_tutor_confirmed.eq.true')
    .order('created_at', { ascending: true })
    .limit(20)

  return ((data ?? []) as unknown as {
    id: string; request_type: 'cancel' | 'reschedule' | 'change_tutor'; created_at: string
    sessions: { classes: { name: string } | null; subjects: { name: string } | null } | null
    requester: { full_name: string } | null
  }[]).map(r => ({
    id: r.id,
    title: `${r.requester?.full_name ?? 'Tutor'} mengajukan ${REQUEST_LABEL[r.request_type]}`,
    subtitle: classSubjectLabel(r.sessions?.classes ?? null, r.sessions?.subjects ?? null),
    createdAt: r.created_at,
    href: '/admin/session-requests?status=pending',
  }))
}
