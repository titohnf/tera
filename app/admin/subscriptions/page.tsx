import { createAdminClient } from '@/lib/supabase/server-admin'
import LanggananManager, {
  type AkunRow,
  type LanggananRow,
} from '@/components/admin/subscriptions/LanggananManager'

export const metadata = { title: 'Langganan' }

/**
 * Kelola langganan SORA/GAMA untuk akun di luar bimbel.
 *
 * Bacanya lewat service role, konsisten dengan seluruh halaman admin lain.
 * Yang menahan orang lain masuk ke sini adalah `app/admin/layout.tsx`, dan
 * setiap aksinya memeriksa ulang sendiri lewat `verifyAdmin()` — server action
 * bisa dipanggil tanpa melewati halamannya.
 *
 * "Menunggu aktivasi" bukan status yang ditulis siapa pun: ia adalah akun
 * ber-role `mandiri` yang belum punya baris langganan aktif. Itu memang antrean
 * yang benar — orang yang sudah mendaftar dan (mungkin) sudah transfer, tapi
 * belum diaktifkan. Menyimpannya sebagai status tersendiri berarti ada dua
 * tempat yang bisa tidak sinkron.
 */
export default async function SubscriptionsPage() {
  const admin = createAdminClient()

  const [{ data: akun }, { data: langganan }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'mandiri')
      .order('created_at', { ascending: false }),
    admin
      .from('subscriptions')
      .select('id, profile_id, product, status, starts_at, ends_at, amount, reference, note, created_at')
      .order('created_at', { ascending: false }),
  ])

  const akunRows: AkunRow[] = (akun ?? []).map((a) => ({
    id: a.id as string,
    full_name: a.full_name as string,
    email: (a.email as string | null) ?? '',
    created_at: a.created_at as string,
  }))

  const barisRows: LanggananRow[] = (langganan ?? []).map((s) => ({
    id: s.id as string,
    profile_id: s.profile_id as string,
    product: s.product as string,
    status: s.status as string,
    starts_at: s.starts_at as string | null,
    ends_at: s.ends_at as string | null,
    amount: s.amount === null ? null : Number(s.amount),
    reference: s.reference as string | null,
    note: s.note as string | null,
  }))

  return <LanggananManager akun={akunRows} langganan={barisRows} />
}
