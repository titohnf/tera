/**
 * Rangka pemuatan portal keluarga — dipakai berkas `loading.tsx` tiap layar.
 *
 * Next menampilkan rangka ini LANGSUNG begitu sebuah tautan diketuk, selagi server masih
 * mengerjakan kuerinya; tanpa itu layar lama tetap terpampang tanpa tanda apa pun sampai
 * semua kuerinya selesai, dan ketukan terasa tidak masuk. Bentuknya sengaja menyerupai
 * isi yang akan menggantikannya (kartu putih berbayang `shadow-kartu`), supaya tidak ada
 * lompatan tata letak saat datanya datang.
 *
 * Murni server component tanpa state: hanya kelas `.shimmer` (lihat `app/globals.css`).
 */

export function Bilah({ lebar = 'w-32', tinggi = 'h-4', kelas = '' }: { lebar?: string; tinggi?: string; kelas?: string }) {
  return <div className={`shimmer rounded ${lebar} ${tinggi} ${kelas}`} />
}

function Bulat({ ukuran = 'h-10 w-10' }: { ukuran?: string }) {
  return <div className={`shimmer shrink-0 rounded-full ${ukuran}`} />
}

function KartuBaris() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-kartu">
      <Bulat />
      <div className="min-w-0 flex-1 space-y-2">
        <Bilah lebar="w-40" />
        <Bilah lebar="w-24" tinggi="h-3" />
      </div>
    </div>
  )
}

/** Layar berisi daftar kartu: tagihan, jadwal, laporan, rapor, penguasaan, notifikasi, profil. */
export function RangkaDaftar({ jumlah = 4 }: { jumlah?: number }) {
  return (
    <div className="space-y-3" aria-busy>
      <span className="sr-only">Memuat…</span>
      <Bilah lebar="w-3/5" tinggi="h-4" kelas="mb-1" />
      {Array.from({ length: jumlah }, (_, i) => <KartuBaris key={i} />)}
    </div>
  )
}

/** Beranda: kartu jadwal berwarna penuh, lalu petak pintasan. */
export function RangkaBeranda() {
  return (
    <div className="space-y-4" aria-busy>
      <span className="sr-only">Memuat beranda…</span>
      <div className="rounded-2xl bg-white p-5 shadow-kartu">
        <Bilah lebar="w-28" tinggi="h-3" />
        <Bilah lebar="w-48" tinggi="h-6" kelas="mt-3" />
        <Bilah lebar="w-40" kelas="mt-2" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-kartu">
            <Bulat ukuran="h-9 w-9" />
            <Bilah lebar="w-12" tinggi="h-3" />
          </div>
        ))}
      </div>
    </div>
  )
}
