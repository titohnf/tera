import { createAdminClient } from '@/lib/supabase/server-admin'
import { TRYOUT_PATH } from '@/lib/tryout/alamat'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'
import DaftarBerjadwal, { type ItemBerjadwal } from '@/components/tryout/DaftarBerjadwal'
import { judulDenganSeri, nomorSeri } from '@/lib/tryout/judul'
import { infoPaket, type InfoPaket } from '@/lib/tryout/paket'

export interface PaketTersedia extends InfoPaket {
  id: string
  judul: string
  kode: string
  /** Jumlah soal; null bila tidak terbaca. */
  jumlahSoal: number | null
}

/** Try out yang sudah terbit. Dibaca dengan klien biasa; kebijakan "Public reads published quizzes" yang berlaku. */
export async function paketTryOutTerbit(supabase: { from: (t: string) => any }): Promise<PaketTersedia[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data } = await supabase
    .from('quizzes')
    .select('id, title, share_code, settings')
    .eq('kind', 'tryout')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  const terbit = ((data ?? []) as { id: string; title: string; share_code: string | null; settings: Record<string, unknown> | null }[]).filter((q) => q.share_code)

  // Jumlah soal tiap try out: hanya hitungannya yang dibaca (klien admin), bukan isi soalnya.
  const admin = createAdminClient()
  const jumlah = new Map<string, number | null>()
  await Promise.all(
    terbit.map(async (q) => {
      const { count } = await admin.from('questions').select('id', { count: 'exact', head: true }).eq('quiz_id', q.id)
      jumlah.set(q.id, typeof count === 'number' ? count : null)
    }),
  )

  return terbit.map((q) => ({ id: q.id, judul: q.title, kode: q.share_code as string, jumlahSoal: jumlah.get(q.id) ?? null, ...infoPaket(q.title, q.settings) }))
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
  nilai,
}: {
  paket: PaketTersedia[]
  hasil: HasilTryOut | null
  petunjukMasuk: string
  /** Halaman hasil satu try out (di Tera, tanpa kode atau login lagi). */
  hrefHasil: (quizId: string) => string
  kode?: string
  /** Akun penguji: tombol Mulai tidak menunggu jadwal. */
  lewatiJadwal?: boolean
  /** Skor akhir tiap try out yang sudah dikerjakan dan dibuka hasilnya (kunci: id try out). */
  nilai?: Record<string, number | null>
}) {
  const selesaiBuka = new Set((hasil?.paket ?? []).map((p) => p.quiz_id))
  const selesaiTunggu = new Set((hasil?.menunggu ?? []).map((m) => m.quiz_id).filter(Boolean) as string[])
  const judulTunggu = new Set((hasil?.menunggu ?? []).map((m) => m.judul))

  const sekarang = Date.now()
  const awal = (p: PaketTersedia) => `${TRYOUT_PATH}/q/${p.kode}${kode ? `?kode=${encodeURIComponent(kode)}` : '?akun=1'}`

  // `paket` terurut dari yang terbaru dibuat; seri (Try Out I, II, ...) dihitung dari jam buka, lalu waktu dibuat.
  const seri = nomorSeri(paket.map((p, i) => ({ id: p.id, jenjang: p.jenjang, mapel: p.mapel, bukaPada: p.bukaPada, dibuat: paket.length - 1 - i })))

  const item: ItemBerjadwal[] = paket.map((p) => ({
    id: p.id,
    judul: judulDenganSeri(p.judul, seri.get(p.id) ?? 1),
    jenjang: p.jenjang,
    kelas: p.kelas,
    mapel: p.mapel,
    menit: p.menit,
    jumlahSoal: p.jumlahSoal,
    bukaPada: p.bukaPada,
    tutupPada: p.tutupPada,
    keadaan: selesaiBuka.has(p.id) ? 'selesai' : selesaiTunggu.has(p.id) || judulTunggu.has(p.judul) ? 'menunggu' : 'belum',
    hrefMulai: awal(p),
    hrefHasil: hrefHasil(p.id),
    nilai: selesaiBuka.has(p.id) ? (nilai?.[p.id] ?? null) : null,
  }))

  return paket.length === 0 ? (
    <p className="rounded-xl bg-white p-5 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">Belum ada try out. Nanti muncul di sini begitu dibuka.</p>
  ) : (
    <DaftarBerjadwal paket={item} petunjukMasuk={petunjukMasuk} sekarangServer={sekarang} lewatiJadwal={lewatiJadwal} />
  )
}
