import { redirect } from 'next/navigation'
import { keluargaContext } from '@/lib/keluarga'

/**
 * Pintu masuk portal keluarga — sekarang cuma persinggahan.
 *
 * Halaman ini pernah jadi daftar anak berisi kartu ringkasan: sisa tagihan dan
 * sesi terdekat per anak. Isinya berguna, tapi tempatnya keliru. Memilih anak
 * bukan tujuan kunjungan, ia saklar yang dipakai berulang kali dalam satu
 * kunjungan — dan sebagai layar tersendiri ia memaksa orang tua beranak dua
 * kembali ke sini setiap kali ingin membandingkan sesuatu. Saklarnya kini jadi
 * bilah tab di puncak setiap halaman (`components/keluarga/AnakTabs.tsx`), dan
 * ringkasan yang dulu ada di kartu-kartu itu pindah ke beranda masing-masing
 * anak, di tempat yang bisa ditindaklanjuti.
 *
 * Yang tersisa di sini cuma dua keadaan yang tidak punya rumah lain: keluarga
 * tanpa anak tertaut, dan lemparan ke anak pertama.
 */
export default async function KeluargaHome() {
  const { anak } = await keluargaContext()

  if (anak.length > 0) redirect(`/keluarga/${anak[0].id}`)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
        Belum ada anak yang tertaut ke akun ini. Hubungi admin Tera.
      </p>
    </main>
  )
}
