import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const SUPABASE_URL = 'https://fkieereilqfiqtjmpher.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

const __dirname = dirname(fileURLToPath(import.meta.url))
const records = JSON.parse(readFileSync(join(__dirname, '../scripts/math_data.json'), 'utf-8'))

async function main() {
  // 1. Upsert subject Matematika SD
  console.log('1. Mencari/membuat subject Matematika SD...')
  let { data: existing } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', 'Matematika')
    .contains('level', ['SD'])
    .single()

  let subjectId
  if (existing) {
    subjectId = existing.id
    console.log(`   Subject sudah ada: ${subjectId}`)
  } else {
    const { data: inserted, error } = await supabase
      .from('subjects')
      .insert({ name: 'Matematika', description: 'Matematika Sekolah Dasar', level: ['SD'] })
      .select('id')
      .single()
    if (error) throw new Error(`Gagal insert subject: ${error.message}`)
    subjectId = inserted.id
    console.log(`   Subject dibuat: ${subjectId}`)
  }

  // 2. Hapus data lama
  console.log('2. Menghapus data lama (kelas 1-6)...')
  const { error: delError, count } = await supabase
    .from('curriculum_topics')
    .delete()
    .eq('subject_id', subjectId)
    .in('grade_level', ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'])
  if (delError) throw new Error(`Gagal delete: ${delError.message}`)
  console.log(`   Dihapus`)

  // 3. Insert data baru dalam batch
  console.log(`3. Memasukkan ${records.length} capaian pembelajaran...`)
  const withSubjectId = records.map(r => ({ ...r, subject_id: subjectId }))

  const BATCH_SIZE = 50
  for (let i = 0; i < withSubjectId.length; i += BATCH_SIZE) {
    const batch = withSubjectId.slice(i, i + BATCH_SIZE)
    const { error: insError } = await supabase
      .from('curriculum_topics')
      .insert(batch)
    if (insError) throw new Error(`Gagal insert batch ${i}: ${insError.message}`)
    console.log(`   Batch ${i + 1}-${Math.min(i + BATCH_SIZE, withSubjectId.length)} OK`)
  }

  console.log('\n✓ Selesai! Ringkasan per kelas:')
  const byGrade = {}
  records.forEach(r => {
    byGrade[r.grade_level] = (byGrade[r.grade_level] || 0) + 1
  })
  Object.entries(byGrade).sort().forEach(([k, v]) => console.log(`  ${k}: ${v} item`))
  console.log(`  Total: ${records.length} item`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
