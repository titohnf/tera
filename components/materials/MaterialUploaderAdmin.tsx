'use client'

import { useState, useTransition } from 'react'
import { addLinkMaterialAdmin } from '@/lib/actions/admin/materials'
import { useRouter } from 'next/navigation'

export default function MaterialUploaderAdmin({ sessionId }: { sessionId: string }) {
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
