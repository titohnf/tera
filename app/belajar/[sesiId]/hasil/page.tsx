import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  labelPenguasaan,
  pemilikSesi,
  isiPaket,
  keadaanPaket,
  paketSesi,
  ringkasanSesi,
  rubrikMapel,
  tinjauanSesi,
  tutupSesi,
  type PitaPenguasaan,
} from '@/lib/belajar/sesi'
import {
  isiPaketTopik,
  keadaanPaketTopik,
  paketTopikSesi,
  pesanPendampingan,
} from '@/lib/belajar/topik-peta'
import { namaPaket } from '@/lib/belajar/nama-paket'
import { persenDari } from '@/lib/belajar/penilaian'
import { createClient } from '@/lib/supabase/server'
import { materiTopik } from '@/lib/belajar/materi'
import TinjauanSesi from '@/components/belajar/TinjauanSesi'
import { hasilSoal, KeteranganJawaban, NomorJawaban } from '@/components/belajar/BilahJawaban'
import PilihanSesudahSkor from '@/components/belajar/PilihanSesudahSkor'

/**
 * Hasil satu sesi, dirinci per topik.
 *
 * Soal yang bertag dua topik dihitung di keduanya — itu memang tujuannya.
 * Pertanyaan yang dijawab halaman ini adalah "sejauh apa penguasaan topik ini",
 * bukan "apakah angkanya berjumlah seratus persen".
 *
 * Labelnya (mis. "Mahir", "Cakap") datang dari rubrik mapel di database, bukan
 * dari daftar yang ditulis di sini. Mapel tanpa rubrik menampilkan persentase
 * mentah — tanpa label lebih jujur daripada label yang dikarang halaman ini.
 */
