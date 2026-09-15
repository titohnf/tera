/**
 * Deskripsi invoice privat dibuat dengan jumlah pertemuan ikut di dalamnya —
 * "Privat SMA — Agustus 2026 (9 pertemuan)". Jumlah itu juga sudah tampil di
 * kolom Qty, dan ketika admin mengoreksi Qty teks di dalam kurungnya tidak
 * ikut berubah, sehingga satu baris bisa menyebut dua angka berbeda.
 *
 * Kolom Qty adalah angka yang benar (dialah yang dikalikan dengan tarif), jadi
 * yang di dalam kurung dibuang saja saat ditampilkan. Deskripsi aslinya tetap
 * utuh di database supaya invoice lama tidak berubah maknanya.
 */
export function displayLineItemDescription(description: string): string {
  return description.replace(/\s*\(\d+\s*pertemuan\)\s*$/i, '')
}

/**
 * Bulan-bulan yang DICAKUP sebuah invoice, dalam bentuk "YYYY-MM".
 *
 * Bulan terbit bukan jawabannya. Invoice kelas grup diterbitkan sekali untuk
 * satu semester (lihat catatan ambang 30 hari di lib/tagihan.ts) — satu baris
 * "Grup SMP Reguler" dengan unit `bulan` dan `months: 6` yang terbit 17 Juli
 * adalah tagihan Juli sampai Desember. Mengelompokkannya menurut `issued_at`
 * saja membuat siswa yang tagihannya sudah dikirim terbaca "Belum Dikirim" di
 * lima bulan sisanya.
 *
 * Tiga aturan, dari yang paling tepercaya:
 *
 * 1. Baris yang punya `period` menyebut bulannya sendiri — begitulah invoice
 *    bulanan kelas privat dibuat (lihat generateMonthlyInvoice), jadi tidak
 *    ada yang perlu diterka.
 * 2. Baris `unit: 'bulan'` tanpa `period` membentang `months` bulan sejak
 *    bulan terbit. Ini terkaan, tapi terkaan yang cocok dengan cara
 *    generateInvoice menghitung kuantitasnya, dan tidak ada rentang tanggal
 *    yang tersimpan di barisnya untuk dipakai sebagai gantinya.
 * 3. Kalau tidak ada yang bisa diturunkan, jatuh ke bulan terbit.
 *
 * Baris potongan tidak ikut menentukan cakupan: "Diskon Referral" dengan
 * `months: 0` adalah potongan sekali, bukan pernyataan tentang bulan.
 */
export function invoiceCoverageMonths(invoice: {
  issued_at: string
  line_items: { unit?: string; months?: number; period?: string; is_deduction?: boolean }[] | null
}): string[] {
  const issuedMonth = invoice.issued_at.slice(0, 7)
  const items = (invoice.line_items ?? []).filter(i => !i.is_deduction)
  const months = new Set<string>()

  for (const item of items) {
    if (item.period) {
      months.add(item.period)
      continue
    }
    if (item.unit === 'bulan' && Number(item.months) > 0) {
      for (let i = 0; i < Number(item.months); i++) months.add(tambahBulan(issuedMonth, i))
    }
  }

  return months.size > 0 ? [...months] : [issuedMonth]
}

/** Geser kunci bulan "2026-07" maju `jumlah` bulan. */
function tambahBulan(bulan: string, jumlah: number): string {
  const [tahun, nomor] = bulan.split('-').map(Number)
  const total = (tahun * 12) + (nomor - 1) + jumlah
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}
