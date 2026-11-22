/**
 * Judul tampilan try out: "Try Out I TKA Matematika". Angka Romawi adalah urutan try out itu di
 * antara try out sejenjang dan semapel (menurut jam buka, lalu menurut waktu dibuat); jenjang,
 * kelas, dan tahun ajaran tidak masuk judul, tetapi tampil sebagai label.
 */

import { tanggalWib } from '@/lib/tryout/paket'

const ROMAWI: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]

export function romawi(n: number): string {
  let sisa = Math.max(1, Math.floor(n))
  let hasil = ''
  for (const [nilai, huruf] of ROMAWI) {
    while (sisa >= nilai) {
      hasil += huruf
      sisa -= nilai
    }
  }
  return hasil
}

/** "Try Out TKA Matematika SD Kelas 6" + seri 1 → "Try Out I TKA Matematika". */
export function judulDenganSeri(judul: string, seri: number): string {
  const m = judul.match(/^(?:Try ?Out\s+)?(?:TKA\s+)?(.+?)\s+(?:SD|SMP|SMA)(?:\s+Kelas\s+\d+)?\s*$/i)
  if (m) return `Try Out ${romawi(seri)} TKA ${m[1]}`
  return judul.replace(/^Try ?Out\b/i, `Try Out ${romawi(seri)}`)
}

export interface UntukSeri {
  id: string
  jenjang: string
  mapel: string
  bukaPada: string | null
  /** Makin kecil makin lama dibuat. */
  dibuat: number
}

/** Urutan (mulai 1) tiap try out di antara yang sejenjang dan semapel. */
export function nomorSeri(daftar: UntukSeri[]): Map<string, number> {
  const hasil = new Map<string, number>()
  const grup = new Map<string, UntukSeri[]>()
  for (const d of daftar) {
    const k = `${d.jenjang}|${d.mapel.toLowerCase()}`
    grup.set(k, [...(grup.get(k) ?? []), d])
  }
  for (const isi of grup.values()) {
    isi
      .sort((a, b) => (a.bukaPada ? Date.parse(a.bukaPada) : Infinity) - (b.bukaPada ? Date.parse(b.bukaPada) : Infinity) || a.dibuat - b.dibuat)
      .forEach((d, i) => hasil.set(d.id, i + 1))
  }
  return hasil
}

/** Tahun ajaran dimulai Juli: Juli–Desember 2026 dan Januari–Juni 2027 sama-sama 2026/2027 (WIB). */
export function tahunAjaran(iso: string | number): string {
  const [th, bln] = tanggalWib(iso).split('-').map(Number)
  const awal = bln >= 7 ? th : th - 1
  return `${awal}/${awal + 1}`
}
