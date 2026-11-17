import type { TopikPeta } from '@/lib/belajar/topik-peta'
import type { LangkahTopik, PaketRingkas } from '@/lib/belajar/langkah'
import { kodePaketAnak } from '@/lib/belajar/nama-paket'
import { labelSesiWib } from '@/lib/waktu'

/**
 * Bahan kartu Misi yang dipakai bersama oleh peta jalur dan lembar rincian
 * topik: rupa keping paket, label tombol, dan kalimat ringkas.
 *
 * Dipindah dari `PetaTopik.tsx` apa adanya — aturannya (urutan pemeriksaan
 * keadaan keping, kapan "Ulangi" bukan "Kerjakan", kabar apa yang pantas satu
 * baris) tidak berubah, hanya tempat tinggalnya. Catatan panjang di tiap fungsi
 * menjelaskan alasannya dan tetap berlaku.
 */

/**
 * Deretan keping paket: seluruh isi topik dalam satu baris selebar kartu.
 *
 * PERTANYAAN YANG DIJAWABNYA "aku sudah sampai mana" — dan sampai sebelum ini
 * kartu Misi tidak bisa menjawabnya sama sekali. Yang tampil cuma satu paket,
 * yang berikutnya, sehingga anak yang sudah melewati C1 dan C2 melihat layar
 * yang persis sama dengan anak yang belum menyentuh apa pun. Kemajuan yang
 * tidak terlihat adalah kemajuan yang tidak terasa.
 *
 * KODENYA IKUT DIGAMBAR, bukan cuma titik berwarna. Titik memberi tahu berapa
 * banyak; kode memberi tahu APA — dan tombol di bawah kartu berbunyi "Kerjakan
 * C4", kalimat yang cuma bisa dicocokkan dengan deretan ini kalau deretannya
 * menyebutkan C4.
 *
 * TIGA KELOMPOK DIPISAHKAN GARIS TIPIS: wajib, lalu pengayaan, lalu ujian.
 * Tanpa pemisah, C4 di sebelah C3 terbaca sebagai kelanjutan yang sama
 * wajibnya, dan anak yang menghitung "masih enam lagi" akan mengira topiknya
 * dua kali lebih panjang dari yang sebenarnya menahan ketuntasannya.
 *
 * LIMA KEADAAN, DAN TIDAK SATU PUN DIBEDAKAN OLEH WARNA SAJA:
 *
 *   hijau + centang   sudah lolos (untuk ujian: sudah dikerjakan).
 *   kuning + gembok   sedang terkunci, menunggu jedanya habis.
 *   biru bergaris     yang akan dibuka tombol di bawah. Satu-satunya per kartu.
 *   putih bergaris    boleh dikerjakan, belum lolos.
 *   abu polos         belum bisa dibuka sama sekali.
 *
 * Dua yang paling sering disalahbaca dapat ikon, bukan sekadar rona: "sudah"
 * dan "tertutup" adalah kabar yang paling menentukan apa yang anak lakukan
 * berikutnya, dan keduanya harus terbaca oleh yang tidak membedakan hijau dari
 * kuning — sekitar satu dari dua belas anak laki-laki.
 *
 * PUTIH BERGARIS BUKAN ABU, dan bedanya bukan selera. Paket pengayaan boleh
 * dikerjakan kapan saja lewat halaman topik; menggambarnya abu — rona yang di
 * seluruh aplikasi ini berarti "tidak bisa" — akan memagari anak dari sesuatu
 * yang sebenarnya terbuka, persis kebalikan dari prinsip "memberi tahu, bukan
 * memblokir" yang memandu seluruh peta ini. Abu disimpan untuk yang memang
 * benar-benar tertutup: ujian yang masih menunggu paket wajibnya tuntas.
 */
