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

/**
 * Sebutan pendek paket, untuk tempat yang cuma punya beberapa kata.
 *
 * "C1", bukan "Paket C1 — Mengingat". Label tombol di kartu Misi harus muat di
 * setengah lebar layar ponsel bersama tombol kedua, dan nama Bloom yang ikut
 * masuk ke sana akan terpotong di tengah kata — persis pada bagian yang
 * membedakan satu paket dari paket lain.
 *
 * Yang panjang TIDAK diganti, cuma didampingi: begitu anak sampai di halaman
 * topik atau layar hasil, ruangnya ada dan "Mengingat" memang layak dibaca.
 * Keduanya memakai tabel yang sama supaya kode di tombol dan nama di halaman
 * tidak mungkin menunjuk paket yang berbeda.
 */
export function kodePaket(p: {
  jenis: 'latihan' | 'ujian'
  levelBloom: number | null
  nomor: number
}): string {
  if (p.jenis === 'ujian') return 'Ujian'
  const bloom = p.levelBloom == null ? undefined : NAMA_BLOOM[p.levelBloom]
  return bloom ? bloom.kode : `Paket ${p.nomor}`
}

/**
 * Nama level seperti yang dibaca ANAK — tanpa kode C1-C6 dan tanpa istilah
 * taksonomi. Istilah Bloom ("Memahami", "Menganalisis") adalah bahasa guru dan
 * peneliti; bagi anak SD ia cuma terbaca sebagai pelajaran yang serius. Daftar
 * ini dipakai di layar yang dilihat anak saja (peta Misi, daftar paket, sesi,
 * hasil). Permukaan tutor, orang tua, dan rapor tetap memakai `namaPaket`
 * dan `kodePaket` di atas, karena di sana istilahnya memang berguna.
 *
 * "Level 1" sampai "Level 6". SENGAJA tanpa julukan (Pemula, Mahir, Ahli...):
 * kata-kata yang berdekatan artinya membuat tangganya tidak terbaca naik, dan
 * sebagian kata tidak dikenal anak. Angka tidak bisa bertabrakan makna.
 */

/** "Level 2"; paket ujian "Tantangan Akhir". */
export function namaPaketAnak(p: {
  jenis: 'latihan' | 'ujian'
  levelBloom: number | null
  nomor: number
}): string {
  if (p.jenis === 'ujian') return 'Tantangan Akhir'
  return p.levelBloom == null ? `Paket ${p.nomor}` : `Level ${p.levelBloom}`
}

/** Sebutan pendek untuk tombol: "Level 2"; paket ujian "Tantangan". */
export function kodePaketAnak(p: {
  jenis: 'latihan' | 'ujian'
  levelBloom: number | null
  nomor: number
}): string {
  if (p.jenis === 'ujian') return 'Tantangan'
  return p.levelBloom == null ? `Paket ${p.nomor}` : `Level ${p.levelBloom}`
}

/**
 * Julukan paket pengayaan untuk ANAK, mengikuti level taksonominya sehingga
 * makin tinggi levelnya makin "naik" namanya: Menerapkan "Juara", Menganalisis
 * "Detektif", Mengevaluasi "Pakar", Mencipta "Penemu" (bukan "Pencipta", yang
 * terdengar terlalu besar). Level 1-2 jarang dipakai pengayaan, tapi tetap
 * diberi nama supaya tidak ada yang kosong.
 */
const JULUKAN_PENGAYAAN: Record<number, string> = {
  1: 'Pengingat',
  2: 'Penjelas',
  3: 'Juara',
  4: 'Detektif',
  5: 'Pakar',
  6: 'Penemu',
}

/** "Tantangan Detektif" untuk pengayaan level 4. Tanpa level, "Tantangan Juara". */
export function namaPengayaanAnak(levelBloom: number | null): string {
  const julukan = levelBloom == null ? undefined : JULUKAN_PENGAYAAN[levelBloom]
  return `Tantangan ${julukan ?? 'Juara'}`
}
