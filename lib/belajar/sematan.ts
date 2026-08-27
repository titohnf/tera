import { extractDriveFileId } from '@/lib/curriculum-resource-links'

/**
 * Materi topik untuk permukaan belajar: bahan yang sudah ada di Drive, dibaca
 * di dalam halaman.
 *
 * Barisnya tidak baru. `curriculum_resources` sudah menyimpan materi sebagai
 * judul + tautan sejak migrasi 057, dan sejak 060 ia menunjuk `group_id` yang
 * sama dengan yang dipakai soal — jadi materi, soal, dan pembahasan sebetulnya
 * sudah satu ruang kunci. Yang belum ada cuma layar bacanya: sampai sekarang
 * tautan itu selalu melempar anak keluar aplikasi, ke berkas yang tidak tahu ia
 * sedang di topik mana.
 *
 * Menulis materinya tetap di Drive. Tidak ada niat menyaingi Google Docs di
 * sini — yang dikerjakan berkas ini cuma mengubah tautan jadi bentuk yang bisa
 * disematkan.
 *
 * Berkas ini sengaja MURNI: tidak ada satu pun impor ke sisi server, karena
 * `sematkan()` dipanggil dari komponen klien. Pengambilan datanya ada di
 * `lib/belajar/materi.ts`, dan pemisahan itu bukan kerapian melainkan syarat —
 * menyeret client Supabase server ke bundel browser membuat build gagal.
 */

export interface MateriTopik {
  id: string
  group_id: string
  title: string
  link_url: string
}

/**
 * Bentuk tampil satu tautan.
 *
 * `dokumen` lebih tinggi daripada lebar, `video` mengikuti 16:9 — dua bentuk
 * saja, karena selebihnya cuma menambah keputusan tanpa menambah kejelasan.
 */
export type Sematan =
  | { mode: 'bingkai'; src: string; rasio: 'video' | 'dokumen' }
  | { mode: 'tautan' }

const TAUTAN: Sematan = { mode: 'tautan' }

/** `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/shorts/ID` → id-nya. */
function idYoutube(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
  if (host !== 'youtube.com' && host !== 'm.youtube.com') return null
  if (u.pathname === '/watch') return u.searchParams.get('v')
  const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)/)
  return m ? m[1] : null
}

/**
 * Tautan ini video atau bukan.
 *
 * Hanya YouTube yang bisa dijawab dengan pasti. Berkas Drive tidak bisa
 * dibedakan video atau dokumen tanpa memanggil Drive API (alasan panjangnya di
 * `sematkan()` di bawah), jadi yang tidak dikenali dihitung sebagai bahan baca
 * — salah menyebut dokumen sebagai video lebih menyesatkan daripada tidak
 * menyebutnya sama sekali.
 */
export function adalahVideo(url: string): boolean {
  try {
    return idYoutube(new URL(url)) !== null
  } catch {
    return false
  }
}

/**
 * Mengubah tautan materi jadi alamat yang bisa ditaruh di dalam `<iframe>`.
 *
 * DAFTAR-PUTIH, bukan tebak-tebakan, dan itu disengaja karena dua hal.
 *
 * Pertama, banyak layanan yang dipakai bimbel — Wordwall, Wayground, Kahoot —
 * memasang `X-Frame-Options`, dan penolakannya TIDAK bisa dideteksi dari
 * browser: bingkainya cuma jadi kosong tanpa satu pun pesan atau event yang
 * bisa ditangkap. Menyematkan dulu lalu berharap adalah cara membuat layar
 * kosong yang tidak bisa dijelaskan ke anak yang sedang menatapnya.
 *
 * Kedua, daftar ini sekaligus batas keamanannya. `link_url` adalah teks yang
 * diketik orang ke dalam basis data; hanya alamat yang sudah DIBENTUK ULANG di
 * sini yang boleh masuk ke `<iframe>`, tidak pernah nilai aslinya.
 *
 * Berkas Drive biasa tidak bisa dibedakan video atau PDF tanpa memanggil Drive
 * API, jadi semuanya diberi rasio `dokumen`; pemutar video Drive tetap tampil
 * di dalamnya, hanya dengan pita hitam di atas-bawah. Menukarnya dengan satu
 * panggilan `files.get` per materi bukan pertukaran yang sepadan sebelum ada
 * yang benar-benar terganggu.
 */
export function sematkan(url: string): Sematan {
  // Berkas yang sudah dipindahkan ke penyimpanan Tera (migrasi 120). Alamatnya
  // relatif dan sedomain, jadi tidak ada `X-Frame-Options` orang lain yang bisa
  // mengosongkan bingkainya, dan tidak ada login Google yang diminta di
  // tengah-tengah — rutenya menjaga dirinya dengan sesi Tera yang sudah dipakai
  // anak untuk sampai ke halaman ini. Ini satu-satunya cabang yang boleh
  // meloloskan alamat tanpa membentuknya ulang, karena bentuknya kita sendiri
  // yang menyusun di `materiTopik()`, bukan orang yang mengetik ke basis data.
  if (/^\/api\/materi\/[0-9a-f-]{36}$/.test(url)) {
    return { mode: 'bingkai', src: url, rasio: 'dokumen' }
  }

  let u: URL
  try {
    u = new URL(url)
  } catch {
    return TAUTAN
  }
  if (u.protocol !== 'https:') return TAUTAN

  const video = idYoutube(u)
  // `youtube-nocookie`, bukan `youtube`: pembacanya anak-anak, dan tidak ada
  // yang hilang dengan memilih yang satunya.
  if (video) {
    return { mode: 'bingkai', src: `https://www.youtube-nocookie.com/embed/${video}`, rasio: 'video' }
  }

  // Satu-satunya pengurai id Drive di repo ini. Ia pula yang menolak tautan
  // Google Form terbitan, yang id-nya bukan id berkas.
  const berkas = extractDriveFileId(url)
  if (!berkas) return TAUTAN

  const host = u.hostname.replace(/^www\./, '')
  if (host === 'drive.google.com') {
    return { mode: 'bingkai', src: `https://drive.google.com/file/d/${berkas}/preview`, rasio: 'dokumen' }
  }

  const jenis = u.pathname.split('/').filter(Boolean)[0]
  if (jenis === 'presentation') {
    return {
      mode: 'bingkai',
      src: `https://docs.google.com/presentation/d/${berkas}/embed`,
      rasio: 'video',
    }
  }
  if (jenis === 'document' || jenis === 'spreadsheets') {
    return {
      mode: 'bingkai',
      src: `https://docs.google.com/${jenis}/d/${berkas}/preview`,
      rasio: 'dokumen',
    }
  }
  return TAUTAN
}
