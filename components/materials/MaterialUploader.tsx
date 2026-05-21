'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addFileMaterial, addLinkMaterial } from '@/lib/actions/materials'
import { useRouter } from 'next/navigation'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'video/mp4',
]
const MAX_SIZE = 50 * 1024 * 1024

export default function MaterialUploader({
  sessionId,
  tutorId,
  classId,
}: {
  sessionId: string
  tutorId: string
  classId: string
}) {
  const [tab, setTab] = useState<'file' | 'link'>('file')

  // File state
  const [fileTitle, setFileTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Link state
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [savingLink, setSavingLink] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Tipe file tidak didukung. Gunakan PDF, Word, PPT, Excel, gambar, atau MP4.')
      return
    }
    if (f.size > MAX_SIZE) {
      setError('Ukuran file maksimal 50MB.')
      return
    }
    setFile(f)
    setError('')
    if (!fileTitle) setFileTitle(f.name.replace(/\.[^/.]+$/, ''))
  }

  async function handleUploadFile() {
    if (!file || !fileTitle.trim()) {
      setError('Judul dan file wajib diisi.')
      return
    }
    setUploading(true)
    setError('')
    setSuccess('')
    setProgress(0)

    const ext = file.name.split('.').pop()
    const filePath = `${tutorId}/${classId}/${sessionId}/${Date.now()}.${ext}`

    setProgress(30)
    const { error: uploadError } = await supabase.storage
      .from('session-materials')
      .upload(filePath, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }
    setProgress(80)

    const result = await addFileMaterial(sessionId, {
      title: fileTitle.trim(),
      file_path: filePath,
      file_size_bytes: file.size,
      mime_type: file.type,
    })

    if (result.error) {
      setError(result.error)
      setUploading(false)
      return
    }

    setSuccess('Materi berhasil diupload!')
    setFileTitle('')
    setFile(null)
    setProgress(0)
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    router.refresh()
  }

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

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => { setTab('file'); setError(''); setSuccess('') }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Upload File
        </button>
        <button
          onClick={() => { setTab('link'); setError(''); setSuccess('') }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'link' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Tambah Link
        </button>
      </div>

      {tab === 'file' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Judul Materi</label>
            <input
              type="text"
              value={fileTitle}
              onChange={e => setFileTitle(e.target.value)}
              placeholder="Contoh: Slide Pertemuan 1 - Kinematika"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
            />
            {file && (
              <p className="text-xs text-gray-400 mt-1">
                {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
          {uploading && (
            <div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}% terupload</p>
            </div>
          )}
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}
          <button
            onClick={handleUploadFile}
            disabled={uploading || !file}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? `Mengupload ${progress}%...` : 'Upload Materi'}
          </button>
        </div>
      )}

      {tab === 'link' && (
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
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingLink ? 'Menyimpan...' : 'Simpan Link'}
          </button>
        </div>
      )}
    </div>
  )
}
