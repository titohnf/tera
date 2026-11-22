'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { COOKIE_KODE } from '@/lib/umum'
import { catatSalah, terlaluBanyakSalah } from '@/lib/tryout/batas-kode'

/**
 * Membuka sesi akun sungguhan untuk pemilik kode yang SUDAH punya akun, tanpa email dan password.
 *
 * Siswa bimbel: kodenya milik anak (`learners.profile_id` = profil siswa), dan siswa tidak login
 * sendiri; yang login adalah akun keluarga yang tertaut padanya (`family_students`). Jadi kode
 * membuka sesi akun keluarga itu, dan tampilannya sama persis dengan masuk lewat email. Pelanggan
 * mandiri membuka akunnya sendiri. Sesinya dibuat dari tautan masuk sekali pakai (`generateLink`
 * dan `verifyOtp` di server; tidak ada email yang dikirim). Mengembalikan alamat tujuan, atau
 * null bila kode ini bukan milik orang yang punya akun.
 */
async function masukSebagaiAkunSekali(kode: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data: l } = await admin.from('learners').select('profile_id').eq('access_code', kode).maybeSingle()
  const profilId = (l as { profile_id: string | null } | null)?.profile_id
  if (!profilId) return null
  const { data: profil } = await admin.from('profiles').select('role').eq('id', profilId).single()
  const peran = (profil as { role: string } | null)?.role

  let akunId: string | null = null
  let tujuan: string | null = null
  if (peran === 'student') {
    const { data: keluarga } = await admin.from('family_students').select('family_id').eq('student_id', profilId).order('created_at').limit(1)
    akunId = (keluarga as { family_id: string }[] | null)?.[0]?.family_id ?? null
    tujuan = `/siswa/${profilId}`
  } else if (peran === 'mandiri') {
    akunId = profilId
    tujuan = '/mandiri'
  }
  if (!akunId || !tujuan) return null

  const { data: pengguna } = await admin.auth.admin.getUserById(akunId)
  const email = pengguna?.user?.email
  if (!email) return null
  const { data: tautan, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const hash = tautan?.properties?.hashed_token
  if (error || !hash) return null
  const supabase = await createClient()
  const { error: galatMasuk } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: hash })
  if (galatMasuk) return null
  return tujuan
}

/**
 * Satu percobaan membuka sesi akun, diulang bila gagal. Puluhan anak mengetik kode pada detik yang
 * sama, dan tiap masuk memanggil layanan auth beberapa kali (tautan, verifikasi); satu panggilan
 * yang lambat atau ditolak sebentar tidak boleh membuat anak melihat layar galat. Galat apa pun
 * dianggap "belum berhasil" lalu diulang; sesudah tiga kali, pemilik kode masuk lewat cookie kode.
 */
async function masukSebagaiAkun(kode: string): Promise<string | null> {
  for (let percobaan = 0; percobaan < 3; percobaan++) {
    try {
      const tujuan = await masukSebagaiAkunSekali(kode)
      if (tujuan) return tujuan
    } catch (e) {
      console.error('masukSebagaiAkun gagal', percobaan + 1, e instanceof Error ? e.message : e)
    }
    if (percobaan < 2) await new Promise((r) => setTimeout(r, 300 * (percobaan + 1) + Math.random() * 400))
  }
  return null
}

const opsiCookieKode = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}

/**
 * Masuk dengan kode peserta. Siswa bimbel (kodenya milik siswa yang tertaut akun keluarga) dimasukkan
 * ke akun keluarganya dan mendarat di berandanya, tempat SEMUA kartu terbuka (Belajar, Laporan, Jadwal,
 * Try Out, Tagihan). Siswa mandiri ke /mandiri. Peserta dari luar bimbel, yang belum punya akun,
 * mendapat cookie httpOnly 30 hari dan beranda peserta kode (`/umum`). Bila sesi akun gagal dibuat,
 * pemilik kode tetap masuk lewat cookie kode (Try Out saja).
 */
export async function masukDenganKode(formData: FormData): Promise<void> {
  const kode = String(formData.get('kode') ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (!kode) redirect('/login?tab=kode&galat=1')
  if (await terlaluBanyakSalah()) redirect('/login?tab=kode&galat=2')
  const supabase = await createClient()
  let nama: unknown = null
  for (let percobaan = 0; percobaan < 3 && !nama; percobaan++) {
    const { data, error } = await supabase.rpc('masuk_peserta', { p_kode: kode })
    nama = data
    if (!error) break // jawaban sah (nama atau tidak dikenal); hanya galat jaringan yang diulang
    await new Promise((r) => setTimeout(r, 300 * (percobaan + 1)))
  }
  if (!nama) {
    await catatSalah()
    redirect('/login?tab=kode&galat=1')
  }
  // Cookie kode disimpan di kedua jalur. Sora memakainya untuk melewati layar "Selamat Datang" dan
  // untuk tombol Kembali ke Beranda Try Out; tanpanya anak yang masuk lewat akun keluarga bisa
  // jatuh ke layar masuk Sora yang lama setelah selesai mengerjakan satu mata pelajaran.
  ;(await cookies()).set(COOKIE_KODE, kode, opsiCookieKode)
  const tujuanAkun = await masukSebagaiAkun(kode)
  if (tujuanAkun) redirect(tujuanAkun)
  redirect('/umum')
}

export async function keluarUmum(): Promise<void> {
  ;(await cookies()).delete(COOKIE_KODE)
  redirect('/login?tab=kode')
}

/**
 * Menambahkan email dan password pada peserta umum yang masuk dengan kode.
 *
 * Orangnya sama: baris `learners` yang sudah punya kode ditautkan ke akun baru
 * (`tautkan_peserta_ke_siswa`, migrasi 228), jadi seluruh riwayat try out ikut
 * dan kodenya tetap berlaku. Akun dibuat lewat API admin (peran `mandiri`, email
 * langsung terverifikasi) — pendaftaran mandiri di dasbor Supabase tidak perlu
 * dibuka. Yang berhak adalah pemegang kode: cookie `kode_peserta` diperiksa
 * ulang di sini, bukan dipercaya dari formulir.
 */
export async function buatAkunDariKode(formData: FormData): Promise<void> {
  const kode = (await cookies()).get(COOKIE_KODE)?.value
  if (!kode) redirect('/login?tab=kode')

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const ulang = String(formData.get('ulang') ?? '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect('/umum/akun?galat=email')
  if (password.length < 8) redirect('/umum/akun?galat=pendek')
  if (password !== ulang) redirect('/umum/akun?galat=beda')

  const admin = createAdminClient()
  const { data: learner } = await admin.from('learners').select('id, name, profile_id').eq('access_code', kode).maybeSingle()
  if (!learner) redirect('/login?tab=kode&galat=1')
  if ((learner as { profile_id: string | null }).profile_id) redirect('/umum/akun?galat=sudah')

  const { data: baru, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: (learner as { name: string }).name, role: 'mandiri' },
  })
  if (error || !baru.user) redirect('/umum/akun?galat=terpakai')

  const { error: galatTaut } = await admin.rpc('tautkan_peserta_ke_siswa', {
    p_learner: (learner as { id: string }).id,
    p_profile: baru.user.id,
  })
  if (galatTaut) {
    // Jangan tinggalkan akun yatim yang menghalangi email ini dipakai lagi.
    await admin.auth.admin.deleteUser(baru.user.id)
    redirect('/umum/akun?galat=gagal')
  }

  ;(await cookies()).delete(COOKIE_KODE)
  redirect('/login?info=akun')
}
