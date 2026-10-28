// @ts-nocheck
/**
 * Unit tests untuk lib/materi-pemetaan.ts
 * Jalankan dengan: npx vitest (install dulu: npm i -D vitest)
 */
import { describe, it, expect } from 'vitest'
import {
  bacaKode, bangunIndeks, cocokkan, idBerkas, jenisBerkas, judulDariNama, kelasDari, kodeTopik, kunciJalur, normalisasi, periksaKode,
} from './materi-pemetaan'

const G = (id, mapel, kelas, tema, topik) => ({
  id, curriculum: 'Kurikulum Merdeka', subject_id: 's', grade_level: kelas, semester: 1, theme: tema, topic: topik,
  subjects: { name: mapel },
})
const grup = [
  G('9f3a2c11-0000-4000-8000-000000000001', 'IPA', 'Kelas 7', 'Gerak dan Gaya', 'Pengenalan Gaya'),
  G('abcdef22-0000-4000-8000-000000000002', 'Science', 'Kelas 4', 'Energy', 'Where Do Plants Grow Better? & Spot'),
  G('112233aa-0000-4000-8000-000000000003', 'Bahasa Indonesia', 'Kelas 2', 'Menjaga Kesehatan', 'Tata Bahasa: Kalimat Tanya'),
]

describe('kode topik', () => {
  it('diturunkan dari 6 karakter pertama id, huruf kecil', () => {
    expect(kodeTopik('9F3A2C11-0000-4000-8000-000000000001')).toBe('t-9f3a2c')
  })
  it('dibaca dari segmen folder mana pun, yang terdalam menang', () => {
    expect(bacaKode(['IPA', 'Kelas 7', 'Gaya [t-9f3a2c]'])).toBe('t-9f3a2c')
    expect(bacaKode(['IPA [t-111111]', 'Kelas 7', 'Gaya [t-222222]'])).toBe('t-222222')
    expect(bacaKode(['IPA', 'Kelas 7', 'Gaya'])).toBeNull()
  })
  it('menolak bila dua grup berbagi kode', () => {
    expect(() => periksaKode([G('aaaaaa11-0', 'x', 'k', 't', 'a'), G('aaaaaa22-0', 'x', 'k', 't', 'b')])).toThrow()
    expect(() => periksaKode(grup)).not.toThrow()
  })
})

describe('normalisasi', () => {
  it('menyamakan tanda baca yang diganti Drive', () => {
    expect(normalisasi('Better? & Spot')).toBe(normalisasi('Better- & Spot'))
  })
  it('membaca "Kelas 5 SD" sebagai "Kelas 5"', () => {
    expect(kelasDari('Kelas 5 SD')).toBe('Kelas 5')
  })
  it('judul tanpa nomor urut dan ekstensi ganda', () => {
    expect(judulDariNama('18. Materi_7 SMP_IPA_Pengenalan Gaya.docx.pdf')).toBe('Materi_7 SMP_IPA_Pengenalan Gaya')
    expect(judulDariNama('7. Materi_2 SD_Matematika_Bilangan sampai 100.pptx.pdf')).toBe('Materi_2 SD_Matematika_Bilangan sampai 100')
    expect(judulDariNama('Materi Kerapatan Jenis.pdf')).toBe('Materi Kerapatan Jenis')
  })
})

describe('cocokkan', () => {
  const peta = [{ jalur: 'Bahasa Indonesia/Kelas 2/Kalimat Tanya', kode: kodeTopik(grup[2].id) }]
  const indeks = bangunIndeks(grup, peta)

  it('kode menang atas nama', () => {
    const h = cocokkan(['IPA', 'Kelas 7', 'Apa saja [t-112233]'], indeks)
    expect(h).toMatchObject({ status: 'cocok', cara: 'kode' })
    expect(h.grup.id).toBe(grup[2].id)
  })
  it('kode yang tak dikenal dilaporkan, tidak dilewatkan ke nama', () => {
    expect(cocokkan(['IPA', 'Kelas 7', 'Pengenalan Gaya [t-ffffff]'], indeks).status).toBe('kode-tak-dikenal')
  })
  it('peta manual dipakai sebelum nama', () => {
    expect(cocokkan(['Bahasa Indonesia', 'Kelas 2', 'Kalimat Tanya'], indeks)).toMatchObject({ status: 'cocok', cara: 'peta' })
  })
  it('nama persis, dengan tanda baca Drive dan "SD"', () => {
    expect(cocokkan(['Science', 'Kelas 4', 'Where Do Plants Grow Better- & Spot'], indeks)).toMatchObject({ status: 'cocok', cara: 'nama' })
    expect(cocokkan(['IPA', 'Kelas 7 SD', 'Pengenalan Gaya'], indeks)).toMatchObject({ status: 'cocok', cara: 'nama' })
  })
  it('tidak menebak: nama mirip tapi tidak sama = tak ada', () => {
    expect(cocokkan(['IPA', 'Kelas 7', 'Gaya dan Gerak Dasar'], indeks).status).toBe('tak-ada')
  })
  it('kunci jalur membuang kode', () => {
    expect(kunciJalur(['IPA', 'Kelas 7', 'Gaya [t-9f3a2c]'])).toBe('IPA/Kelas 7/Gaya')
  })
})

describe('idBerkas', () => {
  it('membaca id dari tautan berkas Drive dan Docs', () => {
    expect(idBerkas('https://drive.google.com/file/d/1ksrYrz-gv2JU2T0BoQnqleotD1zx_y9W/view')).toBe('1ksrYrz-gv2JU2T0BoQnqleotD1zx_y9W')
    expect(idBerkas('https://docs.google.com/document/d/1DanrZuvi3zcikdV6UyBXXhS3gslgsM1W/edit?usp=sharing')).toBe('1DanrZuvi3zcikdV6UyBXXhS3gslgsM1W')
  })
  it('menolak yang bukan berkas: folder, Form terbitan, situs lain, sampah', () => {
    expect(idBerkas('https://drive.google.com/drive/folders/17kMocfBYxOKYNqf-2OKZJHNcF0WQwYSn')).toBeNull()
    expect(idBerkas('https://docs.google.com/forms/d/e/1FAIpQLSabcdefghijklmnop/viewform')).toBeNull()
    expect(idBerkas('https://qrco.de/bfN47O')).toBeNull()
    expect(idBerkas('bukan url')).toBeNull()
    expect(idBerkas(null)).toBeNull()
  })
})

describe('jenisBerkas', () => {
  it('PDF dan Google Docs tampil di halaman; .docx tidak, dan disebut namanya', () => {
    expect(jenisBerkas('application/pdf').tampil).toBe(true)
    expect(jenisBerkas('application/vnd.google-apps.document').tampil).toBe(true)
    const docx = jenisBerkas('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(docx.tampil).toBe(false)
    expect(docx.nama).toBe('.docx')
  })
})
