import type { drive_v3, forms_v1 } from 'googleapis'
import { bacaKode, bangunIndeks, normalisasi, type GrupTopik } from '@/lib/materi-pemetaan'

/**
 * Sinkron soal digital dari Google Form di Drive — kembaran `materi-pemetaan.ts`.
 *
 * Tutor menaruh asesmen sebagai Google Form di folder bimbel. Modul ini membaca
 * form itu lewat Google Forms API (soal DAN kunci penilaiannya, yang tutor atur
 * sendiri di Forms) lalu membuat:
 *
 *   1. satu kuis DRAF di Sora (`quizzes` + `questions`) — bahan penugasan ke
 *      sesi semester depan; semester ini tidak ditugaskan ke sesi mana pun;
 *   2. butir bank soal DRAF (`question_bank_items`) bertag topik kurikulum
 *      (`question_curriculum_tags`) — yang dikerjakan anak di menu Belajar.
 *
 * Tidak ada hubungannya dengan kelengkapan jurnal tutor: tidak membuat baris
 * `assessments` dan tidak menyentuh `assessment_results`. Tutor tetap memakai
 * Google Form dan mengisi nilai manual.
 *
 * ATURAN YANG SAMA DENGAN SINKRON MATERI:
 *   - hanya yang cocok pasti yang diproses; topik tidak pernah ditebak. Form yang
 *     topiknya belum bisa dipastikan tetap jadi kuis, tapi butir bank soalnya
 *     belum dibuat (butir tanpa topik tidak muncul di Belajar), dan barisnya jadi
 *     daftar kerja admin;
 *   - tidak ada yang ditulis ke Drive.
 *
 * ATURAN KHUSUS SOAL:
 *   - semuanya masuk sebagai `draf`; hanya `aktif` yang sampai ke anak. Kunci
 *     tiap butir diuji `nilai_jawaban_banyak()` di database sebelum ditulis;
 *   - form yang berubah di Drive dibuat ulang HANYA kalau semua hasil lamanya
 *     masih draf dan belum dipakai siapa pun. Kalau tidak, ditandai
 *     `perlu_tinjauan` dan tidak ada yang ditimpa;
 *   - form bergambar/video dilewati utuh (kalimat soalnya bergantung gambar).
 *
 * Klien Drive, Forms, dan database DISUNTIKKAN, seperti sinkron materi.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = { from: (tabel: string) => any; rpc: (nama: string, args: object) => PromiseLike<{ data: any; error: any }> }

/** Folder bimbel tempat tutor menyimpan materi, bank soal, dan asesmen. */
export const FOLDER_ASESMEN = '115fSYDrele2qIHKnfJlkrVEQgdy2afMB'
const MIME_FORM = 'application/vnd.google-apps.form'
const PENANDA_DESKRIPSI = 'Dibuat otomatis dari Google Form'

export type PetaSoal = {
  /** Nama form di Drive tanpa awalan nomor, mis. "Asesmen_7 SMP_IPA_Kalor dan Perpindahannya". */
  nama: string
  /** Kode topik tujuan, `t-xxxxxx` (lihat halaman admin Materi dan Soal). */
  kode: string
  /** Catatan manusia: topik yang dituju. Tidak dipakai mesin. */
  topik?: string
}

// ─────────────────────────────────────────────── uraian form

export type SoalForm = {
  type: 'mcq_single' | 'mcq_multi' | 'statement_grid'
  prompt: string
  options: { choices: string[] } | { statements: string[]; answer_labels: string[] }
  correct_answer: string | string[] | { answers: boolean[]; grading_mode: 'proportional' }
  weight: number
  /** Teks umpan balik "salah" dari Forms, bila tutor mengisinya. */
  pembahasan: string | null
}

const tanpaNomor = (t: string) => t.replace(/^\s*(?:Question\s*)?\d+[.:]\s*(?:\(Level[^)]*\))?\s*/i, '').trim()
const tanpaHuruf = (t: string) => t.replace(/^\s*[A-Za-z][.)]\s+/, '').trim()

/** Semua pilihan berawalan "A. ", "B. " ... berurutan? Maka awalan itu dibuang. */
function bukaHuruf(nilai: string[]): string[] {
  const huruf = nilai.every((v, i) => new RegExp(`^${String.fromCharCode(65 + i)}[.)]\\s`).test(v.trim()))
  return huruf ? nilai.map(tanpaHuruf) : nilai
}

