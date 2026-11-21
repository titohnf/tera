import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server-admin'
import PohonKompetensi from '@/components/laporan/PohonKompetensi'
import { daftarTryOut, muatTryOut } from '@/lib/reports/tryout-data'
import {
  indikatorTerlemah,
  jumlahTanpaPeta,
  ringkasPerSiswa,
  sisipkanPembanding,
  susunPohon,
  type Simpul,
} from '@/lib/reports/kompetensi-tryout'
import { lepasTautanPercobaan, tautkanPercobaan } from '@/lib/actions/admin/tryout'
import { aturHasilDibuka } from '@/lib/actions/admin/peserta-tryout'

export const metadata = { title: 'Hasil Try Out' }

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Hasil Try Out: analisis kelas menurut kompetensi, dan hasil per siswa.
 *
 * Dua pertanyaan yang dijawab halaman ini: (1) kompetensi mana yang paling
 * lemah di seluruh peserta — rujukan menyusun soal try out berikutnya; (2) di
 * mana setiap siswa kuat dan lemah — rujukan remedial. Susunannya mengikuti
 * halaman daya serap Pusmendik (elemen → sub-elemen → kompetensi → indikator),
 * dengan capaian nasional sebagai pembanding.
 *
 * Peserta mengetik namanya sendiri saat mengerjakan, jadi percobaan harus
 * DITAUTKAN ke siswa Tera di sini sebelum hasilnya muncul di akun keluarga.
 * Tebakan nama diberikan bila semua kata pada nama peserta ada di nama siswa.
 */
