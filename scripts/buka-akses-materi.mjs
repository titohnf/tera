/**
 * Membuka akses berkas materi supaya bisa dibaca murid di dalam halaman.
 *
 * Panel materi di `/belajar` menyematkan berkas Drive langsung di halaman
 * (lihat `lib/belajar/sematan.ts`). Yang tidak dibagikan "siapa saja yang punya
 * link" tidak gagal dengan pesan yang bisa kita tangkap — Google merender layar
 * "Anda memerlukan akses" DI DALAM bingkainya, dan dari sisi kita itu tampak
 * seperti berhasil. Anak yang membukanya melihat formulir minta akses, bukan
 * materinya.
 *
 * Saat skrip ini ditulis: 27 dari 47 materi tersemat sudah terbuka, 20 belum.
 *
 * `--ubah` dan `--batal` butuh GOOGLE_SERVICE_ACCOUNT_EMAIL dan
 * GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY. Keduanya TIDAK ada di `.env.local` mana
 * pun saat ini — hanya di lingkungan produksi, tempat fitur duplikasi Drive
 * berjalan. Mode lihat tidak membutuhkannya sama sekali, dan itu disengaja:
 * memeriksa keadaan tidak boleh menuntut kunci yang bisa mengubah keadaan.
 *
 * Yang diubah hanya SATU hal: menambahkan izin baca untuk siapa pun yang punya
 * tautannya. Izin yang sudah ada tidak pernah disentuh, tidak ada berkas yang
 * dipindah, diubah isinya, apalagi dihapus. Peran yang diberikan `reader` —
 * tidak pernah `writer`, sekalipun berkasnya memang milik bimbel.
 *
 * BAWAANNYA TIDAK MENULIS APA-APA. Kebalikan dari
 * `isian-awal-materi-topik.mjs`, yang menulis kecuali diminta `--dry-run`.
 * Bedanya disengaja: yang ini mengubah izin berbagi berkas di Drive milik
 * orang, dan salah jalan di sini artinya bahan bimbel jadi bisa dibuka siapa
 * pun di internet yang menebak tautannya. Keadaan sepertinya harus diminta
 * dengan sengaja, bukan didapat karena lupa menambahkan flag.
 *
 *   node scripts/buka-akses-materi.mjs            # lihat saja, tidak menulis
 *   node scripts/buka-akses-materi.mjs --ubah     # benar-benar membuka akses
 *   node scripts/buka-akses-materi.mjs --batal    # menutup lagi yang dibuka
 *
 * `--batal` mencabut izin "anyone" pada berkas materi. Ia tidak bisa
 * membedakan izin yang dipasang skrip ini dari yang sudah dipasang orang
 * sebelumnya — jadi ia menutup keduanya, dan itu disebutkan di layar sebelum
 * berjalan.
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
// Mengimpor berkas TypeScript langsung dari skrip .mjs: Node 23+ melucuti
// anotasi tipe sendiri, dan `lib/google-drive.ts` isinya memang bisa dilucuti
// (tidak ada enum atau namespace). Di Node yang lebih tua impor ini gagal —
// mesin yang dipakai saat skrip ditulis ada di v24.
import { getDriveClient } from '../lib/google-drive.ts'

// Memuat .env.local sendiri; nilainya tidak pernah dicetak.
try {
  for (const baris of readFileSync('.env.local', 'utf8').split('\n')) {
    const cocok = baris.match(/^([A-Z_]+)=(.*)$/)
    if (cocok && !process.env[cocok[1]]) process.env[cocok[1]] = cocok[2].replace(/^["']|["']$/g, '')
  }
} catch {
  // Boleh datang dari luar.
}

const MODE = process.argv.includes('--batal')
  ? 'batal'
  : process.argv.includes('--ubah')
    ? 'ubah'
    : 'lihat'

/**
 * Id berkas Drive dari sebuah tautan.
 *
 * Kembaran `extractDriveFileId()` di `lib/curriculum-resource-links.ts`, ditulis
 * ulang di sini karena skrip node biasa tidak bisa mengimpor modul TypeScript.
 * Kalau yang di sana berubah, yang di sini ikut — keduanya harus sepakat soal
 * tautan mana yang dianggap berkas.
 *
 * Null untuk: tautan Google Form terbitan (id-nya bukan id berkas), tautan
 * FOLDER (tidak punya `/d/`), dan apa pun yang bukan Drive.
 */
function idBerkasDrive(url) {
  try {
    const u = new URL(url)
    if (!['docs.google.com', 'drive.google.com'].includes(u.hostname.replace(/^www\./, ''))) return null
    if (u.pathname.includes('/forms/d/e/')) return null
    const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]{15,})/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/**
 * Apakah berkasnya sudah bisa dibuka tanpa akun?
 *
 * Diperiksa dengan membukanya sungguhan tanpa membawa kredensial apa pun —
 * persis yang dialami browser anak. Menanyakannya ke Drive API tidak sama:
 * service account melihat berkas dengan haknya sendiri, dan bisa menjawab
 * "ada" untuk berkas yang bagi orang luar tertutup.
 */