function umpanBalik(g: forms_v1.Schema$Grading | undefined): string | null {
  const t = g?.whenWrong?.text?.replace(/^\s*Jawaban Salah\.?\s*/i, '').trim()
  return t || null
}

/**
 * Soal bernilai dari sebuah form. Butir tanpa `grading` (identitas, refleksi,
 * unggah foto) dilewati. Apa pun yang bernilai tapi tidak bisa dipahami masuk
 * `catatan` dan menggugurkan form itu seluruhnya — kuis yang kehilangan satu
 * soal diam-diam lebih menyesatkan daripada tidak ada kuis.
 */
export function uraikanForm(form: forms_v1.Schema$Form): { soal: SoalForm[]; catatan: string[]; gambar: boolean } {
  const soal: SoalForm[] = []
  const catatan: string[] = []
  const items = form.items ?? []
  if (items.some(it => it.imageItem || it.videoItem || it.questionItem?.image)) {
    return { soal, catatan: ['memuat gambar/video'], gambar: true }
  }

  items.forEach((it, n) => {
    const label = `item ${n + 1}`
    if (it.questionItem?.question) {
      const q = it.questionItem.question
      if (!q.grading) return
      const cq = q.choiceQuestion
      if (!cq) { catatan.push(`${label}: butir bernilai tapi bukan pilihan`); return }
      const asli = (cq.options ?? []).map(o => o.value ?? '')
      if ((cq.options ?? []).some(o => o.isOther)) { catatan.push(`${label}: ada opsi "Lainnya"`); return }
      const pilihan = bukaHuruf(asli)
      const benar = (q.grading.correctAnswers?.answers ?? []).map(a => pilihan[asli.indexOf(a.value ?? '')])
      if (benar.length === 0 || benar.some(b => b === undefined)) { catatan.push(`${label}: kunci tidak cocok dengan pilihan`); return }
      if (new Set(pilihan).size !== pilihan.length) { catatan.push(`${label}: teks pilihan kembar`); return }
      const bobot = Number(q.grading.pointValue)
      if (!(bobot > 0)) { catatan.push(`${label}: bobot ${q.grading.pointValue}`); return }
      const prompt = tanpaNomor(it.title ?? '')
      const dasar = { prompt, weight: bobot, pembahasan: umpanBalik(q.grading) }
      if (cq.type === 'RADIO' || cq.type === 'DROP_DOWN') {
        if (benar.length !== 1) { catatan.push(`${label}: pilihan ganda dengan ${benar.length} kunci`); return }
        soal.push({ ...dasar, type: 'mcq_single', options: { choices: pilihan }, correct_answer: benar[0] })
      } else if (cq.type === 'CHECKBOX') {
        soal.push({ ...dasar, type: 'mcq_multi', options: { choices: pilihan }, correct_answer: benar })
      } else catatan.push(`${label}: tipe pilihan ${cq.type}`)
    } else if (it.questionGroupItem) {
      const baris = it.questionGroupItem.questions ?? []
      if (!baris.some(b => b.grading)) return
      const kolom = (it.questionGroupItem.grid?.columns?.options ?? []).map(o => o.value ?? '')
      if (kolom.length !== 2) { catatan.push(`${label}: grid dengan ${kolom.length} kolom`); return }
      if (baris.some(b => !b.grading || (b.grading.correctAnswers?.answers ?? []).length !== 1)) {
        catatan.push(`${label}: ada baris grid tanpa tepat satu kunci`); return
      }
      const bobot = baris.reduce((a, b) => a + Number(b.grading?.pointValue ?? 0), 0)
      const pernyataan = baris.map(b => b.rowQuestion?.title ?? '')
      if (!(bobot > 0) || pernyataan.some(t => !t.trim())) { catatan.push(`${label}: bobot/teks baris grid tidak sah`); return }
      const jawab = baris.map(b => b.grading!.correctAnswers!.answers![0].value ?? '')
      if (jawab.some(v => !kolom.includes(v))) { catatan.push(`${label}: kunci grid di luar kolom`); return }
      soal.push({
        type: 'statement_grid',
        prompt: tanpaNomor(it.title ?? ''),
        options: { statements: bukaHuruf(pernyataan), answer_labels: kolom },
        correct_answer: { answers: jawab.map(v => v === kolom[0]), grading_mode: 'proportional' },
        weight: bobot,
        pembahasan: baris.map(b => umpanBalik(b.grading ?? undefined)).find(Boolean) ?? null,
      })
    }
  })
  return { soal, catatan, gambar: false }
}

