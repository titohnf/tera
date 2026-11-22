/**
 * Dua alamat, dua pintu masuk, satu aplikasi.
 *
 * - `app.bimbeltera.com` (cadangan: `bimbeltera.vercel.app`): keluarga, tutor, admin. Masuk dengan
 *   email dan password.
 * - `sora.bimbeltera.com` (cadangan: `sora-bimbeltera.vercel.app`): siswa, pelanggan langganan, dan
 *   peserta umum. Masuk dengan kode.
 *
 * Tampilan ditentukan dari hostname, jadi halaman login hanya menampilkan SATU cara masuk dan
 * orang tua tidak tersasar ke tampilan siswa (atau sebaliknya). Kodenya sama untuk keduanya.
 * Cookie sesi Supabase terikat ke host, sehingga sesi kedua alamat memang terpisah.
 */
export type Tampilan = 'app' | 'sora'

const HOST_VERCEL_APP = 'bimbeltera.vercel.app'

export function tampilanDariHost(host: string | null | undefined): Tampilan {
  const h = (host ?? '').toLowerCase()
  return /^sora([.-]|$)/.test(h) ? 'sora' : 'app'
}

/**
 * Host pasangan di tampilan `ke`, atau null bila host ini bukan salah satu alamat yang dikenal
 * (preview Vercel, alamat Netlify bawaan): di sana tidak ada pengalihan, supaya tidak melempar ke
 * alamat yang tidak ada.
 */
export function hostUntuk(host: string | null | undefined, ke: Tampilan): string | null {
  const h = (host ?? '').toLowerCase()
  if (!h) return null
  const sekarang = tampilanDariHost(h)
  if (sekarang === ke) return h
  if (ke === 'sora') {
    if (h.startsWith('app.')) return `sora.${h.slice(4)}`
    if (h === HOST_VERCEL_APP) return `sora-${h}`
    if (h.startsWith('localhost')) return `sora.${h}`
    return null
  }
  if (h.startsWith('sora.')) return h.slice(5) === 'localhost' || h.slice(5).startsWith('localhost:') ? h.slice(5) : `app.${h.slice(5)}`
  if (h === `sora-${HOST_VERCEL_APP}`) return HOST_VERCEL_APP
  return null
}
