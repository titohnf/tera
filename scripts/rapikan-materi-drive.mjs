/**
 * Merapikan materi di folder Drive bimbel, sekali jalan.
 *
 * Folder "Materi dan Bank Soal Semester 1 2026/2027" memuat dua susunan yang
 * bersaing sejak arsip `tutor.bimbeltera` dipindahkan ke sana: pohon per murid
 * dan per kelas — yang menjawab "murid ini pertemuan lalu pakai apa" — dan 60
 * berkas rata di akarnya. Yang ditanyakan `/belajar` pertanyaan ketiga:
 * "topik kurikulum ini punya materi apa". Skrip ini membuat tempat yang
 * menjawab pertanyaan itu, dan tidak mengusik dua yang lain.
 *
 * Yang dikerjakan:
 *   1. Membangun `Materi Kurikulum/<Mapel>/<Kelas>/<Topik>/`
 *   2. Memindahkan 39 PDF dari akar ke folder topiknya, dinamai judul materinya
 *   3. Mencatat file id baru → `pdf_path` lama di `curriculum_resource_duplications`
 *   4. Mengarahkan `curriculum_resources.link_url` ke berkas di folder itu
 *   5. Membuang `.DS_Store` dan sisa salinan Juli ke Sampah Drive
 *   6. Menamai ulang pohon arsip jadi "Arsip Sesi - Semester Ganjil 2026-2027"
 *
 * LANGKAH 3 TIDAK BOLEH DILEWATI. `/api/materi/[id]` mencari PDF di bucket
 * lewat file id yang ada di `link_url`. Begitu link_url menunjuk berkas baru
 * tanpa baris pemetaannya, setiap materi berubah jadi 404 — dan kegagalannya
 * tidak muncul di mana pun kecuali di layar anak yang sedang membukanya.
 *
 * Topik dijadikan FOLDER, bukan nama berkas: satu topik boleh punya lebih dari
 * satu materi, dan empat di antaranya memang begitu. Nama folder tidak dipakai
 * mencocokkan apa pun — yang mengikat tetap file id di dalam `link_url` — jadi
 * mengganti nama topik di Tera tidak memutuskan apa-apa di sini.
 *
 * Duplikat DI DALAM pohon arsip sengaja dibiarkan: materi yang sama muncul di
 * folder beberapa murid karena memang dipakai di beberapa sesi, dan menghapus
 * salinan di folder seorang murid mengubah catatan sesinya.
 *
 * Aman diulang: folder yang sudah ada dipakai kembali, berkas yang sudah di
 * tempatnya tidak pindah dua kali, dan baris duplications yang sudah ada tidak
 * digandakan. Semua yang dibuang masuk Sampah Drive, bisa dikembalikan 30 hari.
 *
 * Butuh /tmp/drive2.json (hasil pemindaian) dan ~/Downloads/materi-tera-untuk-drive/_peta.json
 *
 *   node scripts/rapikan-materi-drive.mjs            # uji coba, tidak mengubah apa pun
 *   node scripts/rapikan-materi-drive.mjs --jalankan # eksekusi
 */
import { readFileSync } from 'fs'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
const JALANKAN = process.argv.includes('--jalankan')
const k = JSON.parse(readFileSync(process.env.HOME + '/Downloads/tera-506803-4a78a7715d6c.json','utf8'))
const auth = new google.auth.JWT({ email:k.client_email, key:k.private_key, scopes:['https://www.googleapis.com/auth/drive'] })
const drive = google.drive({ version:'v3', auth })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ROOT='1uYbssLlmPq1oaKKdTqWJBuSd63SRXs4v'
const { semua } = JSON.parse(readFileSync('/tmp/drive2.json','utf8'))
const peta = JSON.parse(readFileSync(process.env.HOME+'/Downloads/materi-tera-untuk-drive/_peta.json','utf8'))
const [{data:res},{data:grp},{data:subj},{data:dup}] = await Promise.all([
  sb.from('curriculum_resources').select('id,title,link_url,group_id').eq('kind','materi'),
  sb.from('curriculum_topic_groups').select('id,subject_id,grade_level,topic'),
  sb.from('subjects').select('id,name'),
  sb.from('curriculum_resource_duplications').select('drive_file_id,pdf_path'),
])
const nm=new Map(subj.map(s=>[s.id,s.name])), gi=new Map(grp.map(g=>[g.id,g]))
const byId=new Map(res.map(r=>[r.id,r]))
const akar=new Map(semua.filter(f=>!f.jalur).map(f=>[f.name,f]))
const bersih=t=>t.trim().replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').slice(0,120)
const rencana=[]
for (const p of peta) {
  const f=akar.get(p.berkas); const r=byId.get(p.resource_id); const g=r?gi.get(r.group_id):null
  if(!f||!r||!g) continue
  rencana.push({ fileId:f.id, jalur:['Materi Kurikulum', nm.get(g.subject_id)??'Umum', g.grade_level, bersih(g.topic)],
    keNama:bersih(r.title)+'.pdf', resourceId:r.id, pdfPath:p.pdf_path })
}
const kunci={}; for(const x of rencana){ const kk=x.jalur.join('/')+'/'+x.keNama; (kunci[kk]??=[]).push(x.fileId) }
const bentrok=Object.entries(kunci).filter(([,v])=>v.length>1)
console.log('berkas:',rencana.length,'| folder topik:',new Set(rencana.map(x=>x.jalur.join('/'))).size)
console.log('bentrok nama:', bentrok.length?bentrok:'tidak ada')
if(!JALANKAN){ console.log('\n== UJI COBA =='); process.exit(0) }