const jawabanBenar = (s: SoalForm) =>
  s.type === 'statement_grid' ? (s.correct_answer as { answers: boolean[] }).answers : s.correct_answer

/** Kunci tiap soal diuji penilai di database (dua skema, satu panggilan per skema). Null = lolos. */
async function periksaKunci(db: Db, soal: SoalForm[]): Promise<string | null> {
  const daftar = soal.map(s => ({ tipe: s.type, opsi: s.options, kunci: s.correct_answer, jawaban: jawabanBenar(s), bobot: s.weight }))
  for (const skema of ['sederhana', 'pengukuran']) {
    const { data, error } = await db.rpc('nilai_jawaban_banyak', { p_daftar: daftar, p_skema: skema })
    if (error) return `penilai: ${error.message}`
    const nilai = (data ?? []) as (number | string | null)[]
    for (const [i, s] of soal.entries()) {
      if (Number(nilai[i]) !== Number(s.weight)) return `soal ${i + 1} (${s.type}, skema ${skema}): kunci bernilai ${nilai[i]}, mestinya ${s.weight}`
    }
  }
  return null
}

// ─────────────────────────────────────────────── pemetaan form → topik

/** "12. Asesmen_7 SMP_Matematika_Skala dan Peta" → "Asesmen_7 SMP_Matematika_Skala dan Peta" */
export function namaDasar(nama: string): string {
  return nama.replace(/^\d+\.\s*/, '').trim()
}

export type CocokForm = { grup: GrupTopik; cara: 'kode' | 'peta' | 'nama' }

/**
 * Topik sebuah form dari NAMANYA, dengan urutan yang sama seperti materi:
 * (a) kode `[t-xxxxxx]` di nama, (b) peta manual (`lib/soal-pemetaan.json`),
 * (c) pola "Jenis_<kelas>_<Mapel>_<Topik>" dibandingkan persis (setelah
 * normalisasi) dengan Mapel / Kelas / Topik grup kurikulum. Kemiripan tidak
 * pernah dipakai untuk memutuskan.
 */
export function cocokkanForm(
  nama: string,
  indeks: ReturnType<typeof bangunIndeks>,
  petaNama: Map<string, string>,
  /** Jalur folder form di Drive, mis. "/2. Reguler/2. Kelas TKA 9 SMP/Matematika/3. Asesmen". */
  jalur = '',
): CocokForm | null {
  const dasar = namaDasar(nama)
  const kode = bacaKode([dasar])
  if (kode) {
    const g = indeks.perKode.get(kode)
    if (g) return { grup: g, cara: 'kode' }
  }
  const dariPeta = petaNama.get(normalisasi(dasar))
  if (dariPeta) {
    const g = indeks.perKode.get(dariPeta)
    if (g) return { grup: g, cara: 'peta' }
  }

  // Tiga bentuk nama yang dipakai tutor:
  //   Jenis_<kelas>_<Mapel>_<Topik>          "Asesmen_7 SMP_IPA_Kalor dan Perpindahannya"
  //   Jenis_<Mapel>_<kelas>_<Topik>          "Asesmen_Kimia_10 SMA_Sifat Periodik Unsur"
  //   Jenis_TKA_<kelas>_<Topik>              "Asesmen_TKA_9 SMP_Teorema Pythagoras" (mapel dari folder)
  let kelas: string | null = null
  let mapel: string | null = null
  let topik: string | null = null
  let m = /^[^_]*_\s*(?:TKA_)?\s*(\d+)\s*(?:SD|SMP|SMA)?\s*_(.+)$/i.exec(dasar)
  if (m) {
    kelas = m[1]
    const sisa = m[2]
    const potong = sisa.indexOf('_')
    if (potong > 0) { mapel = sisa.slice(0, potong); topik = sisa.slice(potong + 1) }
    else { topik = sisa; mapel = mapelDariJalur(jalur) }
  } else if ((m = /^[^_]*_([^_]+)_\s*(\d+)\s*(?:SD|SMP|SMA)\s*_(.+)$/i.exec(dasar))) {
    mapel = m[1]; kelas = m[2]; topik = m[3]
  }
  if (kelas && mapel && topik) {
    const calon = indeks.perNama.get([normalisasi(mapel), normalisasi(`Kelas ${kelas}`), normalisasi(topik)].join('|')) ?? []
    if (calon.length === 1) return { grup: calon[0], cara: 'nama' }
  }
  return null
}

