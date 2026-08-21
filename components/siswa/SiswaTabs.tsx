import Link from 'next/link'

/**
 * Bilah tab murid, dipakai halaman admin dan portal keluarga.
 *
 * Kedua halaman kini memberi daftar tab yang sama — Kelas, Tagihan, Laporan —
 * hanya tautannya yang berbeda arah. Daftarnya tetap diberikan pemanggil, bukan
 * dikunci di sini, karena pemanggillah yang tahu jumlah isi tiap tab dan ke mana
 * tautannya menuju.
 */
export default function SiswaTabs({
  tabs,
  active,
  hrefFor,
}: {
  tabs: { key: string; label: string; count?: number }[]
  active: string
  hrefFor: (key: string) => string
}) {
  return (
    <div className="flex border-b border-slate-100 overflow-x-auto">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={hrefFor(t.key)}
          className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            active === t.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                active === t.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
