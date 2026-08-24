'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  activateSubscription,
  createMandiriAccount,
  extendSubscription,
  stopSubscription,
} from '@/lib/actions/admin/subscriptions'

export type AkunRow = {
  id: string
  full_name: string
  email: string
  created_at: string
}

export type LanggananRow = {
  id: string
  profile_id: string
  product: string
  status: string
  starts_at: string | null
  ends_at: string | null
  amount: number | null
  reference: string | null
  note: string | null
}

/**
 * Kelola langganan SORA/GAMA.
 *
 * Bentuknya meniru `PracticeAccessManager` — dua daftar berdampingan dan satu
 * borang tambah di bawah — karena pekerjaannya memang sama: melihat siapa yang
 * sudah punya akses, siapa yang menunggu, lalu memberi atau mencabut.
 *
 * Yang dipisah di sini adalah "menunggu aktivasi" dan "aktif". Pemisahan itu
 * bukan gaya: antrean menunggu adalah satu-satunya bagian halaman ini yang
 * menuntut tindakan, dan ia harus terbaca lebih dulu daripada daftar yang cuma
 * perlu dilihat sesekali.
 */

function tanggal(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

function sisaHari(ends: string | null): number | null {
  if (!ends) return null
  return Math.ceil((new Date(ends).getTime() - Date.now()) / 86_400_000)
}

const STATUS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  stopped: 'bg-slate-100 text-slate-500',
  expired: 'bg-slate-100 text-slate-500',
}

export default function LanggananManager({
  akun,
  langganan,
}: {
  akun: AkunRow[]
  langganan: LanggananRow[]
}) {
  const [pending, startTransition] = useTransition()
  const [pesan, setPesan] = useState<string | null>(null)
  const [aktivasiState, aktivasiAction] = useActionState(activateSubscription, null)
  const [akunState, akunAction] = useActionState(createMandiriAccount, null)

  const namaAkun = new Map(akun.map((a) => [a.id, a] as const))

  const aktif = langganan.filter((s) => s.status === 'active')
  const riwayat = langganan.filter((s) => s.status !== 'active')
  const idAktif = new Set(aktif.map((s) => s.profile_id))
  const menunggu = akun.filter((a) => !idAktif.has(a.id))

  function jalankan(aksi: () => Promise<{ error: string } | null>) {
    setPesan(null)
    startTransition(async () => {
      const hasil = await aksi()
      if (hasil?.error) setPesan(hasil.error)
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Langganan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Akses SORA dan GAMA untuk pelanggan di luar bimbel. Murid bimbel tidak perlu
          berlangganan — aksesnya sudah ikut akun keluarganya.
        </p>
      </div>

      {(pesan || aktivasiState?.error || akunState?.error) && (
        <p className="text-sm text-red-600">
          {pesan ?? aktivasiState?.error ?? akunState?.error}
        </p>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Menunggu aktivasi ({menunggu.length})
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Akun yang sudah terdaftar tapi belum punya langganan aktif.
        </p>

        {menunggu.length === 0 ? (
          <p className="text-sm text-gray-400 py-6">Tidak ada yang menunggu.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {menunggu.map((a) => (
              <details key={a.id} className="rounded-xl border border-slate-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">{a.full_name}</span>
                    <span className="block text-xs text-gray-400 truncate">{a.email}</span>
                  </span>
                  <span className="text-xs font-medium text-blue-600 shrink-0">Aktifkan</span>
                </summary>

                <form action={aktivasiAction} className="border-t border-slate-100 p-4 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="profile_id" value={a.id} />
                  <label className="text-sm">
                    <span className="block text-xs text-gray-500 mb-1">Produk</span>
                    <select name="product" defaultValue="sora" className="w-full rounded-lg border-slate-200 text-sm">
                      <option value="sora">SORA</option>
                      <option value="gama">GAMA</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="block text-xs text-gray-500 mb-1">Lama (bulan)</span>
                    <input name="bulan" type="number" min={1} max={24} defaultValue={1} className="w-full rounded-lg border-slate-200 text-sm" />
                  </label>
                  <label className="text-sm">
                    <span className="block text-xs text-gray-500 mb-1">Nominal (opsional)</span>
                    <input name="amount" type="number" min={0} step={1000} className="w-full rounded-lg border-slate-200 text-sm" />
                  </label>
                  <label className="text-sm">
                    <span className="block text-xs text-gray-500 mb-1">No. rujukan transfer</span>
                    <input name="reference" className="w-full rounded-lg border-slate-200 text-sm" />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="block text-xs text-gray-500 mb-1">Catatan</span>
                    <input name="note" className="w-full rounded-lg border-slate-200 text-sm" />
                  </label>
                  <button
                    type="submit"
                    className="sm:col-span-2 min-h-10 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Aktifkan langganan
                  </button>
                </form>
              </details>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Aktif ({aktif.length})
        </h2>

        {aktif.length === 0 ? (
          <p className="text-sm text-gray-400 py-6">Belum ada langganan aktif.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {aktif.map((s) => {
              const a = namaAkun.get(s.profile_id)
              const sisa = sisaHari(s.ends_at)
              return (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900">
                      {a?.full_name ?? 'Akun terhapus'}{' '}
                      <span className="text-xs font-normal text-gray-400 uppercase">{s.product}</span>
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {tanggal(s.starts_at)} – {tanggal(s.ends_at)}
                      {sisa !== null && (
                        <span className={sisa <= 7 ? ' text-amber-600 font-medium' : ''}>
                          {' · '}
                          {sisa < 0 ? 'sudah lewat' : `berakhir dalam ${sisa} hari`}
                        </span>
                      )}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => jalankan(() => extendSubscription(s.id, 1))}
                    className="text-xs font-medium text-blue-600 disabled:opacity-50"
                  >
                    +1 bulan
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => jalankan(() => stopSubscription(s.id))}
                    className="text-xs font-medium text-red-600 disabled:opacity-50"
                  >
                    Hentikan
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {riwayat.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Riwayat ({riwayat.length})
          </h2>
          <div className="mt-3 space-y-2">
            {riwayat.map((s) => {
              const a = namaAkun.get(s.profile_id)
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-700">
                      {a?.full_name ?? 'Akun terhapus'}{' '}
                      <span className="text-xs text-gray-400 uppercase">{s.product}</span>
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {tanggal(s.starts_at)} – {tanggal(s.ends_at)}
                    </span>
                  </span>
                  <span
                    className={`inline-flex whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      STATUS[s.status] ?? 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Buat akun langganan
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Untuk yang mendaftar langsung di tempat — dan untuk menguji seluruh jalurnya sebelum
          pendaftaran mandiri dibuka.
        </p>
        <form action={akunAction} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input name="full_name" placeholder="Nama lengkap" className="rounded-lg border-slate-200 text-sm" />
          <input name="email" type="email" placeholder="Email" className="rounded-lg border-slate-200 text-sm" />
          <input name="password" type="password" placeholder="Password (min. 8)" className="rounded-lg border-slate-200 text-sm" />
          <button
            type="submit"
            className="sm:col-span-3 min-h-10 rounded-lg border border-slate-200 bg-white text-sm font-medium text-gray-700 hover:bg-slate-50 transition-colors"
          >
            Buat akun
          </button>
        </form>
      </section>
    </div>
  )
}
