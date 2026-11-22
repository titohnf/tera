// Unggah gambar try out TKA SD Matematika ke bucket publik `quiz-uploads/tka-sd-mat/`.
//   node --env-file=.env.local docs/tryout-tka-sd-mat/unggah.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const dir = new URL('.', import.meta.url).pathname
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const url = {}
for (const f of readdirSync(dir + 'gambar').sort()) {
  const tujuan = 'tka-sd-mat/' + f
  const tipe = f.endsWith('.png') ? 'image/png' : 'image/jpeg'
  const { error } = await sb.storage.from('quiz-uploads').upload(tujuan, readFileSync(dir + 'gambar/' + f), { contentType: tipe, upsert: true })
  if (error) { console.error('GAGAL', tujuan, error.message); process.exitCode = 1; continue }
  url[f] = sb.storage.from('quiz-uploads').getPublicUrl(tujuan).data.publicUrl
}
writeFileSync(dir + 'url-gambar.json', JSON.stringify(url, null, 1))
console.log(Object.keys(url).length, 'terunggah')
