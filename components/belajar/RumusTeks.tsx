import katex from 'katex'

/**
 * Teks soal yang boleh memuat rumus: `$sebaris$` dan `$$sebaris sendiri$$`.
 *
 * Salinan `src/lib/latex.tsx` dari repo `form`. Harus sama persis karena
 * soalnya sama persis: penyusunnya mengetik `$\frac{1}{2}$` di Sora, dan kalau
 * di sini pembacanya melihat tanda dolar mentah, yang rusak bukan tampilannya
 * melainkan soalnya.
 *
 * Tujuh dari tiga puluh satu soal di bank hari ini memuat rumus, jadi ini bukan
 * kesiapan untuk masa depan — ini kebutuhan hari pertama.
 */

interface Penggal {
  teks: string
  blok: boolean
  rumus: boolean
}

function pisahRumus(teks: string): Penggal[] {
  // Rumus blok ($$…$$) dulu, baru rumus sebaris ($…$) di sisa teks biasanya —
  // urutan terbalik akan membuat `$$` terbaca sebagai dua rumus kosong.
  const penggal: Penggal[] = []
  const blokRe = /\$\$([\s\S]+?)\$\$/g
  let batas = 0
  let cocok: RegExpExecArray | null

  while ((cocok = blokRe.exec(teks))) {
    if (cocok.index > batas) {
      penggal.push({ teks: teks.slice(batas, cocok.index), blok: false, rumus: false })
    }
    penggal.push({ teks: cocok[1], blok: true, rumus: true })
    batas = cocok.index + cocok[0].length
  }
  if (batas < teks.length) {
    penggal.push({ teks: teks.slice(batas), blok: false, rumus: false })
  }

  return penggal.flatMap(p => {
    if (p.rumus) return [p]
    const sebarisRe = /\$(.+?)\$/g
    const bagian: Penggal[] = []
    let akhir = 0
    let m: RegExpExecArray | null
    while ((m = sebarisRe.exec(p.teks))) {
      if (m.index > akhir) {
        bagian.push({ teks: p.teks.slice(akhir, m.index), blok: false, rumus: false })
      }
      bagian.push({ teks: m[1], blok: false, rumus: true })
      akhir = m.index + m[0].length
    }
    if (akhir < p.teks.length) {
      bagian.push({ teks: p.teks.slice(akhir), blok: false, rumus: false })
    }
    return bagian
  })
}

export default function RumusTeks({ text }: { text: string }) {
  return (
    <>
      {pisahRumus(text).map((p, i) => {
        // Teks biasa memakai `whitespace-pre-wrap` karena prompt soal kerap
        // punya baris kosong yang memisahkan stimulus dari pertanyaannya.
        if (!p.rumus) {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {p.teks}
            </span>
          )
        }
        // `throwOnError: false` supaya satu rumus yang salah ketik menampilkan
        // dirinya berwarna merah, bukan merobohkan seluruh halaman soal.
        const html = katex.renderToString(p.teks, {
          throwOnError: false,
          displayMode: p.blok,
        })
        const Tag = p.blok ? 'div' : 'span'
        return <Tag key={i} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </>
  )
}
