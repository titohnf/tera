'use client'

import { useRef, useState, useTransition } from 'react'

type UploadAction = (formData: FormData) => Promise<{ error?: string; url?: string }>

export default function AvatarUpload({
  currentUrl,
  name,
  uploadAction,
}: {
  currentUrl: string | null
  name: string
  uploadAction: UploadAction
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setError('')
    const formData = new FormData()
    formData.set('avatar', file)
    startTransition(async () => {
      const result = await uploadAction(formData)
      if (result.error) {
        setError(result.error)
        setPreview(currentUrl)
      }
    })
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity disabled:opacity-60 ring-2 ring-white shadow"
      >
        {preview ? (
          <img src={preview} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-semibold text-slate-500">{initials}</span>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </button>
      <div>
        <p className="text-xs text-gray-400">
          {isPending ? 'Mengupload...' : 'Klik foto untuk mengganti'}
        </p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