export default async function HasilTryOutAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ quiz?: string; attempt?: string }>
}) {
  const { quiz, attempt } = await searchParams

  if (!quiz) {
    const daftar = await daftarTryOut()
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Hasil Try Out</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pilih try out untuk melihat capaian kelas per kompetensi dan hasil tiap siswa.
          </p>
        </div>
        {daftar.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-gray-500">Belum ada try out yang terbit.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {daftar.map((t) => (
              <Link
                key={t.id}
                href={`/admin/hasil-tryout?quiz=${t.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300"
              >
                <p className="font-medium text-gray-900">{t.judul}</p>
                <p className="mt-1 text-sm text-gray-500">{t.jumlahSelesai} peserta sudah mengirim jawaban</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  const data = await muatTryOut(quiz)
  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/hasil-tryout" className="text-sm text-gray-500 underline">← Semua try out</Link>
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-gray-500">Try out tidak ditemukan.</p>
      </div>
    )
  }

  const ids = data.percobaan.map((p) => p.id)
  const pohonKelas = susunPohon(data.soal, data.skor, ids)
  const terlemah = indikatorTerlemah(pohonKelas, 5)
  const tanpaPeta = jumlahTanpaPeta(data.soal)
  const ringkas = ringkasPerSiswa(data.soal, data.skor, ids)
  const nilai = (skor: number | null) => (skor !== null && data.bobotTotal > 0 ? (skor / data.bobotTotal) * 100 : null)
  const rataNilai = ids.length > 0
    ? data.percobaan.reduce((n, p) => n + (nilai(p.skor) ?? 0), 0) / ids.length
    : null

  // Per soal: persen skor kelas dan berapa yang benar penuh.
  const perSoal = data.soal.map((s) => {
    const skorSoal = data.skor.filter((x) => x.questionId === s.id)
    const jumlah = skorSoal.reduce((n, x) => n + x.skor, 0)
    const penuh = skorSoal.filter((x) => x.skor >= s.bobot - 1e-9).length
    return { s, persen: ids.length > 0 ? (jumlah / (s.bobot * ids.length)) * 100 : null, penuh }
  })

  const admin = createAdminClient()
  const { data: kuisPengaturan } = await admin.from('quizzes').select('settings').eq('id', data.id).maybeSingle()
  const hasilDibuka = ((kuisPengaturan as { settings: Record<string, unknown> | null } | null)?.settings ?? {}).hasil_dibuka === true
  const { data: siswaMentah } = await admin
    .from('profiles')
    .select('id, full_name, grade')
    .in('role', ['student', 'mandiri'])
    .eq('is_active', true)
    .order('full_name')
  const siswa = (siswaMentah ?? []) as { id: string; full_name: string | null; grade: string | number | null }[]
  const namaSiswa = new Map(siswa.map((s) => [s.id, s.full_name ?? '(tanpa nama)']))

  /** Tebakan: semua kata pada nama peserta ada di nama siswa, dan hanya satu siswa yang cocok. */
  const tebak = (nama: string): string | null => {
    const kata = nama.toLowerCase().split(/\s+/).filter(Boolean)
    if (kata.length === 0) return null
    const cocok = siswa.filter((s) => {
      const t = (s.full_name ?? '').toLowerCase().split(/\s+/)
      return kata.every((k) => t.includes(k))
    })
    return cocok.length === 1 ? cocok[0].id : null
  }

  // Rincian satu percobaan: pohonnya dibandingkan dengan rata-rata kelas.
  const percobaanDipilih = attempt ? data.percobaan.find((p) => p.id === attempt) : null
  const pohonDipilih = percobaanDipilih
    ? sisipkanPembanding(susunPohon(data.soal, data.skor, [percobaanDipilih.id]), pohonKelas)
    : null

  const namaElemen = pohonKelas.map((e) => e.nama)

  return (
    <div className="space-y-5">
      <Link href="/admin/hasil-tryout" className="text-sm text-gray-500 underline">← Semua try out</Link>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">{data.judul}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ids.length} peserta sudah mengirim jawaban
          {rataNilai !== null && <> · rata-rata nilai <b>{fmt(rataNilai)}</b> dari 100</>}
        </p>
      </div>

      <form action={aturHasilDibuka} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input type="hidden" name="quiz_id" value={data.id} />
        <input type="hidden" name="buka" value={hasilDibuka ? '0' : '1'} />
        <p className="min-w-60 flex-1 text-sm text-gray-700">
          Hasil untuk peserta berkode (halaman Hasil di Sora): <b>{hasilDibuka ? 'sudah dibuka' : 'belum dibuka'}</b>.{' '}
          {hasilDibuka
            ? 'Peserta bisa melihat nilai dan capaian dengan kodenya.'
            : 'Buka setelah semua sesi try out selesai, supaya sesi pertama tidak membocorkan ke sesi berikutnya.'}
        </p>
        <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-slate-50">
          {hasilDibuka ? 'Tutup hasil' : 'Buka hasil untuk peserta'}
        </button>
      </form>

      {data.tanpaKolomKompetensi && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Peta kompetensi belum bisa dibaca: migrasi 224 belum dijalankan. Capaian per kompetensi akan muncul setelah migrasi dijalankan dan petanya dipasang ke soal.
        </p>
      )}
      {!data.tanpaKolomKompetensi && tanpaPeta > 0 && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {tanpaPeta} dari {data.soal.length} soal belum dipetakan ke kompetensi, jadi tidak ikut analisis di bawah.
        </p>
      )}

      {ids.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-gray-500">Belum ada peserta yang mengirim jawaban.</p>
      ) : (
        <>
          {/* Rincian satu percobaan */}
          {percobaanDipilih && pohonDipilih && (
            <section className="rounded-2xl border border-blue-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{percobaanDipilih.nama}</h2>
                  <p className="text-sm text-gray-500">
                    Nilai {nilai(percobaanDipilih.skor) !== null ? fmt(nilai(percobaanDipilih.skor) as number) : '—'} dari 100
                    {percobaanDipilih.studentId && <> · siswa Tera: {namaSiswa.get(percobaanDipilih.studentId)}</>}
                  </p>
                </div>
                <Link href={`/admin/hasil-tryout?quiz=${data.id}`} className="shrink-0 text-sm text-gray-500 underline">Tutup</Link>
              </div>
              <div className="mt-3">
                <PohonKompetensi pohon={pohonDipilih} labelPembanding="Rata-rata kelas" />
              </div>
            </section>
          )}

          {/* Rujukan soal berikutnya */}
          {terlemah.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-gray-900">Indikator terlemah (rujukan soal try out berikutnya)</h2>
              <p className="mt-1 text-sm text-gray-500">Capaian kelas paling rendah. Soal tambahan di indikator ini paling berguna untuk diperbanyak.</p>
              <ol className="mt-3 flex flex-col gap-2">
                {terlemah.map((t, i) => (
                  <li key={t.kunci} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 text-gray-800">
                      <span className="mr-2 text-gray-400">{i + 1}.</span>
                      {t.nama}
                      <span className="ml-2 text-xs text-gray-400">soal no. {t.nomorSoal.join(', ')}</span>
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      <b>{t.persen !== null ? fmt(t.persen) : '—'}%</b>
                      {t.nasional !== null && <span className="ml-2 text-xs text-gray-500">nasional {fmt(t.nasional)}%</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Capaian kelas per kompetensi */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Capaian kelas per kompetensi</h2>
            <p className="mt-1 text-sm text-gray-500">
              Bilah biru = capaian peserta kita, garis hitam = capaian nasional. Ketuk satu baris untuk membuka tingkat di bawahnya.
            </p>
            <div className="mt-3">
              <PohonKompetensi pohon={pohonKelas} />
            </div>
          </section>

          {/* Per soal */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-gray-900">Per soal</h2>
              <p className="mt-1 text-sm text-gray-500">Persen skor kelas pada tiap soal, dan berapa peserta yang benar penuh.</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">No.</th>
                  <th className="px-4 py-2 font-medium">Indikator</th>
                  <th className="px-4 py-2 text-right font-medium">Skor kelas</th>
                  <th className="px-4 py-2 text-right font-medium">Benar penuh</th>
                  <th className="px-4 py-2 text-right font-medium">Nasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perSoal.map(({ s, persen, penuh }) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 tabular-nums text-gray-500">{s.nomor}</td>
                    <td className="px-4 py-2 text-gray-800">{s.kompetensi?.indikator.nama ?? <span className="text-gray-400">belum dipetakan</span>}</td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums">{persen !== null ? `${fmt(persen)}%` : '—'}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-600">{penuh} / {ids.length}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-500">{s.kompetensi?.indikator.nasional != null ? `${fmt(s.kompetensi.indikator.nasional)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Per siswa dan penautan */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-gray-900">Per peserta</h2>
              <p className="mt-1 text-sm text-gray-500">
                Tautkan tiap peserta ke siswa Tera supaya hasilnya muncul di akun keluarga. Tebakan nama sudah diisi bila cocok; periksa sebelum menekan Tautkan.
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {data.percobaan.map((p, i) => {
                const r = ringkas[i]
                const sudah = Boolean(p.studentId)
                const tebakan = sudah ? null : tebak(p.nama)
                return (
                  <div key={p.id} className="space-y-2 px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/admin/hasil-tryout?quiz=${data.id}&attempt=${p.id}`} className="font-medium text-blue-700 hover:underline">
                          {p.nama}
                        </Link>
                        <p className="text-xs text-gray-500">
                          Nilai {nilai(p.skor) !== null ? fmt(nilai(p.skor) as number) : '—'}
                          {r.terlemah.length > 0 && <> · terlemah: {r.terlemah.map((t) => `no. ${t.nomorSoal.join(',')}`).join('; ')}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs tabular-nums text-gray-600">
                        {r.elemen.map((e: Simpul, k) => (
                          <span key={e.kunci} title={namaElemen[k]}>
                            {e.nama.split(' ')[0]} <b>{e.persen !== null ? fmt(e.persen) : '—'}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                    {sudah ? (
                      <form action={lepasTautanPercobaan} className="flex items-center gap-2 text-sm">
                        <input type="hidden" name="attempt_id" value={p.id} />
                        <span className="text-green-700">Tertaut ke {namaSiswa.get(p.studentId as string) ?? 'siswa'}</span>
                        <button type="submit" className="text-xs text-gray-500 underline">Lepas</button>
                      </form>
                    ) : (
                      <form action={tautkanPercobaan} className="flex flex-wrap items-center gap-2 text-sm">
                        <input type="hidden" name="attempt_id" value={p.id} />
                        <input type="hidden" name="quiz_id" value={data.id} />
                        <select name="student_id" defaultValue={tebakan ?? ''} required className="rounded border border-gray-300 px-2 py-1">
                          <option value="">Pilih siswa Tera…</option>
                          {siswa.map((s) => (
                            <option key={s.id} value={s.id}>{s.full_name}{s.grade ? ` (kelas ${s.grade})` : ''}</option>
                          ))}
                        </select>
                        <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">Tautkan</button>
                        {tebakan && <span className="text-xs text-amber-700">tebakan dari nama</span>}
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