export function DeretPaket({
  paket,
  sekarang,
}: {
  paket: PaketRingkas[]
  sekarang: string | null
}) {
  if (paket.length === 0) return null

  // Ujian menunggu selama masih ada paket wajib yang belum lolos (189).
  // Dihitung di sini, bukan diminta dari database: jawabannya sudah utuh ada di
  // deretan yang sedang digambar, dan kolom kesembilan untuk sesuatu yang bisa
  // dibaca dari delapan kolom lain adalah kolom yang harus dijaga tetap cocok.
  const wajibBelum = paket.some(p => p.jenis === 'latihan' && !p.pengayaan && !p.lolos)

  return (
    <span className="flex flex-wrap items-center gap-2">
      {paket.map((p, i) => {
        const sesudah = paket[i + 1]
        // Garis pemisah muncul di PERGANTIAN kelompok, jadi ia tidak perlu tahu
        // kelompok mana yang ada di topik ini. Topik tanpa pengayaan tidak
        // menggambar garis yang memisahkan ketiadaan dari ujian.
        //
        // Dilekatkan ke keping SEBELUM pergantian, bukan sesudahnya. Deret tujuh
        // keping tidak selalu muat satu baris, dan garis yang menempel di
        // depan keping berikutnya akan ikut turun bersamanya — berdiri sendiri
        // di awal baris kedua sebagai coretan yang tidak memisahkan apa pun.
        const pisah =
          sesudah != null && (sesudah.pengayaan !== p.pengayaan || sesudah.jenis !== p.jenis)
        const k = keadaanKeping(p, p.paketId === sekarang, wajibBelum)

        return (
          <span key={p.paketId} className="flex items-center gap-2">
            <span
              title={`${kodeRingkas(p)} — ${k.sebut}`}
              className={`flex items-center gap-1 rounded-xl border-2 px-3 py-1.5 text-sm font-bold ${k.kelas}`}
            >
              {k.ikon === 'lolos' && <IkonCentang />}
              {k.ikon === 'kunci' && <IkonGembok />}
              {k.ikon === 'gagal' && <IkonSilang />}
              {kodeRingkas(p)}
            </span>
            {pisah && <span className="h-5 w-0.5 rounded bg-slate-200" aria-hidden />}
          </span>
        )
      })}
    </span>
  )
}

export interface KeadaanKeping {
  kelas: string
  ikon: 'lolos' | 'kunci' | 'gagal' | null
  /** Keadaannya dalam kata-kata, untuk `title` — dan untuk yang tidak melihat warna. */
  sebut: string
}

/**
 * Rupa sebuah keping. HASILNYA SELALU MENANG atas gilirannya.
 *
 * Paket yang gagal tetap merah seluruhnya — isi, garis, dan silangnya — walau ia
 * juga giliran berikutnya. Warna adalah satu-satunya saluran yang dipunyai
 * keping selebar dua digit, dan memberikannya kepada "giliran" berarti
 * mengambilnya dari "hasil": anak yang baru saja tidak lolos C1 lalu melihat C1
 * bergaris biru seperti paket yang belum pernah ia sentuh berhak bingung. Yang
 * berikutnya toh sudah disebutkan tombol di bawah kartu, lengkap dengan kata
 * kerjanya — "Ulangi C1".
 *
 * Biru karenanya cuma dipakai di satu tempat: paket yang belum punya cerita apa
 * pun. Di sana ia tidak menimpa kabar siapa-siapa, dan ia cuma GARIS — isinya
 * tetap putih seperti tetangganya, karena yang dibedakan giliran, bukan
 * keadaan.
 *
 * URUTAN PEMERIKSAAN ISINYA ADALAH ATURANNYA:
 *
 *   lolos       Mendahului segalanya. Paket yang sudah dilewati memang selalu
 *               berkunci — itu mekanisme 183, bukan halangan — jadi
 *               menggambarnya bergembok mengabarkan hambatan yang tidak ada.
 *
 *   belum lolos Merah bersilang: pernah dikerjakan, nilainya di bawah ambang.
 *               Ini keadaan yang paling perlu dibedakan dari "belum disentuh",
 *               dan sebelum ini keduanya sama-sama putih bergaris.
 *
 *               Kalau ia sekaligus sedang terkunci, warnanya TETAP merah dan
 *               ikonnya yang berganti gembok. Warna menjawab "bagaimana
 *               hasilnya", ikon menjawab "bisa dibuka sekarang atau tidak" —
 *               dua kabar, dua saluran, satu keping.
 *
 *   terkunci    Kuning bergembok, untuk yang terkunci tanpa pernah dikerjakan.
 *
 *   menunggu    Abu polos: ujian yang paket wajibnya belum tuntas. Satu-satunya
 *               yang benar-benar tidak bisa dibuka — sebab itu satu-satunya
 *               yang abu.
 *
 *   sisanya     Putih bergaris: boleh dikerjakan, belum disentuh — garisnya
 *               biru kalau ia giliran berikutnya. BUKAN abu, karena rona itu di
 *               seluruh aplikasi ini berarti "tidak bisa", dan paket pengayaan
 *               sebenarnya terbuka kapan saja.
 */
