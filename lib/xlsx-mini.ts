import { crc32 } from 'node:zlib'

/**
 * Penulis .xlsx sangat kecil, tanpa dependensi: satu atau beberapa lembar berisi teks dan angka,
 * dengan baris judul tebal dan lebar kolom. Dipakai unduhan Rekap Skor.
 *
 * Alasannya bukan CSV: Excel berpengaturan regional Indonesia memakai titik koma sebagai pemisah
 * kolom, sehingga CSV berkoma terbuka sebagai satu kolom panjang. Berkas .xlsx terbuka benar di mana pun.
 *
 * Isinya paket zip tanpa kompresi (metode 0) dengan tujuh berkas XML; sel teks memakai `inlineStr`
 * supaya tidak perlu tabel string bersama.
 */
export type Sel = string | number | null | undefined

export interface Lembar {
  nama: string
  /** Baris pertama dianggap judul kolom (dicetak tebal). */
  baris: Sel[][]
  lebar?: number[]
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string)
    // karakter kendali yang tidak sah di XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

const kol = (i: number) => {
  let s = ''
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

function xmlLembar(l: Lembar): string {
  const lebar = l.lebar?.length
    ? `<cols>${l.lebar.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : ''
  const baris = l.baris
    .map((b, r) => {
      const sel = b
        .map((v, c) => {
          const ref = `${kol(c)}${r + 1}`
          const gaya = r === 0 ? ' s="1"' : ''
          if (v === null || v === undefined || v === '') return ''
          if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${r === 0 ? gaya : ' s="2"'}><v>${v}</v></c>`
          return `<c r="${ref}" t="inlineStr"${gaya}><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`
        })
        .join('')
      return `<row r="${r + 1}">${sel}</row>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${lebar}<sheetData>${baris}</sheetData></worksheet>`
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCE6F2"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`

function zip(berkas: { nama: string; isi: Buffer }[]): Buffer {
  const lokal: Buffer[] = []
  const pusat: Buffer[] = []
  let offset = 0
  for (const b of berkas) {
    const nama = Buffer.from(b.nama)
    const crc = crc32(b.isi)
    const kepala = Buffer.alloc(30)
    kepala.writeUInt32LE(0x04034b50, 0)
    kepala.writeUInt16LE(20, 4)
    kepala.writeUInt16LE(0x0800, 6) // nama berkas UTF-8
    kepala.writeUInt16LE(0, 8)
    kepala.writeUInt16LE(0, 10)
    kepala.writeUInt16LE(0x21, 12) // 1980-01-01
    kepala.writeUInt32LE(crc, 14)
    kepala.writeUInt32LE(b.isi.length, 18)
    kepala.writeUInt32LE(b.isi.length, 22)
    kepala.writeUInt16LE(nama.length, 26)
    kepala.writeUInt16LE(0, 28)
    lokal.push(kepala, nama, b.isi)
    const p = Buffer.alloc(46)
    p.writeUInt32LE(0x02014b50, 0)
    p.writeUInt16LE(20, 4)
    p.writeUInt16LE(20, 6)
    p.writeUInt16LE(0x0800, 8)
    p.writeUInt16LE(0, 10)
    p.writeUInt16LE(0, 12)
    p.writeUInt16LE(0x21, 14)
    p.writeUInt32LE(crc, 16)
    p.writeUInt32LE(b.isi.length, 20)
    p.writeUInt32LE(b.isi.length, 24)
    p.writeUInt16LE(nama.length, 28)
    p.writeUInt32LE(offset, 42)
    pusat.push(p, nama)
    offset += 30 + nama.length + b.isi.length
  }
  const ukuranPusat = pusat.reduce((n, b) => n + b.length, 0)
  const akhir = Buffer.alloc(22)
  akhir.writeUInt32LE(0x06054b50, 0)
  akhir.writeUInt16LE(berkas.length, 8)
  akhir.writeUInt16LE(berkas.length, 10)
  akhir.writeUInt32LE(ukuranPusat, 12)
  akhir.writeUInt32LE(offset, 16)
  return Buffer.concat([...lokal, ...pusat, akhir])
}

export function buatXlsx(lembar: Lembar[]): Buffer {
  const nama = (n: string, i: number) => esc(n.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `Lembar${i + 1}`)
  const t = (s: string) => Buffer.from(s, 'utf8')
  return zip([
    {
      nama: '[Content_Types].xml',
      isi: t(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${lembar
          .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
          .join('')}</Types>`,
      ),
    },
    {
      nama: '_rels/.rels',
      isi: t(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      nama: 'xl/workbook.xml',
      isi: t(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${lembar
          .map((l, i) => `<sheet name="${nama(l.nama, i)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
          .join('')}</sheets></workbook>`,
      ),
    },
    {
      nama: 'xl/_rels/workbook.xml.rels',
      isi: t(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${lembar
          .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
          .join('')}<Relationship Id="rId${lembar.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      ),
    },
    { nama: 'xl/styles.xml', isi: t(STYLES) },
    ...lembar.map((l, i) => ({ nama: `xl/worksheets/sheet${i + 1}.xml`, isi: t(xmlLembar(l)) })),
  ])
}
