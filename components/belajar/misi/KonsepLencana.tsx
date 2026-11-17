/**
 * EKSPLORASI lencana pangkat: bentuk menurut jenjang.
 *   SD  (kelas 1–6)   → BULAT
 *   SMP (kelas 7–9)   → PERISAI
 *   SMA (kelas 10–12) → SEGI ENAM
 * Dua arah gaya, A dan B, untuk dipilih. Belum dipakai di aplikasi.
 */
import { TITIK_BINTANG_PUBLIK as BINTANG } from './konsep-bintang'

type Jenjang = 'sd' | 'smp' | 'sma'
const jenjangDari = (k: number): Jenjang => (k <= 6 ? 'sd' : k <= 9 ? 'smp' : 'sma')
/** Urutan di dalam jenjang, mulai 0. */
const urutDalam = (k: number) => (k <= 6 ? k - 1 : k <= 9 ? k - 7 : k - 10)

const BADAN: Record<Jenjang, string> = {
  sd: 'M50 4 A46 46 0 1 1 49.99 4 Z',
  smp: 'M50 4 L90 15 V50 C90 75 72 89 50 97 C28 89 10 75 10 50 V15 Z',
  sma: 'M50 4 L90 27 V73 L50 96 L10 73 V27 Z',
}

export function Badan({ j: _j, skala = 1, ...p }: { j: Jenjang; skala?: number } & React.SVGProps<SVGPathElement>) {
  return (
    <path
      d={BADAN.sma /* semua jenjang segi enam */}
      transform={`translate(50 50) scale(${skala}) translate(-50 -50)`}
      strokeLinejoin="round"
      {...p}
    />
  )
}

/* ───────────── KONSEP A — stiker enamel berangka ───────────── */

const WARNA_A: Record<number, [string, string, string]> = {
  // [dasar, tua, muda]
  1: ['#F87171', '#B91C1C', '#FECACA'],
  2: ['#FB923C', '#C2410C', '#FED7AA'],
  3: ['#FACC15', '#A16207', '#FEF08A'],
  4: ['#4ADE80', '#15803D', '#BBF7D0'],
  5: ['#38BDF8', '#0369A1', '#BAE6FD'],
  6: ['#A78BFA', '#6D28D9', '#DDD6FE'],
  7: ['#E0A060', '#7C4A1E', '#F6DDBA'],
  8: ['#CBD5E1', '#475569', '#F1F5F9'],
  9: ['#FBBF24', '#B45309', '#FEF3C7'],
  10: ['#34D399', '#047857', '#A7F3D0'],
  11: ['#6366F1', '#3730A3', '#C7D2FE'],
  12: ['#F43F5E', '#9F1239', '#FECDD3'],
}

export function LencanaA({ kelas, ukuran = 96 }: { kelas: number; ukuran?: number }) {
  const j = jenjangDari(kelas)
  const [dasar, tua, muda] = WARNA_A[kelas]
  return (
    <svg viewBox="0 0 100 100" width={ukuran} height={ukuran} aria-hidden>
      {j === 'sma' && (
        <g fill={tua}>
          <path d="M9 34 L-2 44 L9 54 Z" />
          <path d="M91 34 L102 44 L91 54 Z" />
        </g>
      )}
      <Badan j={j} fill={tua} />
      <Badan j={j} skala={0.9} fill={dasar} stroke={muda} strokeWidth={2.5} />
      <Badan j={j} skala={0.72} fill="none" stroke={muda} strokeOpacity={0.55} strokeWidth={1.6} strokeDasharray="1 3.2" strokeLinecap="round" />
      {j === 'smp' && <path d="M22 18 Q50 28 78 18" fill="none" stroke={muda} strokeOpacity={0.5} strokeWidth={2.2} strokeLinecap="round" />}
      <path d="M24 30 Q32 18 50 14" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={3.5} strokeLinecap="round" />
      <text
        x="50"
        y={j === 'smp' ? 60 : 62}
        textAnchor="middle"
        fontSize={kelas >= 10 ? 34 : 44}
        fontWeight={900}
        fontFamily="ui-rounded, 'Nunito', system-ui, sans-serif"
        fill="#fff"
        stroke={tua}
        strokeWidth={5}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {kelas}
      </text>
    </svg>
  )
}

/* ───────────── KONSEP B — lambang logam berpangkat ───────────── */

