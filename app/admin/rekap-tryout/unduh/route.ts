import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { muatRekap, saring } from '@/lib/reports/rekap-tryout'
import { buatXlsx } from '@/lib/xlsx-mini'
import { urutMapel } from '@/lib/tryout/paket'

export const dynamic = 'force-dynamic'

/** Unduhan Excel Rekap Skor. Rute ini TIDAK dilindungi layout admin, jadi perannya diperiksa di sini. */
export async function GET(req: Request) {
  const user = await getUser()
  if (!user) return new NextResponse('Belum masuk', { status: 401 })
  const { data: profil } = await createAdminClient().from('profiles').select('role').eq('id', user.id).single()
  if ((profil as { role: string } | null)?.role !== 'admin') return new NextResponse('Tidak berhak', { status: 403 })

  const u = new URL(req.url)
  const rekap = await muatRekap()
  const jenjang = u.searchParams.get('jenjang')
  const j = jenjang && rekap.jenjang.includes(jenjang) ? jenjang : null
  const kolomMapel = [...new Set(rekap.mapel.filter((m) => !j || m.jenjang === j).map((m) => m.nama))].sort(
    (a, b) => urutMapel(a) - urutMapel(b) || a.localeCompare(b, 'id'),
  )
  const urutMinta = u.searchParams.get('urut') ?? 'rata'
  const urut = urutMinta === 'nama' || urutMinta === 'rata' || kolomMapel.includes(urutMinta) ? urutMinta : 'rata'
  const naik = u.searchParams.get('arah') ? u.searchParams.get('arah') === 'naik' : urut === 'nama'
  const baris = saring(rekap, j, urut, naik)

  const bulat = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10)
  const rekapBaris: (string | number | null)[][] = [
    ['No', 'Nama', 'Asal', 'Jenjang', ...kolomMapel.flatMap((m) => [`${m} (nilai)`, `${m} (skor)`, `${m} (total)`, `${m} (menit)`]), 'Rata-rata'],
    ...baris.map((b, i) => [
      i + 1,
      b.nama,
      b.asal,
      b.jenjang,
      ...kolomMapel.flatMap((m) => {
        const n = b.nilai[m]
        return n ? [bulat(n.nilai), bulat(n.skor), bulat(n.bobot), n.durasiMenit === null ? null : Math.round(n.durasiMenit)] : [null, null, null, null]
      }),
      bulat(b.rata),
    ]),
  ]
  const ringkas: (string | number | null)[][] = [
    ['Jenjang', 'Mata pelajaran', 'Paket', 'Peserta', 'Rata-rata nilai'],
    ...rekap.paket.filter((p) => !j || p.jenjang === j).map((p) => [p.jenjang, p.mapel, p.judul, p.peserta, bulat(p.rata)]),
  ]
  const lebar = [5, 32, 26, 9, ...kolomMapel.flatMap(() => [14, 12, 12, 12]), 12]
  const xlsx = buatXlsx([
    { nama: 'Rekap Skor', baris: rekapBaris, lebar },
    { nama: 'Ringkasan Paket', baris: ringkas, lebar: [9, 20, 44, 10, 16] },
  ])
  const tanggal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  return new NextResponse(new Uint8Array(xlsx), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rekap-skor-tryout-${j ?? 'semua'}-${tanggal}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
