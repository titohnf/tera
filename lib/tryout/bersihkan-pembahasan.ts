/**
 * Pembahasan untuk pembaca (siswa, orang tua): tanpa catatan kerja penyusun.
 *
 * Pembahasan butir impor berakhir dengan penanda "[Kunci buatan Claude.]" atau
 * "[Kunci buatan Claude; PERIKSA.]", lalu daftar "Sumber: …" / "Terinspirasi dari
 * tulisan: …". Itu catatan untuk penyusun dan penelaah, bukan untuk pembaca, jadi
 * semuanya dari penanda sampai akhir dibuang. Teks di database tidak diubah, supaya
 * penanda PERIKSA tetap bisa dicari oleh yang menelaah.
 */
export function bersihkanPembahasan(teks: string | null | undefined): string | null {
  if (!teks) return null
  const bersih = teks.replace(/\s*\[Kunci buatan Claude[^\]]*\][\s\S]*$/i, '').trim()
  return bersih || null
}