export const LOGAM_B = [
  { terang: '#F2C98A', dasar: '#B9803A', tua: '#6B4420', emas: '#FFF1CC' },
  { terang: '#BFD6E6', dasar: '#5F86A3', tua: '#2F4B63', emas: '#FFFFFF' },
  { terang: '#A5EC92', dasar: '#3FA64B', tua: '#1E6B2E', emas: '#FDE68A' },
  { terang: '#82E2DA', dasar: '#2A9D9B', tua: '#146463', emas: '#FDE68A' },
  { terang: '#C7B3FA', dasar: '#7A5AE0', tua: '#43298F', emas: '#FDE68A' },
  { terang: '#F9A0A0', dasar: '#D8404A', tua: '#8A1C28', emas: '#FFE9A8' },
  { terang: '#A3B6FF', dasar: '#4560E6', tua: '#232F9A', emas: '#FFE9A8' },
  { terang: '#FFEBA6', dasar: '#F5A623', tua: '#B45F06', emas: '#FFFFFF' },
]
/** Tingkat (Pemula, Pejuang, Elit, Mahir, Ahli, Pakar, Maestro, Legenda) tiap kelas. */
export const TINGKAT_KELAS = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7]

const kutub = (r: number, i: number, n: number, mulai = -90) => {
  const a = ((mulai + (360 / n) * i) * Math.PI) / 180
  return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const
}

export function Chevron({ y, w = 17, warna, tebal = 5, tegas = false }: { y: number; w?: number; warna: string; tebal?: number; tegas?: boolean }) {
  const h = tegas ? w * 0.55 : 7
  return (
    <path
      d={`M${50 - w} ${y + h} L50 ${y} L${50 + w} ${y + h}`}
      fill="none"
      stroke={warna}
      strokeWidth={tebal}
      strokeLinecap={tegas ? 'butt' : 'round'}
      strokeLinejoin={tegas ? 'miter' : 'round'}
    />
  )
}

/** Padi: dua tangkai melengkung seperti tanda kurung "( )", bulirnya berselang-seling di kedua sisi. */
export function Padi({ warna, garis }: { warna: string; garis: string }) {
  const sisi = (cermin: boolean) => {
    const x = (v: number) => (cermin ? 100 - v : v)
    const P = (t: number) => [(1 - t) ** 2 * 34 + 2 * (1 - t) * t * 16 + t * t * 34, (1 - t) ** 2 * 78 + 2 * (1 - t) * t * 50 + t * t * 22] as const
    const T = (t: number) => [2 * (1 - t) * (16 - 34) + 2 * t * (34 - 16), 2 * (1 - t) * (50 - 78) + 2 * t * (22 - 50)] as const
    return (
      <g>
        <path d={`M${x(34)} 78 Q${x(16)} 50 ${x(34)} 22`} fill="none" stroke={warna} strokeWidth={2.6} strokeLinecap="round" />
        {[0.2, 0.32, 0.44, 0.56, 0.68, 0.8].map((t, i) => {
          const [px, py] = P(t)
          const [tx, ty] = T(t)
          const sudut = (Math.atan2(ty, tx) * 180) / Math.PI - 90
          const dalam = i % 2 === 0
          // normal ke dalam (kanan jalur untuk sisi kiri) atau ke luar
          const n = Math.hypot(tx, ty)
          const nx = (-ty / n) * -1 * (dalam ? 1 : -1)
          const ny = (tx / n) * -1 * (dalam ? 1 : -1)
          const cx = px + nx * 4.2
          const cy = py + ny * 4.2
          const rot = sudut + (dalam ? -28 : 28)
          return (
            <ellipse
              key={i}
              cx={x(cx)}
              cy={cy}
              rx={2.8}
              ry={5.6}
              fill={warna}
              stroke={garis}
              strokeWidth={0.8}
              transform={`rotate(${cermin ? -rot : rot} ${x(cx)} ${cy})`}
            />
          )
        })}
      </g>
    )
  }
  return (
    <g>
      {sisi(false)}
      {sisi(true)}
    </g>
  )
}

/** Sayap kaku di sisi kiri-kanan segi enam: bulu bersudut lurus, ujung runcing. */
export function Sayap({ warna, garis }: { warna: string; garis: string }) {
  const sisi = (
    <>
      <path
        d="M13 34 L-9 22 L-6 30 L-13 31 L-8 39 L-14 41 L-8 48 L-12 52 L-4 57 L13 62 Z"
        fill={warna}
        stroke={garis}
        strokeWidth={1.6}
        strokeLinejoin="miter"
      />
      <path d="M13 40 L-4 33 M13 47 L-5 42 M13 54 L-3 50" stroke={garis} strokeWidth={1.2} strokeOpacity={0.6} fill="none" />
    </>
  )
  return (
    <g>
      {sisi}
      <g transform="translate(100 0) scale(-1 1)">{sisi}</g>
    </g>
  )
}

