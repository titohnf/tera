/**
 * Tombol "Kirim Akses ke WhatsApp Orang Tua". Hasil dari `siapkanWaAkses`;
 * mati (dengan alasannya) bila bahannya kurang. Komponen server, tanpa state.
 */
export default function TombolWaAkses({ href, alasan }: { href: string | null; alasan: string | null }) {
  if (!href) {
    return (
      <div>
        <span className="flex items-center justify-center w-full px-4 py-2.5 bg-slate-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
          Kirim Akses ke WhatsApp Orang Tua
        </span>
        {alasan && <p className="text-xs text-gray-400 mt-1">{alasan}</p>}
      </div>
    )
  }
  return (
    <div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Kirim Akses ke WhatsApp Orang Tua
      </a>
      <p className="text-xs text-gray-400 mt-1">
        Berisi password default. Pastikan akun sudah direset ke default sebelum dikirim.
      </p>
    </div>
  )
}
