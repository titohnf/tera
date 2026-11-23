import { headers } from 'next/headers'
import { hostUntuk } from '@/lib/tampilan'
import { alihkanKeTampilanSiswa, umumContext } from '@/lib/umum'
import { tautanWaAdmin } from '@/lib/kontak'
import KartuAplikasi from '@/components/apps/KartuAplikasi'

/**
 * Beranda peserta umum (masuk dengan kode): empat kartu yang sama dengan
 * beranda langganan, tetapi hanya Try Out yang terbuka. Tiga lainnya TAMPIL
 * terkunci dan menuju halaman langganan — yang tidak melihatnya tidak tahu ada
 * yang bisa didapat.
 */
export default async function BerandaUmum() {
  const { namaPendek, punyaAkun, studentId, kode, nama } = await umumContext()
  await alihkanKeTampilanSiswa(studentId, (id) => `/siswa/${id}`)
  // Misi dan Materi dibuka dengan email di alamat app (login kode hanya di alamat sora), jadi tautannya
  // dihitung dari hostname: sora. -> app., sora-bimbeltera.vercel.app -> bimbeltera.vercel.app.
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const hostApp = hostUntuk(host, 'app')
  const protokol = h.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https')
  const hrefApp = hostApp ? `${protokol}://${hostApp}/login` : '/login'
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Halo, {namaPendek}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pilih yang mau kamu kerjakan hari ini.</p>
      </div>

      {punyaAkun ? (
        // Siswa bimbel yang masuk dengan kode: kartunya sama, tetapi mereka sudah berlangganan, jadi
        // yang tertutup bukan soal langganan. Kodenya hanya membuka Try Out; sisanya lewat email.
        <>
          <KartuAplikasi nama="Misi" keterangan="Masuk dengan email" teks="Buka di alamat app dengan email dan passwordmu." href={hrefApp} terkunci ikon="bullseye-bk" />
          <KartuAplikasi nama="Materi" keterangan="Masuk dengan email" teks="Buka di alamat app dengan email dan passwordmu." href={hrefApp} terkunci ikon="books-bk" />
        </>
      ) : (
        <>
          <KartuAplikasi nama="Misi" keterangan="Belum aktif" teks="Aktifkan langganan untuk membuka Misi." href="/umum/langganan" terkunci ikon="bullseye-bk" />
          <KartuAplikasi nama="Materi" keterangan="Belum aktif" teks="Aktifkan langganan untuk membuka Materi." href="/umum/langganan" terkunci ikon="books-bk" />
        </>
      )}
      <KartuAplikasi nama="Try Out" teks="Uji kemampuanmu lewat try out TKA." href="/umum/tryout" ikon="trophy-bk" />

      {punyaAkun ? (
        <p className="pt-2 text-center text-sm text-gray-500">
          Masuk dengan kode hanya membuka Try Out. Untuk yang lain, masuk dengan email dan passwordmu.
        </p>
      ) : (
        <p className="pt-2 text-center text-sm text-gray-500">
          Mau berlangganan Misi dan Materi?{' '}
          <a
            href={tautanWaAdmin(`Halo Bimbel Tera, saya ${nama} (kode peserta ${kode}). Saya ingin berlangganan Tera.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-green-700 hover:underline"
          >
            Chat admin lewat WhatsApp
          </a>
        </p>
      )}
    </div>
  )
}
