/**
 * Bentuk id topik pengukuran — `D-01`, `A-07`, `AB-12`.
 *
 * Modul terpisah, dan sengaja TANPA satu pun impor sisi server. Pola ini
 * membedakan dua lapisan yang berbagi satu alamat `/penguasaan/[kunci]`, dan
 * yang perlu membedakannya bukan cuma rute server: `HeaderKeluarga` adalah
 * komponen klien, dan ia harus tahu daftar mana yang ditinggalkan pembacanya
 * sebelum ia bisa menggambar panah kembali ke sana. Rumahnya yang lama,
 * `topik-rapor.ts`, mengimpor klien Supabase sisi server — menariknya ke
 * browser lewat berkas itu mustahil.
 *
 * Pembedanya bukan tebakan melainkan jaminan database — `topik.id` punya
 * `check (id ~ '^[A-F]{1,2}-[0-9]{2}$')` sejak migrasi 140, dan uuid tidak
 * pernah cocok pola ini.
 */
export const KODE_TOPIK = /^[A-F]{1,2}-[0-9]{2}$/

export function adalahKodeTopik(kunci: string): boolean {
  return KODE_TOPIK.test(kunci)
}
