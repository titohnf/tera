import { TRYOUT_PATH } from '@/lib/tryout/alamat'
import Link from 'next/link'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'
import TombolMulai from '@/components/tryout/TombolMulai'
import { infoPaket, urutJenjang, urutMapel, type InfoPaket } from '@/lib/tryout/paket'

export interface PaketTersedia extends InfoPaket {
  id: string
  judul: string
  kode: string
}

/** Try out yang sudah terbit. Dibaca dengan klien biasa; kebijakan "Public reads published quizzes" yang berlaku. */
export async function paketTryOutTerbit(supabase: { from: (t: string) => any }): Promise<PaketTersedia[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data } = await supabase
    .from('quizzes')
    .select('id, title, share_code, settings')
    .eq('kind', 'tryout')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  return ((data ?? []) as { id: string; title: string; share_code: string | null; settings: Record<string, unknown> | null }[])
    .filter((q) => q.share_code)
    .map((q) => ({ id: q.id, judul: q.title, kode: q.share_code as string, ...infoPaket(q.title, q.settings) }))
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
  lewatiJadwal = false,
}: {
  paket: PaketTersedia[]
  hasil: HasilTryOut | null
  petunjukMasuk: string
  /** Halaman hasil satu try out (di Tera, tanpa kode atau login lagi). */
  hrefHasil: (quizId: string) => string
  kode?: string
  /** Akun penguji: tombol Mulai tidak menunggu jadwal. */
  lewatiJadwal?: boolean
}) {
  const selesaiBuka = new Set((hasil?.paket ?? []).map((p) => p.quiz_id))
  const selesaiTunggu = new Set((hasil?.menunggu ?? []).map((m) => m.quiz_id).filter(Boolean) as string[])
  const judulTunggu = new Set((hasil?.menunggu ?? []).map((m) => m.judul))

  // Dikelompokkan per jenjang (SD, SMP, ...), di dalamnya per mata pelajaran, supaya anak
  // SD tidak salah membuka paket SMP dan sebaliknya.
  const kelompok = new Map<string, PaketTersedia[]>()
  for (const p of paket) kelompok.set(p.jenjang, [...(kelompok.get(p.jenjang) ?? []), p])
  const jenjangUrut = [...kelompok.keys()].sort((a, b) => urutJenjang(a) - urutJenjang(b))
  const sekarang = Date.now()

  const awal = (p: PaketTersedia) => `${TRYOUT_PATH}/q/${p.kode}${kode ? `?kode=${encodeURIComponent(kode)}` : '?akun=1'}`

  return (
    <div className="space-y-8">
      {paket.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">Belum ada try out yang dibuka.</p>
      ) : (
        jenjangUrut.map((jenjang) => {
          const isi = (kelompok.get(jenjang) ?? []).sort((a, b) => urutMapel(a.mapel) - urutMapel(b.mapel) || a.mapel.localeCompare(b.mapel, 'id'))
          const kelas = isi.find((p) => p.kelas)?.kelas
          return (
            <section key={jenjang} className="space-y-3">
              <div className="flex items-baseline gap-2 border-b border-slate-200 pb-2">
                <h2 className="text-lg font-bold text-gray-900">Try Out {jenjang}</h2>
                {kelas && <span className="text-sm text-gray-500">Kelas {kelas}</span>}
              </div>
              {isi.map((p) => {
                const buka = selesaiBuka.has(p.id)
                const tunggu = selesaiTunggu.has(p.id) || judulTunggu.has(p.judul)
                const sudah = buka || tunggu
                const aksen = urutMapel(p.mapel) === 0 ? 'border-l-blue-600' : urutMapel(p.mapel) === 1 ? 'border-l-amber-500' : 'border-l-slate-400'
                return (
                  <div key={p.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-l-4 bg-white p-4 shadow ring-1 ring-gray-900/5 ${aksen}`}>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-gray-900">{p.mapel}</p>
                      <p className="mt-0.5 text-xs font-medium text-gray-600">
                        {p.jenjang}
                        {p.kelas ? ` · Kelas ${p.kelas}` : ''}
                        {p.menit ? ` · ${p.menit} menit` : ''}
                      </p>
                      <p className={`mt-1 text-xs ${sudah ? 'font-medium text-emerald-700' : 'text-gray-500'}`}>
                        {sudah ? 'Kamu sudah mengerjakan try out ini' : petunjukMasuk}
                      </p>
                    </div>
                    {!sudah && (
                      // Satu alamat: Sora ada di bawah /tryout. Peserta berkode dibawa dengan `?kode=`,
                      // akun dengan `?akun=1` (sesinya sudah dibagi), jadi layar Selamat Datang dilewati.
                      <TombolMulai href={awal(p)} bukaPada={p.bukaPada} tutupPada={p.tutupPada} sekarangServer={sekarang} lewati={lewatiJadwal} />
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
              })}
            </section>
          )
        })
      )}
    </div>
  )
}
