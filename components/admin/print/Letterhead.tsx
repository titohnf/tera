/**
 * Kop surat dokumen cetak — invoice, kuitansi, surat pengingat, slip gaji.
 *
 * Satu komponen dipakai bersama supaya keempatnya tidak pelan-pelan berbeda:
 * sebelumnya markup ini disalin di tiap halaman, dan slip gaji sempat memakai
 * nama, alamat, dan tata letak yang lain sendiri.
 *
 * Ini khusus versi HTML. PDF-nya dirender @react-pdf/renderer yang punya
 * primitif sendiri (`View`/`Text`/`Image`), jadi tidak bisa ikut memakai ini.
 */
export default function Letterhead() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-bold text-gray-900">Bimbel Tera</p>
          <p className="text-xs text-gray-600 mt-0.5">Jl. Rawageni No. 9k, Kel. Ratujaya, Kec. Cipayung, Kota Depok</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Telepon: 0813 1550 2949 &middot; Email: teralearningcenter.id@gmail.com
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-tera.png" alt="Tera Bimbel" className="h-10 w-auto" />
      </div>

      <hr className="border-gray-300 mb-4" />
    </>
  )
}
