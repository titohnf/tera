/**
 * Nama paket seperti yang dibaca anak — label saja, tanpa satu pun kueri.
 *
 * BERKAS SENDIRI, dan itu bukan kerapian. Ia tadinya tinggal di
 * `topik-peta.ts`, yang baris pertamanya mengimpor klien Supabase sisi server.
 * `DaftarPaket` adalah komponen klien, dan sebuah fungsi label yang diimpor
 * dari berkas server menyeret `next/headers` ke dalam bundel peramban — build
 * gagal dengan galat yang menyebut Pages Router, sesuatu yang sama sekali tidak
 * dipakai aplikasi ini.
 *
 * Aturannya jadi terlihat: apa pun yang dipanggil komponen klien tidak boleh
 * tinggal serumah dengan pembaca database, sedekat apa pun hubungan artinya.
 */

/**
 * Nama level Bloom, untuk label paket saja.
 *
 * Daftar resminya hidup di dua tempat yang lebih berhak: batas 1-6 dijaga
 * constraint `questions_bloom_level_check` di database, dan penamaannya
 * ditetapkan `lib/bloom.ts` di repo Sora tempat soal ditulis. Yang di sini cuma
 * cara membacanya di layar anak — kalau nanti ada level yang namanya berubah,
 * yang berubah label, bukan arti.
 */
const NAMA_BLOOM: Record<number, { kode: string; nama: string }> = {
  1: { kode: 'C1', nama: 'Mengingat' },
  2: { kode: 'C2', nama: 'Memahami' },
  3: { kode: 'C3', nama: 'Menerapkan' },
  4: { kode: 'C4', nama: 'Menganalisis' },
  5: { kode: 'C5', nama: 'Mengevaluasi' },
  6: { kode: 'C6', nama: 'Mencipta' },
}

/**
 * Nama paket seperti yang dibaca anak.
 *
 * Paket latihan MENYEBUTKAN level Bloom-nya (PRD FR2: "Paket C2 — Memahami"):
 * anak boleh tahu bahwa yang dilatih hari ini pemahaman, bukan hafalan. Paket
 * ujian TIDAK, dan itu bukan kelalaian melainkan syarat — dokumen fondasi
 * Bagian 3.7 menuntut level dicampur tanpa diberi tahu, meniru ujian sungguhan
 * yang tidak pernah berkata "sekarang soal C3".
 */
export function namaPaket(p: {
  jenis: 'latihan' | 'ujian'
  levelBloom: number | null
  nomor: number
}): string {
  if (p.jenis === 'ujian') return 'Ujian'
  const bloom = p.levelBloom == null ? undefined : NAMA_BLOOM[p.levelBloom]
  return bloom ? `Paket ${bloom.kode} — ${bloom.nama}` : `Paket ${p.nomor}`
}
