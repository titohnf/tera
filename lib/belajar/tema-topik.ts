/**
 * Tema sebuah topik pengukuran — "Bilangan", "Aljabar", dan dua saudaranya.
 *
 * Datanya sudah ada sejak migrasi 140: kolom `topik.elemen`, yang mengikuti
 * pembagian elemen Kurikulum Merdeka untuk Matematika. Yang belum ada cuma
 * caranya dibaca orang — `geometri_pengukuran` adalah kunci basis data, bukan
 * kalimat untuk anak.
 *
 * BERKAS TANPA SATU PUN IMPOR, dengan alasan yang sama seperti `nama-paket.ts`
 * dan `kode-topik.ts`: `PetaTopik` komponen klien, dan apa pun yang dipanggil
 * dari browser tidak boleh serumah dengan pembaca database. Yang dipulangkan
 * golongan dan labelnya, bukan gambarnya; bentuk dan warnanya urusan layar
 * (`components/belajar/IkonTema.tsx`).
 */
export type TemaTopik =
  | 'bilangan'
  | 'aljabar'
  | 'geometri_pengukuran'
  | 'data_peluang'
  | 'lainnya'

const LABEL: Record<Exclude<TemaTopik, 'lainnya'>, string> = {
  bilangan: 'Bilangan',
  aljabar: 'Aljabar',
  geometri_pengukuran: 'Geometri & Pengukuran',
  data_peluang: 'Data & Peluang',
}

const DIKENAL = Object.keys(LABEL) as Exclude<TemaTopik, 'lainnya'>[]

/** Golongan tema sebuah topik, dari nilai `elemen`-nya. */
export function temaTopik(elemen: string | null | undefined): TemaTopik {
  const e = (elemen ?? '').trim().toLowerCase()
  return (DIKENAL as string[]).includes(e) ? (e as TemaTopik) : 'lainnya'
}

/**
 * Nama tema seperti yang dibaca anak.
 *
 * Elemen yang belum dikenal TIDAK jatuh ke "Lainnya" melainkan dirapikan dari
 * kuncinya sendiri: `pengukuran` jadi "Pengukuran", `data_peluang` jadi "Data &
 * Peluang". Empat elemen hari ini hanya milik Matematika, dan mapel berikutnya
 * akan membawa elemennya sendiri — label "Lainnya" untuk seluruh elemen fisika
 * adalah kabar yang lebih buruk daripada tebakan yang rapi.
 */
export function namaTema(elemen: string | null | undefined): string {
  const e = (elemen ?? '').trim().toLowerCase()
  if (!e) return 'Umum'
  const dikenal = LABEL[e as Exclude<TemaTopik, 'lainnya'>]
  if (dikenal) return dikenal
  return e
    .split('_')
    .filter(Boolean)
    .map(k => k.charAt(0).toUpperCase() + k.slice(1))
    .join(' & ')
}
