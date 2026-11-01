// @ts-nocheck
/**
 * Unit tests untuk ringkasPembayaran()
 * Jalankan dengan: npx vitest (install dulu: npm i -D vitest)
 */
import { describe, it, expect } from 'vitest'
import { hariTerlambat, ringkasKeterlambatan, ringkasPembayaran } from './tagihan'

describe('ringkasPembayaran', () => {
  it('mengurangi cicilan dari tagihan yang berstatus angsuran', () => {
    const r = ringkasPembayaran(
      [{ id: 'a', total_due: 2_580_000, status: 'partially_paid' }],
      [{ invoice_id: 'a', amount: 1_860_000 }],
    )
    expect(r).toEqual({ sudahBayar: 1_860_000, belumBayar: 720_000 })
  })

  it('menganggap invoice paid lunas penuh walau tanpa catatan pembayaran', () => {
    const r = ringkasPembayaran([{ id: 'a', total_due: 500_000, status: 'paid' }], [])
    expect(r).toEqual({ sudahBayar: 500_000, belumBayar: 0 })
  })

  it('mengabaikan draft dan yang dibatalkan', () => {
    const r = ringkasPembayaran(
      [
        { id: 'a', total_due: 100, status: 'draft' },
        { id: 'b', total_due: 200, status: 'cancelled' },
      ],
      [],
    )
    expect(r).toEqual({ sudahBayar: 0, belumBayar: 0 })
  })

  it('tidak membiarkan kelebihan bayar menutupi invoice lain', () => {
    const r = ringkasPembayaran(
      [
        { id: 'a', total_due: 100, status: 'sent' },
        { id: 'b', total_due: 100, status: 'sent' },
      ],
      [{ invoice_id: 'a', amount: 300 }],
    )
    expect(r).toEqual({ sudahBayar: 100, belumBayar: 100 })
  })
})

describe('hariTerlambat', () => {
  it('tagihan tanpa pembayaran dihitung sejak jatuh tempo', () => {
    expect(hariTerlambat('sent', '2026-10-01', '2026-11-01')).toBe(31)
    expect(hariTerlambat('sent', '2026-11-01', '2026-11-01')).toBe(0)
  })

  it('angsuran dihitung sejak lewat batas diam 30 hari setelah bayar terakhir', () => {
    expect(hariTerlambat('partially_paid', '2026-08-08', '2026-11-01', '2026-10-13')).toBe(0)
    expect(hariTerlambat('partially_paid', '2026-08-08', '2026-11-01', '2026-09-15')).toBe(17)
  })

  it('draft, dibatalkan, dan lunas tidak pernah terlambat', () => {
    for (const st of ['draft', 'cancelled', 'paid']) {
      expect(hariTerlambat(st, '2026-01-01', '2026-11-01')).toBe(0)
    }
  })
})

describe('ringkasKeterlambatan', () => {
  const inv = { id: 'a', total_due: 2_995_000, status: 'partially_paid', due_date: '2026-08-08' }
  const bayar = [
    { invoice_id: 'a', amount: 600_000, paid_at: '2026-08-12T03:00:00Z' },
    { invoice_id: 'a', amount: 600_000, paid_at: '2026-09-15T03:00:00Z' },
    { invoice_id: 'a', amount: 600_000, paid_at: '2026-10-13T03:00:00Z' },
  ]

  it('murid yang rutin mencicil tidak punya keterlambatan maupun tunggakan', () => {
    expect(ringkasKeterlambatan([inv], bayar, '2026-11-01')).toEqual({ maxOverdueDays: 0, totalOutstanding: 0 })
  })

  it('angsuran yang berhenti dihitung dengan sisa setelah cicilan', () => {
    expect(ringkasKeterlambatan([inv], bayar, '2026-12-20')).toEqual({ maxOverdueDays: 38, totalOutstanding: 1_195_000 })
  })

  it('invoice terkirim yang lewat tempo menghitung nilai penuhnya', () => {
    const r = ringkasKeterlambatan([{ id: 'b', total_due: 800_000, status: 'sent', due_date: '2026-09-01' }], [], '2026-11-01')
    expect(r).toEqual({ maxOverdueDays: 61, totalOutstanding: 800_000 })
  })
})
