import Link from 'next/link'
import { umumContext } from '@/lib/umum'
import { createClient } from '@/lib/supabase/server'
import DaftarTryOut, { paketTryOutTerbit } from '@/components/tryout/DaftarTryOut'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'

export const metadata = { title: 'Try Out' }
export const dynamic = 'force-dynamic'

export default async function TryOutUmum() {
  const { kode, nama } = await umumContext()
  const supabase = await createClient()
  const [paket, { data }] = await Promise.all([paketTryOutTerbit(supabase), supabase.rpc('hasil_peserta_tryout', { p_kode: kode })])
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
        nama={nama}
        petunjukMasuk={`Di layar masuk, pilih "Kode peserta" lalu masukkan ${kode}.`}
        ctaHref="/umum/langganan"
        kode={kode}
      />
    </div>
  )
}
