/** Hasil sebuah soal, dan namanya. Berkas biasa (bukan 'use client') supaya terbaca di server maupun klien. */
export type HasilButir = 'benar' | 'sebagian' | 'salah' | 'belum'

export const LABEL_HASIL: Record<HasilButir, string> = { benar: 'Benar', sebagian: 'Benar sebagian', salah: 'Belum tepat', belum: 'Dilewati' }
