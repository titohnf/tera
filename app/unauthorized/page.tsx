import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Akses Tidak Diizinkan</h1>
        <p className="text-sm text-gray-500 mb-6">
          Akun kamu belum memiliki akses ke halaman ini. Pastikan role sudah diatur dengan benar oleh admin.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Kembali ke Login
        </Link>
      </div>
    </div>
  )
}
