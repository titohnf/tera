import { TRYOUT_PATH } from '@/lib/tryout/alamat'
import Link from 'next/link'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'

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
  petunjukMasuk,
  hrefHasil,
  kode,
}: {
  paket: PaketTersedia[]
  hasil: HasilTryOut | null
  petunjukMasuk: string
  /** Halaman hasil satu try out (di Tera, tanpa kode atau login lagi). */
  hrefHasil: (quizId: string) => string
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
            const sudah = buka || tunggu
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{p.judul}</p>
                  <p className={`mt-0.5 text-xs ${sudah ? 'font-medium text-emerald-700' : 'text-gray-500'}`}>
                    {sudah ? 'Kamu sudah mengerjakan try out ini' : petunjukMasuk}
                  </p>
                </div>
                {!sudah && (
                  <a
                    // Satu alamat: Sora ada di bawah /tryout. Peserta berkode dibawa dengan `?kode=`,
                    // akun dengan `?akun=1` (sesinya sudah dibagi), jadi layar Selamat Datang dilewati
                    // dan peserta langsung ke halaman persiapan. `<a>`, bukan Link: itu bukan rute Tera.
                    href={`${TRYOUT_PATH}/q/${p.kode}${kode ? `?kode=${encodeURIComponent(kode)}` : '?akun=1'}`}
                    className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Mulai
                  </a>
                )}
                {sudah && buka && (
                  <Link href={hrefHasil(p.id)} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    Lihat hasil
                  </Link>
                )}
                {sudah && !buka && (
                  <span className="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-500" title="Hasil dibuka setelah semua sesi try out selesai">
                    Hasil belum dibuka
                  </span>
                )}
              </div>
            )
          })
        )}
      </section>

    </div>
  )
}
