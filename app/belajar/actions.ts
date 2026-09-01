'use server'

import { redirect } from 'next/navigation'
import { belajarContext } from '@/lib/belajar/konteks'
import { allowedCurriculumGradeLevels } from '@/lib/curriculum-grade'
import { createClient } from '@/lib/supabase/server'
import { materiTopik } from '@/lib/belajar/materi'
import type { MateriTopik } from '@/lib/belajar/sematan'
import {
  bukaPaket,
  keadaanPaket,
  jawabSoal,
  kunciPaket,
  paketSesi,
  type PaketTopik,
  pemilikSesi,
  topikLatihan,
  tutupSesi,
  type HasilJawab,
  type TopikLatihan,
} from '@/lib/belajar/sesi'
import {
  bukaPaketTopik,
  keadaanPaketTopik,
  kunciPaketTopik,
  petaTopik,
  type PaketPeta,
  type TopikPeta,
} from '@/lib/belajar/topik-peta'

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

/**
 * Topik satu mapel beserta materinya, dalam satu perjalanan.
 *
 * Dua aksi terpisah akan terasa lebih rapi tapi justru lebih lambat: server
 * action di Next berjalan berurutan, jadi `Promise.all` atas dua aksi tetap
 * menghasilkan dua perjalanan yang saling menunggu. Materi satu mapel cuma
 * beberapa baris tautan — murah dibawa sekalian, dan menyaringnya ke topik yang
 * dicentang cukup terjadi di browser, tanpa perjalanan baru tiap kali kotak
 * centang disentuh.
 *
 * Pelanggan langganan ikut membawa materi sejak migrasi 119, dan sejak 121 ia
 * juga mendapat seluruh bank soal — yang membayar diperlakukan sama dengan
 * murid bimbel. Tidak ada lagi percabangan "ini pelanggan atau bukan" di sini,
 * dan itu memang tujuannya: batasnya dijaga RLS dan `practice_only_public()`,
 * bukan kode pemanggil. Cabang yang lupa dipasang di satu pemanggil adalah cara
 * termudah membocorkan yang bukan haknya — dan cabang yang lupa DIHAPUS adalah
 * cara termudah menyembunyikan yang sudah jadi haknya.
 */
export async function muatTopik(
  anak: string | undefined,
  subjectId: string
): Promise<{ topik: TopikLatihan[]; materi: MateriTopik[]; jenjang: string[] }> {
  // Jenjang ikut dari sini, bukan dari prop halaman: `belajarContext()` sudah
  // dipanggil di baris pertama aksi ini, jadi tidak ada perjalanan tambahan —
  // dan sumbernya tinggal satu tempat, tidak bisa berbeda antara daftar topik
  // dan jenjang yang dipakai menyorotinya.
  const { learnerId, kelas, studentId } = await belajarContext(anak)
  // Rubriknya TIDAK ikut. Daftar topik menyebutkan persentase, bukan label
  // penilaiannya — menilai adalah pekerjaan halaman Penguasaan, dan mengambil
  // rubrik untuk sesuatu yang tidak ditampilkan cuma satu perjalanan yang
  // dibayar tanpa ditagih siapa pun.
  const topik = await topikLatihan(learnerId, subjectId)

  // Penerjemah yang sama dengan halaman sesi tutor dan admin: kelas si anak,
  // ditambah pengecualian per mapel kalau ada (migrasi 105 — mis. siswa kelas 8
  // yang IPA-nya dari kurikulum Kelas 7). Sifatnya MENAMBAH: elemen pertama
  // selalu kelas aslinya, dan itu yang dipakai layar membedakan "kelas kamu"
  // dari kurikulum tambahan. Null berarti kelasnya tidak diketahui — daftar
  // kosong, dan tidak ada yang disorot.
  const jenjang = await allowedCurriculumGradeLevels(await createClient(), {
    sessionGrade: kelas,
    subjectId,
    studentIds: studentId ? [studentId] : [],
  })

  return {
    topik,
    materi: await materiTopik(topik.map((t) => t.group_id)),
    jenjang: jenjang ?? [],
  }
}

export async function periksaJawaban(
  sesiId: string,
  itemId: string,
  jawaban: unknown
): Promise<HasilJawab | null> {
  const pemilik = await pemilikSesi(sesiId)
  if (!pemilik) return null

  // SENGAJA TIDAK me-`revalidatePath` halaman sesinya. Dulu ada di sini, dan
  // itu yang membuat sesi pertama di produksi berakhir tanpa `finished_at`:
  // revalidasi memaksa halaman sesi dirender ulang di server sesudah TIAP
  // jawaban, dan sesudah jawaban terakhir penjaga "semua sudah dijawab" di sana
  // berbunyi — pembacanya tersentak pindah sebelum sempat membaca pembahasan
  // soal terakhir, dan tombol "Selesai" yang memanggil `practice_finish_session`
  // tidak pernah tertekan.
  //
  // Tidak ada yang hilang dengan menghapusnya: rute sesi selalu dinamis, jadi
  // muat ulang sungguhan tetap membaca keadaan terbaru dari database.
  // `learnerId` tidak lagi ikut: sejak migrasi 137 database yang menurunkannya
  // dari sesinya sendiri, sekalian dengan skornya. Meneruskannya dari sini cuma
  // membuka jalan agar keduanya berbeda.
  return jawabSoal(sesiId, itemId, jawaban)
}

