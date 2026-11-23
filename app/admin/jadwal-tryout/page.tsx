import { createAdminClient } from '@/lib/supabase/server-admin'
import { aturJadwalTryOut } from '@/lib/actions/admin/peserta-tryout'
import { TRYOUT_PATH } from '@/lib/tryout/alamat'
import { hariWib, infoPaket, jamWib, keInputWib, urutJenjang, urutMapel } from '@/lib/tryout/paket'

export const metadata = { title: 'Jadwal Try Out' }
export const dynamic = 'force-dynamic'

/**
 * Jadwal try out: kapan tombol Mulai bisa diklik, per paket. Try out dikerjakan bersama-sama,
 * jadi misalnya Matematika dibuka pukul 10.00 dan Bahasa Indonesia pukul 11.00. Jam diisi
 * dalam WIB. Sebelum jamnya tombol Mulai di halaman Try Out mati dengan hitung mundur, dan
 * database menolak percobaan yang dimulai lebih awal. "Pantau langsung" membuka Live Monitoring Sora.
 */
export default async function JadwalTryOutPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('quizzes')
    .select('id, title, settings, share_code')
    .eq('kind', 'tryout')
    .eq('status', 'published')
  const paket = ((data ?? []) as { id: string; title: string; settings: Record<string, unknown> | null; share_code: string | null }[])
    .map((q) => ({ id: q.id, judul: q.title, ...infoPaket(q.title, q.settings) }))
    .sort((a, b) => urutJenjang(a.jenjang) - urutJenjang(b.jenjang) || urutMapel(a.mapel) - urutMapel(b.mapel))
  const sekarang = new Date().toISOString()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Jadwal Try Out</h1>
        <p className="mt-1 text-sm text-gray-500">
          Atur kapan tombol Mulai bisa diklik tiap paket (jam WIB). Sebelum jamnya, tombol mati dan menampilkan hitung mundur.
          Kosongkan untuk membuka tanpa menunggu. Sekarang pukul {jamWib(sekarang)} WIB, {hariWib(sekarang)}.
        </p>
      </div>

      {paket.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-gray-500">Belum ada try out yang terbit.</p>
      ) : (
        <div className="space-y-3">
          {paket.map((p) => (
            <form key={p.id} action={aturJadwalTryOut} className="rounded-2xl border border-slate-200 bg-white p-5">
              <input type="hidden" name="quiz_id" value={p.id} />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{p.mapel} <span className="text-gray-500">· {p.jenjang}{p.kelas ? ` Kelas ${p.kelas}` : ''}</span></p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {p.bukaPada
                      ? `Dibuka ${hariWib(p.bukaPada)} pukul ${jamWib(p.bukaPada)} WIB${new Date(p.bukaPada) > new Date() ? '' : ' (sudah lewat)'}`
                      : 'Tanpa jadwal: bisa dimulai kapan saja'}
                    {p.tutupPada ? ` · ditutup ${hariWib(p.tutupPada)} pukul ${jamWib(p.tutupPada)} WIB` : ''}
                  </p>
                </div>
                {/* Live Monitoring ada di Sora (di bawah /tryout, sesi login admin ikut terbawa). `<a>`, bukan Link: itu bukan rute Tera. */}
                <a href={`${TRYOUT_PATH}/dashboard/quizzes/${p.id}/live`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-slate-50">
                  Pantau langsung ↗
                </a>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs text-gray-600">
                  Tombol Mulai aktif mulai
                  <input type="datetime-local" name="opens_at" defaultValue={keInputWib(p.bukaPada)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-gray-900" />
                </label>
                <label className="flex flex-col gap-1 text-xs text-gray-600">
                  Ditutup (kosong = 23.59 hari yang sama)
                  <input type="datetime-local" name="closes_at" defaultValue={keInputWib(p.tutupPada)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-gray-900" />
                </label>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Simpan
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  )
}
