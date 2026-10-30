#!/usr/bin/env node
/**
 * Menautkan siswa yang belum punya akun orang tua.
 *
 * Latar belakang: sejak migrasi 076 yang bisa login ke portal hanyalah akun
 * `parent`; profil `student` cuma catatan. Siswa yang dibuat lewat form lama
 * hanya mendapat akun `student` (tidak bisa login) tanpa akun orang tua.
 *
 * Untuk tiap siswa yang belum tertaut ke `family_students`, skrip ini:
 *   1. memindahkan email siswa ke email teknis (membebaskan alamat aslinya),
 *   2. membuat akun orang tua dengan email asli itu dan password default
 *      (variabel lingkungan PASSWORD_DEFAULT_RESET), nama = nama orang tua di
 *      profil siswa, telepon = telepon orang tua,
 *   3. menautkan keduanya di `family_students`.
 * Kalau langkah 2 gagal, email siswa dikembalikan seperti semula.
 *
 * Password lama siswa TIDAK bisa dipindahkan (Supabase hanya menyimpan hash-nya),
 * jadi orang tua masuk dengan password default lalu menggantinya sendiri.
 *
 * Pakai:
 *   node scripts/tautkan-keluarga-siswa-lama.mjs              # simulasi, tidak mengubah apa pun
 *   node scripts/tautkan-keluarga-siswa-lama.mjs --jalankan   # benar-benar mengubah
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { randomUUID } from 'crypto'

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
)
const jalankan = process.argv.includes('--jalankan')
const passwordDefault = process.env.PASSWORD_DEFAULT_RESET || env.PASSWORD_DEFAULT_RESET
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const teknis = () => `siswa-${randomUUID().slice(0, 12)}@siswa.bimbeltera.com`
const adalahTeknis = e => /^siswa-[0-9a-f-]+@siswa\.bimbeltera\.com$/i.test(e || '')
const samarkan = e => (e || '').replace(/^(.{2}).*(@.*)$/, '$1***$2')

if (jalankan && (!passwordDefault || passwordDefault.length < 6)) {
  console.error('PASSWORD_DEFAULT_RESET belum diatur (minimal 6 karakter). Isi di .env.local atau di lingkungan perintah ini.')
  process.exit(1)
}

const { data: siswa } = await sb.from('profiles').select('id, full_name, email, parent_name, parent_phone').eq('role', 'student')
const { data: tautan } = await sb.from('family_students').select('student_id')
const tertaut = new Set((tautan ?? []).map(t => t.student_id))
const target = (siswa ?? []).filter(s => !tertaut.has(s.id) && s.email && !adalahTeknis(s.email))

console.log(jalankan ? 'MODE: JALANKAN (mengubah data)' : 'MODE: SIMULASI (tidak mengubah apa pun)')
console.log(`Siswa belum tertaut: ${target.length}\n`)

let berhasil = 0
for (const s of target) {
  const emailAsli = s.email
  const namaOrtu = s.parent_name?.trim() || `Keluarga ${s.full_name}`
  console.log(`- ${s.full_name} | login keluarga: ${samarkan(emailAsli)} | nama akun: ${namaOrtu}`)
  if (!jalankan) continue

  const emailBaru = teknis()
  const { error: e1 } = await sb.auth.admin.updateUserById(s.id, { email: emailBaru, email_confirm: true })
  if (e1) { console.log(`   GAGAL memindahkan email siswa: ${e1.message}`); continue }
  await sb.from('profiles').update({ email: emailBaru }).eq('id', s.id)

  const pulihkan = async () => {
    await sb.auth.admin.updateUserById(s.id, { email: emailAsli, email_confirm: true })
    await sb.from('profiles').update({ email: emailAsli }).eq('id', s.id)
  }

  const { data: baru, error: e2 } = await sb.auth.admin.createUser({
    email: emailAsli,
    password: passwordDefault,
    email_confirm: true,
    user_metadata: { full_name: namaOrtu, role: 'parent' },
  })
  if (e2) { console.log(`   GAGAL membuat akun orang tua: ${e2.message} — email siswa dikembalikan`); await pulihkan(); continue }

  const ubah = { role: 'parent', full_name: namaOrtu, updated_at: new Date().toISOString() }
  if (s.parent_phone) ubah.phone = s.parent_phone
  await sb.from('profiles').update(ubah).eq('id', baru.user.id)

  const { error: e3 } = await sb.from('family_students').insert({ family_id: baru.user.id, student_id: s.id })
  if (e3) {
    console.log(`   GAGAL menautkan: ${e3.message} — membatalkan`)
    await sb.auth.admin.deleteUser(baru.user.id).catch(() => undefined)
    await pulihkan()
    continue
  }
  console.log('   OK: akun orang tua dibuat dan ditautkan')
  berhasil++
}

console.log(jalankan ? `\nSelesai: ${berhasil}/${target.length} berhasil.` : '\nSimulasi selesai. Jalankan lagi dengan --jalankan untuk mengubah data.')
