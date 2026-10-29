/**
 * Mengisi `question_bank_items.paket_kunci` ("form:<id berkas Drive>") pada
 * butir hasil sinkron Google Form yang dibuat SEBELUM migrasi 203. Sumbernya
 * buku catatan `sinkron_soal_drive.butir_ids`: satu form = satu paket.
 *
 *   node --env-file=.env.local scripts/isi-paket-kunci-form.mjs          # hitung saja
 *   node --env-file=.env.local scripts/isi-paket-kunci-form.mjs --tulis
 *
 * Hanya mengisi yang masih kosong; tidak pernah menimpa. Aman diulang.
 */
import { createClient } from '@supabase/supabase-js'

const TULIS = process.argv.includes('--tulis')
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const baris = []
for (let d = 0; ; d += 1000) {
  const { data, error } = await db.from('sinkron_soal_drive').select('file_id, butir_ids').order('file_id').range(d, d + 999)
  if (error) { console.error(error.message); process.exit(1) }
  baris.push(...data)
  if (data.length < 1000) break
}

let kandidat = 0, terisi = 0
for (const b of baris) {
  if (!b.butir_ids?.length) continue
  const { data: kosong } = await db.from('question_bank_items').select('id').in('id', b.butir_ids).is('paket_kunci', null)
  kandidat += kosong?.length ?? 0
  if (TULIS && kosong?.length) {
    const { error } = await db.from('question_bank_items').update({ paket_kunci: `form:${b.file_id}` }).in('id', kosong.map(x => x.id))
    if (error) { console.error(`GAGAL form ${b.file_id}: ${error.message}`); process.exit(1) }
    terisi += kosong.length
  }
}
console.log(`${baris.length} form di buku catatan; ${kandidat} butir belum bertanda${TULIS ? `, ${terisi} diisi` : ' (belum ditulis, tambahkan --tulis)'}.`)
