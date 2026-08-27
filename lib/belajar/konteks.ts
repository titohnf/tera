import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import { namaPendek } from '@/lib/nama'

/**
 * Konteks permukaan belajar — satu-satunya tempat dua kalangan pemakainya
 * bertemu, dan satu-satunya tempat perbedaannya dihitung.
 *
 * Keluarga bimbel masuk atas nama seorang anak (`?anak=<studentId>`);
 * pelanggan langganan masuk atas nama dirinya sendiri. Di bawah fungsi ini
 * tidak ada satu pun halaman yang perlu tahu yang mana — semuanya menerima
 * `learnerId` dan `hanyaPublik` sebagai nilai biasa. Itu disengaja: percabangan
 * "ini keluarga atau pelanggan" yang tersebar ke banyak halaman adalah cara
 * termudah membuat salah satunya melihat yang bukan haknya.
 *
 * Identitas latihan diambil lewat RPC, bukan dengan menyentuh tabel `learners`
 * langsung. Kedua RPC-nya bergerbang: `practice_start_as_child` memeriksa
 * `family_covers_student()`, `practice_start_as_me` memeriksa langganan aktif.
 * Keduanya mengembalikan null saat tidak berhak, dan null di sini berarti
 * halamannya tidak pernah dirender — bukan dirender kosong.
 *
 * Kode akses TIDAK pernah masuk ke sini. Ia tetap ada untuk anak yang berlatih
 * di perangkat tutor lewat Sora, tapi permukaan ini selalu bekerja dari sesi
 * login — kode yang dikirim dari browser berarti kredensial yang bisa ditebak
 * dan diputar ulang.
 *
 * Memakai client sesi, dengan alasan yang sama seperti `lib/keluarga.ts` dan
 * `lib/mandiri.ts`.
 */
export interface KonteksBelajar {
  learnerId: string
  /**
   * Hanya boleh mengerjakan soal bertanda gratis.
   *
   * Sejak migrasi 121 ini BUKAN lagi "pelanggan langganan": yang membayar
   * mendapat seluruh bank soal, sama seperti murid bimbel. Nilainya benar hanya
   * untuk lapisan gratis — yang pintunya belum dibuka, jadi hari ini ia selalu
   * false. Dibiarkan ada supaya lapisan itu nanti tinggal menyalakannya, bukan
   * memasang ulang percabangan yang sudah pernah dihapus.
   */
  hanyaPublik: boolean
  namaPelajar: string
  /** Terisi hanya untuk jalur keluarga — dipakai tautan kembali ke portal. */
  studentId: string | null
}

export async function belajarContext(anakDipilih?: string): Promise<KonteksBelajar> {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, nickname, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'parent') {
    if (!anakDipilih) redirect('/keluarga')

    const { data: learnerId } = await supabase.rpc('practice_start_as_child', {
      p_student: anakDipilih,
    })
    // Null berarti anak itu bukan anaknya. Dikembalikan ke daftar anak, bukan
    // ke /unauthorized: yang keliru hampir selalu tautan lama, bukan niat.
    if (!learnerId) redirect('/keluarga')

    const { data: anak } = await supabase
      .from('profiles')
      .select('full_name, nickname')
      .eq('id', anakDipilih)
      .single()

    return {
      learnerId: learnerId as string,
      hanyaPublik: false,
      namaPelajar: anak
        ? namaPendek({
            full_name: anak.full_name as string,
            nickname: anak.nickname as string | null,
          })
        : 'Anak',
      studentId: anakDipilih,
    }
  }

  if (profile?.role === 'mandiri') {
    const { data: learnerId } = await supabase.rpc('practice_start_as_me')
    // Sudah mendaftar, belum berlangganan. Bukan penolakan — ini halaman yang
    // menerangkan cara mengaktifkannya.
    if (!learnerId) redirect('/mandiri/langganan')

    return {
      learnerId: learnerId as string,
      // Sampai di sini berarti langganannya aktif — `practice_start_as_me()`
      // memulangkan null kalau tidak, dan null di atas berarti halaman ini tidak
      // pernah dirender. Jadi tidak ada yang perlu disaring.
      hanyaPublik: false,
      namaPelajar: namaPendek({
        full_name: (profile.full_name as string) || 'Kamu',
        nickname: profile.nickname as string | null,
      }),
      studentId: null,
    }
  }

  redirect('/unauthorized')
}
