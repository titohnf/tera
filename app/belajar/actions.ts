'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { belajarContext } from '@/lib/belajar/konteks'
import {
  bukaSesi,
  jawabSoal,
  pemilikSesi,
  topikLatihan,
  tutupSesi,
  type HasilJawab,
  type TopikLatihan,
} from '@/lib/belajar/sesi'

/**
 * Aksi permukaan belajar — tipis dengan sengaja.
 *
 * Tiap aksi menetapkan ulang "atas nama siapa" sebelum berbuat apa pun, dan
 * TIDAK pernah menerima learner id dari pemanggilnya. Yang boleh datang dari
 * browser cuma id anak (`anak`) dan id sesi — keduanya diperiksa ulang di
 * database, oleh `practice_start_as_child()` dan `practice_actor()`. Server
 * action adalah endpoint HTTP seperti yang lain: siapa pun yang punya sesi
 * login bisa memanggilnya dengan argumen karangan sendiri.
 */

export async function muatTopik(anak: string | undefined, subjectId: string): Promise<TopikLatihan[]> {
  const { learnerId } = await belajarContext(anak)
  return topikLatihan(learnerId, subjectId)
}

/**
 * Membuka sesi lalu berpindah ke rutenya. Sesi yang tidak jadi terbuka —
 * topiknya habis, atau isinya bertipe yang tidak dinilai otomatis —
 * mengembalikan kalimat, bukan lemparan: yang terjadi bukan kesalahan siapa pun.
 */
export async function mulaiLatihan(
  anak: string | undefined,
  subjectId: string,
  groupIds: string[],
  jumlah: number
): Promise<{ error: string } | never> {
  const { learnerId } = await belajarContext(anak)
  const sesiId = await bukaSesi(learnerId, subjectId, groupIds, jumlah)

  if (!sesiId) {
    return { error: 'Belum ada soal yang bisa dilatih untuk pilihan itu. Coba topik lain.' }
  }
  redirect(`/belajar/${sesiId}`)
}

export async function periksaJawaban(
  sesiId: string,
  itemId: string,
  jawaban: unknown
): Promise<HasilJawab | null> {
  const pemilik = await pemilikSesi(sesiId)
  if (!pemilik) return null

  const hasil = await jawabSoal(pemilik.learnerId, sesiId, itemId, jawaban)
  // Halaman sesinya server-rendered: tanpa ini, muat ulang sesudah menjawab
  // akan menampilkan kemajuan yang tersimpan di cache, bukan yang barusan.
  if (hasil) revalidatePath(`/belajar/${sesiId}`)
  return hasil
}

export async function selesaikanLatihan(sesiId: string): Promise<void> {
  const pemilik = await pemilikSesi(sesiId)
  if (!pemilik) redirect('/belajar')

  await tutupSesi(sesiId)
  redirect(`/belajar/${sesiId}/hasil`)
}
