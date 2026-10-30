'use client'

import { useState } from 'react'
import { ChevronDown, CirclePlay, ExternalLink, FileText } from 'lucide-react'
import { sematkan, type MateriTopik } from '@/lib/belajar/sematan'

/**
 * Bahan belajar untuk topik yang sedang dipilih, dibaca di tempat.
 *
 * Sebelum ini materi cuma daftar tautan di portal keluarga: menekannya berarti
 * berpindah aplikasi, ke berkas yang tidak tahu anaknya sedang memilih topik
 * apa. Di sini bahannya tampil di halaman yang sama, tepat di atas tombol yang
 * memulai latihannya — baca dulu, baru kerjakan.
 *
 * Sengaja TIDAK ada di dalam sesi yang sedang berjalan. Materi yang bisa
 * diintip di tengah soal mengubah latihan jadi ujian buka buku tanpa ada yang
 * memutuskannya, dan sebagian bahan memuat contoh yang sudah beserta jawabannya.
 */
export default function Materi({ materi }: { materi: MateriTopik[] }) {
  // Yang pertama terbuka, sisanya menunggu diketuk. Tiga bingkai Google yang
  // dimuat sekaligus itu berat di HP, dan cuma satu yang benar-benar dibaca
  // lebih dulu.
  const pertama = materi[0]?.id ?? null
  const [terbuka, setTerbuka] = useState<string | null>(pertama)

  // Komponen ini ikut terpasang sejak daftarnya masih kosong — centangnya belum
  // ditekan — jadi `useState` di atas menyimpan null dan tidak pernah menghitung
  // ulang saat materinya akhirnya datang. Tanpa penyetelan ini kartunya muncul
  // dengan semua isinya tertutup, dan yang pertama tidak pernah jadi yang
  // terbuka seperti yang dijanjikan.
  //
  // Disetel saat render, bukan lewat useEffect, mengikuti anjuran React untuk
  // keadaan turunan: satu render lebih hemat daripada render kedua yang
  // memperbaiki yang pertama.
  const [pertamaSebelumnya, setPertamaSebelumnya] = useState<string | null>(pertama)
  if (pertama !== pertamaSebelumnya) {
    setPertamaSebelumnya(pertama)
    setTerbuka(pertama)
  }

  // Topik terpilih tidak punya bahan: kartunya tidak muncul sama sekali.
  // "Belum ada materi" adalah kabar yang tidak bisa diperbuat apa-apa oleh anak
  // yang membacanya.
  if (materi.length === 0) return null

  return (
    <div className="space-y-2.5">
      {materi.map((m) => (
        <Bahan
          key={m.id}
          bahan={m}
          terbuka={terbuka === m.id}
          buka={() => setTerbuka(terbuka === m.id ? null : m.id)}
        />
      ))}
    </div>
  )
}

/** Ubin ikon bahan: video atau bacaan, supaya jenisnya terbaca sebelum dibuka. */
function IkonBahan({ video }: { video: boolean }) {
  const Ikon = video ? CirclePlay : FileText
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        video ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
      }`}
      aria-hidden
    >
      <Ikon className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </span>
  )
}

function Bahan({
  bahan,
  terbuka,
  buka,
}: {
  bahan: MateriTopik
  terbuka: boolean
  buka: () => void
}) {
  const sematan = sematkan(bahan.link_url)
  const kartu = 'overflow-hidden rounded-lg bg-white shadow-kartu'

  // Tautan yang tidak bisa disematkan tampil apa adanya sebagai tautan keluar —
  // bukan sebagai bingkai yang diam-diam kosong. Lihat `sematkan()` untuk
  // kenapa penolakan iframe tidak bisa dideteksi dari sini.
  if (sematan.mode === 'tautan') {
    return (
      <a
        href={bahan.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${kartu} flex items-center gap-3 p-3 transition hover:bg-slate-50`}
      >
        <IkonBahan video={false} />
        <span className="min-w-0 flex-1 text-sm font-medium text-gray-900">{bahan.title}</span>
        <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      </a>
    )
  }

  return (
    <div className={kartu}>
      <button
        type="button"
        onClick={buka}
        aria-expanded={terbuka}
        className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-slate-50"
      >
        <IkonBahan video={sematan.rasio === 'video'} />
        <span className="min-w-0 flex-1 text-sm font-medium text-gray-900">{bahan.title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${terbuka ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {terbuka && (
        <div className="border-t border-slate-900/[0.05] p-3">
          <iframe
            src={sematan.src}
            title={bahan.title}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer"
            className={`w-full rounded-md bg-slate-100 ring-1 ring-gray-900/5 ${
              sematan.rasio === 'video' ? 'aspect-video' : 'h-[60vh]'
            }`}
          />
          {/* Wajib ada. Berkas Drive yang belum dibagikan "siapa saja yang
              punya link" memunculkan layar login Google di dalam bingkai, dan
              itu tidak bisa kita ketahui dari sini — tautan ini yang membuat
              bingkai gagal tidak pernah jadi jalan buntu. */}
          <a
            href={bahan.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Buka di tab baru
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      )}
    </div>
  )
}
