/**
 * Mengaktifkan butir bank soal DRAF yang dipasangi tag topik kurikulum — yaitu
 * butir hasil impor bank soal tutor dan sinkron Google Form. Sebelum impor
 * itu `question_curriculum_tags` kosong, jadi cakupan ini tepat butir-butir
 * tersebut dan tidak menyentuh bank soal sistem peta (yang berbasis `topik_id`).
 *
 *   node --env-file=.env.local scripts/aktifkan-butir-draf.mjs           # hitung saja
 *   node --env-file=.env.local scripts/aktifkan-butir-draf.mjs --tulis
 *
 * Hanya mengubah `draf` -> `aktif`. Yang `ditarik` atau sudah `aktif` tidak disentuh.
 */
import { createClient } from '@supabase/supabase-js'

const TULIS = process.argv.includes('--tulis')
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ids = []
for (let d = 0; ; d += 1000) {
  const { data, error } = await db.from('question_curriculum_tags').select('question_bank_item_id').order('question_bank_item_id').range(d, d + 999)
  if (error) { console.error(error.message); process.exit(1) }
  ids.push(...data.map(t => t.question_bank_item_id))
  if (data.length < 1000) break
}
const uniq = [...new Set(ids)]
const draf = []
for (let i = 0; i < uniq.length; i += 200) {
  const { data } = await db.from('question_bank_items').select('id, status_verifikasi').in('id', uniq.slice(i, i + 200))
  draf.push(...data.filter(x => x.status_verifikasi === 'draf').map(x => x.id))
}
console.log(`${uniq.length} butir bertag topik; ${draf.length} berstatus draf.`)
if (!TULIS) { console.log('Belum ditulis. Tambahkan --tulis untuk mengaktifkan.'); process.exit(0) }

let aktif = 0
for (let i = 0; i < draf.length; i += 100) {
  const { error, count } = await db.from('question_bank_items')
    .update({ status_verifikasi: 'aktif' }, { count: 'exact' })
    .in('id', draf.slice(i, i + 100))
    .eq('status_verifikasi', 'draf')
  if (error) { console.error(`GAGAL: ${error.message}`); process.exit(1) }
  aktif += count ?? 0
}
console.log(`${aktif} butir diaktifkan.`)
