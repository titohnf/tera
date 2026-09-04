'use client'

import { useState, useTransition } from 'react'
import { addLinkMaterialAdmin } from '@/lib/actions/admin/materials'
import { useRouter } from 'next/navigation'

/**
 * Kembaran admin dari `MaterialUploader`, termasuk keadaan terkuncinya.
 *
 * Materi kurikulum tidak pernah menjadi baris `materials`, jadi halaman yang
 * hanya menampilkan lampiran sesi memperlihatkan tab Materi yang kosong untuk
 * topik yang materinya sebenarnya sudah dibaca murid. Admin yang memeriksa
 * keluhan tutor lalu melihat kekosongan itu dan menyimpulkan materinya belum
 * ada — kesimpulan yang salah, dan justru dari layar yang seharusnya menjawab.
 *
 * Berkasnya ditautkan lewat `/api/materi/<id>`, bukan ke Drive: rute itu
 * menyajikan berkasnya dari penyimpanan Tera setelah barisnya lolos RLS
 * (policy 057 untuk admin), jadi admin melihat berkas yang sama dengan yang
 * dibaca murid tanpa perlu punya akses Drive-nya sendiri. Kembaran tutor
 * menautkan berkas yang sama sejak policy `Tutors read learning materials`
 * (migrasi 188) memberi peran tutor hak membacanya.
 */
export default function MaterialUploaderAdmin({
  sessionId,
  materiKurikulum = [],
}: {
  sessionId: string
  /** Materi dari Kurikulum untuk topik sesi ini. Kosong = admin mengisi sendiri. */
  materiKurikulum?: { id: string; title: string; groupId: string }[]
}) {
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSaveLink() {
    setError('')
    setSuccess('')
    startTransition(async () => {
      const result = await addLinkMaterialAdmin(sessionId, { title: linkTitle, link_url: linkUrl })
      if (result.error) { setError(result.error); return }
      setSuccess('Link berhasil ditambahkan!')
      setLinkTitle('')
      setLinkUrl('')
      router.refresh()
    })
  }

  if (materiKurikulum.length > 0) {
    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Materi topik ini sudah tersedia di Kurikulum dan otomatis muncul untuk
            murid. Tutor tidak perlu menempelkannya lagi, dan syarat &ldquo;Materi&rdquo;
            sesi ini sudah terpenuhi olehnya.
          </p>
          {materiKurikulum.map(m => (
            <div key={m.id}>
              <label className="block text-xs font-medium text-gray-600 mb-1">Judul</label>
              <input
                type="text"
                value={m.title}
                disabled
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm text-gray-500 cursor-not-allowed"
              />
              <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">Berkasnya</label>
              <a
                href={`/api/materi/${m.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Buka materi
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p className="text-xs text-gray-400 mt-1">
                Yang dibuka murid: <code className="text-gray-500">/belajar?topik={m.groupId}</code>
              </p>
            </div>
          ))}
          <p className="text-xs text-gray-400">
            Bahan lain untuk topik ini ditambahkan dari Admin &rarr; Kurikulum, supaya
            semua murid topik ini mendapatkannya.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Judul</label>
          <input
            type="text"
            value={linkTitle}
            onChange={e => setLinkTitle(e.target.value)}
            placeholder="Contoh: Soal Latihan Google Forms"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">URL / Link</label>
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://docs.google.com/..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}
        <button
          onClick={handleSaveLink}
          disabled={isPending || !linkTitle.trim() || !linkUrl.trim()}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Link'}
        </button>
      </div>
    </div>
  )
}
