'use client'

import { useState } from 'react'
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
  const [terbuka, setTerbuka] = useState<string | null>(materi[0]?.id ?? null)

  // Topik terpilih tidak punya bahan: kartunya tidak muncul sama sekali.
  // "Belum ada materi" adalah kabar yang tidak bisa diperbuat apa-apa oleh anak
  // yang membacanya.
  if (materi.length === 0) return null

  return (
    <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
      <p className="font-semibold tracking-tight text-gray-900">
        Materi{materi.length > 1 ? ` (${materi.length})` : ''}
      </p>
      <p className="mt-0.5 text-sm leading-relaxed text-gray-500">
        Baca atau tonton dulu kalau perlu, baru mulai latihannya.
      </p>

      <div className="mt-3 flex flex-col divide-y divide-gray-100 border-t border-gray-100">
        {materi.map((m) => (
          <Bahan
            key={m.id}
            bahan={m}
            terbuka={terbuka === m.id}
            buka={() => setTerbuka(terbuka === m.id ? null : m.id)}
          />
        ))}
      </div>
    </div>
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

  // Tautan yang tidak bisa disematkan tampil apa adanya sebagai tautan keluar —
  // bukan sebagai bingkai yang diam-diam kosong. Lihat `sematkan()` untuk
  // kenapa penolakan iframe tidak bisa dideteksi dari sini.
  if (sematan.mode === 'tautan') {
    return (
      <a
        href={bahan.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 py-3 hover:text-blue-700"
      >
        <span className="min-w-0 flex-1 text-sm text-gray-900">{bahan.title}</span>
        <span className="shrink-0 text-xs font-medium text-blue-600">Buka →</span>
      </a>
    )
  }

  return (
    <div className="py-3">
      <button
        type="button"
        onClick={buka}
        aria-expanded={terbuka}
        className="flex w-full items-center gap-2 text-left"
      >
        <span aria-hidden className="text-xs text-gray-400">
          {terbuka ? '▾' : '▸'}
        </span>
        <span className="min-w-0 flex-1 text-sm text-gray-900">{bahan.title}</span>
      </button>

      {terbuka && (
        <div className="mt-2">
          <iframe
            src={sematan.src}
            title={bahan.title}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer"
            className={`w-full rounded-lg bg-slate-100 ring-1 ring-gray-900/5 ${
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
            className="mt-1.5 inline-block text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Buka di tab baru →
          </a>
        </div>
      )}
    </div>
  )
}