export function keadaanKeping(
  p: PaketRingkas,
  sekarang: boolean,
  wajibBelum: boolean
): KeadaanKeping {
  const r = rona(p, sekarang, wajibBelum)
  return {
    kelas: `${r.isi} ${r.garis}`,
    ikon: r.ikon,
    // Gilirannya tetap dikatakan, cuma tidak lagi lewat warna: yang tidak
    // membedakan rona sekali pun tahu keping mana yang berikutnya.
    sebut: sekarang ? `${r.sebut} — berikutnya` : r.sebut,
  }
}

function rona(
  p: PaketRingkas,
  sekarang: boolean,
  wajibBelum: boolean
): { isi: string; garis: string; ikon: KeadaanKeping['ikon']; sebut: string } {
  if (p.lolos) {
    return {
      isi: 'bg-emerald-50 text-emerald-700',
      garis: 'border-emerald-200',
      ikon: 'lolos',
      sebut: p.jenis === 'ujian' ? 'sudah dikerjakan' : 'sudah lolos',
    }
  }
  if (p.pernahDikerjakan) {
    return {
      isi: 'bg-red-50 text-red-700',
      garis: 'border-red-200',
      ikon: p.terkunci ? 'kunci' : 'gagal',
      sebut: p.terkunci ? 'belum lolos, sedang terkunci' : 'sudah dicoba, belum lolos',
    }
  }
  if (p.terkunci) {
    return {
      isi: 'bg-amber-50 text-amber-700',
      garis: 'border-amber-200',
      ikon: 'kunci',
      // Ujian yang terkunci bukan menunggu jeda melainkan sudah terpakai (189),
      // dan tidak ada jam yang boleh dijanjikan untuknya.
      sebut: p.jenis === 'ujian' ? 'sudah terpakai' : 'sedang terkunci',
    }
  }
  if (p.jenis === 'ujian' && wajibBelum) {
    return {
      isi: 'bg-slate-100 text-gray-400',
      garis: 'border-transparent',
      ikon: null,
      sebut: 'menunggu semua level tuntas',
    }
  }
  return {
    isi: sekarang ? 'bg-white text-blue-700' : 'bg-white text-gray-600',
    garis: sekarang ? 'border-blue-500' : 'border-slate-200',
    ikon: null,
    sebut: p.pengayaan ? 'pengayaan, belum dikerjakan' : 'belum dikerjakan',
  }
}

/**
 * Dua ikon sebesar huruf di sebelahnya.
 *
 * Digambar langsung sebagai SVG, bukan diambil dari pustaka ikon: keduanya cuma
 * beberapa garis, dan sebuah paket ikon yang ditarik demi dua bentuk sepuluh
 * piksel adalah puluhan kilobita yang diunduh tiap anak yang membuka Misi.
 *
 * `aria-hidden` karena keadaannya sudah tertulis di `title` kepingnya — ikon
 * yang ikut dibacakan pembaca layar cuma menambah satu kata tanpa arti di
 * tengah kalimat yang sudah lengkap.
 */