export async function selesaikanLatihan(sesiId: string): Promise<void> {
  const pemilik = await pemilikSesi(sesiId)
  if (!pemilik) redirect('/belajar')

  await tutupSesi(sesiId)
  redirect(`/belajar/${sesiId}/hasil`)
}

/** Keadaan seluruh paket sebuah topik, untuk layar pemilih. */
export async function muatPaket(
  anak: string | undefined,
  groupId: string
): Promise<PaketTopik[]> {
  const { learnerId } = await belajarContext(anak)
  return keadaanPaket(learnerId, groupId)
}

/**
 * Membuka satu putaran sebuah paket.
 *
 * Yang menentukan SOAL MANA adalah database: putaran pertama memuat seluruh isi
 * paket, putaran berikutnya hanya yang masih salah. Pemanggil cuma menyebut
 * topik dan nomor paketnya — dua angka yang boleh datang dari browser karena
 * keduanya diperiksa ulang di sana, tidak seperti daftar id soal yang tidak
 * punya cara diperiksa sama sekali.
 */
export async function mulaiPaket(
  anak: string | undefined,
  groupId: string,
  nomor: number
): Promise<{ error: string } | never> {
  const { learnerId } = await belajarContext(anak)
  const sesiId = await bukaPaket(learnerId, groupId, nomor)
  if (!sesiId) {
    return {
      error: 'Paket ini tidak bisa dikerjakan lagi — sudah benar semua, atau kuncinya sudah dibuka.',
    }
  }
  redirect(`/belajar/${sesiId}`)
}

/**
 * Mengerjakan lagi paket yang barusan dinilai — putaran berikutnya, isinya soal
 * yang masih salah.
 *
 * Topik dan nomor paketnya dibaca dari SESINYA, tidak diterima dari browser:
 * sesi sudah tahu ia paket yang mana, dan menanyakannya lagi ke pemanggil cuma
 * membuka kemungkinan dua jawaban yang berbeda.
 */
export async function ulangiPaket(sesiId: string): Promise<{ error: string } | never> {
  const pemilik = await pemilikSesi(sesiId)
  if (!pemilik) redirect('/belajar')

  const paket = await paketSesi(sesiId)
  if (!paket) {
    return { error: 'Latihan ini bukan bagian dari sebuah paket, jadi tidak bisa diulang di sini.' }
  }

  const baru = await bukaPaket(pemilik.learnerId, paket.groupId, paket.nomor)
  if (!baru) {
    return {
      error: 'Paket ini tidak bisa dikerjakan lagi — sudah benar semua, atau kuncinya sudah dibuka.',
    }
  }
  redirect(`/belajar/${baru}`)
}

/**
 * Membuka kunci jawaban sebuah paket — dan MENGUNCI paketnya.
 *
 * Satu aksi, bukan dua, dan itu inti taruhannya: tidak ada jalan melihat kunci
 * tanpa menyerahkan kesempatan memperbaikinya. Kalau keduanya bisa dipisah,
 * "lihat kunci lalu ulangi" jadi jalan pintas menuju seratus persen yang tidak
 * mengajarkan apa pun.
 *
 * Penguncian yang gagal TIDAK menghalangi kuncinya terbuka: yang sudah terjadi
 * di layar sesudah ini tidak bisa ditarik kembali, dan menolak menampilkan
 * kunci karena satu baris gagal ditulis cuma menghukum orang yang salah.
 * Kegagalannya tercatat di log.
 */
export async function bukaKunciJawaban(sesiId: string): Promise<never> {
  const pemilik = await pemilikSesi(sesiId)
  if (!pemilik) redirect('/belajar')

  const paket = await paketSesi(sesiId)
  if (paket) await kunciPaket(pemilik.learnerId, paket.groupId, paket.nomor)

  redirect(`/belajar/${sesiId}/hasil?kunci=1`)
}

/* ---------------------------------------------------------------------------
 * Jalur peta kompetensi
 *
 * Kembaran tiga aksi paket di atas, berkunci topik. Gerbangnya sama persis —
 * `belajarContext()` yang memutuskan atas nama siapa, dan learner id tidak
 * pernah datang dari browser.
 * ------------------------------------------------------------------------- */

export async function muatPeta(anak: string | undefined): Promise<TopikPeta[]> {
  const { learnerId } = await belajarContext(anak)
  return petaTopik(learnerId)
}

export async function muatPaketPeta(
  anak: string | undefined,
  topikId: string
): Promise<PaketPeta[]> {
  const { learnerId } = await belajarContext(anak)
  return keadaanPaketTopik(learnerId, topikId)
}

/**
 * Membuka satu putaran paket peta.
 *
 * Yang boleh datang dari browser cuma id paketnya; siapa pemiliknya, soal mana
 * yang masih perlu dikerjakan, dan boleh-tidaknya dibuka semuanya diputuskan di
 * database.
 */
export async function mulaiPaketPeta(
  anak: string | undefined,
  paketId: string
): Promise<{ error: string } | never> {
  const { learnerId } = await belajarContext(anak)
  const sesiId = await bukaPaketTopik(learnerId, paketId)
  if (!sesiId) {
    return {
      error:
        'Paket ini tidak bisa dikerjakan lagi — sudah benar semua, kuncinya sudah dibuka, atau ujiannya sudah pernah dikerjakan.',
    }
  }
  redirect(`/belajar/${sesiId}`)
}

export async function bukaKunciPaketPeta(
  anak: string | undefined,
  paketId: string
): Promise<boolean> {
  const { learnerId } = await belajarContext(anak)
  return kunciPaketTopik(learnerId, paketId)
}
