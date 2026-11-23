/**
 * Rangka pemuatan (skeleton) per layar siswa. Tiap layar punya rangka yang
 * bentuknya menyerupai isinya — jumlah kartu, tinggi, dan susunan barisnya —
 * supaya layar tidak melompat saat data datang. Dipasang lewat `loading.tsx`
 * di setiap rute; `loading.tsx` di rute yang lebih dalam menggantikan yang di
 * atasnya, jadi tiap layar mendapat rangkanya sendiri.
 */

function Blok({ kelas }: { kelas: string }) {
  return <div className={`shimmer rounded ${kelas}`} />
}

function Pembungkus({ children, label = 'Memuat…' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="space-y-4" aria-busy>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

const KARTU = 'rounded-xl bg-white shadow ring-1 ring-gray-900/5'

/** Beranda: baris sapaan (avatar + nama), hero biru berisi angka kemajuan dan tombol, lalu empat baris menu berikon. */
export function RangkaBeranda() {
  return (
    <Pembungkus>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shimmer rounded-full" />
        <Blok kelas="h-7 w-44" />
      </div>
      <div className="space-y-3 rounded-2xl bg-slate-200/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Blok kelas="h-7 w-52 !bg-white/70" />
            <Blok kelas="h-4 w-24 !bg-white/60" />
          </div>
          <div className="h-14 w-14 shimmer rounded-full" />
        </div>
        <Blok kelas="h-12 w-40 !bg-white/70" />
        <Blok kelas="h-2.5 w-full rounded-full !bg-white/70" />
        <Blok kelas="h-12 w-full rounded-xl !bg-white" />
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className={`flex items-center gap-3.5 p-4 ${KARTU}`}>
          <div className="h-14 w-14 shrink-0 shimmer rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Blok kelas="h-5 w-28" />
            <Blok kelas="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </Pembungkus>
  )
}

/** Pilihan Misi: keterangan lalu dua kartu mapel besar berujung bulat. */
export function RangkaMisi() {
  return (
    <Pembungkus>
      <Blok kelas="h-4 w-64 max-w-full" />
      {[0, 1].map(i => (
        <div key={i} className="space-y-3 rounded-3xl bg-white p-5 shadow ring-1 ring-gray-900/5">
          <div className="h-14 w-14 shimmer rounded-2xl" />
          <Blok kelas="h-7 w-48" />
          <Blok kelas="h-4 w-4/5" />
          <Blok kelas="h-2.5 w-full rounded-full" />
        </div>
      ))}
    </Pembungkus>
  )
}

/** Satu topik Misi: judul, titik kemajuan, lalu kartu langkah dan tombol. */
export function RangkaTopikMisi() {
  return (
    <Pembungkus>
      <div className={`space-y-3 p-5 ${KARTU}`}>
        <Blok kelas="h-3 w-24" />
        <Blok kelas="h-6 w-3/4" />
        <div className="flex gap-2 pt-1">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-3 w-3 shimmer rounded-full" />
          ))}
        </div>
      </div>
      <div className={`space-y-2 p-4 ${KARTU}`}>
        <Blok kelas="h-4 w-1/2" />
        <Blok kelas="h-4 w-full" />
        <Blok kelas="h-11 w-full rounded-xl" />
      </div>
    </Pembungkus>
  )
}

/** Daftar materi: keterangan, lalu kartu berisi kode, judul, dan ringkasan. */
export function RangkaMateri() {
  return (
    <Pembungkus>
      <Blok kelas="h-4 w-52" />
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="space-y-2 rounded-xl bg-white p-4 shadow-kartu">
          <Blok kelas="h-3 w-12" />
          <Blok kelas="h-5 w-3/5" />
          <Blok kelas="h-4 w-full" />
        </div>
      ))}
    </Pembungkus>
  )
}

/** Daftar Try Out: pil saringan jadwal, lalu kartu dengan blok mapel di kiri. */
export function RangkaTryOut() {
  return (
    <Pembungkus>
      <div className="flex gap-2">
        {['w-24', 'w-28', 'w-24'].map((w, i) => (
          <div key={i} className={`h-8 ${w} shimmer rounded-full`} />
        ))}
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="flex overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
          <div className="w-28 shrink-0 shimmer sm:w-36" />
          <div className="min-w-0 flex-1 space-y-2 px-4 py-3">
            <Blok kelas="h-4 w-20 rounded-full" />
            <Blok kelas="h-5 w-4/5" />
            <div className="flex gap-1.5">
              <Blok kelas="h-5 w-16" />
              <Blok kelas="h-5 w-16" />
            </div>
            <Blok kelas="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </Pembungkus>
  )
}

/** Pembahasan try out: kartu judul berisi label, nama, dan lencana; lalu deretan soal. */
export function RangkaPembahasan() {
  return (
    <Pembungkus>
      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-5">
        <Blok kelas="h-3 w-36" />
        <Blok kelas="h-6 w-3/4" />
        <div className="flex gap-1.5">
          <Blok kelas="h-5 w-20" />
          <Blok kelas="h-5 w-24" />
        </div>
        <Blok kelas="h-4 w-1/2" />
      </section>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-kartu">
          <div className="h-9 w-9 shrink-0 shimmer rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Blok kelas="h-4 w-1/2" />
            <Blok kelas="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </Pembungkus>
  )
}

/** Profil: kartu identitas (avatar bulat + nama) lalu baris tindakan. */
export function RangkaProfil() {
  return (
    <Pembungkus>
      <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-kartu">
        <div className="h-12 w-12 shrink-0 shimmer rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Blok kelas="h-5 w-40" />
          <Blok kelas="h-3 w-28" />
        </div>
      </div>
      <Blok kelas="h-12 w-full rounded-xl" />
    </Pembungkus>
  )
}

/** Langganan dan layar kartu-berbaris sejenisnya: keterangan, lalu kartu berisi beberapa baris. */
export function RangkaLangganan() {
  return (
    <Pembungkus>
      <Blok kelas="h-4 w-56 max-w-full" />
      <div className={`space-y-3 p-5 ${KARTU}`}>
        <Blok kelas="h-4 w-full" />
        <Blok kelas="h-4 w-5/6" />
        <Blok kelas="h-4 w-2/3" />
        <Blok kelas="h-10 w-56 max-w-full rounded-full" />
      </div>
    </Pembungkus>
  )
}

/** Viewer materi layar penuh: hanya latar gelapnya, supaya tidak ada kilatan putih. */
export function RangkaViewer() {
  return <div className="fixed inset-0 z-50 bg-[#1f1d19]" aria-busy />
}
