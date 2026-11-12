import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * Jenis siswa untuk tabel Laporan Belajar.
 *
 * "Yayasan" BUKAN penanda di profil: ia jenis KELAS (`classes.class_type` =
 * `yayasan`, selain `group` dan `private`), jadi seorang siswa disebut siswa
 * yayasan bila keanggotaannya yang aktif hanya di kelas yayasan. Kelas yayasan
 * tidak pernah ditagih (lihat `generateInvoice`), dan itulah pembedanya bagi
 * admin.
 *
 * Yang aktif di kelas yayasan SEKALIGUS di kelas lain dihitung `bimbel`: lewat
 * kelas lainnya ia tetap ditagih seperti siswa bimbel biasa, dan tiap tabel
 * hanya punya satu kolom jenis. Hari ini tidak ada siswa seperti itu.
 *
 * Siswa tanpa keanggotaan aktif juga `bimbel` (bawaan): ia tetap siswa yang
 * terdaftar, hanya sedang tidak punya kelas.
 *
 * Pelanggan langganan (role `mandiri`) tidak lewat sini; tabelnya menandainya
 * dari role.
 */
export type JenisSiswa = 'bimbel' | 'yayasan'

export async function jenisSiswaBanyak(studentIds: string[]): Promise<Map<string, JenisSiswa>> {
  const hasil = new Map<string, JenisSiswa>(studentIds.map(id => [id, 'bimbel']))
  if (studentIds.length === 0) return hasil

  const admin = createAdminClient()
  const punyaYayasan = new Set<string>()
  const punyaLain = new Set<string>()

  for (let i = 0; i < studentIds.length; i += 100) {
    const { data } = await admin
      .from('class_students')
      .select('student_id, classes(class_type, is_active)')
      .eq('is_active', true)
      .in('student_id', studentIds.slice(i, i + 100))

    type Baris = { student_id: string; classes: { class_type: string | null; is_active: boolean | null } | null }
    for (const r of (data as unknown as Baris[] | null) ?? []) {
      // Kelas yang sudah dinonaktifkan tidak menentukan jenis siswanya sekarang.
      if (!r.classes || r.classes.is_active === false) continue
      if (r.classes.class_type === 'yayasan') punyaYayasan.add(r.student_id)
      else punyaLain.add(r.student_id)
    }
  }

  for (const id of punyaYayasan) {
    if (!punyaLain.has(id)) hasil.set(id, 'yayasan')
  }
  return hasil
}
