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
  ['Bilangan Bulat', 'Pengertian, Penjumlahan, dan Pengurangan', 'Siswa dapat membangun intuisi bilangan bulat, menalar operasi tambah/kurang sebagai "selisih jarak", serta memecahkan soal literasi terkait pergerakan suhu atau kedalaman benda.'],
  ['Bilangan Bulat', 'Perkalian, Pembagian, Pangkat, & Bilangan Prima', 'Siswa dapat menalar pola kelipatan, konsep eksponen, dan bilangan prima, serta membahas soal literasi yang berkaitan dengan pembagian logistik atau pola penyebaran.'],
  ['Bilangan Bulat', 'Faktor (FPB) dan Kelipatan (KPK)', 'Siswa dapat menemukan FPB dan KPK melalui pemahaman pembagi bersama, serta menyelesaikan soal literasi tentang penjadwalan berkala atau pembagian paket bantuan.'],
  ['Bilangan Bulat', 'Pengayaan Terpadu', 'Siswa dapat membahas dan memecahkan soal literasi tingkat lanjut (AKM) terkait analisis grafik, serta mengeksplorasi matriks bilangan dan sifat bilangan untuk fondasi ujian.'],
  ['Bilangan Rasional', 'Pecahan, Lambang, Pecahan Negatif, & Operasi Hitung', 'Siswa dapat memvisualisasikan pecahan, menempatkan pecahan negatif pada garis bilangan, menyelesaikan operasi hitung pecahan dengan penyamaan penyebut logis, serta menelaah soal literasi dari teks narasi/resep.'],
  ['Bilangan Rasional', 'Sifat Operasi dan Urutan Operasi', 'Siswa dapat menerapkan hierarki operasi hitung campuran pada pecahan dan membedah soal literasi terkait tahap penyelesaian masalah keuangan sederhana.'],
  ['Bilangan Rasional', 'Persentase & Bilangan Desimal', 'Siswa dapat menalar kesetaraan desimal dan persen, serta memecahkan soal literasi dalam konteks diskon belanja atau data sensus penduduk.'],
  ['Bilangan Rasional', 'Notasi Ilmiah (Bentuk Baku)', 'Siswa dapat menuliskan angka besar/kecil dengan perpangkatan basis 10 dan mendiskusikan soal literasi dari teks sains (jarak antarplanet atau ukuran sel).'],
  ['Bilangan Rasional', 'Pengayaan Terpadu', 'Siswa dapat memecahkan soal literasi kompleks dari teks instruksional (seperti resep masakan skala besar), serta memecahkan masalah pecahan bertingkat dan desimal berulang.'],
  ['Evaluasi', 'Review Materi Bilangan Bulat', 'Siswa dapat merangkum konsep dasar, menyelesaikan kuis formatif, dan membahas soal literasi terintegrasi untuk memperkuat pemahaman utuh pada materi bilangan bulat.'],
  ['Evaluasi', 'Review Materi Bilangan Rasional', 'Siswa dapat mereview seluruh konsep pecahan, desimal, persentase, dan notasi ilmiah serta membedah soal literasi untuk menguji pemahaman mendalam pada bilangan rasional.'],
  ['Ujian Tengah', 'UTS (Ujian Tengah Semester)', 'Siswa dapat mengerjakan Ujian Tengah Semester yang mengukur penguasaan nalar matematika dan pemecahan masalah literasi secara komprehensif.'],
  ['Rasio', 'Pengertian Perbandingan', 'Siswa dapat memahami konsep dasar membandingkan dua besaran secara logis dan menyimpulkan informasi dari teks literasi yang memuat data statistik dasar.'],
  ['Rasio', 'Perbandingan Senilai & Berbalik Nilai', 'Siswa dapat menalar konsep perbandingan senilai dan berbalik nilai secara intuitif, serta menyelesaikan soal literasi terkait proporsi bahan baku UMKM maupun manajemen waktu proyek.'],
  ['Rasio', 'Skala dan Peta', 'Siswa dapat mengaplikasikan rasio untuk menghitung skala peta dan mengevaluasi soal literasi berbasis teks geografi atau tata letak kota.'],
  ['Rasio', 'Laju Perubahan & Grafik Perbandingan', 'Siswa dapat menganalisis laju perubahan satu variabel terhadap variabel lain, memvisualisasikannya ke dalam grafik linear, serta membaca informasi tersirat dari grafik literasi visual.'],
  ['Rasio', 'Review Materi Rasio', 'Siswa dapat merangkum seluruh konsep perbandingan (senilai dan berbalik nilai), skala peta, serta laju perubahan, menyelesaikan kuis formatif, dan membedah soal literasi terintegrasi untuk memperkuat pemahaman utuh pada materi Rasio.'],
  ['Rasio', 'Pengayaan Terpadu', 'Siswa dapat membahas, mengkritisi, dan menyusun formula matematika dari teks literasi kompleks berbasis data statistik riil atau infografis panjang yang berkaitan dengan aplikasi rasio dan skala.'],
  ['Pengayaan', 'Pengayaan TKA: Bilangan Bulat', 'Siswa dapat membahas dan membedah bedah soal tipe TKA lanjutan khusus untuk materi bilangan bulat, sifat-sifatnya, serta analisis logika kuantitatif.'],
  ['Pengayaan', 'Pengayaan TKA: Bilangan Rasional', 'Siswa dapat mendiskusikan dan menyelesaikan tipe soal TKA yang menguji manipulasi aljabar tingkat lanjut pada bilangan rasional, pecahan bertingkat, dan bentuk baku.'],
  ['Pengayaan', 'Pengayaan TKA: Rasio', 'Siswa dapat menguasai strategi penyelesaian soal TKA tingkat tinggi yang berkaitan dengan pemodelan perbandingan, laju perubahan, dan analisis data rasio.'],
  ['Ujian Akhir', 'AAS (Asesmen Akhir Semester)', 'Siswa dapat mengerjakan Asesmen Akhir Semester yang menguji fondasi nalar dan kemampuan literasi dari Bab 1 hingga Bab 3.'],
  ['Pengayaan', 'Pengayaan: Olimpiade', 'Siswa dapat menyelesaikan soal-soal latihan olimpiade yang berkaitan dengan tema bilangan bulat, bilangan rasional dan rasio.'],
].map(([theme, topic, learning_outcomes], i) => ({
  grade_level: 'Kelas 7',
  semester: 1,
  theme,
  topic,
  learning_outcomes,
  sort_order: i,
}))

async function main() {
  console.log('1. Mencari subject Matematika...')
  let { data: existing } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', 'Matematika')
    .single()

  if (!existing) throw new Error('Subject Matematika tidak ditemukan')
  const subjectId = existing.id
  console.log(`   Subject ditemukan: ${subjectId}`)

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

  console.log(`\n✓ Selesai! ${records.length} pertemuan Matematika Kelas 7 Semester 1 dimasukkan.`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
