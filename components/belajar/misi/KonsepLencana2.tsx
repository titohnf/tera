/**
 * LENCANA PANGKAT. Kelas 1–4 memakai LencanaB (chevron, kelas 4 + diamond).
 * Kelas 5+: satu permata di tengah yang berganti bentuk, sayap emas berlapis (gaya level 10 di referensi),
 * pita di bawah.
 *   5 diamond · 6–7 segi lima · 8–9 segi enam bersisi · 10–12 bintang bersisi
 *   sayap (hanya 10–12): 10 (3, bingkai) → 11 (4, pita) → 12 (5, mahkota)
 */
import { TITIK_BINTANG_PUBLIK } from './konsep-bintang'
import { Badan, Chevron, Kilau, LOGAM_B, LencanaB, Mahkota, TINGKAT_KELAS } from './KonsepLencana'

type Logam = (typeof LOGAM_B)[number]

/**
 * Satu sisi sayap: lapisan emas melengkung bertumpuk. Tiap lapisan keluar dari sisi segi enam,
 * menyapu ke luar lalu naik jadi ujung runcing; lapisan bawah sedikit lebih pendek.
 */
function SisiSayap({ n, m, satuWarna }: { n: number; m: Logam; satuWarna: boolean }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const y = 52 + (i - (n - 1) / 2) * 8 // pangkal tiap lapisan
        const ujungX = -12 + i * 2.5 // lapisan atas paling panjang
        const ujungY = y - 14 + i * 1.5
        return (
          <path
            key={i}
            d={`M30 ${y - 5} L${ujungX + 16} ${y - 5} L${ujungX} ${ujungY} L${ujungX + 3} ${y + 1} L${ujungX + 14} ${y + 5} L30 ${y + 5} Z`}
            fill={satuWarna || i % 2 === 0 ? m.dasar : m.terang}
            stroke={m.tua}
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
        )
      })}
    </>
  )
}

function Sayap({ n, m, satuWarna }: { n: number; m: Logam; satuWarna: boolean }) {
  return (
    <g>
      <SisiSayap n={n} m={m} satuWarna={satuWarna} />
      <g transform="translate(100 0) scale(-1 1)">
        <SisiSayap n={n} m={m} satuWarna={satuWarna} />
      </g>
    </g>
  )
}

function Pita({ m }: { m: Logam }) {
  return (
    <g fill={m.dasar} stroke={m.tua} strokeWidth={1.6} strokeLinejoin="round">
      <path d="M33 84 L47 90 L45 108 L40 102 L35 108 Z" />
      <path d="M67 84 L53 90 L55 108 L60 102 L65 108 Z" />
    </g>
  )
}

/** Permata bersisi: segitiga dari pusat ke tiap sudut, terang di atas, gelap di bawah. */
function Permata({ titik, m, id }: { titik: (readonly [number, number])[]; m: Logam; id: string }) {
  const n = titik.length
  const rona = (i: number) => {
    const a = (titik[i][1] + titik[(i + 1) % n][1]) / 2
    return a < 44 ? '#FFFFFF' : a < 56 ? m.terang : m.dasar
  }
  return (
    <g strokeLinejoin="round">
      {titik.map((p, i) => (
        <polygon
          key={`${id}${i}`}
          points={`50,50 ${p[0].toFixed(2)},${p[1].toFixed(2)} ${titik[(i + 1) % n][0].toFixed(2)},${titik[(i + 1) % n][1].toFixed(2)}`}
          fill={rona(i)}
          fillOpacity={rona(i) === '#FFFFFF' ? 0.85 : 1}
          stroke={m.tua}
          strokeWidth={1}
        />
      ))}
      <polygon points={titik.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')} fill="none" stroke={m.tua} strokeWidth={2.4} />
    </g>
  )
}

const poligon = (n: number, r: number, mulai = -90) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((mulai + (360 / n) * i) * Math.PI) / 180
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const
  })

const bintangTitik = TITIK_BINTANG_PUBLIK.split(' ').map(s => {
  const [x, y] = s.split(',').map(Number)
  return [50 + (x - 50) * 0.55, 50 + (y - 50) * 0.55] as const
})

const LAPIS_SAYAP = [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 5]

export type VarianIsi = 'bintang4' | 'permata' | 'chevron' | 'belajar' | 'kristal'

