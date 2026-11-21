import { SORA_TRYOUT_URL } from '@/lib/tryout/alamat'
import HasilPeserta, { type HasilTryOut } from '@/components/tryout/HasilPeserta'

export interface PaketTersedia {
  id: string
  judul: string
  kode: string
}

/** Try out yang sudah terbit. Dibaca dengan klien biasa; kebijakan "Public reads published quizzes" yang berlaku. */
export async function paketTryOutTerbit(supabase: { from: (t: string) => any }): Promise<PaketTersedia[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data } = await supabase
    .from('quizzes')
    .select('id, title, share_code')
    .eq('kind', 'tryout')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  return ((data ?? []) as { id: string; title: string; share_code: string | null }[])
    .filter((q) => q.share_code)
    .map((q) => ({ id: q.id, judul: q.title, kode: q.share_code as string }))
}

/**
 * Halaman Try Out: try out yang tersedia (dengan statusnya bagi orang ini) dan
 * hasilnya. Mengerjakan terjadi di Sora; di sini orang hanya memilih lalu
 * dibawa ke sana. `petunjukMasuk` mengatakan cara masuk di layar Sora (kode
 * atau akun).
 */
export default function DaftarTryOut({
  paket,
  hasil,
  nama,
  petunjukMasuk,
  ctaHref,
  kode,
}: {
  paket: PaketTersedia[]
  hasil: HasilTryOut | null
  nama: string
  petunjukMasuk: string
  ctaHref: string
  kode?: string
}) {
  const selesaiBuka = new Set((hasil?.paket ?? []).map((p) => p.quiz_id))
  const selesaiTunggu = new Set((hasil?.menunggu ?? []).map((m) => m.quiz_id).filter(Boolean) as string[])
  const judulTunggu = new Set((hasil?.menunggu ?? []).map((m) => m.judul))

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Try out</h2>
        {paket.length === 0 ? (
          <p className="rounded-xl bg-white p-5 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">Belum ada try out yang dibuka.</p>
        ) : (
          paket.map((p) => {
            const buka = selesaiBuka.has(p.id)
            const tunggu = selesaiTunggu.has(p.id) || judulTunggu.has(p.judul)
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{p.judul}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {buka ? 'Selesai · hasil ada di bawah' : tunggu ? 'Sudah dikerjakan · hasil belum dibuka' : petunjukMasuk}
                  </p>
                </div>
                {!buka && !tunggu && (
                  <a
                    href={`${SORA_TRYOUT_URL}/q/${p.kode}`}
                    className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Mulai
                  </a>
                )}
              </div>
            )
          })
        )}
      </section>

      {(hasil?.paket ?? []).length > 0 && (
        <section className="space-y-8">
          <h2 className="text-base font-semibold text-gray-900">Hasil</h2>
          {(hasil?.paket ?? []).map((p) => (
            <HasilPeserta key={p.quiz_id} p={p} nama={hasil?.nama ?? nama} ctaHref={ctaHref} kode={kode} />
          ))}
        </section>
      )}
    </div>
  )
}
