'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type HolidayKind = 'nasional' | 'cuti_bersama' | 'internal'

export const HOLIDAY_KINDS: { value: HolidayKind; label: string }[] = [
  { value: 'nasional', label: 'Libur Nasional' },
  { value: 'cuti_bersama', label: 'Cuti Bersama' },
  { value: 'internal', label: 'Libur Bimbel' },
]

export type Holiday = {
  id: string
  holiday_date: string
  name: string
  kind: HolidayKind
  notes: string | null
}

/** Sesi yang jatuh di tanggal libur dan belum dibatalkan. */
export type ClashingSession = {
  id: string
  scheduled_at: string
  className: string
  tutorName: string
}

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { admin, userId: user.id }
}

function revalidateAll() {
  revalidatePath('/admin/libur')
  revalidatePath('/admin/sessions')
  revalidatePath('/admin/classes', 'layout')
  revalidatePath('/admin')
}

/**
 * Batas hari dalam UTC untuk sebuah tanggal WIB.
 *
 * `scheduled_at` disimpan UTC sementara tanggalnya dibaca dalam WIB (UTC+7),
 * pola yang sama dengan wibDayRangeUtc di lib/daily-message.ts. Tanpa geseran
 * ini, sesi jam 07:00 WIB tidak akan terdeteksi bentrok dengan liburnya
 * sendiri — ia jatuh di tanggal UTC sebelumnya.
 */
function wibDayRangeUtc(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  return {
    start: new Date(Date.UTC(y, m - 1, d, -7)).toISOString(),
    end: new Date(Date.UTC(y, m - 1, d + 1, -7)).toISOString(),
  }
}

/** Sesi aktif yang bentrok dengan sebuah tanggal — dipakai sebelum membatalkan. */
export async function getClashingSessions(day: string): Promise<ClashingSession[]> {
  const ctx = await verifyAdmin()
  if (!ctx) return []

  const { start, end } = wibDayRangeUtc(day)
  const { data } = await ctx.admin
    .from('sessions')
    .select('id, scheduled_at, classes(name), profiles!tutor_id(full_name)')
    .neq('status', 'cancelled')
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .order('scheduled_at') as unknown as {
      data: { id: string; scheduled_at: string; classes: { name: string } | null; profiles: { full_name: string } | null }[] | null
    }

  return (data ?? []).map(s => ({
    id: s.id,
    scheduled_at: s.scheduled_at,
    className: s.classes?.name ?? '—',
    tutorName: s.profiles?.full_name ?? '—',
  }))
}

export async function createHoliday(input: {
  holiday_date: string
  name: string
  kind: HolidayKind
  notes?: string | null
}): Promise<{ error: string } | { id: string }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.holiday_date)) return { error: 'Tanggal tidak valid' }
  if (!input.name.trim()) return { error: 'Keterangan libur wajib diisi' }

  const { data, error } = await ctx.admin
    .from('holidays')
    .insert({
      holiday_date: input.holiday_date,
      name: input.name.trim(),
      kind: input.kind,
      notes: input.notes?.trim() || null,
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.code === '23505' ? 'Tanggal itu sudah ada di kalender libur' : error.message }
  }

  revalidateAll()
  return { id: data.id }
}

export async function updateHoliday(
  id: string,
  input: { name: string; kind: HolidayKind; notes?: string | null },
): Promise<{ error: string } | null> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  if (!input.name.trim()) return { error: 'Keterangan libur wajib diisi' }

  const { error } = await ctx.admin
    .from('holidays')
    .update({ name: input.name.trim(), kind: input.kind, notes: input.notes?.trim() || null })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidateAll()
  return null
}

export async function deleteHoliday(id: string): Promise<{ error: string } | null> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  // Sesi yang sudah terlanjur dibatalkan TIDAK dihidupkan kembali. Menghapus
  // tanggal libur bisa berarti banyak hal — salah ketik, atau jadwal berubah —
  // dan menjadwalkan ulang sesi adalah keputusan yang perlu dilihat orangnya,
  // bukan efek samping dari menghapus satu baris.
  const { error } = await ctx.admin.from('holidays').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidateAll()
  return null
}

/**
 * Membatalkan seluruh sesi aktif yang jatuh di tanggal libur.
 *
 * Alasannya diisi otomatis dengan nama liburnya, sehingga di detail kelas
 * terbaca "Libur nasional — Proklamasi Kemerdekaan", bukan sekadar batal tanpa
 * keterangan.
 *
 * Dipisahkan dari createHoliday() dan tidak pernah berjalan sendiri: mencatat
 * tanggal libur dan membatalkan kelas orang adalah dua keputusan berbeda.
 * Tanggal libur bisa saja dicatat untuk semester depan, jauh sebelum jadwalnya
 * final, dan sesi kelas grup yang dibatalkan tetap mengurangi gaji tutor
 * meskipun tagihan siswanya tidak berubah.
 */
export async function cancelSessionsOnHoliday(
  id: string,
): Promise<{ error: string } | { cancelled: number }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: holiday } = await ctx.admin
    .from('holidays')
    .select('holiday_date, name, kind')
    .eq('id', id)
    .single() as { data: { holiday_date: string; name: string; kind: HolidayKind } | null }

  if (!holiday) return { error: 'Tanggal libur tidak ditemukan' }

  const { start, end } = wibDayRangeUtc(holiday.holiday_date)
  const { data: clashing } = await ctx.admin
    .from('sessions')
    .select('id')
    .neq('status', 'cancelled')
    .gte('scheduled_at', start)
    .lt('scheduled_at', end) as { data: { id: string }[] | null }

  const ids = (clashing ?? []).map(s => s.id)
  if (ids.length === 0) return { cancelled: 0 }

  const label = HOLIDAY_KINDS.find(k => k.value === holiday.kind)?.label ?? 'Libur'
  const { error } = await ctx.admin
    .from('sessions')
    .update({
      status: 'cancelled',
      cancellation_reason: `${label} — ${holiday.name}`,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids)

  if (error) return { error: error.message }

  revalidateAll()
  return { cancelled: ids.length }
}