const garisIsi = (m: Logam) => ({ stroke: m.tua, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const })

/** Ikon belajar yang naik tingkat: buku, pensil, lampu ide, obor, topi wisuda. */
function IkonBelajar({ k, m }: { k: number; m: Logam }) {
  const g = garisIsi(m)
  const putih = '#fff'
  if (k === 5)
    return (
      <g {...g}>
        <path d="M50 68 L26 62 V36 L50 42 Z" fill={putih} />
        <path d="M50 68 L74 62 V36 L50 42 Z" fill={m.terang} />
        <path d="M32 46 L44 49 M32 53 L44 56" fill="none" strokeWidth={1.4} />
      </g>
    )
  if (k === 6)
    return (
      <g {...g} transform="rotate(40 50 50)">
        <rect x="43" y="24" width="14" height="38" fill={m.emas} />
        <rect x="43" y="24" width="14" height="7" fill={m.terang} />
        <path d="M43 62 L57 62 L50 76 Z" fill="#FDE68A" />
        <path d="M46.5 70 L53.5 70 L50 76 Z" fill={m.tua} />
      </g>
    )
  if (k === 7)
    return (
      <g {...g}>
        <path d="M50 24 C64 24 72 34 72 44 C72 53 64 56 62 64 H38 C36 56 28 53 28 44 C28 34 36 24 50 24 Z" fill={m.emas} />
        <rect x="39" y="64" width="22" height="6" rx="2" fill={putih} />
        <path d="M43 74 H57" strokeWidth={3} />
        <path d="M44 40 Q50 34 56 40" fill="none" stroke={putih} strokeWidth={2.4} />
      </g>
    )
  if (k === 8)
    return (
      <g {...g}>
        <path d="M50 22 C60 34 70 40 68 54 C67 66 59 74 50 74 C41 74 33 66 32 54 C31 44 38 40 40 32 C44 38 46 38 50 22 Z" fill="#FDBA74" />
        <path d="M50 44 C56 50 60 54 58 62 C57 68 54 70 50 70 C46 70 43 68 42 62 C41 56 46 52 50 44 Z" fill="#FEF08A" />
      </g>
    )
  return (
    <g {...g}>
      <path d="M50 28 L78 40 L50 52 L22 40 Z" fill={m.emas} />
      <path d="M34 48 V58 C34 64 66 64 66 58 V48 L50 55 Z" fill={m.terang} />
      <path d="M74 42 V58" fill="none" strokeWidth={2.4} />
      <circle cx="74" cy="62" r="3.2" fill="#FDE68A" />
    </g>
  )
}

