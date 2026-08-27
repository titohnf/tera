'use client'

import { useState } from 'react'
import { addLinkMaterial } from '@/lib/actions/materials'
import { useRouter } from 'next/navigation'

/**
 * Menempelkan bahan ke sebuah sesi — kalau memang masih perlu ditempel.
 *
 * Sejak materi berkumpul di folder Drive bimbel dan rincian sesi menariknya
 * dari sana, topik yang sudah bermateri TIDAK perlu diisi tutor sama sekali.
 * Kolomnya karena itu diisi otomatis dan dikunci: yang muncul justru materi
 * yang akan dilihat keluarga, jadi tutor bisa memastikan bahannya sudah benar
 * tanpa mengetik apa pun.
 *
 * Dikunci, bukan disembunyikan. Kolom yang lenyap tanpa penjelasan berakhir
 * jadi pertanyaan ke admin — "kenapa saya tidak bisa melampirkan materi lagi?"
 * — sedangkan kolom terkunci yang memperlihatkan isinya menjawab pertanyaan itu
 * sebelum sempat ditanyakan.
 *
 * Topik yang BELUM bermateri tetap membuka kolomnya seperti biasa. Selama
 * perpustakaan belum menutup seluruh kurikulum, mencabut jalan tutor berarti
 * bahan yang ada di tangannya tidak punya tempat sama sekali.
 */
export default function MaterialUploader({
  sessionId,
  materiKurikulum = [],
}: {
  sessionId: string
  tutorId: string
  classId: string
  /** Materi dari folder bimbel untuk topik sesi ini. Kosong = tutor mengisi sendiri. */
  materiKurikulum?: { id: string; title: string; groupId: string }[]
}) {
  // Link state
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [savingLink, setSavingLink] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  async function handleSaveLink() {
    setError('')
    setSuccess('')
    setSavingLink(true)
    const result = await addLinkMaterial(sessionId, {
      title: linkTitle,
      link_url: linkUrl,
    })
    setSavingLink(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess('Link berhasil ditambahkan!')
    setLinkTitle('')
    setLinkUrl('')
    router.refresh()
  }

  const dariKurikulum = materiKurikulum.length > 0

  if (dariKurikulum) {
    return (
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Materi topik ini sudah tersedia di Kurikulum dan otomatis muncul untuk
            murid. Tidak perlu ditempel lagi.
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
            Ada bahan lain yang perlu dilampirkan? Sampaikan ke admin agar
            dimasukkan ke Kurikulum, supaya semua murid topik ini mendapatkannya.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Judul</label>
          <input
            type="text"
            value={linkTitle}
            onChange={e => setLinkTitle(e.target.value)}
            placeholder="Contoh: Soal Latihan Google Forms"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">URL / Link</label>
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://docs.google.com/..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}
        <button
          onClick={handleSaveLink}
          disabled={savingLink || !linkTitle.trim() || !linkUrl.trim()}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
        >
          {savingLink ? 'Menyimpan...' : 'Simpan Link'}
        </button>
      </div>
    </div>
  )
}
