import { golonganMapel, type GolonganMapel } from '@/lib/belajar/ikon-mapel'
import Ikon3D, { IKON_GOLONGAN } from '@/components/ui/Ikon3D'

/**
 * Ikon bulat untuk sebuah mapel: gambar 3D (`components/ui/Ikon3D`) di atas
 * lingkaran berwarna lembut, dengan cincin kemajuan bila angkanya diketahui.
 * Warna jadi penanda cepat: mapel yang sama selalu berwarna sama di seluruh layar.
 */

export const WARNA: Record<GolonganMapel, string> = {
  bahasa: 'bg-sky-100 text-sky-700',
  matematika: 'bg-indigo-100 text-indigo-700',
  sains: 'bg-teal-100 text-teal-700',
  kimia: 'bg-violet-100 text-violet-700',
  fisika: 'bg-cyan-100 text-cyan-700',
  biologi: 'bg-emerald-100 text-emerald-700',
  bumi: 'bg-green-100 text-green-700',
  ipas: 'bg-lime-100 text-lime-700',
  ekonomi: 'bg-amber-100 text-amber-700',
  sejarah: 'bg-orange-100 text-orange-700',
  sosial: 'bg-rose-100 text-rose-700',
  agama: 'bg-stone-100 text-stone-700',
  seni: 'bg-fuchsia-100 text-fuchsia-700',
  olahraga: 'bg-red-100 text-red-700',
  komputer: 'bg-slate-100 text-slate-700',
  umum: 'bg-slate-100 text-slate-700',
}

export default function IkonMapel({
  nama,
  size = 44,
  persen = null,
}: {
  nama: string
  /** Ruang yang ditempati ikon ini, dengan atau tanpa cincin. */
  size?: number
  /**
   * Kemajuan 0-100 sebagai cincin mengelilingi ikonnya, atau null untuk tidak
   * menggambar cincin sama sekali. Null dipakai saat angkanya belum diketahui —
   * cincin kosong berarti "belum mengerjakan apa pun", dan itu kabar yang tidak
   * boleh disampaikan hanya karena datanya tidak sampai.
   */
  persen?: number | null
}) {
  const golongan = golonganMapel(nama)

  // Ukuran luarnya SELALU `size`, ada cincin atau tidak, dan lingkaran dalamnya
  // selalu menyisakan ruang cincin yang sama. Kalau ruang itu cuma disediakan
  // saat cincinnya ada, mapel yang sudah dikerjakan tampak lebih besar daripada
  // yang belum — perbedaan ukuran yang tidak berarti apa-apa, di deretan yang
  // seharusnya sejajar.
  const tebal = 3
  const dalam = size - tebal * 3
  const r = (size - tebal) / 2
  const keliling = 2 * Math.PI * r
  const terisi = persen == null ? 0 : (Math.min(Math.max(persen, 0), 100) / 100) * keliling

  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      {...(persen == null
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': `${Math.round(persen)} persen soal sudah dikerjakan` })}
    >
      {persen != null && (
        <svg
          className={`absolute inset-0 -rotate-90 ${WARNA[golongan].split(' ')[1]}`}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={tebal}
            className="stroke-gray-200"
          />
          {terisi > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={tebal}
              strokeLinecap="round"
              strokeDasharray={`${terisi} ${keliling}`}
            />
          )}
        </svg>
      )}
      <span
        className={`flex items-center justify-center rounded-full ${WARNA[golongan]}`}
        style={{ width: dalam, height: dalam }}
      >
        <Ikon3D nama={IKON_GOLONGAN[golongan]} ukuran={Math.round(dalam * 0.68)} />
      </span>
    </span>
  )
}
