'use client'

import { useState, useTransition } from 'react'
import { sendPasswordResetEmail } from '@/lib/actions/admin/users'

export default function PasswordResetButton({ userId }: { userId: string }) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleReset() {
    startTransition(async () => {
      const result = await sendPasswordResetEmail(userId)
      if (result?.error) {
        setErrorMsg(result.error)
        setStatus('error')
      } else {
        setStatus('success')
      }
    })
  }

  return (
    <div>
      <button
        onClick={handleReset}
        disabled={isPending || status === 'success'}
        className="w-full px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
      >
        {isPending ? 'Mengirim...' : status === 'success' ? 'Link terkirim' : 'Kirim Link Reset Password'}
      </button>
      {status === 'success' && (
        <p className="text-xs text-green-600 mt-1.5">Link reset password telah dikirim ke email pengguna.</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-600 mt-1.5">{errorMsg}</p>
      )}
    </div>
  )
}
