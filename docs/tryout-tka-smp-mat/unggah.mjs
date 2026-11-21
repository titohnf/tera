// Unggah gambar stimulus try out TKA SMP Matematika ke bucket publik `quiz-uploads`.
//   node --env-file=../../.env.local docs/tryout-tka-smp-mat/unggah.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const dir = new URL('.', import.meta.url).pathname
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const peta = JSON.parse(readFileSync(dir + 'siap/peta-gambar.json', 'utf8'))
const berkas = new Map() // jalur lokal -> nama tujuan
for (const f of Object.values(peta)) berkas.set(f, 'tka-smp-mat/' + f.replace('gambar/', '').replace('.jpg', '') + '.jpg')
berkas.set('siap/no12-pilihan.png', 'tka-smp-mat/no12-pilihan.png')
berkas.set('siap/no25-pilihan.png', 'tka-smp-mat/no25-pilihan.png')
const url = {}
for (const [lokal, tujuan] of berkas) {
  const tipe = tujuan.endsWith('.png') ? 'image/png' : 'image/jpeg'
  const { error } = await sb.storage.from('quiz-uploads').upload(tujuan, readFileSync(dir + lokal), { contentType: tipe, upsert: true })
  if (error) { console.error('GAGAL', tujuan, error.message); process.exitCode = 1; continue }
  url[lokal] = sb.storage.from('quiz-uploads').getPublicUrl(tujuan).data.publicUrl
  console.log('ok', tujuan)
}
writeFileSync(dir + 'siap/url-gambar.json', JSON.stringify(url, null, 1))
console.log(Object.keys(url).length, 'terunggah')
