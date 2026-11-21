import { createAdminClient } from '@/lib/supabase/server-admin'
import { tambahPesertaTryOut, tautkanPesertaKeSiswa } from '@/lib/actions/admin/peserta-tryout'

export const metadata = { title: 'Peserta Try Out' }
export const dynamic = 'force-dynamic'

const SORA_URL = (process.env.NEXT_PUBLIC_SORA_TRYOUT_URL ?? 'https://sora-bimbeltera.vercel.app').replace(/\/$/, '')

interface Peserta {
  id: string
  name: string
  access_code: string | null
  sekolah: string | null
  jenjang: string | null
  nama_wali: string | null
  wa: string | null
  profile_id: string | null
  created_at: string
}

/**
 * Peserta Try Out: murid dari luar bimbel yang masuk dengan kode (bukan akun).
 *
 * Kodenya dibagikan lewat WhatsApp dan dipakai di setiap try out berikutnya,
 * jadi riwayat mereka terkumpul di satu tempat. Saat mereka berlangganan dan
 * punya akun Tera, "Tautkan" memindahkan seluruh riwayat ke siswa itu — tidak
 * ada pencocokan nama.
 */
export default async function PesertaTryOutPage() {
  const admin = createAdminClient()

  const { data: pesertaMentah } = await admin
    .from('learners')
    .select('id, name, access_code, sekolah, jenjang, nama_wali, wa, profile_id, created_at')
    .or('profile_id.is.null,wa.not.is.null')
    .order('created_at', { ascending: false })
  const peserta = (pesertaMentah ?? []) as Peserta[]

  const ids = peserta.map((p) => p.id)
  const selesai = new Map<string, number>()
  if (ids.length > 0) {
    const { data: percobaan } = await admin
      .from('attempts')
      .select('learner_id')
      .in('learner_id', ids)
      .not('submitted_at', 'is', null)
    for (const a of (percobaan ?? []) as { learner_id: string }[]) selesai.set(a.learner_id, (selesai.get(a.learner_id) ?? 0) + 1)
  }

  const profilTertaut = new Map<string, string>()
  const idProfil = peserta.map((p) => p.profile_id).filter((x): x is string => !!x)
  if (idProfil.length > 0) {
    const { data: pr } = await admin.from('profiles').select('id, full_name').in('id', idProfil)
    for (const p of (pr ?? []) as { id: string; full_name: string | null }[]) profilTertaut.set(p.id, p.full_name ?? 'Siswa')
  }

  const { data: siswaMentah } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('role', ['student', 'mandiri'])
    .order('full_name')
  const siswa = ((siswaMentah ?? []) as { id: string; full_name: string | null }[]).filter((s) => s.full_name)

  const { data: paket } = await admin
    .from('quizzes')
    .select('title, share_code')
    .eq('kind', 'tryout')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
  const tautanTryOut = paket?.[0]?.share_code ? `${SORA_URL}/q/${paket[0].share_code}` : SORA_URL

  const pesan = (p: Peserta) =>
    `Assalamu'alaikum Bapak/Ibu${p.nama_wali ? ' ' + p.nama_wali : ''}. Berikut kode peserta Try Out TKA Bimbel Tera untuk ${p.name}: *${p.access_code}*. ` +
    `Buka ${tautanTryOut}, pilih "Kode peserta", lalu masukkan kode tersebut. Kode ini juga dipakai untuk try out berikutnya. Terima kasih.`

  const pesanHasil = (p: Peserta) =>
    `Assalamu'alaikum Bapak/Ibu${p.nama_wali ? ' ' + p.nama_wali : ''}. Hasil Try Out TKA Bimbel Tera untuk ${p.name} sudah bisa dilihat di ${SORA_URL}/hasil/${p.access_code} ` +
    `(atau buka ${SORA_URL}/hasil dan masukkan kode ${p.access_code}). Terima kasih.`

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Peserta Try Out</h1>
        <p className="mt-1 text-sm text-gray-500">
          Murid dari luar bimbel masuk dengan kode peserta. Kirim kodenya lewat WhatsApp, dan tautkan ke akun siswa saat
          mereka berlangganan supaya seluruh riwayat try out ikut.
        </p>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-medium text-gray-900">+ Tambah peserta</summary>
        <form action={tambahPesertaTryOut} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Nama lengkap siswa
            <input name="nama" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Asal sekolah
            <input name="sekolah" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Jenjang
            <select name="jenjang" defaultValue="" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">—</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Nama orang tua/wali
            <input name="nama_wali" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700 sm:col-span-2">
            Nomor WhatsApp orang tua
            <input name="wa" inputMode="tel" placeholder="0812…" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Simpan dan buat kode
            </button>
          </div>
        </form>
      </details>

      {peserta.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-gray-500">Belum ada peserta dari luar bimbel.</p>
      ) : (
        <div className="space-y-3">
          {peserta.map((p) => {
            const tertaut = p.profile_id ? profilTertaut.get(p.profile_id) ?? 'Siswa' : null
            const n = selesai.get(p.id) ?? 0
            return (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {[p.sekolah, p.jenjang].filter(Boolean).join(' · ') || 'Sekolah belum diisi'}
                      {p.nama_wali ? ` · wali: ${p.nama_wali}` : ''}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {n} try out selesai{tertaut ? ` · tertaut ke ${tertaut}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {p.access_code ? (
                      <p className="font-mono text-lg font-semibold tracking-widest text-gray-900">{p.access_code}</p>
                    ) : (
                      <p className="text-sm text-gray-400">kode dipensiunkan</p>
                    )}
                    {p.access_code && p.wa && (
                      <a
                        href={`https://wa.me/${p.wa}?text=${encodeURIComponent(pesan(p))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm font-medium text-green-700 hover:underline"
                      >
                        Kirim kode lewat WhatsApp
                      </a>
                    )}
                    {p.access_code && p.wa && n > 0 && (
                      <a
                        href={`https://wa.me/${p.wa}?text=${encodeURIComponent(pesanHasil(p))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-sm font-medium text-blue-700 hover:underline"
                      >
                        Kirim tautan hasil lewat WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {!p.profile_id && (
                  <form action={tautkanPesertaKeSiswa} className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <input type="hidden" name="learner_id" value={p.id} />
                    <select name="student_id" required defaultValue="" className="min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="" disabled>
                        Tautkan ke siswa Tera…
                      </option>
                      {siswa.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-slate-50">
                      Tautkan
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
