'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

/**
 * Aksi admin untuk langganan SORA/GAMA.
 *
 * Dicetak dari `lib/actions/admin/practice-access.ts` — pola yang sudah
 * menjawab persoalan yang sama, yaitu memberi dan mencabut akses. Termasuk
 * kebiasaan yang di tempat lain akan disebut duplikasi: `verifyAdmin()` disalin
 * seperti di ~20 berkas lain di direktori ini. Menyatukannya adalah perubahan
 * yang menyentuh semuanya sekaligus, dan itu bukan urusan pekerjaan ini.
 *
 * Pembayaran masih manual — transfer lalu admin mengaktifkan. Semua penulisan
 * lewat service role: pelanggan tidak punya jalur tulis apa pun ke tabel
 * `subscriptions`, dan nanti webhook gateway masuk lewat pintu yang sama
 * dengan menulis `method = 'gateway'`.
 */

export type ActionState = { error: string } | null

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

const PRODUK = ['sora', 'gama']

function tambahBulan(dari: Date, bulan: number): string {
  const d = new Date(dari)
  d.setMonth(d.getMonth() + bulan)
  return d.toISOString()
}

/**
 * Mengaktifkan langganan sesudah transfernya diterima.
 *
 * Indeks unik parsial `subscriptions_one_active` menolak baris aktif kedua
 * untuk produk yang sama, jadi klik ganda tidak menghasilkan dua langganan yang
 * saling menimpa — ia gagal, dan kegagalan yang terlihat lebih baik daripada
 * dua baris yang membuat "kapan habisnya" tak punya jawaban tunggal.
 */
export async function activateSubscription(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const profileId = (formData.get('profile_id') as string)?.trim()
  const product = (formData.get('product') as string)?.trim()
  const bulan = Number(formData.get('bulan'))
  const reference = (formData.get('reference') as string)?.trim() || null
  const amountRaw = (formData.get('amount') as string)?.trim()
  const note = (formData.get('note') as string)?.trim() || null

  if (!profileId) return { error: 'Akun wajib dipilih' }
  if (!PRODUK.includes(product)) return { error: 'Produk tidak valid' }
  if (!Number.isInteger(bulan) || bulan < 1 || bulan > 24) {
    return { error: 'Lama langganan 1–24 bulan' }
  }

  const { data: profile } = await ctx.admin
    .from('profiles')
    .select('role')
    .eq('id', profileId)
    .single()
  if (!profile) return { error: 'Akun tidak ditemukan' }
  // Sengaja dibatasi ke `mandiri`: murid bimbel sudah berhak atas seluruh bank
  // soal lewat jalur keluarga, dan memberinya langganan hanya akan membuat dua
  // sumber hak untuk satu orang.
  if (profile.role !== 'mandiri') {
    return { error: 'Hanya akun langganan yang bisa diaktifkan di sini' }
  }

  const sekarang = new Date()
  const { error } = await ctx.admin.from('subscriptions').insert({
    profile_id: profileId,
    product,
    status: 'active',
    starts_at: sekarang.toISOString(),
    ends_at: tambahBulan(sekarang, bulan),
    method: 'transfer',
    reference,
    amount: amountRaw ? Number(amountRaw) : null,
    note,
    activated_by: ctx.user.id,
    activated_at: sekarang.toISOString(),
  })
  if (error) return { error: error.message }

  revalidatePath('/admin/subscriptions')
  return null
}

/**
 * Perpanjangan menambah BARIS BARU, bukan menggeser tanggal baris lama.
 *
 * Riwayatnya jadi bisa dibaca — kapan diperpanjang, oleh siapa, dengan rujukan
 * transfer mana — dan bentuk penulisannya sama persis dengan yang nanti dipakai
 * webhook pembayaran. Baris lama ditutup lebih dulu supaya indeks unik parsial
 * tidak menolak yang baru.
 *
 * Mulainya dari `ends_at` lama kalau masih di depan: memperpanjang lebih awal
 * tidak boleh memotong sisa hari yang sudah dibayar.
 */
export async function extendSubscription(id: string, bulan: number): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  if (!Number.isInteger(bulan) || bulan < 1 || bulan > 24) {
    return { error: 'Lama perpanjangan 1–24 bulan' }
  }

  const { data: lama } = await ctx.admin
    .from('subscriptions')
    .select('profile_id, product, ends_at, method, amount')
    .eq('id', id)
    .single()
  if (!lama) return { error: 'Langganan tidak ditemukan' }

  const sekarang = new Date()
  const akhirLama = lama.ends_at ? new Date(lama.ends_at as string) : null
  const mulai = akhirLama && akhirLama > sekarang ? akhirLama : sekarang

  const { error: errTutup } = await ctx.admin
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('id', id)
  if (errTutup) return { error: errTutup.message }

  const { error } = await ctx.admin.from('subscriptions').insert({
    profile_id: lama.profile_id,
    product: lama.product,
    status: 'active',
    starts_at: mulai.toISOString(),
    ends_at: tambahBulan(mulai, bulan),
    method: lama.method,
    amount: lama.amount,
    activated_by: ctx.user.id,
    activated_at: sekarang.toISOString(),
  })
  if (error) return { error: error.message }

  revalidatePath('/admin/subscriptions')
  return null
}

/**
 * Menghentikan tanpa menghapus, seperti `revokeCode()` menyimpan learner-nya:
 * riwayat pembayaran adalah catatan yang tidak boleh hilang hanya karena
 * langganannya berakhir.
 */
export async function stopSubscription(id: string, alasan?: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('subscriptions')
    .update({ status: 'stopped', note: alasan?.trim() || null })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/subscriptions')
  return null
}

/**
 * Membuat akun langganan dari sisi admin.
 *
 * Ada dua alasan ia tetap perlu meski pendaftaran mandiri nanti dibuka: ia yang
 * memungkinkan SELURUH jalur diuji sebelum pendaftaran diaktifkan — tanpa itu,
 * penguji pertamanya adalah orang asing — dan ia tetap terpakai untuk yang
 * mendaftar langsung di tempat.
 *
 * Role-nya ditulis eksplisit ke `profiles` sesudah akun dibuat, sama seperti
 * `createUser()` di `lib/actions/admin/users.ts`. Sejak migrasi 108, trigger
 * `handle_new_user` tidak lagi membaca role dari metadata sama sekali —
 * metadata di bawah cuma membawa namanya.
 */
export async function createMandiriAccount(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const fullName = (formData.get('full_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!fullName) return { error: 'Nama wajib diisi' }
  if (!email) return { error: 'Email wajib diisi' }
  if (!password || password.length < 8) return { error: 'Password minimal 8 karakter' }

  const { data: authData, error: authError } = await ctx.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (authError) return { error: authError.message }

  const { error } = await ctx.admin
    .from('profiles')
    .update({ role: 'mandiri', updated_at: new Date().toISOString() })
    .eq('id', authData.user.id)
  if (error) return { error: error.message }

  revalidatePath('/admin/subscriptions')
  return null
}