export default async function HasilSesi({
  params,
  searchParams,
}: {
  params: Promise<{ sesiId: string }>
  searchParams: Promise<{ soal?: string; kunci?: string }>
}) {
  const { sesiId } = await params
  const { soal: soalDiminta, kunci: kunciDiminta } = await searchParams

  const pemilik = await pemilikSesi(sesiId)
  if (!pemilik) redirect('/belajar')

  // Halaman inilah tanda sesi itu selesai, jadi di sinilah ia ditutup — bukan
  // di tombol yang membawa orang ke sini. Sebuah tombol bisa tidak tertekan
  // (dan memang pernah tidak: sesi pertama di produksi berakhir dengan
  // `finished_at` null), sementara halaman ini pasti dilewati siapa pun yang
  // sampai di akhir. `practice_finish_session` memakai `coalesce`, jadi membuka
  // halaman ini dua kali tidak memundurkan waktu selesainya.
  await tutupSesi(sesiId)

  // Sesudah `tutupSesi`, tidak sebelumnya: `practice_session_review` cuma
  // membuka sesi yang `finished_at`-nya terisi, dan syarat itulah yang menjaga
  // kunci jawaban di dalamnya (migrasi 131).
  const [rincian, tinjauan, paket, petaPaket, pendampingan] = await Promise.all([
    ringkasanSesi(pemilik.learnerId, sesiId),
    tinjauanSesi(sesiId),
    paketSesi(sesiId),
    paketTopikSesi(sesiId),
    // Sesudah `tutupSesi` juga, dan itu syarat: pendeteksi eskalasi (149)
    // adalah trigger pada `finished_at`, jadi barisnya baru ada setelah sesi
    // ini benar-benar ditutup. Hampir selalu null.
    pesanPendampingan(pemilik.learnerId, sesiId),
  ])

  // Keadaan paketnya SESUDAH putaran ini ditutup — berapa dari kesepuluh soal
  // yang kini benar, sudah berapa putaran, dan apakah kuncinya sudah dibuka.
  // Ini yang dinilai, bukan putaran yang barusan: putaran kedua yang berisi
  // empat soal dan benar semua bukan "100%", melainkan paket yang naik dari
  // 6/10 jadi 10/10.
  //
  // DUA JALUR, SATU BENTUK. Paket grup dan paket peta menjawab pertanyaan yang
  // sama untuk halaman ini — berapa nilai paketnya sekarang, berapa soal yang
  // masih salah, kuncinya sudah dibuka atau belum — jadi keduanya diperas jadi
  // satu bentuk di sini, dan sisa halaman tidak perlu tahu sesi ini datang dari
  // mana. Cabang yang menyebar ke seluruh berkas adalah cabang yang suatu hari
  // lupa dipasang di satu tempat.
  const [semuaPaket, isi] = paket
    ? await Promise.all([
        keadaanPaket(pemilik.learnerId, paket.groupId),
        isiPaket(pemilik.learnerId, paket.groupId),
      ])
    : petaPaket
      ? await Promise.all([
          keadaanPaketTopik(pemilik.learnerId, petaPaket.topikId),
          isiPaketTopik(pemilik.learnerId, petaPaket.paketId),
        ])
      : [[], []]

  const paketIni = paket
    ? (semuaPaket.find(p => p.nomor === paket.nomor) ?? null)
    : petaPaket
      ? ((semuaPaket as { paketId?: string }[]).find(
          p => p.paketId === petaPaket.paketId,
        ) as (typeof semuaPaket)[number] | undefined) ?? null
      : null

  // Nomor soal DI DALAM PAKETNYA, bukan di dalam putaran ini.
  //
  // Putaran ketiga yang isinya enam sisa soal menomori mereka 1..6, dan nomor
  // itu tidak berarti apa-apa di luar putaran itu: soal yang sama muncul
  // sebagai "nomor 5" di rincian topik dan "nomor 2" di sini, dan orang tua
  // yang mengetuk petak nomor 5 mendarat di layar yang berkata "Soal 2".
  // Nomor paket tetap seumur paketnya, jadi itu yang dipakai di mana pun.
  const ordPaket = new Map(isi.map(b => [b.itemId, b.ord]))
  // Dinomori ulang SEKALI di sini, bukan diterjemahkan di tiap pemakaian: satu
  // saja pemakaian yang lupa diterjemahkan akan menampilkan dua nomor berbeda
  // untuk soal yang sama di layar yang sama.
  const soal = tinjauan.map(t => ({ ...t, nomor: ordPaket.get(t.id) ?? t.nomor }))

  // Rubriknya milik mapel sesi ini. Dibaca lewat sesinya, bukan diterima dari
  // alamat, supaya halaman ini tidak bisa dipakai mengintip rubrik mapel lain.
  const supabase = await createClient()
  const { data: sesi } = await supabase
    .from('practice_sessions')
    .select('subject_id, group_ids')
    .eq('id', sesiId)
    .single()
  const rubrik: PitaPenguasaan[] | null = sesi?.subject_id
    ? await rubrikMapel(sesi.subject_id as string)
    : null

  // Nilai PAKET (kesepuluh soalnya, keadaan sekarang) kalau sesi ini bagian
  // dari paket. Sesi lama yang lahir sebelum paket ada jatuh ke nilai sesinya
  // sendiri — satu-satunya angka yang memang dimilikinya.
  const total = rincian.reduce((s, b) => s + Number(b.score), 0)
  const maksimum = rincian.reduce((s, b) => s + Number(b.max_score), 0)
  const persen = paketIni
    ? persenDari(paketIni.skor, paketIni.maks)
    : persenDari(total, maksimum)
  const label = labelPenguasaan(rubrik, persen)

  const kembali = pemilik.profileId ? `/belajar?anak=${pemilik.profileId}` : '/belajar'
  // Topik yang barusan dikerjakan, supaya "Ulangi" kembali ke bahannya dan
  // bukan ke daftar mapel. Yang dipakai `group_ids` SESINYA, bukan rincian di
  // layar: rincian bisa memuat topik kedua karena satu soal bertanda dua topik
  // (lihat catatan di atas), dan yang dipilih anak tadi cuma satu.
  //
  // Rinciannya jadi cadangan untuk sesi lama yang `group_ids`-nya kosong.
  const groupIds = (sesi?.group_ids as string[] | null) ?? []
  const topikTadi = groupIds[0] ?? rincian[0]?.group_id ?? null
  // Tautan materi hanya kalau topiknya PUNYA materi. "Baca materinya dulu" yang
  // mendarat di topik bertuliskan "0 materi" adalah janji yang tidak ditepati —
  // dan itu terjadi pada topik yang paling mungkin dibuka lewat tautan ini,
  // yaitu topik yang nilainya kurang.
  const punyaMateri = topikTadi ? (await materiTopik([topikTadi])).length > 0 : false
  const ulangi =
    topikTadi && punyaMateri ? `${kembali}${pemilik.profileId ? '&' : '?'}topik=${topikTadi}` : null

  // Tiga tampilan, satu rute — dan yang membedakannya BUKAN kerapian melainkan
  // urutan belajar:
  //
  //   tanpa parameter  nilainya dan nomor mana yang salah, TANPA kunci
  //   ?kunci=1         seluruh soal beserta kunci dan pembahasannya
  //   ?soal=6          satu soal itu saja
  //
  // Kuncinya di belakang satu ketukan, dan itu inti alurnya: anak yang sudah
  // membaca kunci tidak lagi mengerjakan ulang soal yang salah, ia menyalinnya.
  // Kesempatan mencoba dengan kepala sendiri cuma ada sekali, tepat sebelum
  // kunci itu terbaca — jadi di situlah "Perbaiki" berdiri, sendirian di atas.
  //
  // Ketukannya SATU, bukan gembok: siapa pun yang menyunting alamat sampai juga
  // ke kuncinya, dan memang tidak apa-apa. Yang dijaga di sini urutan yang
  // ditawarkan, bukan rahasia — rahasianya dijaga migrasi 131, yang menolak
  // membuka kunci sesi yang belum selesai.
  //
  // Nomor yang tidak dikenali (sesi lain, alamat yang disunting tangan)
  // dianggap tidak ada, dan halamannya kembali jadi halaman nilai — memulangkan
  // galat untuk sebuah nomor yang meleset lebih mahal daripada menampilkan
  // halaman yang memang jadi asal nomor itu.
  const petak = soal.map(t => ({
    nomor: t.nomor,
    hasil: hasilSoal(t.skor, t.skorMaks, t.sudahDijawab),
  }))
  const jumlahSalah = petak.filter(p => p.hasil !== 'benar').length
  const cacah = {
    correct: petak.filter(p => p.hasil === 'benar').length,
    partial: petak.filter(p => p.hasil === 'sebagian').length,
    wrong: petak.filter(p => p.hasil === 'salah').length,
    belum: petak.filter(p => p.hasil === 'belum').length,
  }
  const jalurHasil = `/belajar/${sesiId}/hasil`
  const nomorDiminta = Number(soalDiminta)
  const terpilih = Number.isInteger(nomorDiminta)
    ? (soal.find(t => t.nomor === nomorDiminta) ?? null)
    : null
  // KUNCI HANYA UNTUK PAKET YANG SUDAH TERKUNCI.
  //
  // Sebelumnya `?soal=5` menampilkan kunci sebuah soal tanpa mengunci apa pun,
  // dan itu lubang di seluruh taruhannya: anak yang mengetik alamat itu
  // mendapat kunci gratis, sementara yang menekan tombolnya membayar dengan
  // paketnya. Sekarang keduanya menuntut hal yang sama — satu-satunya jalan
  // menuju kunci tetap tombol yang mengunci.
  //
  // Sesi tanpa paket (lahir sebelum migrasi 134) dibiarkan terbuka: tidak ada
  // paket yang bisa dikunci, jadi tidak ada yang bisa dipertaruhkan.
  const kunciBoleh = (!paket && !petaPaket) || (paketIni?.terkunci ?? false)
  const kunciTerbuka = kunciBoleh && (kunciDiminta === '1' || terpilih !== null)

  // Alamatnya ikut diluruskan, bukan cuma isinya: `?kunci=1` yang menampilkan
  // halaman nilai adalah alamat yang berbohong tentang apa yang sedang dilihat.
  if (!kunciBoleh && (kunciDiminta === '1' || soalDiminta)) redirect(jalurHasil)
  const tautanPetak = (n: number) => `${jalurHasil}?soal=${n}`

  // Yang tersisa dihitung dari PAKETNYA, bukan dari putaran ini. Putaran kedua
  // yang berisi empat soal dan benar semua tidak berarti paketnya selesai —
  // yang menentukan tinggal berapa dari kesepuluh soal itu yang masih salah.
  const sisa = paketIni ? paketIni.total - paketIni.benar : jumlahSalah
  // Jalur peta tidak punya `?topik=`: petanya berdiri di halaman `/belajar` itu
  // sendiri, dan komponennya membuka satu-satunya topik berisi dengan
  // sendirinya. Jadi tautannya cukup `kembali` — bukan null, yang akan
  // menghilangkan tombol "pilih paket lain" dari layar anak yang baru saja
  // selesai satu paket.
  const daftarPaket =
    paket && pemilik.profileId
      ? `/belajar?anak=${pemilik.profileId}&topik=${paket.groupId}`
      : paket
        ? `/belajar?topik=${paket.groupId}`
        : petaPaket
          ? kembali
          : null

  const pilihan = (
    <PilihanSesudahSkor
      sesiId={sesiId}
      sisa={sisa}
      terkunci={paketIni?.terkunci ?? false}
      kunciTerbuka={kunciTerbuka}
      daftarPaket={daftarPaket}
      kembali={kembali}
      materi={ulangi}
    />
  )

  if (terpilih) {
    return (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <p className="font-semibold tracking-tight text-gray-900">
            Soal {terpilih.nomor}
            {paket ? ` · Paket ${paket.nomor}` : ` dari ${soal.length}`}
          </p>
          <Link href={jalurHasil} className="shrink-0 text-sm font-medium text-blue-600">
            Hasil selengkapnya
          </Link>
        </div>

        {/* Deretannya tetap lengkap, jadi soal salah berikutnya berjarak satu
            ketukan — tanpa ini, membaca tiga soal yang salah berarti tiga kali
            kembali ke daftar. */}
        <NomorJawaban
          soal={petak}
          tautan={tautanPetak}
          aktif={terpilih.nomor}
          className="px-1"
        />

        <TinjauanSesi soal={[terpilih]} nama={pemilik.nama} />

        {pilihan}
      </div>
    )
  }

  if (kunciTerbuka) {
    return (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <p className="font-semibold tracking-tight text-gray-900">Kunci jawaban</p>
          <Link href={jalurHasil} className="shrink-0 text-sm font-medium text-blue-600">
            Kembali ke nilai
          </Link>
        </div>

        {/* Deretan nomornya juga jadi daftar isi: mengetuk salah satunya
            menyisakan soal itu saja. */}
        <NomorJawaban soal={petak} tautan={tautanPetak} className="px-1" />

        <TinjauanSesi soal={soal} nama={pemilik.nama} />

        {pilihan}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Nilainya, dan nomor mana yang salah — tidak lebih.

          Ini layar yang paling menentukan di seluruh alur: yang dilihat anak di
          sini menentukan apakah langkah berikutnya mencoba lagi atau menyalin.
          Soalnya tidak dicetak, kuncinya tidak dicetak, pembahasannya tidak
          dicetak. Yang ada cuma cukup untuk memutuskan — berapa, dan yang mana.

          Deretan nomor tanpa tautan, sengaja: di layar ini nomor bukan pintu
          menuju kunci, melainkan peta soal mana yang akan dikerjakan ulang. */}
      <div className="rounded-xl bg-white p-5 shadow-kartu">
        <div className="text-center">
          {/* Yang dinilai PAKET ini, bukan putaran yang barusan. Putaran kedua
              yang berisi empat soal dan benar semua bukan "100%" — ia paket
              yang naik dari 6/10 jadi 10/10, dan angka yang dicetak di sini
              harus angka yang sama dengan yang dibawa pulang ke daftar paket. */}
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">
              {paket ? `Paket ${paket.nomor}` : petaPaket ? namaPaket(petaPaket) : 'Latihan'}
            </span>{' '}
            · {pemilik.nama}
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-gray-900">{persen}%</p>
          {label && <p className="mt-0.5 text-sm font-semibold text-blue-600">{label}</p>}
          {paketIni && (
            <p className="mt-1 text-sm text-gray-500">
              {paketIni.benar} dari {paketIni.total} soal benar
              {paketIni.putaran > 1 && ` · putaran ke-${paketIni.putaran}`}
            </p>
          )}
          {paketIni?.terkunci && (
            <p className="mt-2 text-xs text-gray-400">
              Kuncinya sudah dibuka, jadi paket ini tidak bisa dikerjakan lagi.
            </p>
          )}
        </div>

        {/* Petak di bawah menggambar PUTARAN INI, bukan paketnya — itulah soal
            yang barusan dikerjakan, dan nomornya nomor yang tadi dilihat di
            layar. Judul kecilnya yang menjaga agar tidak terbaca sebagai
            kesepuluh soal paketnya. */}
        {petak.length > 0 && (
          <>
            <p className="mt-4 text-xs font-medium text-gray-500">
              Putaran ini — {petak.length} soal
            </p>
            <KeteranganJawaban rincian={cacah} className="mt-2" />
            <NomorJawaban soal={petak} className="mt-3" />
          </>
        )}
      </div>

      {/* Kalimat pendampingan (FR7), tepat di bawah nilainya dan di atas segala
          rincian: ia menjawab pertanyaan yang baru saja muncul di kepala anak
          saat membaca angka itu, dan menaruhnya di dasar halaman berarti ia
          dibaca sesudah anak selesai menyimpulkan sendiri.

          Teksnya datang dari `pengaturan`, bukan dari berkas ini — tim konten
          yang memiliki kalimatnya (FR7). Tidak ada angka di sekitarnya, dan
          tidak ada penjelasan kenapa ia muncul: yang memicunya Skor Putaran 1,
          angka yang FR3 larang sampai ke layar ini dalam bentuk apa pun,
          termasuk dalam bentuk kalimat yang menerangkannya.

          Bukan peringatan dan bukan pagar — warnanya biru muda, bukan merah,
          dan tidak ada satu pun kendali yang dinonaktifkan olehnya. */}
      {pendampingan && (
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-sm leading-relaxed text-blue-900">{pendampingan}</p>
        </div>
      )}

      {/* Rincian per topik KURIKULUM — sesi jalur peta tidak punya satu pun,
          karena butirnya sengaja tidak bertag bab sejak migrasi 148. Untuk sesi
          itu yang ditampilkan topik petanya, satu baris, dengan angka yang sama
          dengan nilai di atas: bukan pengulangan tanpa guna, melainkan satu-
          satunya tempat nama topiknya muncul di layar hasil. */}
      {petaPaket && paketIni ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-kartu">
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{petaPaket.topikNama}</p>
              <p className="text-xs text-gray-400">
                {petaPaket.topikId} · {namaPaket(petaPaket)}
              </p>
              <p className="text-xs text-gray-400">{paketIni.total} soal</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900">{persen}%</p>
              {label && <p className="text-xs text-gray-500">{label}</p>}
            </div>
          </div>
        </div>
      ) : rincian.length === 0 ? (
        <div className="rounded-xl bg-white p-4 shadow-kartu">
          <p className="text-sm leading-relaxed text-gray-500">
            Tidak ada rincian topik untuk sesi ini.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-kartu">
          {rincian.map(baris => {
            const p = persenDari(Number(baris.score), Number(baris.max_score))
            const l = labelPenguasaan(rubrik, p)
            return (
              <div key={baris.group_id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{baris.topic}</p>
                  {baris.theme && <p className="text-xs text-gray-400">{baris.theme}</p>}
                  <p className="text-xs text-gray-400">{baris.answered} soal</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-900">{p}%</p>
                  {l && <p className="text-xs text-gray-500">{l}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pilihan}
    </div>
  )
}
