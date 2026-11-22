import Link from 'next/link'

/**
 * Pemilih mapel: deretan tombol bulat, satu per mapel, yang aktif berlatar gelap. Tautan biasa (alamat
 * dengan `?mapel=`), jadi pilihannya bisa dibagikan dan tombol kembali peramban bekerja. Tidak tampil
 * bila hanya ada satu mapel.
 */
export default function PemilihMapel({ pilihan }: { pilihan: { nama: string; href: string; aktif: boolean }[] | null }) {
  if (!pilihan || pilihan.length < 2) return null
  return (
    <nav aria-label="Pilih mapel" className="flex flex-wrap gap-2">
      {pilihan.map((p) => (
        <Link
          key={p.nama}
          href={p.href}
          aria-current={p.aktif ? 'page' : undefined}
          className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
            p.aktif ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'
          }`}
        >
          {p.nama}
        </Link>
      ))}
    </nav>
  )
}
