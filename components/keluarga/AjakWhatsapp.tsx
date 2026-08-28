import { pesanAjakan } from '@/lib/referal'

/**
 * Tombol "Ajak lewat WhatsApp" — satu-satunya ajakan referal di portal ini.
 *
 * Dipakai dua tempat dengan warna berbeda: banner di dasar beranda (amber,
 * senada latarnya) dan kartu di halaman Profil (hijau di atas kartu putih).
 * Yang harus tetap satu adalah PESANNYA — dua salinan teks ajakan yang
 * pelan-pelan menyimpang berarti dua janji berbeda tentang siapa yang dapat
 * vouchernya.
 */
export default function AjakWhatsapp({
  kode,
  className,
}: {
  kode: string
  className: string
}) {
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(pesanAjakan(kode))}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-colors ${className}`}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.86 9.86 0 004.76 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2zm0 18.02h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.17 8.17 0 01-1.25-4.36c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 015.82 2.42 8.18 8.18 0 012.41 5.82c0 4.54-3.7 8.22-8.24 8.22zm4.52-6.16c-.25-.12-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.56c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.14-1.19-.06-.1-.22-.16-.47-.29z" />
      </svg>
      Ajak lewat WhatsApp
    </a>
  )
}