/** Mahkota kecil di bagian atas badan. */
export function Mahkota({ warna, garis }: { warna: string; garis: string }) {
  return (
    <g>
      <path
        d="M39 27 L40 14 L45 21 L50 11 L55 21 L60 14 L61 27 Z"
        fill={warna}
        stroke={garis}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <circle cx="50" cy="11" r="2" fill="#fff" stroke={garis} strokeWidth={1} />
    </g>
  )
}

/** Kilau empat sudut. */
export function Kilau({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  const t = r * 0.28
  return (
    <path
      d={`M${x} ${y - r} L${x + t} ${y - t} L${x + r} ${y} L${x + t} ${y + t} L${x} ${y + r} L${x - t} ${y + t} L${x - r} ${y} L${x - t} ${y - t} Z`}
      fill="#fff"
      stroke="#F59E0B"
      strokeWidth={0.8}
      strokeLinejoin="round"
    />
  )
}

export function LencanaB({ kelas, ukuran = 96 }: { kelas: number; ukuran?: number }) {
  const j = jenjangDari(kelas)
  const tingkat = TINGKAT_KELAS[kelas - 1]
  const m = LOGAM_B[tingkat]
  // SD 1–6: garis, chevron 1–3, 1 chevron + bintang, 2 chevron + bintang. SMP/SMA memakai padi:
  //   7–9 = bintang + chevron 1–3 (9 juga berbingkai emas); 10 = + sayap, 11 = + mahkota, 12 = + bingkai emas & kilau.
  // SD 1–4: 1, 2, 3 chevron tegas, lalu 3 chevron + bintang kecil di bawah. SD 5: padi, SD 6: padi + bintang di tengah.
  // SMP/SMA: padi + chevron tegas 1–3 + bintang kecil di bawah (9 berbingkai emas; 10 + sayap, 11 + mahkota, 12 + bingkai & kilau).
  const dalamPadi = kelas >= 7
  const nTegas = kelas <= 3 ? kelas : kelas === 4 ? 3 : dalamPadi ? Math.min(kelas - 6, 3) : 0
  const w = dalamPadi ? 13 : 18
  const jarak = dalamPadi ? 10 : 12
  const tinggi = w * 0.55
  const mulai = dalamPadi ? 30 : kelas === 4 ? 26 : 50 - ((nTegas - 1) * jarak + tinggi) / 2
  const bintangKecil: [number, number, number] | null =
    dalamPadi ? [50, 66, 0.22] : kelas === 6 ? [50, 50, 0.4] : null
  const marks = (
    <>
      {kelas === 4 && (
        <polygon points="50,66 58,75 50,84 42,75" fill={m.emas} stroke={m.tua} strokeWidth={1.2} strokeLinejoin="round" />
      )}
      {kelas >= 5 && <Padi warna={m.emas} garis={m.tua} />}
      {Array.from({ length: nTegas }, (_, i) => (
        <Chevron key={i} y={mulai + i * jarak} w={w} warna={m.emas} tebal={dalamPadi ? 6 : 7.5} tegas />
      ))}
      {bintangKecil && (
        <g transform={`translate(${bintangKecil[0]} ${bintangKecil[1]}) scale(${bintangKecil[2]}) translate(-50 -50)`}>
          <polygon points={BINTANG} fill={m.emas} />
        </g>
      )}
    </>
  )
  const sayap = kelas >= 10
  const mahkota = kelas >= 11
  const juara = kelas === 12
  const id = `kb${kelas}`
  return (
    <svg viewBox="0 0 100 100" width={ukuran} height={ukuran} aria-hidden overflow="visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m.terang} />
          <stop offset="0.5" stopColor={m.dasar} />
          <stop offset="1" stopColor={m.tua} />
        </linearGradient>
      </defs>
      {sayap && <Sayap warna={m.emas} garis={m.tua} />}
      <Badan j={j} fill={`url(#${id})`} stroke={m.tua} strokeWidth={2.5} />
      <Badan j={j} skala={0.82} fill={m.tua} fillOpacity={0.35} stroke={j === 'sma' ? m.emas : m.terang} strokeWidth={j === 'sma' ? 2.4 : 1.8} strokeOpacity={0.9} />

      {(juara || kelas === 9) && <Badan j={j} skala={0.93} fill="none" stroke={m.emas} strokeWidth={1.6} />}
      {marks}
      {mahkota && <Mahkota warna={m.emas} garis={m.tua} />}
      {juara && (
        <>
          <Kilau x={14} y={16} />
          <Kilau x={88} y={20} r={4} />
          <Kilau x={82} y={86} />
        </>
      )}
      <path d="M24 30 Q32 17 50 13" fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
