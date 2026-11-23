import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { jenjangAnak } from '@/lib/tryout/jenjang-anak'
import { hariWib, infoPaket, jamWib, tanggalWib } from '@/lib/tryout/paket'

export interface TryOutTerdekat {
  /** Penanda singkat di samping nama kartu: "Hari ini", "Sedang dibuka", atau tanggalnya. */
  label: string
  /** Satu baris: mapel, jenjang, dan jamnya. */
  teks: string
  /** Sedang bisa dikerjakan sekarang. */
  terbuka: boolean
}

/**
 * Try out berjadwal berikutnya yang BELUM dikerjakan seorang siswa bimbel dan
 * belum tutup — untuk satu baris di beranda, supaya jadwalnya terlihat tanpa
 * membuka menu Try Out.
 *
 * Hanya MEMBACA: sengaja tidak memakai `kodeAnak()`, yang membuatkan kode dan
 * baris `learners` bila belum ada — sesuatu yang tidak pantas terjadi hanya
 * karena sebuah beranda dibuka. Paket tanpa jadwal tidak ditampilkan; tanpa
 * jam buka, "terdekat" tidak punya arti. Gagal apa pun dijawab null: baris
 * ini pelengkap dan tidak boleh merusak beranda.
 */
export async function tryOutTerdekat(studentId: string): Promise<TryOutTerdekat | null> {
  try {
    const jenjang = await jenjangAnak(studentId)
    const [{ data: kuis }, { data: pelajar }] = await Promise.all([
      (await createClient())
        .from('quizzes')
        .select('id, title, share_code, settings')
        .eq('kind', 'tryout')
        .eq('status', 'published'),
      createAdminClient().from('learners').select('id').eq('profile_id', studentId).maybeSingle(),
    ])
    const selesai = new Set<string>()
    const learnerId = (pelajar as { id: string } | null)?.id
    if (learnerId) {
      const { data } = await createAdminClient()
        .from('attempts')
        .select('quiz_id')
        .eq('learner_id', learnerId)
        .not('submitted_at', 'is', null)
      for (const r of (data ?? []) as { quiz_id: string }[]) selesai.add(r.quiz_id)
    }

    const sekarang = Date.now()
    const kandidat = ((kuis ?? []) as { id: string; title: string; share_code: string | null; settings: Record<string, unknown> | null }[])
      .filter((q) => q.share_code && !selesai.has(q.id))
      .map((q) => infoPaket(q.title, q.settings))
      .filter((p) => (!jenjang || p.jenjang === jenjang || p.jenjang === 'Lainnya') && p.bukaPada)
      .filter((p) => !p.tutupPada || new Date(p.tutupPada).getTime() > sekarang)
      .sort((a, b) => new Date(a.bukaPada as string).getTime() - new Date(b.bukaPada as string).getTime())
    const p = kandidat[0]
    if (!p?.bukaPada) return null

    const buka = new Date(p.bukaPada).getTime()
    const terbuka = buka <= sekarang
    const hariIni = tanggalWib(buka) === tanggalWib(sekarang)
    const jam = p.tutupPada && tanggalWib(p.bukaPada) === tanggalWib(p.tutupPada) ? `${jamWib(p.bukaPada)}–${jamWib(p.tutupPada)} WIB` : `${jamWib(p.bukaPada)} WIB`
    const nama = [p.mapel, p.jenjang !== 'Lainnya' ? p.jenjang : null, p.kelas ? `Kelas ${p.kelas}` : null].filter(Boolean).join(' ')
    return {
      label: terbuka ? 'Sedang dibuka' : hariIni ? 'Hari ini' : hariWib(p.bukaPada).split(',')[0],
      teks: `${nama} · ${hariIni || terbuka ? '' : hariWib(p.bukaPada).split(',')[1].trim() + ' · '}${jam}`,
      terbuka,
    }
  } catch {
    return null
  }
}