/** Mapel dari folder: segmen tepat sesudah segmen "Kelas ..." (jalur Reguler). */
function mapelDariJalur(jalur: string): string | null {
  const seg = jalur.split('/').filter(Boolean)
  const i = seg.findIndex(s => /Kelas\s/i.test(s))
  const kandidat = i >= 0 ? seg[i + 1] : null
  return kandidat && !/asesmen|bank soal|materi/i.test(kandidat) ? kandidat : null
}

// ─────────────────────────────────────────────── Drive

export type FormDrive = { id: string; name: string; jalur: string; modifiedTime: string | null }

async function paralel<T, R>(daftar: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const hasil: R[] = new Array(daftar.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(n, daftar.length) }, async () => {
      while (i < daftar.length) {
        const k = i++
        hasil[k] = await fn(daftar[k])
      }
    }),
  )
  return hasil
}

export async function ambilFormDrive(drive: drive_v3.Drive, akar = FOLDER_ASESMEN): Promise<FormDrive[]> {
  const hasil: FormDrive[] = []
  async function isi(id: string, jalur: string) {
    const folder: { id: string; jalur: string }[] = []
    let token: string | undefined
    do {
      const r = await drive.files.list({
        q: `'${id}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id,name,mimeType,modifiedTime)',
        pageSize: 200,
        pageToken: token,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      })
      for (const f of r.data.files ?? []) {
        if (f.mimeType === 'application/vnd.google-apps.folder') folder.push({ id: f.id!, jalur: `${jalur}/${f.name}` })
        else if (f.mimeType === MIME_FORM) hasil.push({ id: f.id!, name: f.name ?? '', jalur, modifiedTime: f.modifiedTime ?? null })
      }
      token = r.data.nextPageToken ?? undefined
    } while (token)
    return folder
  }
  let tingkat = await isi(akar, '')
  while (tingkat.length) {
    const lanjut = await paralel(tingkat, 6, f => isi(f.id, f.jalur))
    tingkat = lanjut.flat()
  }
  return hasil
}

// ─────────────────────────────────────────────── sinkron

export type BarisSinkron = {
  file_id: string
  nama: string
  jalur: string
  modified_time: string | null
  group_id: string | null
  cara_cocok: string | null
  quiz_id: string | null
  butir_ids: string[]
  jumlah_butir: number
  status: 'selesai' | 'tanpa_topik' | 'dilewati' | 'galat' | 'perlu_tinjauan'
  catatan: string | null
  diperiksa_at: string
}

export type HasilSinkronSoal = {
  formDrive: number
  /** Menunggu giliran: form baru/berubah yang belum sempat diproses di putaran ini. */
  antrean: number
  dibuat: number
  diperbarui: number
  butirBaru: number
  tanpaTopik: { nama: string; jalur: string }[]
  dilewati: { nama: string; alasan: string }[]
  perluTinjauan: { nama: string; alasan: string }[]
  galat: { nama: string; alasan: string }[]
}

const norm = (s: string) => normalisasi(s)

export async function sinkronkanSoalDigital(opsi: {
  db: Db
  drive: drive_v3.Drive
  forms: forms_v1.Forms
  peta: PetaSoal[]
  tulis: boolean
  /** Form yang diproses per putaran; sisanya menunggu putaran berikutnya. */
  batas?: number
}): Promise<HasilSinkronSoal> {
  const { db, drive, forms, peta, tulis } = opsi
  const batas = opsi.batas ?? 40

  const { data: grupData, error: eGrup } = await db
    .from('curriculum_topic_groups')
    .select('id, curriculum, subject_id, grade_level, semester, theme, topic, subjects(name)')
  if (eGrup) throw new Error(`Gagal membaca grup topik: ${eGrup.message}`)
  const indeks = bangunIndeks((grupData ?? []) as GrupTopik[], [])
  const petaNama = new Map(peta.map(p => [norm(namaDasar(p.nama)), p.kode.toLowerCase()]))

  const berkas = await ambilFormDrive(drive)
  const { data: baris } = await db.from('sinkron_soal_drive').select('*')
  const ada = new Map(((baris ?? []) as BarisSinkron[]).map(b => [b.file_id, b]))

  // Yang perlu diproses: form baru, form yang berubah, yang sebelumnya galat,
  // dan yang tadinya tanpa topik tapi kini topiknya bisa dipastikan.
  const antri = berkas.filter(f => {
    const b = ada.get(f.id)
    if (!b) return true
    if (b.status === 'galat') return true
    if (b.modified_time && f.modifiedTime && new Date(b.modified_time).getTime() !== new Date(f.modifiedTime).getTime()) return true
    if (b.status === 'tanpa_topik' && cocokkanForm(f.name, indeks, petaNama, f.jalur)) return true
    return false
  })
  const giliran = antri.slice(0, batas)

  const hasil: HasilSinkronSoal = {
    formDrive: berkas.length, antrean: antri.length - giliran.length,
    dibuat: 0, diperbarui: 0, butirBaru: 0,
    tanpaTopik: [], dilewati: [], perluTinjauan: [], galat: [],
  }

  let penulis: string | null = null
  if (tulis) {
    const { data: admin } = await db.from('profiles').select('id').eq('role', 'admin').order('created_at').limit(1)
    penulis = admin?.[0]?.id ?? null
  }

  async function catat(f: FormDrive, b: Partial<BarisSinkron> & Pick<BarisSinkron, 'status'>) {
    if (!tulis) return
    await db.from('sinkron_soal_drive').upsert({
      file_id: f.id, nama: namaDasar(f.name), jalur: f.jalur, modified_time: f.modifiedTime,
      group_id: null, cara_cocok: null, quiz_id: null, butir_ids: [], jumlah_butir: 0, catatan: null,
      ...b, diperiksa_at: new Date().toISOString(),
    })
  }

  await paralel(giliran, 3, async f => {
    const nama = namaDasar(f.name)
    const lama = ada.get(f.id) ?? null
    const cocok = cocokkanForm(f.name, indeks, petaNama, f.jalur)
    try {
      const { data: form } = await forms.forms.get({ formId: f.id })
      const u = uraikanForm(form)
      if (u.gambar || u.soal.length === 0 || u.catatan.length > 0) {
        const alasan = u.gambar ? 'memuat gambar/video' : u.catatan.join(' | ') || 'tidak ada butir bernilai'
        hasil.dilewati.push({ nama, alasan })
        await catat(f, { status: 'dilewati', catatan: alasan })
        return
      }
      const salah = await periksaKunci(db, u.soal)
      if (salah) {
        hasil.galat.push({ nama, alasan: salah })
        await catat(f, { status: 'galat', catatan: salah })
        return
      }

      // Hasil lama boleh diganti hanya kalau masih draf dan belum dipakai siapa pun.
      let quizId = lama?.quiz_id ?? null
      let butirLama = lama?.butir_ids ?? []
      let berubah = false
      if (lama && lama.modified_time && f.modifiedTime && new Date(lama.modified_time).getTime() !== new Date(f.modifiedTime).getTime()) {
        berubah = true
        let aman = true
        if (quizId) {
          const [{ data: kuis }, { count: tugas }, { count: coba }] = await Promise.all([
            db.from('quizzes').select('status').eq('id', quizId).maybeSingle(),
            db.from('assessments').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId),
            db.from('attempts').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId),
          ])
          if (kuis && (kuis.status !== 'draft' || (tugas ?? 0) > 0 || (coba ?? 0) > 0)) aman = false
        }
        if (aman && butirLama.length) {
          const { data: sisaButir } = await db.from('question_bank_items').select('id, status_verifikasi').in('id', butirLama)
          if ((sisaButir ?? []).some((x: { status_verifikasi: string }) => x.status_verifikasi !== 'draf')) aman = false
        }
        if (!aman) {
          const alasan = 'form berubah di Drive, tetapi hasil lamanya sudah diaktifkan/dipakai — tinjau manual'
          hasil.perluTinjauan.push({ nama, alasan })
          await catat(f, { status: 'perlu_tinjauan', catatan: alasan, group_id: lama.group_id, cara_cocok: lama.cara_cocok, quiz_id: quizId, butir_ids: butirLama, jumlah_butir: lama.jumlah_butir })
          return
        }
        if (tulis) {
          if (butirLama.length) await db.from('question_bank_items').delete().in('id', butirLama)
          if (quizId) await db.from('quizzes').delete().eq('id', quizId)
        }
        quizId = null
        butirLama = []
      }

      // Kuis: pakai yang sudah ada (diadopsi dari impor awal bila judul & penanda sama) atau buat baru.
      if (tulis && !quizId) {
        const { data: sama } = await db.from('quizzes').select('id, description').eq('title', nama).limit(5)
        const adopsi = ((sama ?? []) as { id: string; description: string | null }[]).find(q => q.description?.startsWith(PENANDA_DESKRIPSI))
        if (adopsi) quizId = adopsi.id
        else {
          const { data: kuis, error: eKuis } = await db.from('quizzes')
            .insert({ title: nama, description: `${PENANDA_DESKRIPSI} (sinkron Drive). Sumber: ${f.jalur.replace(/^\//, '')}`, status: 'draft', kind: 'asesmen', created_by: penulis, settings: {} })
            .select('id').single()
          if (eKuis || !kuis) throw new Error(`kuis gagal dibuat: ${eKuis?.message}`)
          const { error: eSoal } = await db.from('questions').insert(
            u.soal.map((s, i) => ({ quiz_id: kuis.id, order_index: i, type: s.type, prompt: s.prompt, options: s.options, correct_answer: s.correct_answer, weight: s.weight })),
          )
          if (eSoal) { await db.from('quizzes').delete().eq('id', kuis.id); throw new Error(`soal kuis gagal ditulis: ${eSoal.message}`) }
          quizId = kuis.id
        }
      }

      // Butir bank soal: hanya kalau topiknya pasti.
      let butirIds: string[] = butirLama
      if (cocok && tulis && butirIds.length === 0) {
        const { data: tag } = await db.from('question_curriculum_tags').select('question_bank_items(prompt)').eq('group_id', cocok.grup.id)
        const sudah = new Set(((tag ?? []) as { question_bank_items: { prompt: string } | null }[]).map(t => norm(t.question_bank_items?.prompt ?? '')))
        const baru = u.soal.filter(s => !sudah.has(norm(s.prompt)))
        if (baru.length) {
          const { data: masuk, error: eButir } = await db.from('question_bank_items').insert(
            baru.map(s => ({
              created_by: penulis, type: s.type, prompt: s.prompt, options: s.options, correct_answer: s.correct_answer,
              weight: 1, explanation: s.pembahasan, status_verifikasi: 'draf', sumber_pembuatan: 'manual',
            })),
          ).select('id')
          if (eButir || !masuk) throw new Error(`butir bank soal gagal ditulis: ${eButir?.message}`)
          const { error: eTag } = await db.from('question_curriculum_tags').insert(
            masuk.map((m: { id: string }) => ({ question_bank_item_id: m.id, group_id: cocok.grup.id })),
          )
          if (eTag) { await db.from('question_bank_items').delete().in('id', masuk.map((m: { id: string }) => m.id)); throw new Error(`tag topik gagal: ${eTag.message}`) }
          butirIds = masuk.map((m: { id: string }) => m.id)
          hasil.butirBaru += butirIds.length
        }
      }

      if (lama && !berubah && lama.status === 'tanpa_topik') hasil.diperbarui++
      else if (lama) hasil.diperbarui++
      else hasil.dibuat++
      if (!cocok) hasil.tanpaTopik.push({ nama, jalur: f.jalur.replace(/^\//, '') })
      await catat(f, {
        status: cocok ? 'selesai' : 'tanpa_topik',
        group_id: cocok?.grup.id ?? null, cara_cocok: cocok?.cara ?? null,
        quiz_id: quizId, butir_ids: butirIds, jumlah_butir: u.soal.length,
        catatan: cocok ? null : 'topik belum bisa dipastikan dari nama form — tambahkan ke lib/soal-pemetaan.json atau beri kode [t-xxxxxx] pada nama form',
      })
    } catch (e) {
      const alasan = e instanceof Error ? e.message : 'galat tak dikenal'
      hasil.galat.push({ nama, alasan })
      await catat(f, { status: 'galat', catatan: alasan.slice(0, 500) })
    }
  })

  // Daftar kerja lengkap (termasuk yang diproses putaran lalu): form tanpa topik di buku catatan.
  if (tulis) {
    const { data: semua } = await db.from('sinkron_soal_drive').select('nama, jalur').eq('status', 'tanpa_topik')
    hasil.tanpaTopik = (semua ?? []) as { nama: string; jalur: string }[]
  }
  return hasil
}
