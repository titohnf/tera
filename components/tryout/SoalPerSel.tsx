import type { ReactNode } from 'react'
import { IsiKartu } from '@/components/tryout/DetailPembahasan'
import { type HasilButir } from '@/components/tryout/hasil-butir'
import type { ItemSoal } from '@/components/tryout/PenelusurSoal'
import PenelusurSoalPopup from '@/components/tryout/PenelusurSoalPopup'
import type { RiwayatMapel } from '@/lib/tryout/riwayat-kemampuan'

/**
 * Isi pop up untuk tiap sel tabel hasil (topik x try out): soal-soal topik itu pada try out itu, satu soal
 * per nomor, dengan jawaban anak dan kunci. Kuncinya `<kunci topik>|<urutan try out>`. Komponen server:
 * yang dikirim ke klien hanya elemen jadi, dan isinya baru dipasang saat pop up dibuka. Pembahasan
 * sengaja tidak ikut.
 */
export function soalPerSel(m: RiwayatMapel): Record<string, ReactNode> {
  const peta: Record<string, ReactNode> = {}
  for (const b of m.bidang) {
    for (const t of b.topik) {
      t.perTryOut.forEach((x, i) => {
        if (!x || x.butir.length === 0) return
        const items: ItemSoal[] = x.butir.map((bt) => {
          const dijawab = bt.teks && bt.teks.jawaban !== null && bt.teks.jawaban !== undefined
          const hasil: HasilButir = !bt.teks || dijawab ? bt.status : 'belum'
          return {
            nomor: bt.nomor,
            hasil,
            isi: bt.teks ? (
              <IsiKartu teks={{ ...bt.teks, pembahasan: null }} hasil={hasil} id={bt.id} bobot={bt.bobot} />
            ) : (
              <p className="text-sm text-gray-400">Soal ini tidak dapat ditampilkan.</p>
            ),
          }
        })
        peta[`${t.kunci}|${i}`] = <PenelusurSoalPopup items={items} />
      })
    }
  }
  return peta
}
