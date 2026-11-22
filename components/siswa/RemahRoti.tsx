import Link from 'next/link'

/** Remah roti: "Beranda / Try Out". Item terakhir adalah halaman ini (tanpa tautan). */
export default function RemahRoti({ item }: { item: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Remah roti" className="text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {item.map((it, i) => {
          const terakhir = i === item.length - 1
          return (
            <li key={it.label} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-gray-300">/</span>}
              {it.href && !terakhir ? (
                <Link href={it.href} className="hover:text-gray-900 hover:underline">
                  {it.label}
                </Link>
              ) : (
                <span aria-current={terakhir ? 'page' : undefined} className={terakhir ? 'font-medium text-gray-900' : undefined}>
                  {it.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
