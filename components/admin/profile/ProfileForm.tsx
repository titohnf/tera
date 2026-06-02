'use client'

import { useActionState } from 'react'
import { updateProfile, changePassword } from '@/lib/actions/admin/profile'
import AvatarUpload from '@/components/AvatarUpload'
import { uploadAvatar } from '@/lib/actions/avatar'

export default function ProfileForm({ fullName, phone, email, avatarUrl }: {
  fullName: string
  phone: string
  email: string
  avatarUrl: string | null
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, null)
  const [pwState, pwAction, pwPending] = useActionState(changePassword, null)

  return (
    <div className="space-y-6 max-w-xl">
      {/* Profile info */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Informasi Akun</h2>
        <div className="mb-5 pb-5 border-b border-slate-100">
          <AvatarUpload currentUrl={avatarUrl} name={fullName || 'Pengguna'} uploadAction={uploadAvatar} />
        </div>
        <form action={profileAction} className="space-y-3">
          {profileState && 'error' in profileState && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{profileState.error}</div>
          )}
          {profileState && 'success' in profileState && (
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{profileState.success}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nama Lengkap *</label>
            <input
              name="full_name"
              type="text"
              required
              defaultValue={fullName}
              className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nomor Telepon</label>
            <input
              name="phone"
              type="tel"
              defaultValue={phone}
              placeholder="Opsional"
              className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={profilePending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {profilePending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Ubah Password</h2>
        <form action={pwAction} className="space-y-3">
          {pwState && 'error' in pwState && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{pwState.error}</div>
          )}
          {pwState && 'success' in pwState && (
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{pwState.success}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Password Baru *</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Minimal 8 karakter"
              className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Konfirmasi Password *</label>
            <input
              name="confirm"
              type="password"
              required
              placeholder="Ulangi password baru"
              className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={pwPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {pwPending ? 'Mengubah...' : 'Ubah Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