/** Kristal yang tumbuh: 1, 2, 3 kristal, lalu berkilau. */
function Kristal({ x, y, sk, rot = 0, m }: { x: number; y: number; sk: number; rot?: number; m: Logam }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sk})`} strokeLinejoin="round" stroke={m.tua} strokeWidth={2 / sk}>
      <path d="M0 -20 L-9 -10 V14 H0 Z" fill="#fff" fillOpacity={0.9} />
      <path d="M0 -20 L9 -10 V14 H0 Z" fill={m.terang} />
      <path d="M-9 -10 L0 -4 L9 -10" fill="none" strokeWidth={1.2 / sk} />
    </g>
  )
}

/** Berlian klasik (meja, mahkota, dasar runcing) yang jumlahnya bertambah: 1–5 untuk kelas 5–9. */
function Berlian({ x, y, s, m }: { x: number; y: number; s: number; m: Logam }) {
  const p = (px: number, py: number) => `${(x + px * s).toFixed(2)},${(y + py * s).toFixed(2)}`
  const poly = (...t: [number, number][]) => t.map(([a, b]) => p(a, b)).join(' ')
  return (
    <g strokeLinejoin="round">
      <polygon points={poly([-14, -3], [-8, -10], [-4, -3])} fill={m.terang} />
      <polygon points={poly([-8, -10], [8, -10], [4, -3], [-4, -3])} fill="#FFFFFF" />
      <polygon points={poly([14, -3], [8, -10], [4, -3])} fill={m.terang} fillOpacity={0.8} />
      <polygon points={poly([-14, -3], [-4, -3], [0, 14])} fill={m.dasar} />
      <polygon points={poly([-4, -3], [4, -3], [0, 14])} fill={m.terang} />
      <polygon points={poly([4, -3], [14, -3], [0, 14])} fill={m.tua} fillOpacity={0.85} />
      <polygon points={poly([-8, -10], [8, -10], [14, -3], [0, 14], [-14, -3])} fill="none" stroke={m.tua} strokeWidth={1.9} />
      <path d={`M${p(-14, -3)} L${p(14, -3)} M${p(-8, -10)} L${p(-4, -3)} L${p(0, 14)} L${p(4, -3)} L${p(8, -10)}`} fill="none" stroke={m.tua} strokeWidth={0.9} />
    </g>
  )
}

function BintangEmpat({ k, m }: { k: number; m: Logam }) {
  const jumlah = k - 4
  const posisi: [number, number, number][] =
    jumlah === 1 ? [[50, 50, 1.75]]
    : jumlah === 2 ? [[34, 50, 1.05], [66, 50, 1.05]]
    : jumlah === 3 ? [[50, 36, 0.95], [36, 62, 0.95], [64, 62, 0.95]]
    : jumlah === 4 ? [[36, 40, 0.92], [64, 40, 0.92], [36, 62, 0.92], [64, 62, 0.92]]
    : [[38, 37, 0.78], [62, 37, 0.78], [30, 60, 0.78], [50, 60, 0.78], [70, 60, 0.78]]
  return (
    <g>
      {posisi.map(([x, y, s], i) => (
        <Berlian key={i} x={x} y={y} s={s} m={m} />
      ))}
    </g>
  )
}

function IsiVarian({ k, m, varian, id, titik }: { k: number; m: Logam; varian: VarianIsi; id: string; titik: (readonly [number, number])[] }) {
  if (varian === 'bintang4') return <BintangEmpat k={k} m={m} />
  if (varian === 'belajar') return <IkonBelajar k={k} m={m} />
  if (varian === 'kristal')
    return (
      <g>
        {k >= 9 && <circle cx="50" cy="50" r="25" fill="none" stroke={m.emas} strokeWidth={2} strokeDasharray="2 4" strokeLinecap="round" />}
        {k >= 6 && <Kristal x={36} y={56} sk={0.8} rot={-18} m={m} />}
        {k >= 7 && <Kristal x={64} y={56} sk={0.8} rot={18} m={m} />}
        <Kristal x={50} y={k === 5 ? 52 : 50} sk={k === 5 ? 1.05 : 1.15} m={m} />
        {k >= 8 && <Kilau x={68} y={30} r={6} />}
      </g>
    )
  // chevron + permata kecil di bawah
  const nCh = Math.min(k - 4, 3)
  const bentuk = k === 5 ? poligon(4, 21) : k <= 7 ? poligon(5, 20) : poligon(6, 20)
  return (
    <g>
      {Array.from({ length: nCh }, (_, i) => (
        <Chevron key={i} y={28 + i * 10} w={17} warna={m.emas} tebal={6.5} tegas />
      ))}
      <g transform="translate(50 68) scale(0.5) translate(-50 -50)">
        <Permata titik={k >= 9 ? poligon(6, 20) : bentuk} m={m} id={`${id}c`} />
      </g>
    </g>
  )
}

// Warna: kelas 1–4 merah, 5–8 biru, 9 tosca, 10 merah muda, 11 jingga, 12 kuning. Abu-abu hanya untuk lencana tidak aktif.
const MERAH = { terang: '#FCA5A5', dasar: '#EF4444', tua: '#7F1D1D', emas: '#FEE2E2' }
const BIRU = { terang: '#7DD3FC', dasar: '#0EA5E9', tua: '#075985', emas: '#E0F2FE' }
const JINGGA = { terang: '#FDBA74', dasar: '#F97316', tua: '#9A3412', emas: '#FFEDD5' }
const TOSCA = { terang: '#5EEAD4', dasar: '#14B8A6', tua: '#115E59', emas: '#CCFBF1' }
const PINK = { terang: '#F9A8D4', dasar: '#EC4899', tua: '#831843', emas: '#FCE7F3' }
const KUNING = { terang: '#FEF08A', dasar: '#EAB308', tua: '#854D0E', emas: '#FEF9C3' }
const ABU = { terang: '#E5E7EB', dasar: '#9CA3AF', tua: '#4B5563', emas: '#F3F4F6' }

export function LencanaF({ kelas, ukuran = 96, varian = 'bintang4', aktif = true }: { kelas: number; ukuran?: number; varian?: VarianIsi; aktif?: boolean }) {
  const k = Math.min(Math.max(kelas, 1), 12)
  // Kelas 1–4 hijau, 5–6 biru cerah, 7–8 jingga, pola yang sama (chevron 1–3, lalu 3 + diamond), 9 bintang tanpa sayap, 10–12 bersayap.
  const polaChevron = k <= 8
  const m: Logam = !aktif ? ABU : k <= 4 ? MERAH : k <= 8 ? BIRU : k === 9 ? TOSCA : k === 10 ? PINK : k === 11 ? JINGGA : KUNING
  const p = ((k - 1) % 4) + 1
  const nTegas = Math.min(p, 3)
  const mulai = p === 4 ? 26 : 50 - ((nTegas - 1) * 12 + 18 * 0.55) / 2
  const n = LAPIS_SAYAP[k - 1]
  const titik = bintangTitik
  const id = `kf${k}${aktif ? '' : 'x'}`
  return (
    <svg viewBox="0 0 100 100" width={ukuran} height={ukuran} aria-hidden overflow="visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m.terang} />
          <stop offset="0.5" stopColor={m.dasar} />
          <stop offset="1" stopColor={m.tua} />
        </linearGradient>
      </defs>
      {k >= 11 && <Pita m={m} />}
      {n > 0 && <Sayap n={n} m={m} satuWarna={false} />}
      {k === 12 && (
        <g transform="translate(50 9) scale(1.25) translate(-50 -27)">
          <Mahkota warna={m.dasar} garis={m.tua} />
        </g>
      )}
      <Badan j="sma" fill={`url(#${id})`} stroke={m.tua} strokeWidth={2.5} />
      <Badan j="sma" skala={0.82} fill={m.tua} fillOpacity={0.35} stroke={k >= 9 ? m.emas : m.terang} strokeWidth={k >= 9 ? 2.4 : 1.8} strokeOpacity={0.9} />
      {k >= 10 && <Badan j="sma" skala={0.93} fill="none" stroke={m.emas} strokeWidth={1.6} />}
      {k === 12 && (
        <g stroke={m.emas} strokeWidth={2.2} strokeLinecap="round" opacity={0.95}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = ((-90 + 60 * i) * Math.PI) / 180
            return <line key={i} x1={50 + 26 * Math.cos(a)} y1={50 + 26 * Math.sin(a)} x2={50 + 37 * Math.cos(a)} y2={50 + 37 * Math.sin(a)} />
          })}
        </g>
      )}
      {polaChevron ? (
        <g>
          {k <= 4
            ? Array.from({ length: k }, (_, i) => {
                const cy = 50 + (i - (k - 1) / 2) * 12
                // Semua kelas 1–4 trapesium yang bergantian arah (▼▲▼▲), dimulai dari sisi sempit menghadap ke bawah.
                const lebar = 19
                const sempit = lebar - 4.5
                // Kelas 3: ▼ ▼ ▲ (garis bawah jadi cermin garis atas); lainnya bergantian.
                const sempitDiBawah = k === 3 ? i < 2 : i % 2 === 0
                const [yA, yB] = [cy - 3.5, cy + 3.5]
                const [hA, hB] = sempitDiBawah ? [lebar, sempit] : [sempit, lebar]
                return (
                  <polygon
                    key={i}
                    points={`${50 - hA},${yA} ${50 + hA},${yA} ${50 + hB},${yB} ${50 - hB},${yB}`}
                    fill={m.emas}
                  />
                )
              })
            : Array.from({ length: nTegas }, (_, i) => (
                <Chevron key={i} y={p === 4 ? 29 + i * 11 : mulai + (p === 3 ? -0.5 : 0) + i * 12} w={18} warna={m.emas} tebal={7.5} tegas />
              ))}
          {p === 4 && k > 4 && <polygon points="50,60 57,68 50,76 43,68" fill={m.emas} stroke={m.tua} strokeWidth={1.2} strokeLinejoin="round" />}
        </g>
      ) : (
        <polygon points={titik.map(t => `${t[0].toFixed(2)},${t[1].toFixed(2)}`).join(' ')} fill={m.emas} stroke={m.tua} strokeWidth={1.6} strokeLinejoin="round" />
      )}
      <path d="M24 30 Q32 17 50 13" fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
