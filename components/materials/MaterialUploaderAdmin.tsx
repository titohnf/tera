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
              <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">URL / Link</label>
              <input
                type="text"
                value={`/belajar?topik=${m.groupId}`}
                disabled
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm text-gray-500 cursor-not-allowed"
              />
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