function IkonCentang() {
  return (
    <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M2.5 6.5 5 9l4.5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IkonSilang() {
  return (
    <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="m3.2 3.2 5.6 5.6M8.8 3.2 3.2 8.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IkonGembok() {
  return (
    <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" aria-hidden>
      <path
        d="M4 5V3.5a2 2 0 1 1 4 0V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="2.6" y="5" width="6.8" height="5" rx="1.2" fill="currentColor" />
    </svg>
  )
}

/**
 * Kata di atas tombol: kata kerjanya, lalu paketnya.
 *
 * "Ulangi C1", bukan "Kerjakan C1", untuk paket yang sudah pernah ditutup anak.
 * Langkah yang menunjuk paket yang baru saja ia kerjakan berarti paket itu
 * belum lolos ambang — dan tombol yang tetap berkata "Kerjakan C1" pada anak
 * yang baru menutup C1 terbaca seperti aplikasi yang tidak mengikuti apa yang
 * barusan terjadi. Kepingnya di atas sudah merah bersilang; kata kerjanya
 * mestinya bercerita hal yang sama.
 *
 * `pernahDikerjakan` menghitung putaran yang SELESAI saja (191), jadi paket yang
 * cuma dibuka lalu ditinggalkan tetap berbunyi "Kerjakan" — dan memang begitu
 * seharusnya: tidak ada yang perlu diulang dari sesuatu yang belum pernah
 * dikerjakan.
 */
export function labelTombol(langkah?: LangkahTopik): string {
  return `${langkah?.pernahDikerjakan ? 'Ulangi' : 'Kerjakan'} ${kodeLangkah(langkah)}`
}

/** Kode pendek sebuah keping — "Level 1", "Level 4", "Tantangan". */
export function kodeRingkas(p: PaketRingkas): string {
  return kodePaketAnak({
    jenis: p.jenis,
    levelBloom: p.levelBloom,
    nomor: p.nomor,
  })
}

/**
 * Teks tombol langkah berikutnya: "Mulai Level 1", "Ulangi Level 1", atau
 * "Lanjutkan Level 3". Selain Level 1 berarti anak sudah di tengah jalan, jadi
 * katanya "Lanjutkan" — termasuk Tantangan Akhir.
 */
export function teksLangkah(langkah?: LangkahTopik): string {
  const kode = kodeLangkah(langkah)
  const awal = langkah?.jenis !== 'ujian' && (langkah?.levelBloom ?? 1) === 1
  if (!awal && langkah?.paketId) return `Lanjutkan ${kode}`
  return `${langkah?.pernahDikerjakan ? 'Ulangi' : 'Mulai'} ${kode}`
}

/**
 * Kode paket langkah berikutnya — "Level 1", "Level 4", "Tantangan".
 *
 * Dipakai tombol dan baris keterangan, dari satu tempat. Tombol yang berkata
 * "Kerjakan C4" sementara barisnya menyebut C3 bukan cuma membingungkan; ia
 * membuat anak curiga pada seluruh layar.
 */
export function kodeLangkah(langkah?: LangkahTopik): string {
  if (!langkah || !langkah.paketId) return 'soal'
  return kodePaketAnak({
    jenis: langkah.jenis === 'ujian' ? 'ujian' : 'latihan',
    levelBloom: langkah.levelBloom,
    nomor: langkah.levelBloom ?? 1,
  })
}

/**
 * Satu baris keterangan kartu — yang bisa berubah besok, bukan sifat tetap
 * topiknya. Tema dan jumlah paketnya tinggal di kepala kartu.
 *
 * String kosong berarti tidak ada yang perlu dikatakan, dan pemanggilnya tidak
 * menggambar barisnya sama sekali. Itu keadaan yang paling umum: topik yang
 * langkahnya siap dikerjakan sudah diceritakan tombol dan deret kepingnya.
 *
 * ATURANNYA: sebut yang tidak dikatakan tempat lain, diamkan sisanya. Kartu
 * yang mengulang isi tombolnya sendiri terbaca dua kali untuk informasi yang
 * satu, dan ongkosnya dibayar tiap baris di layar yang isinya sembilan belas
 * topik.
 *
 * Karena itu paket yang siap dikerjakan TIDAK disebut di sini sama sekali —
 * tombol "Kerjakan C1" di bawahnya sudah menyebutnya, lengkap dengan kata
 * kerjanya. Yang disebut justru yang TIDAK punya tombol atau yang tombolnya
 * tidak bisa menjelaskan dirinya sendiri:
 *
 *   terkunci   Tombolnya memang tidak ada, jadi tanpa baris ini kartunya diam
 *              soal kenapa. Dan yang disebut KAPAN ia terbuka, bukan sekadar
 *              bahwa ia terkunci: "Besok, 12.57" mengakhiri pertanyaannya,
 *              "sedang terkunci" cuma memindahkannya ke halaman lain.
 *
 *   ujian      Tombolnya berbunyi "Kerjakan Ujian" tanpa mengatakan bahwa itu
 *              berarti seluruh paket wajibnya sudah lolos — kabar baik yang
 *              sedang dirayakan anak, dan satu-satunya tempatnya di kartu ini.
 *
 *   habis      Tidak ada tombol, tidak ada langkah. Barisnya yang mengabarkan.
 *
 * Jadwal pengecekan ulang ikut di sini dengan alasan yang sama: ia cuma muncul
 * untuk topik tuntas, yang tidak punya kabar lain untuk ditumpuk.
 */
export function ringkasKartu(
  t: TopikPeta,
  langkah: LangkahTopik | undefined,
  paket: PaketRingkas[],
  hariIni: string
): string {
  // Tema dan jumlah paket TIDAK lagi di sini — keduanya pindah ke kepala kartu,
  // di bawah kodenya. Yang tinggal cuma kabar yang bisa berubah besok.
  const bagian: string[] = []

  // Yang terkunci dicari di SELURUH paket, bukan cuma di paket yang ditawarkan.
  // Sejak 193 keduanya bisa berbeda: selama paket wajib tertutup, alurnya
  // menawarkan pengayaan. Kalau kabar terkunci ikut pindah ke paket yang
  // ditawarkan, kartu justru berhenti menyebutkannya tepat pada keadaan yang
  // paling perlu dijelaskan — tombol yang tiba-tiba berbunyi "Kerjakan C4"
  // padahal anak baru saja mengerjakan C3.
  const tertutup = paket.find(p => p.terkunci && p.bukaPada)

  if (langkah && !langkah.paketId) {
    bagian.push('semua paket selesai')
  } else if (tertutup) {
    const w = labelSesiWib(tertutup.bukaPada!, hariIni)
    bagian.push(`${kodeRingkas(tertutup)} terbuka ${w.hari.toLowerCase()} ${w.jam}`)
  } else if (langkah?.terkunci) {
    // Terkunci tanpa waktu buka: itu paket UJIAN, yang kuncinya permanen (183).
    // Tidak ada jam yang boleh dijanjikan, jadi yang disebut cuma keadaannya.
    bagian.push(`${kodeLangkah(langkah)} terkunci`)
  } else if (langkah?.jenis === 'ujian') {
    bagian.push('semua level tuntas')
  }

  // Ditulis sebagai kabar, bukan tenggat: dokumen Retest Terjadwal Bagian 4.3
  // melarang penalti keterlambatan, jadi tidak ada hitung mundur dan tidak ada
  // kata "harus". Yang perlu diketahui anak yang sudah menuntaskan sebuah topik
  // cuma bahwa urusannya belum selesai selamanya.
  if (t.status === 'tuntas' && t.retestBerikutnya) {
    bagian.push(`dicek ulang ${tanggalPendek(t.retestBerikutnya)}`)
  }

  return bagian.join(' · ')
}

/**
 * Enam keadaan FR13, dan cuma dua yang berlabel.
 *
 * Sebuah label status berhak berdiri di kartu ini kalau ia mengabarkan sesuatu
 * yang TIDAK dikatakan bagian lain kartunya. Sejak deret keping dan tombolnya
 * masuk, syarat itu tidak lagi dipenuhi oleh empat dari enam keadaan:
 *
 *   `sedang_dikerjakan`  Dikabarkan deret kepingnya, jauh lebih tepat. Label
 *                        ini cuma bilang "ada yang sedang berjalan"; kepingnya
 *                        menunjukkan paket yang mana, mana yang sudah lolos,
 *                        dan tombolnya menyebutkan apa yang dibuka berikutnya.
 *                        Yang umum berdiri di sebelah yang persis membuat yang
 *                        persis lebih lambat dibaca.
 *
 *   `butuh_pengulangan`  Sama: keping ambar bergembok dan baris "C3 terbuka
 *                        besok 12.57" sudah menceritakan seluruhnya. "Ayo coba
 *                        lagi" di atasnya menambah satu kotak berwarna yang
 *                        menyuruh anak melakukan sesuatu yang justru sedang
 *                        tidak bisa ia lakukan.
 *
 *   `terkunci`           Topiknya tetap bisa diketuk dan dikerjakan (lihat
 *                        catatan prasyarat di kepala berkas), jadi kata
 *                        "terkunci" di layar anak berbohong tentang pintu yang
 *                        sebenarnya terbuka.
 *
 *   `siap_dikerjakan`    Barisnya cuma muncul di bawah judul "Siap untuk kamu
 *                        sekarang". Label yang mengulang judul kelompoknya
 *                        sendiri tidak menambahkan apa pun.
 *
 * Status null juga tidak berlabel — itu topik yang belum pernah disentuh, dan
 * cetakan statusnya memang belum ditulis.
 *
 * YANG TERSISA DUA, dan keduanya bertahan karena tidak punya wakil di tempat
 * lain: `tuntas` adalah putusan tentang SELURUH topik yang tidak bisa dibaca
 * dari deret keping mana pun (paket bisa habis tanpa topiknya tuntas), dan
 * `eskalasi_tutor` mengabarkan sesuatu yang terjadi di luar layar ini — seorang
 * manusia akan duduk bersamanya.
 *
 * Kalimatnya sendiri ditulis untuk anak, bukan tutornya: "Tutor akan membantu"
 * berbunyi seperti pengumuman tentang dirinya yang dibuat di belakangnya,
 * sedangkan "Dibahas bareng tutor" menyebut apa yang akan terjadi.
 */
export function LabelStatus({ status }: { status: string | null }) {
  const label: Record<string, { teks: string; kelas: string }> = {
    tuntas: { teks: 'Tuntas', kelas: 'bg-emerald-50 text-emerald-700' },
    eskalasi_tutor: {
      teks: 'Dibahas bareng tutor',
      kelas: 'bg-violet-50 text-violet-700',
    },
  }
  const l = status ? label[status] : undefined
  if (!l) return null
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${l.kelas}`}>
      {l.teks}
    </span>
  )
}

/**
 * "16 September" dari "2026-09-16".
 *
 * Dirakit sendiri alih-alih memakai `toLocaleDateString`: komponen ini dirender
 * di server DAN di browser, dan keduanya tidak dijamin punya locale yang sama —
 * beda satu huruf saja sudah cukup untuk melahirkan ketidakcocokan hidrasi.
 */
export function tanggalPendek(iso: string): string {
  const bulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  const [, b, h] = iso.split('-')
  return `${Number(h)} ${bulan[Number(b) - 1] ?? ''}`.trim()
}
