import Link from 'next/link'
import { alihkanKeTampilanSiswa, umumContext } from '@/lib/umum'
import { createClient } from '@/lib/supabase/server'
import DaftarTryOut, { paketTryOutTerbit } from '@/components/tryout/DaftarTryOut'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'

export const metadata = { title: 'Try Out' }
export const dynamic = 'force-dynamic'

export default async function TryOutUmum() {
  const { kode, studentId } = await umumContext()
  await alihkanKeTampilanSiswa(studentId, (id) => `/siswa/${id}/tryout`)
  const supabase = await createClient()
  const [paket, { data }, { data: penguji }] = await Promise.all([paketTryOutTerbit(supabase), supabase.rpc('hasil_peserta_tryout', { p_kode: kode }), supabase.rpc('peserta_penguji', { p_kode: kode })])
  return (
    <div className="space-y-5">
      <Link href="/umum" className="text-sm text-gray-500 underline">← Beranda</Link>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Try Out</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Kode pesertamu: <span className="font-mono font-semibold tracking-widest text-gray-900">{kode}</span>
        </p>
      </div>
      <DaftarTryOut
        paket={paket}
        hasil={(data as HasilTryOut | null) ?? null}
        petunjukMasuk="Tekan Mulai, periksa datamu, lalu kerjakan."
        hrefHasil={(id) => `/umum/tryout/${id}`}
        kode={kode}
        lewatiJadwal={penguji === true}
      />
    </div>
  )
}
