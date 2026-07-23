import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fkieereilqfiqtjmpher.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

const records = [
  ['Hakikat Sains dan Percobaan dalam IPA', 'Sains, Metode Ilmiah & Keterampilan Proses', 'Siswa dapat memahami hakikat sains, menalar tahapan metode ilmiah beserta keterampilan proses sains, serta memecahkan soal literasi dari teks penemuan tokoh ilmuwan.'],
  ['Hakikat Sains dan Percobaan dalam IPA', 'Pengukuran Dasar 1: Besaran Pokok & Satuan Baku', 'Siswa dapat melakukan pengukuran besaran pokok (panjang, massa, waktu) dengan alat ukur presisi, menalar pentingnya satuan baku (SI), dan menganalisis teks literasi terkait sejarah standar ukur.'],
  ['Hakikat Sains dan Percobaan dalam IPA', 'Pengukuran Dasar 2: Besaran Turunan & Ketelitian Alat', 'Siswa dapat menalar konsep besaran turunan (mengukur volume benda tak beraturan), membedakan tingkat ketelitian alat ukur, dan membedah teks literasi berupa data manual instrumen laboratorium.'],
  ['Hakikat Sains dan Percobaan dalam IPA', 'Pengayaan Terpadu', 'Siswa dapat membahas dan memecahkan soal literasi tingkat lanjut (AKM) tentang desain eksperimen, serta mengeksplorasi logika ketidakpastian pengukuran untuk fondasi olimpiade dan ujian.'],
  ['Eksplorasi Materi dan Perubahannya', 'Klasifikasi Materi', 'Siswa dapat menalar perbedaan unsur, senyawa, dan campuran, serta membedah soal literasi dari teks infografis mengenai klasifikasi zat di alam.'],
  ['Eksplorasi Materi dan Perubahannya', 'Sifat Materi & Model Partikel', 'Siswa dapat memvisualisasikan model partikel (padat, cair, gas), menalar sifat materi secara mikroskopis, dan menyimpulkan informasi dari teks literasi fenomena alam.'],
  ['Eksplorasi Materi dan Perubahannya', 'Kerapatan (Massa Jenis)', 'Siswa dapat menalar konsep kerapatan massa secara intuitif tanpa bergantung pada hafalan rumus, serta memecahkan soal literasi terkait peristiwa benda mengapung.'],
  ['Eksplorasi Materi dan Perubahannya', 'Perubahan Fisika dan Kimia', 'Siswa dapat membedakan perubahan fisika dan kimia melalui analisis gejala, serta mengevaluasi soal literasi naratif tentang proses pembusukan makanan atau perkaratan.'],
  ['Eksplorasi Materi dan Perubahannya', 'Metode Pemisahan Campuran', 'Siswa dapat menalar berbagai metode pemisahan campuran (filtrasi, distilasi, kromatografi) dan mendiskusikan teks literasi tentang teknologi pengolahan air bersih.'],
  ['Eksplorasi Materi dan Perubahannya', 'Pengayaan Terpadu', 'Siswa dapat membahas dan memecahkan soal literasi kompleks terkait isu lingkungan (pencemaran materi), serta mengeksplorasi analisis grafik wujud zat untuk fondasi pengayaan.'],
  ['Evaluasi', 'Review & Kuis', 'Siswa dapat menyelesaikan kuis formatif dan membedah soal literasi terintegrasi untuk mendiagnosis pemahaman fondasi hakikat sains dan eksplorasi materi.'],
  ['Ujian Tengah', 'UTS (Ujian Tengah Semester)', 'Siswa dapat mengerjakan Ujian Tengah Semester yang mengukur nalar saintifik dan pemecahan masalah literasi secara komprehensif.'],
  ['Konsep Suhu, Pemuaian, dan Kalor', 'Suhu dan Alat Ukurnya', 'Siswa dapat menalar konsep suhu, mengonversi skala dengan logika perbandingan linear (tanpa rumus cepat), dan menganalisis teks literasi terkait data cuaca internasional.'],
  ['Konsep Suhu, Pemuaian, dan Kalor', 'Konsep Pemuaian Benda', 'Siswa dapat menalar fenomena pemuaian pada benda padat, cair, dan gas, serta memecahkan soal literasi mengenai rekayasa konstruksi rel kereta atau jembatan.'],
  ['Konsep Suhu, Pemuaian, dan Kalor', 'Kalor dan Perpindahannya', 'Siswa dapat memahami mekanisme konduksi, konveksi, dan radiasi, menalar keseimbangan energi, serta membedah teks literasi tentang insulasi arsitektur bangunan.'],
  ['Konsep Suhu, Pemuaian, dan Kalor', 'Pengayaan Terpadu', 'Siswa dapat memecahkan soal literasi tingkat lanjut mengenai efisiensi energi termal dan mengeksplorasi penalaran aljabar pada konsep Asas Black.'],
  ['Gerak dan Gaya dalam Kehidupan', 'Mengenal Konsep Gerak', 'Siswa dapat membedakan besaran skalar (jarak) dan vektor (perpindahan), menalar laju gerak lurus, serta memecahkan soal literasi membaca rute peta navigasi.'],
  ['Gerak dan Gaya dalam Kehidupan', 'Pengenalan Gaya', 'Siswa dapat mengidentifikasi berbagai jenis gaya sentuh dan tak sentuh, menggambar resultan gaya, dan membahas soal literasi tentang pentingnya gesekan ban kendaraan.'],
  ['Gerak dan Gaya dalam Kehidupan', 'Menyelisik Hukum I & II Newton', 'Siswa dapat menalar konsep inersia (kelembaman) dan hubungan massa terhadap percepatan, serta menganalisis teks literasi kecelakaan lalu lintas atau fitur keselamatan mobil.'],
  ['Gerak dan Gaya dalam Kehidupan', 'Hukum III Newton & Aplikasinya', 'Siswa dapat mengidentifikasi interaksi gaya aksi-reaksi pada berbagai benda dan membedah soal literasi naratif mengenai prinsip kerja dorongan roket ruang angkasa.'],
  ['Gerak dan Gaya dalam Kehidupan', 'Pengayaan Terpadu', 'Siswa dapat membahas soal literasi analitis dari grafik gerak lurus (v-t), serta mengeksplorasi penalaran sistem interaksi benda pada katrol untuk dasar mekanika tingkat tinggi.'],
  ['Evaluasi', 'Review & Kuis', 'Siswa dapat menyelesaikan kuis formatif dan membedah soal literasi untuk memastikan pemahaman konseptual interaksi energi termal dan mekanika gaya.'],
  ['Ujian Akhir', 'AAS (Asesmen Akhir Semester)', 'Siswa dapat mengerjakan Asesmen Akhir Semester yang menguji fondasi nalar kritis dan kemampuan membaca teks sains dari Bab 1 hingga Bab 4.'],
].map(([theme, topic, learning_outcomes], i) => ({
  grade_level: 'Kelas 7',
  semester: 1,
  theme,
  topic,
  learning_outcomes,
  sort_order: i,
}))

