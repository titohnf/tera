/**
 * Deskripsi invoice privat dibuat dengan jumlah pertemuan ikut di dalamnya —
 * "Privat SMA — Agustus 2026 (9 pertemuan)". Jumlah itu juga sudah tampil di
 * kolom Qty, dan ketika admin mengoreksi Qty teks di dalam kurungnya tidak
 * ikut berubah, sehingga satu baris bisa menyebut dua angka berbeda.
 *
 * Kolom Qty adalah angka yang benar (dialah yang dikalikan dengan tarif), jadi
 * yang di dalam kurung dibuang saja saat ditampilkan. Deskripsi aslinya tetap
 * utuh di database supaya invoice lama tidak berubah maknanya.
 */
export function displayLineItemDescription(description: string): string {
  return description.replace(/\s*\(\d+\s*pertemuan\)\s*$/i, '')
}
