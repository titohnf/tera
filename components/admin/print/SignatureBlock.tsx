/**
 * Blok tanda tangan pimpinan beserta stempel, dipakai semua dokumen cetak.
 *
 * Pemanggil yang menentukan penempatannya (invoice merapatkannya ke kanan,
 * slip gaji menaruhnya berdampingan dengan tanda terima tutor), jadi komponen
 * ini sengaja tidak membawa margin atau perataan sendiri.
 */
export default function SignatureBlock({ date }: { date: string }) {
  return (
    <div className="text-sm text-center">
      <p className="text-gray-600 mb-1">
        Depok, {date}
      </p>
      <p className="font-semibold text-gray-900">Pimpinan Bimbel Tera</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ttd-stempel.png" alt="Tanda tangan dan stempel" className="h-24 w-auto mx-auto" />
      <p className="font-semibold text-gray-900">Suci Purnama Sari, M.Si.</p>
    </div>
  )
}
