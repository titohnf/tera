import { google } from 'googleapis'

/**
 * Kunci privat service account, dirapikan dari bentuk apa pun yang tersimpan.
 *
 * Nilai yang sama harus melewati tiga tempat yang memperlakukannya berbeda —
 * berkas `.env`, dashboard Vercel, dan CLI Netlify — dan masing-masing punya
 * cara sendiri merusaknya. Tiga yang benar-benar terjadi:
 *
 *   1. `\n` tetap dua karakter (dari `.env` atau tempelan JSON) — harus diubah
 *      jadi baris baru sungguhan.
 *   2. `\n` SUDAH jadi baris baru (dashboard menyimpan nilai multi-baris apa
 *      adanya) — dan langkah 1 tidak menemukan apa pun untuk diganti.
 *   3. Tanda kutip pembungkus ikut tertempel, karena di berkas JSON kunci itu
 *      memang dikelilingi `"`.
 *
 * Ketiganya menghasilkan kegagalan yang sama dan sama-sama tidak menjelaskan
 * dirinya: `ERR_OSSL_UNSUPPORTED` dari OpenSSL, sebuah kode yang tidak menyebut
 * kutip, baris baru, maupun environment variable. Menerima ketiganya jauh lebih
 * murah daripada menuntut satu bentuk yang benar lalu berharap setiap orang yang
 * memasangnya di masa depan menebak bentuk mana itu.
 */
function rapikanKunci(mentah: string): string {
  let k = mentah.trim()
  // Kutip pembungkus, tunggal maupun ganda, hanya kalau memang berpasangan.
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1)
  }
  k = k.replace(/\\n/g, '\n')
  // PEM menuntut baris baru penutup. Tanpa ini sebagian pengurai menolaknya,
  // dan lagi-lagi tanpa menyebut alasannya.
  return k.endsWith('\n') ? k : k + '\n'
}

/**
 * Klien Drive yang bertindak sebagai service account bimbel.
 *
 * Dipakai `/api/materi/[id]` untuk mengambil materi dari folder "Materi
 * Kurikulum" — SETELAH RLS memutuskan pemintanya berhak. Service account harus
 * punya akses baca ke folder itu; ia tidak bisa dan tidak perlu menulis.
 */
export function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()
  const mentah = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !mentah) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY belum diatur')
  }
  const key = rapikanKunci(mentah)
  // Diperiksa di sini, bukan dibiarkan gagal di dalam OpenSSL: pesan yang
  // menyebut apa yang salah pada nilainya jauh lebih berguna daripada
  // `ERR_OSSL_UNSUPPORTED`, yang sudah sekali membuat kami mengira masalahnya
  // ada di tempat lain.
  if (!key.startsWith('-----BEGIN') || !key.includes('PRIVATE KEY-----')) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY tidak berbentuk PEM — periksa tanda kutip pembungkus atau baris yang terpotong',
    )
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}
