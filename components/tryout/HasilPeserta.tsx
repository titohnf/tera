import { susunPohon, type PetaKompetensi, type SkorAnalisis, type SoalAnalisis } from '@/lib/reports/kompetensi-tryout'
import KemampuanBidang, { topikPerluLatihan } from '@/components/tryout/KemampuanBidang'
import { tautanWaAdmin } from '@/lib/kontak'

export interface SoalHasil {
  id: string
  nomor: number
  bobot: number
  kompetensi: PetaKompetensi | null
  skor: number
  skor_rata: number | null
}
export interface PaketHasil {
  quiz_id: string
  judul: string
  dikirim: string
  skor: number | null
  jumlah_peserta: number
  soal: SoalHasil[]
}
export interface HasilTryOut {
  nama: string | null
  paket: PaketHasil[]
  menunggu: { judul: string; quiz_id?: string }[]
}

const f = (n: number, d = 0) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })

const KARTU = 'rounded-xl bg-white p-5 shadow ring-1 ring-gray-900/5'

/**
 * Hasil satu try out untuk pesertanya sendiri: nilai, capaian per bidang
 * dan topik yang perlu diperkuat. Tanpa pembanding nasional atau peserta lain.
 * Dipakai beranda umum (berkode) dan beranda akun. `ctaHref` mengarah ke
 * halaman langganan milik pemanggil; `ctaKode` mengisi pesan WhatsApp bila ada.
 */
export default function HasilPeserta({ p, nama, ctaHref, kode }: { p: PaketHasil; nama: string; ctaHref: string; kode?: string }) {
  const soal: SoalAnalisis[] = p.soal.map((s) => ({ id: s.id, nomor: s.nomor, bobot: s.bobot, kompetensi: s.kompetensi }))
  const skorSaya: SkorAnalisis[] = p.soal.map((s) => ({ attemptId: 'saya', questionId: s.id, skor: s.skor }))
  const pohon = susunPohon(soal, skorSaya, ['saya'])

  const bobotTotal = p.soal.reduce((a, s) => a + s.bobot, 0)
  const skor = p.skor ?? p.soal.reduce((a, s) => a + s.skor, 0)
  const nilai = bobotTotal > 0 ? (skor / bobotTotal) * 100 : 0

  const terlemah = topikPerluLatihan(pohon, 3)
  const wa = tautanWaAdmin(
    `Halo Bimbel Tera, saya ${nama}${kode ? ` (kode peserta ${kode})` : ''}. Setelah melihat hasil ${p.judul}, saya ingin tahu info berlangganan Tera untuk latihan yang sesuai.`,
  )

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">{p.judul}</h2>

      <div className={`${KARTU} text-center`}>
        <p className="text-sm text-gray-500">Nilai {nama}</p>
        <p className="mt-1 text-5xl font-semibold text-blue-700">{f(nilai, 1)}</p>
        <p className="mt-1 text-sm text-gray-500">
          dari 100 · skor {f(skor, skor % 1 === 0 ? 0 : 1)} dari {f(bobotTotal)}
        </p>
      </div>

      {pohon.length > 0 && (
        <div className={KARTU}>
          <h3 className="text-sm font-semibold text-gray-900">Kemampuan per bidang</h3>
          <div className="mt-4">
            <KemampuanBidang pohon={pohon} />
          </div>
        </div>
      )}

      {terlemah.length > 0 && (
        <div className={KARTU}>
          <h3 className="text-sm font-semibold text-gray-900">Yang paling perlu diperkuat</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-800">
            {terlemah.map((t) => (
              <li key={t.kunci}>{t.nama}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow">
        <h3 className="text-base font-semibold text-blue-900">Mau lebih siap menghadapi TKA?</h3>
        <p className="mt-2 text-sm text-gray-700">
          Hasil di atas menunjukkan bagian mana yang masih bisa dinaikkan. Dengan berlangganan, {nama} bisa berlatih soal dan membuka materi belajar sesuai bidang
          yang masih lemah, lengkap dengan laporan kemajuannya. Semua riwayat try out ini ikut tersimpan.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={ctaHref} className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Lihat langganan
          </a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
            Tanya lewat WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
