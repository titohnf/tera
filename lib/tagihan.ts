/**
 * Status tagihan: istilahnya, warnanya, dan aturan terlambatnya.
 *
 * Satu-satunya sumber untuk seluruh aplikasi. Sebelum ada berkas ini, halaman
 * detail siswa admin dan beranda anak di portal keluarga menjawabnya
 * sendiri-sendiri, dan jawabannya berbeda untuk tagihan yang SAMA:
 *
 *   Yang dilihat admin   : { Overdue: 17, paid: 4 }
 *   Yang dilihat keluarga: { partially_paid: 7, sent: 10, paid: 4 }
 *
 * Dua sebabnya, dan keduanya ditutup di sini:
 *
 * 1. `partially_paid` tidak ada di kedua peta status, padahal ia dipakai di
 *    basis data. Keduanya jatuh ke fallback dan mencetak string mentah
 *    "partially_paid" ke layar — termasuk layar orang tua.
 *
 * 2. Status `overdue` TIDAK PERNAH tersimpan di basis data; isinya hanya
 *    `sent`, `paid`, dan `partially_paid`. Jadi keterlambatan harus dihitung
 *    dari `due_date`, dan dulu hanya halaman admin yang melakukannya.
 *
 * Istilah dan warnanya diambil dari halaman invoice
 * (`components/admin/invoices/StudentClassInvoiceTable`), yang sudut pandangnya
 * memang yang benar: tagihan yang sudah dicicil adalah **Angsuran** — sebuah
 * kesepakatan yang sedang berjalan — bukan tunggakan. Menandainya merah
 * "Terlambat" menghukum keluarga yang justru sudah mulai membayar, dan di layar
 * admin ia menenggelamkan kabar bahwa uangnya sebagian sudah masuk.
 *
 * Yang merah ada dua: tagihan yang lewat jatuh tempo TANPA pembayaran sama
 * sekali, dan angsuran yang berhenti — pembayaran terakhirnya lebih dari 30
 * hari lalu. Itu pembedaan yang benar-benar dipakai saat menagih: yang menyicil
 * ditunggu, yang diam saja dihubungi.
 *
 * Ambang 30 hari itu bukan angka bulat yang dikarang: invoice kelas reguler
 * diterbitkan satu semester sekaligus sementara hampir semua orang tua
 * membayarnya bulanan, jadi jeda satu bulan antar-angsuran adalah irama yang
 * normal. Yang melewatinya berarti benar-benar berhenti, bukan sedang menunggu
 * tanggal gajian berikutnya.
 */

/** Batas diamnya sebuah angsuran sebelum ia disebut terlambat. */
export const MACET_HARI = 30

/**
 * Selisih hari antara dua tanggal. Menerima
 * `YYYY-MM-DD` maupun cap waktu ISO penuh — `paid_at` bertipe timestamp,
 * `due_date` bertipe date, dan keduanya bertemu di fungsi ini.
 */
function selisihHari(dari: string, ke: string): number {
  return Math.round(
    (Date.parse(`${ke.slice(0, 10)}T00:00:00Z`) - Date.parse(`${dari.slice(0, 10)}T00:00:00Z`)) /
      86_400_000,
  )
}

export type TagihanStatus = {
  label: string
  /** Kelas warna untuk lencana status. */
  cls: string
}

const DASAR: Record<string, TagihanStatus> = {
  draft:          { label: 'Draft',      cls: 'bg-gray-100 text-gray-500' },
  sent:           { label: 'Terkirim',   cls: 'bg-blue-100 text-blue-700' },
  partially_paid: { label: 'Angsuran',   cls: 'bg-yellow-100 text-yellow-700' },
  paid:           { label: 'Lunas',      cls: 'bg-green-100 text-green-700' },
  cancelled:      { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-500' },
  /**
   * Tidak pernah ditulis ke basis data sejauh ini — dihitung dari `due_date`
   * oleh `statusTagihan()`. Tetap dikenali di sini supaya baris yang kelak
   * memakainya tidak mencetak teks mentah, persis kegagalan yang membuat
   * berkas ini ada.
   */
  overdue:        { label: 'Terlambat',  cls: 'bg-red-100 text-red-600' },
}

/**
 * Tanggal pembayaran terakhir dari sederet pembayaran, atau null kalau belum
 * ada satu pun. Dipusatkan di sini supaya setiap layar yang menilai angsuran
 * macet membacanya dengan cara yang sama.
 */
export function tanggalBayarTerakhir(daftar: { paid_at: string }[]): string | null {
  return daftar.reduce<string | null>(
    (t, p) => (t === null || p.paid_at > t ? p.paid_at : t),
    null,
  )
}

/** Status yang tagihannya sudah selesai — tidak bisa disebut terlambat. */
function sudahSelesai(status: string): boolean {
  return status === 'paid' || status === 'cancelled' || status === 'draft'
}

/**
 * Terlambat — dalam dua bentuk yang berbeda ukurannya.
 *
 * Untuk tagihan yang belum dibayar sepeser pun, ukurannya jatuh tempo. Untuk
 * ANGSURAN, tanggal jatuh tempo asli bukan lagi ukuran yang adil begitu
 * pembayaran pertama masuk — invoicenya satu semester, cicilannya bulanan, jadi
 * ia akan lewat tempo sepanjang sisa semester meski uangnya mengalir tiap bulan.
 * Yang diukur adalah DIAMNYA: lebih dari `MACET_HARI` sejak pembayaran terakhir.
 *
 * `bayarTerakhir` opsional, dan tanpa ia angsuran tidak pernah disebut
 * terlambat. Itu disengaja: pemanggil yang tidak punya data pembayaran lebih
 * baik diam daripada menebak, dan tidak ada layar yang mendadak memerah karena
 * seseorang lupa meneruskan satu argumen.
 */
export function tagihanTerlambat(
  status: string,
  dueDate: string | null,
  hariIni: string,
  /** Tanggal pembayaran TERAKHIR yang tercatat, kalau ada. */
  bayarTerakhir?: string | null,
): boolean {
  if (sudahSelesai(status)) return false
  if (status === 'partially_paid') {
    return !!bayarTerakhir && selisihHari(bayarTerakhir, hariIni) > MACET_HARI
  }
  return !!dueDate && dueDate < hariIni
}

/**
 * Label yang dibaca pengguna. `hariIni` diberikan pemanggil (format `YYYY-MM-DD`)
 * agar fungsi ini tidak membaca jam sendiri — aturan lint `react-hooks/purity`
 * melarangnya saat render, alasan yang sama dengan `sekarangIso` di lib/waktu.ts.
 */
export function statusTagihan(
  status: string,
  dueDate: string | null,
  hariIni: string,
  bayarTerakhir?: string | null,
): TagihanStatus {
  if (tagihanTerlambat(status, dueDate, hariIni, bayarTerakhir)) return DASAR.overdue
  return DASAR[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
}

const BILAH: Record<string, string> = {
  draft:          'bg-slate-200',
  sent:           'bg-blue-300',
  partially_paid: 'bg-yellow-400',
  paid:           'bg-green-400',
  cancelled:      'bg-slate-200',
}

/** Warna bilah kemajuan pembayaran, seirama dengan lencana statusnya. */
export function warnaBilahTagihan(
  status: string,
  dueDate: string | null,
  hariIni: string,
  bayarTerakhir?: string | null,
): string {
  if (tagihanTerlambat(status, dueDate, hariIni, bayarTerakhir)) return 'bg-red-400'
  return BILAH[status] ?? 'bg-slate-200'
}
