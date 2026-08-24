/**
 * Penanda "sudah dibaca" untuk notifikasi keluarga — satu simpanan, dua pembaca.
 *
 * Halaman notifikasi memakainya untuk titik biru per baris, bilah navigasi
 * bawah untuk angka di lonceng. Sebelum berkas ini keduanya akan menyimpan
 * kuncinya sendiri-sendiri, dan angka di lonceng bisa bertahan sesudah
 * daftarnya dibaca — persis kabar palsu yang membuat orang berhenti percaya
 * pada lencana.
 *
 * Tempatnya di localStorage, bukan di basis data: keluarga tidak punya satu pun
 * policy tulis (migrasi 076), dan menambahkannya demi titik biru tidak
 * sebanding. Konsekuensinya jujur dan kecil — ganti perangkat, semua kabar
 * tampak baru sekali.
 *
 * Dipakai lewat `useSyncExternalStore`, jadi `snapshotTerbaca()` mengembalikan
 * STRING mentah: React membandingkan snapshot dengan `Object.is`, dan `Set`
 * baru tidak pernah sama dengan dirinya sendiri — perbandingannya akan selalu
 * gagal dan rendernya tidak berhenti.
 */

const KUNCI = 'tera-notif-keluarga-terbaca'

/**
 * Id yang disimpan, paling banyak. Kabar menua keluar dari daftar sesudah 30
 * hari dan tidak pernah kembali, jadi id lama tidak berguna lagi — tanpa batas
 * ini simpanannya tumbuh terus selama akunnya dipakai.
 */
const SIMPAN_MAKS = 200

export function snapshotTerbaca(): string {
  try {
    return window.localStorage.getItem(KUNCI) ?? ''
  } catch {
    return ''
  }
}

/**
 * Snapshot untuk render di server dan untuk hidrasi pertama di browser.
 *
 * `null` berarti "belum diketahui", dan kedua pemakainya memperlakukannya
 * sebagai tidak ada yang baru. Itu disengaja: localStorage tidak ada di server,
 * jadi menebak isinya saat hidrasi membuat HTML server dan browser berbeda.
 */
export function snapshotServer(): null {
  return null
}

/**
 * Simpanan ini hanya berubah oleh halaman itu sendiri, tidak oleh dunia luar,
 * jadi tidak ada yang perlu didengarkan. Perubahannya tetap terbaca karena
 * React memanggil `snapshotTerbaca()` lagi di tiap render berikutnya — misalnya
 * saat pindah halaman, yang membuat lencana di bilah bawah ikut turun.
 */
export function langganan(): () => void {
  return () => {}
}

export function urai(mentah: string | null): Set<string> | null {
  if (mentah === null) return null
  try {
    return new Set(mentah ? (JSON.parse(mentah) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function tandaiTerbaca(ids: string[]): void {
  const semua = urai(snapshotTerbaca()) ?? new Set<string>()
  for (const id of ids) semua.add(id)
  try {
    // Yang dibuang adalah id yang paling dulu masuk — `Set` mempertahankan
    // urutan penyisipan, jadi id terbaru selalu di ekor.
    window.localStorage.setItem(KUNCI, JSON.stringify([...semua].slice(-SIMPAN_MAKS)))
  } catch {
    // localStorage tidak tersedia (mode privat) — penandanya cuma tidak
    // bertahan sampai kunjungan berikutnya, bukan kegagalan yang perlu
    // ditampilkan.
  }
}