async function sudahTerbuka(fileId) {
  const alamat = `https://drive.google.com/file/d/${fileId}/view`
  try {
    const res = await fetch(alamat, { redirect: 'manual' })
    const lokasi = res.headers.get('location') ?? ''
    if (res.status === 401 || res.status === 403) return false
    if (lokasi.includes('accounts.google.com')) return false
    return true
  } catch {
    // Tidak bisa dihubungi bukan berarti tertutup; jangan mengubah apa pun
    // hanya karena jaringan sedang buruk.
    return true
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !kunci) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur.')
  process.exit(1)
}

const db = createClient(url, kunci)
const { data: materi, error } = await db
  .from('curriculum_resources')
  .select('id, title, link_url')
  .eq('kind', 'materi')
  .order('title')
if (error) {
  console.error('Gagal membaca curriculum_resources:', error.message)
  process.exit(1)
}

// Hanya materi. `latihan_soal` sengaja tidak ikut: itu bahan untuk menyusun
// soal dan bisa memuat kunci jawaban — alasan yang sama kenapa portal keluarga
// pun tidak menampilkannya.
const berkas = []
let bukanBerkas = 0
for (const m of materi ?? []) {
  const fileId = idBerkasDrive(m.link_url)
  if (!fileId) {
    bukanBerkas++
    continue
  }
  if (!berkas.some((b) => b.fileId === fileId)) berkas.push({ fileId, title: m.title })
}

console.log(`materi        : ${materi?.length ?? 0}`)
console.log(`berkas Drive  : ${berkas.length} (${bukanBerkas} bukan berkas Drive — dilewati)`)
console.log(`mode          : ${MODE === 'lihat' ? 'LIHAT SAJA (tidak menulis apa pun)' : MODE.toUpperCase()}\n`)

if (MODE === 'batal') {
  console.log('--batal mencabut izin "siapa saja yang punya link" dari SEMUA berkas materi,')
  console.log('termasuk yang sudah terbuka sebelum skrip ini pernah dijalankan.\n')
}

const drive = MODE === 'lihat' ? null : getDriveClient()

const hasil = { sudah: 0, dibuka: 0, ditutup: 0, perlu: 0, takTerjangkau: [] }

for (const b of berkas) {
  const terbuka = await sudahTerbuka(b.fileId)
  const nama = b.title.slice(0, 48)

  if (MODE === 'batal') {
    if (!terbuka) continue
    try {
      const { data } = await drive.permissions.list({
        fileId: b.fileId,
        fields: 'permissions(id,type,role)',
        supportsAllDrives: true,
      })
      for (const izin of data.permissions ?? []) {
        if (izin.type !== 'anyone') continue
        await drive.permissions.delete({
          fileId: b.fileId,
          permissionId: izin.id,
          supportsAllDrives: true,
        })
        hasil.ditutup++
        console.log(`  ditutup : ${nama}`)
      }
    } catch (e) {
      hasil.takTerjangkau.push(nama)
      console.log(`  GAGAL   : ${nama} — ${e.message}`)
    }
    continue
  }

  if (terbuka) {
    hasil.sudah++
    continue
  }

  if (MODE === 'lihat') {
    hasil.perlu++
    console.log(`  perlu dibuka : ${nama}`)
    continue
  }

  try {
    await drive.permissions.create({
      fileId: b.fileId,
      requestBody: { type: 'anyone', role: 'reader' },
      // Tidak mengirim pemberitahuan: tidak ada orang yang diundang, dan
      // notifikasi untuk izin "anyone" hanya membingungkan pemilik berkasnya.
      sendNotificationEmail: false,
      supportsAllDrives: true,
    })
    hasil.dibuka++
    console.log(`  dibuka  : ${nama}`)
  } catch (e) {
    // Paling sering: service account bukan pemilik dan tidak punya hak
    // mengubah izin berkas itu. Yang seperti ini harus dibuka manusia dari
    // Drive, dan skrip ini berhenti mencoba alih-alih memaksa.
    hasil.takTerjangkau.push(nama)
    console.log(`  GAGAL   : ${nama} — ${e.message}`)
  }
}

console.log('')
if (MODE === 'batal') {
  console.log(`izin dicabut      : ${hasil.ditutup}`)
} else if (MODE === 'ubah') {
  console.log(`sudah terbuka     : ${hasil.sudah}`)
  console.log(`baru dibuka       : ${hasil.dibuka}`)
} else {
  console.log(`sudah terbuka     : ${hasil.sudah}`)
  console.log(`perlu dibuka      : ${hasil.perlu}`)
  console.log('\nJalankan lagi dengan --ubah kalau memang mau membukanya.')
}
if (hasil.takTerjangkau.length) {
  console.log(`\ntidak bisa disentuh service account (${hasil.takTerjangkau.length}) — harus dibuka manual di Drive:`)
  for (const n of hasil.takTerjangkau) console.log('  -', n)
}
