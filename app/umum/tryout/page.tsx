import { jenjangPeserta } from '@/lib/tryout/jenjang-anak'
import { alihkanKeTampilanSiswa, umumContext } from '@/lib/umum'
import { createClient } from '@/lib/supabase/server'
import { nilaiDariHasil } from '@/lib/tryout/nilai-hasil'
import DaftarTryOut, { paketTryOutTerbit } from '@/components/tryout/DaftarTryOut'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'

export const metadata = { title: 'Try Out' }
export const dynamic = 'force-dynamic'

export default async function TryOutUmum() {
  const { kode, studentId } = await umumContext()
  await alihkanKeTampilanSiswa(studentId, (id) => `/siswa/${id}/tryout`)
  const supabase = await createClient()
  const [semuaPaket, { data }, { data: penguji }, jenjang] = await Promise.all([paketTryOutTerbit(supabase), supabase.rpc('hasil_peserta_tryout', { p_kode: kode }), supabase.rpc('peserta_penguji', { p_kode: kode }), jenjangPeserta(kode)])
  // Hanya try out yang ditujukan untuk jenjang peserta; jenjang yang belum diisi menampilkan semuanya.
  const paket = semuaPaket.filter((p) => !jenjang || p.jenjang === jenjang || p.jenjang === 'Lainnya')
  return (
    <div className="space-y-5">
      <DaftarTryOut
        paket={paket}
        hasil={(data as HasilTryOut | null) ?? null}
        nilai={nilaiDariHasil((data as HasilTryOut | null) ?? null)}
        petunjukMasuk="Tekan Mulai, periksa datamu, lalu kerjakan."
        hrefHasil={(id) => `/umum/tryout/${id}`}
        kode={kode}
        lewatiJadwal={penguji === true}
      />
    </div>
  )
}
