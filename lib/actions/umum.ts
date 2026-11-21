'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { COOKIE_KODE } from '@/lib/umum'

/** Masuk dengan kode peserta: kode benar -> cookie httpOnly 30 hari, lalu ke beranda umum. */
export async function masukDenganKode(formData: FormData): Promise<void> {
  const kode = String(formData.get('kode') ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (!kode) redirect('/login?tab=umum&galat=1')
  const supabase = await createClient()
  const { data: nama } = await supabase.rpc('masuk_peserta', { p_kode: kode })
  if (!nama) redirect('/login?tab=umum&galat=1')
  ;(await cookies()).set(COOKIE_KODE, kode, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  redirect('/umum')
}

export async function keluarUmum(): Promise<void> {
  ;(await cookies()).delete(COOKIE_KODE)
  redirect('/login?tab=umum')
}
