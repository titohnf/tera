/**
 * Berapa paket topik ini yang sudah tuntas — dan karena paketnya tetap, angka
 * itu punya PENYEBUT.
 *
 * Inilah yang membuat sebuah nilai bisa dipercaya atau tidak: 80% dari satu
 * paket yang dikerjakan di topik berisi empat paket adalah pernyataan tentang
 * seperempat topiknya, dan sebelum ini ia dicetak dengan angka yang sama persis
 * dengan 80% yang menutupi keempatnya.
 *
 * Titiknya TIGA rupa, dan itu bukan hiasan:
 *
 *   penuh     paket yang seluruh soalnya benar
 *   berongga  paket yang berhenti karena kuncinya dibuka
 *   pudar     paket yang belum tuntas
 *
 * Dua yang pertama sama-sama "tuntas" — tidak ada lagi yang bisa dikerjakan di
 * sana — tapi menggambar keduanya sebagai titik hitam yang sama membuat topik
 * yang separuh paketnya berhenti di tengah jalan berbunyi "2 dari 2 paket
 * tuntas" bersanding dengan 55%. Kalimat itu benar dan tetap salah kesannya:
 * yang terbaca kabar baik, yang terjadi dua paket yang menyerah.
 */

/** Titik sebanyak-banyaknya yang digambar; sisanya diserahkan ke kalimatnya. */
const MAKS_TITIK = 6

export default function Keyakinan({
  tuntas,
  sempurna,
  total,
  ringkas,
  className = '',
}: {
  /** Paket yang tidak bisa dikerjakan lagi: benar semua ATAU terkunci. */
  tuntas: number
  /** Di antaranya, yang tuntas karena benar semua. */
  sempurna: number
  total: number
  /** Hanya titiknya, tanpa kata — untuk baris daftar yang sempit. */
  ringkas?: boolean
  className?: string
}) {
  if (total <= 0) return null
  const terkunci = Math.max(0, tuntas - sempurna)
  const kalimat =
    terkunci > 0
      ? `${tuntas} dari ${total} paket tuntas, ${terkunci} di antaranya terkunci`
      : `${tuntas} dari ${total} paket tuntas`

  // Kalau paketnya lebih banyak daripada titik yang muat, titiknya jadi
  // proporsi — bukan cacah. Yang dibaca sekilas tetap benar ("kira-kira
  // separuh"), dan angka persisnya ada di kalimat sebelahnya.
  const digambar = Math.min(total, MAKS_TITIK)
  const skala = (n: number) => (total <= MAKS_TITIK ? n : Math.round((n / total) * digambar))
  const isiPenuh = skala(sempurna)
  const isiTuntas = skala(tuntas)

  return (
    <span className={`flex items-center gap-2 ${className}`} role="img" aria-label={kalimat}>
      <span className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: digambar }, (_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${
              i < isiPenuh
                ? 'bg-gray-700'
                : i < isiTuntas
                  ? // Berongga: sudah berhenti, tapi tidak karena benar.
                    'border-[1.5px] border-gray-700'
                  : 'bg-gray-200'
            }`}
          />
        ))}
      </span>
      {!ringkas && <span className="text-xs text-gray-500">{kalimat}</span>}
    </span>
  )
}
