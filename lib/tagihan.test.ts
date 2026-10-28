// @ts-nocheck
/**
 * Unit tests untuk ringkasPembayaran()
 * Jalankan dengan: npx vitest (install dulu: npm i -D vitest)
 */
import { describe, it, expect } from 'vitest'
import { ringkasPembayaran } from './tagihan'

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
