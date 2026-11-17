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

function Badan({ j, skala = 1, ...p }: { j: Jenjang; skala?: number } & React.SVGProps<SVGPathElement>) {
  return (
    <path
      d={BADAN[j]}
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

const LOGAM_B = [
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
const TINGKAT_KELAS = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7]

const kutub = (r: number, i: number, n: number, mulai = -90) => {
  const a = ((mulai + (360 / n) * i) * Math.PI) / 180
  return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const
}

function Chevron({ y, w = 17, warna, tebal = 5 }: { y: number; w?: number; warna: string; tebal?: number }) {
  return (
    <path
      d={`M${50 - w} ${y + 7} L50 ${y} L${50 + w} ${y + 7}`}
      fill="none"
      stroke={warna}
      strokeWidth={tebal}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

export function LencanaB({ kelas, ukuran = 96 }: { kelas: number; ukuran?: number }) {
  const j = jenjangDari(kelas)
  const tingkat = TINGKAT_KELAS[kelas - 1]
  const m = LOGAM_B[tingkat]
  const u = urutDalam(kelas)
  // SD: kosong, garis, chevron 1–3, chevron 3 + garis. SMP: garis, chevron 1, chevron 2 (tak pernah kosong).
  const tanda: ('garis' | 'chevron')[] =
    j === 'smp'
      ? u === 0 ? ['garis'] : Array(u).fill('chevron')
      : u === 0 ? [] : u === 1 ? ['garis'] : u === 5 ? ['chevron', 'chevron', 'chevron', 'garis'] : Array(u - 1).fill('chevron')
  const tengah = j === 'smp' ? 56 : 50
  const ys = tanda.map((_, i) => tengah + i * 10 - ((tanda.length - 1) * 10) / 2)
  const marks = tanda.map((t, i) =>
    t === 'garis' ? (
      <path key={i} d={`M32 ${ys[i]} H68`} stroke={m.emas} strokeWidth={5} strokeLinecap="round" />
    ) : (
      <Chevron key={i} y={ys[i] - 4} w={17} warna={m.emas} tebal={5} />
    ),
  )
  const id = `kb${kelas}`
  return (
    <svg viewBox="0 0 100 100" width={ukuran} height={ukuran} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m.terang} />
          <stop offset="0.5" stopColor={m.dasar} />
          <stop offset="1" stopColor={m.tua} />
        </linearGradient>
      </defs>
      <Badan j={j} fill={`url(#${id})`} stroke={m.tua} strokeWidth={2.5} />
      <Badan j={j} skala={0.82} fill={m.tua} fillOpacity={0.35} stroke={j === 'sma' ? m.emas : m.terang} strokeWidth={j === 'sma' ? 2.4 : 1.8} strokeOpacity={0.9} />

      {j === 'sd' && marks}
      {j === 'smp' && (
        <>
          <path d="M50 22 L56 29 L50 36 L44 29 Z" fill="#fff" stroke={m.tua} strokeWidth={2} strokeLinejoin="round" />
          <circle cx="37" cy="29" r="2.6" fill={m.emas} />
          <circle cx="63" cy="29" r="2.6" fill={m.emas} />
          {marks}
        </>
      )}
      {j === 'sma' &&
        Array.from({ length: urutDalam(kelas) + 1 }, (_, i) => {
          const n = urutDalam(kelas) + 1
          const x = n === 1 ? 50 : n === 2 ? 36 + i * 28 : 30 + i * 20
          const y = n === 3 ? (i === 1 ? 40 : 54) : 50
          const sk = n === 1 ? 0.62 : n === 2 ? 0.46 : 0.4
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${sk}) translate(-50 -50)`}>
              <polygon points={BINTANG} fill={m.emas} stroke="#B45309" strokeWidth={6} strokeLinejoin="round" />
            </g>
          )
        })}
      <path d="M24 30 Q32 17 50 13" fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