// --- eksekusi ---
const cacheFolder=new Map()
async function folderId(jalur){
  const kunci=jalur.join('/')
  if(cacheFolder.has(kunci)) return cacheFolder.get(kunci)
  const induk = jalur.length===1 ? ROOT : await folderId(jalur.slice(0,-1))
  const nama = jalur[jalur.length-1]
  const q=`'${induk}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder' and name='${nama.replace(/'/g,"\\'")}'`
  const ada=await drive.files.list({ q, fields:'files(id)', pageSize:1, supportsAllDrives:true })
  let id=ada.data.files?.[0]?.id
  if(!id){
    const r=await drive.files.create({ requestBody:{ name:nama, mimeType:'application/vnd.google-apps.folder', parents:[induk] }, fields:'id', supportsAllDrives:true })
    id=r.data.id
  }
  cacheFolder.set(kunci,id); return id
}
let pindah=0
for(const x of rencana){
  const tujuan=await folderId(x.jalur)
  const kini=await drive.files.get({fileId:x.fileId, fields:'parents', supportsAllDrives:true})
  await drive.files.update({ fileId:x.fileId, addParents:tujuan, removeParents:(kini.data.parents??[]).join(','),
    requestBody:{ name:x.keNama }, supportsAllDrives:true })
  pindah++
  if(pindah%10===0) console.log('  dipindahkan',pindah)
}
console.log('dipindahkan & dinamai ulang:',pindah)

// duplications untuk file id baru — supaya /belajar tetap terbaca dari bucket
const adaDup=new Set(dup.map(d=>d.drive_file_id))
const baris=rencana.filter(x=>!adaDup.has(x.fileId)).map(x=>({ drive_file_id:x.fileId, pdf_path:x.pdfPath }))
if(baris.length){
  const { error }=await sb.from('curriculum_resource_duplications').insert(baris)
  console.log('baris duplications baru:', error? 'GAGAL '+error.message : baris.length)
}
// arahkan link_url ke berkas di folder
let ubah=0
for(const x of rencana){
  const { error }=await sb.from('curriculum_resources').update({ link_url:`https://drive.google.com/file/d/${x.fileId}/view` }).eq('id',x.resourceId)
  if(error) console.log('GAGAL update',x.resourceId,error.message); else ubah++
}
console.log('link_url diarahkan:',ubah)

// sampah
const sampah=semua.filter(f=>f.name==='.DS_Store')
const buang=[...akar.values()].filter(f=>!peta.some(p=>p.berkas===f.name) && !f.mimeType.includes('spreadsheet'))
for(const f of [...sampah,...buang]) await drive.files.update({fileId:f.id, requestBody:{trashed:true}, supportsAllDrives:true})
console.log('dibuang ke Sampah:', sampah.length+buang.length)

// pohon arsip diberi nama yang jelas
const pohon=await drive.files.list({ q:`'${ROOT}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`, fields:'files(id,name)', supportsAllDrives:true })
for(const f of pohon.data.files??[]){
  if(/^3\.\s*Semester Ganjil/.test(f.name)){
    await drive.files.update({fileId:f.id, requestBody:{name:'Arsip Sesi - Semester Ganjil 2026-2027'}, supportsAllDrives:true})
    console.log('pohon arsip dinamai ulang:', f.name, '→ Arsip Sesi - Semester Ganjil 2026-2027')
  }
}
