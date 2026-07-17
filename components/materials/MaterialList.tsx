'use client'

import { useState, useTransition } from 'react'
import { deleteMaterial, getSignedUrl } from '@/lib/actions/materials'

type DeleteAction = (materialId: string, filePath: string | null, sessionId: string) => Promise<{ error?: string }>
type SignedUrlAction = (filePath: string) => Promise<{ error?: string; url?: string }>

interface MaterialItem {
  id: string
  title: string
  file_path: string | null
  link_url: string | null
  mime_type: string | null
  file_size_bytes: number | null
  created_at: string
}

function fileIcon(mime: string | null) {
  if (!mime) return '📄'
  if (mime.includes('pdf')) return '📕'
  if (mime.includes('word')) return '📘'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '📙'
  if (mime.includes('sheet') || mime.includes('excel')) return '📗'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.startsWith('video/')) return '🎥'
  return '📄'
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function MaterialList({
  materials,
  sessionId,
  readOnly = false,
  deleteAction = deleteMaterial,
  signedUrlAction = getSignedUrl,
}: {
  materials: MaterialItem[]
  sessionId: string
  readOnly?: boolean
  deleteAction?: DeleteAction
  signedUrlAction?: SignedUrlAction
}) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  if (materials.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500 border border-slate-200 rounded-xl">
        Belum ada materi untuk sesi ini.
      </div>
    )
  }

  async function handleDownload(filePath: string, title: string) {
    const result = await signedUrlAction(filePath)
    if (result.error) { setError(result.error); return }
    const a = document.createElement('a')
    a.href = result.url!
    a.download = title
    a.click()
  }

  function handleDelete(materialId: string, filePath: string | null) {
    if (!confirm('Hapus materi ini?')) return
    setDeletingId(materialId)
    startTransition(async () => {
      const result = await deleteAction(materialId, filePath, sessionId)
      if (result.error) setError(result.error)
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {materials.map(m => {
        const isLink = !!m.link_url

        return (
          <div key={m.id} className="border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{isLink ? '🔗' : fileIcon(m.mime_type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isLink ? (
                  <span className="text-blue-500 truncate block">{m.link_url}</span>
                ) : (
                  <>
                    {new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {m.file_size_bytes ? ` • ${formatSize(m.file_size_bytes)}` : ''}
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {isLink ? (
                <a
                  href={m.link_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Buka
                </a>
              ) : (
                <button
                  onClick={() => handleDownload(m.file_path!, m.title)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Unduh
                </button>
              )}
              {!readOnly && (
                <button
                  onClick={() => handleDelete(m.id, m.file_path)}
                  disabled={isPending && deletingId === m.id}
                  className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
