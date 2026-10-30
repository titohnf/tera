#!/usr/bin/env node
/**
 * Mengganti password awal akun keluarga yang BELUM PERNAH login dengan password
 * default (PASSWORD_DEFAULT_RESET).
 *
 * Latar belakang: 18 akun keluarga dibuat sekaligus oleh skrip pemindahan
 * (migrasi 076) dengan password acak yang panjang dan sulit diketik. Yang belum
 * pernah login tidak punya alasan memakai password itu — mereka butuh kredensial
 * yang mudah disampaikan lewat WhatsApp.
 *
 * Sengaja HANYA akun yang belum pernah login. Akun yang sudah pernah masuk sedang
 * dipakai (atau sudah diganti pemiliknya sendiri); menimpanya membuat mereka
 * mendadak tidak bisa masuk. Untuk satu akun tertentu pakai tombol "Reset Password
 * ke Default" di halaman edit siswa.
 *
 * Pakai:
 *   node scripts/reset-password-keluarga-belum-login.mjs             # simulasi
 *   PASSWORD_DEFAULT_RESET='...' node scripts/reset-password-keluarga-belum-login.mjs --jalankan
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

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
const samarkan = e => (e || '').replace(/^(.{2}).*(@.*)$/, '$1***$2')

if (jalankan && (!passwordDefault || passwordDefault.length < 6)) {
  console.error('PASSWORD_DEFAULT_RESET belum diatur (minimal 6 karakter).')
  process.exit(1)
}

const { data: profil } = await sb.from('profiles').select('id, full_name, email').eq('role', 'parent')
const { data: tautan } = await sb.from('family_students').select('family_id')
const punyaAnak = new Set((tautan ?? []).map(t => t.family_id))
const {
  data: { users },
} = await sb.auth.admin.listUsers({ perPage: 1000 })
const akun = new Map(users.map(u => [u.id, u]))

const target = (profil ?? []).filter(p => punyaAnak.has(p.id) && !akun.get(p.id)?.last_sign_in_at)
const sudahLogin = (profil ?? []).filter(p => punyaAnak.has(p.id) && akun.get(p.id)?.last_sign_in_at).length

console.log(jalankan ? 'MODE: JALANKAN (mengubah password)' : 'MODE: SIMULASI (tidak mengubah apa pun)')
console.log(`Akun keluarga belum pernah login: ${target.length} (dilewati karena sudah pernah login: ${sudahLogin})\n`)

let berhasil = 0
for (const p of target) {
  console.log(`- ${p.full_name} | ${samarkan(p.email)}`)
  if (!jalankan) continue
  const { error } = await sb.auth.admin.updateUserById(p.id, { password: passwordDefault })
  if (error) console.log(`   GAGAL: ${error.message}`)
  else berhasil++
}
console.log(jalankan ? `\nSelesai: ${berhasil}/${target.length} berhasil.` : '\nSimulasi selesai. Tambahkan --jalankan untuk mengubah password.')
