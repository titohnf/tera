/**
 * "Hari ini", "Kemarin", "5 hari lalu", "2 bln lalu" untuk sebuah waktu, dihitung
 * dengan HARI KALENDER WIB — bukan selisih 24 jam. Sesi pukul 23.00 kemarin
 * adalah "Kemarin" bagi yang membaca pukul 08.00, walau selisihnya sembilan jam.
 *
 * Dihitung di server dan dikirim sebagai teks: komponen klien tidak menghitung
 * ulang, jadi tidak ada HTML yang berbeda antara server dan browser.
 */
const WIB = 'Asia/Jakarta'

function hariWib(d: Date): number {
  // 'en-CA' menghasilkan YYYY-MM-DD; dijadikan hari sejak epoch.
  const [y, m, t] = d.toLocaleDateString('en-CA', { timeZone: WIB }).split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, t) / 86_400_000)
}

/** Selisih hari kalender WIB antara `iso` dan `sekarang`; 0 = hari ini. */
export function selisihHari(iso: string, sekarang: Date = new Date()): number {
  return Math.max(0, hariWib(sekarang) - hariWib(new Date(iso)))
}

export function waktuRelatif(iso: string, sekarang: Date = new Date()): { teks: string; lengkap: string } {
  const d = new Date(iso)
  const selisih = hariWib(sekarang) - hariWib(d)
  const lengkap = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: WIB,
  })
  let teks: string
  if (selisih <= 0) teks = 'Hari ini'
  else if (selisih === 1) teks = 'Kemarin'
  else if (selisih < 30) teks = `${selisih} hari lalu`
  else if (selisih < 365) teks = `${Math.floor(selisih / 30)} bln lalu`
  else teks = `${Math.floor(selisih / 365)} thn lalu`
  return { teks, lengkap }
}
