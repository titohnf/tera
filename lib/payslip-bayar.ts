/**
 * Sudah dibayar atau belum, untuk slip gaji tutor.
 *
 * Status slip bergerak draft → paid → sent: "Tandai Dibayar" menaikkannya ke
 * 'paid', lalu "Kirim Slip ke Tutor" menimpanya jadi 'sent'. Artinya status
 * sendirian tidak bisa menjawab pertanyaan ini — begitu slipnya dikirim,
 * jejak 'paid' hilang dan seluruh gaji yang sudah cair terbaca nol.
 *
 * `paid_at` yang menjawab: hanya markPayslipPaid yang mengisinya, dan mengirim
 * slip tidak menghapusnya. Status 'paid' tetap diterima supaya baris lama yang
 * belum sempat punya paid_at tidak ikut hilang.
 */
export type PayslipPaidRow = {
  status: string
  paid_at: string | null
  line_items: { sessionId: string }[]
}

export function sudahDibayar(p: { status: string; paid_at?: string | null }): boolean {
  return Boolean(p.paid_at) || p.status === 'paid'
}

/** Label badge yang menyebut kedua fakta, bukan cuma yang terakhir terjadi. */
export function labelStatusSlip(p: { status: string; paid_at?: string | null }): string {
  if (p.status === 'draft') return 'Draft'
  if (!sudahDibayar(p)) return 'Terkirim'
  return p.status === 'sent' ? 'Dibayar · Terkirim' : 'Dibayar'
}

export function warnaStatusSlip(p: { status: string; paid_at?: string | null }): string {
  if (p.status === 'draft') return 'bg-gray-100 text-gray-500'
  return sudahDibayar(p) ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
}
