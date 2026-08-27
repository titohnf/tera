/**
 * Golongan sebuah mata pelajaran, ditebak dari namanya.
 *
 * `subjects` tidak punya kolom ikon, dan menambahkannya berarti satu bidang
 * lagi yang harus diisi admin setiap kali mapel baru dibuat — untuk sesuatu
 * yang jawabannya hampir selalu bisa dibaca dari namanya sendiri. Peta ini
 * cukup sampai ada mapel yang benar-benar butuh ikon di luar dugaan; kalau itu
 * terjadi, tempatnya menyusul di database, bukan cabang baru di sini.
 *
 * Yang dikembalikan golongannya, bukan gambarnya: bentuk dan warnanya urusan
 * layar (`components/belajar/IkonMapel.tsx`), dan berkas ini tetap bisa dibaca
 * di server tanpa membawa satu pun elemen SVG.
 *
 * URUTAN PENTING: yang lebih spesifik didahulukan. 'IPAS' memuat 'IPA', dan
 * 'Bahasa Inggris' memuat 'Bahasa' — dicocokkan terbalik, keduanya salah.
 */
export type GolonganMapel =
  | 'bahasa'
  | 'matematika'
  | 'sains'
  | 'kimia'
  | 'fisika'
  | 'biologi'
  | 'bumi'
  | 'ipas'
  | 'ekonomi'
  | 'sejarah'
  | 'sosial'
  | 'agama'
  | 'seni'
  | 'olahraga'
  | 'komputer'
  | 'umum'

const GOLONGAN: [string, GolonganMapel][] = [
  ['ipas', 'ipas'],
  ['ipa', 'sains'],
  ['bahasa', 'bahasa'],
  ['english', 'bahasa'],
  ['literasi', 'bahasa'],
  ['matematika', 'matematika'],
  ['math', 'matematika'],
  ['numerasi', 'matematika'],
  ['kimia', 'kimia'],
  ['chemistry', 'kimia'],
  ['fisika', 'fisika'],
  ['physics', 'fisika'],
  ['biologi', 'biologi'],
  ['biology', 'biologi'],
  ['science', 'sains'],
  ['ekonomi', 'ekonomi'],
  ['akuntansi', 'ekonomi'],
  ['sejarah', 'sejarah'],
  ['geografi', 'bumi'],
  ['sosiologi', 'sosial'],
  ['ips', 'sosial'],
  ['agama', 'agama'],
  ['pkn', 'sosial'],
  ['ppkn', 'sosial'],
  ['pancasila', 'sosial'],
  ['seni', 'seni'],
  ['olahraga', 'olahraga'],
  ['pjok', 'olahraga'],
  ['informatika', 'komputer'],
  ['komputer', 'komputer'],
  ['coding', 'komputer'],
]

/** Golongan mapel, atau 'umum' sebagai jawaban terakhir yang selalu benar. */
export function golonganMapel(nama: string): GolonganMapel {
  const n = nama.toLowerCase()
  for (const [kunci, golongan] of GOLONGAN) if (n.includes(kunci)) return golongan
  return 'umum'
}