async function main() {
  console.log('1. Mencari/membuat subject IPA SMP...')
  let { data: existing } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', 'IPA')
    .contains('level', ['SMP'])
    .single()

  let subjectId
  if (existing) {
    subjectId = existing.id
    console.log(`   Subject sudah ada: ${subjectId}`)
  } else {
    const { data: inserted, error } = await supabase
      .from('subjects')
      .insert({ name: 'IPA', description: 'Ilmu Pengetahuan Alam SMP', level: ['SMP'] })
      .select('id')
      .single()
    if (error) throw new Error(`Gagal insert subject: ${error.message}`)
    subjectId = inserted.id
    console.log(`   Subject dibuat: ${subjectId}`)
  }

  console.log('2. Menghapus data lama (Kelas 7 semester 1)...')
  const { error: delError } = await supabase
    .from('curriculum_topics')
    .delete()
    .eq('subject_id', subjectId)
    .eq('grade_level', 'Kelas 7')
    .eq('semester', 1)
  if (delError) throw new Error(`Gagal delete: ${delError.message}`)
  console.log('   Dihapus')

  console.log(`3. Memasukkan ${records.length} pertemuan...`)
  const rows = records.map(r => ({ ...r, subject_id: subjectId }))
  const { error: insError } = await supabase
    .from('curriculum_topics')
    .insert(rows)
  if (insError) throw new Error(`Gagal insert: ${insError.message}`)

  console.log(`\n✓ Selesai! ${records.length} pertemuan IPA Kelas 7 Semester 1 dimasukkan.`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
