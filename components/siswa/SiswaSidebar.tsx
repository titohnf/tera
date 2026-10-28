import Link from 'next/link'

/**
 * Kolom ringkasan di sisi kanan halaman murid — satu komponen untuk halaman
 * detail siswa admin dan beranda anak di portal keluarga.
 *
 * Blok "Aksi" tidak ada di sini: membuat tagihan, menjadwalkan sesi,
 * menonaktifkan, dan menghapus adalah alat kerja admin, bukan informasi tentang
 * anaknya. Halaman admin merendernya sendiri sebagai kartu terpisah.
 *
 * Blok profil (level, kelas, email, HP) dan orang tua sudah dibuang seluruhnya:
 * bagi keluarga isinya adalah datanya sendiri yang sudah mereka ketahui, dan
 * bagi admin data yang sama sudah ada di kepala halaman dan formulir ubah —
 * jadi ia cuma memakan ruang teratas tanpa memberi tahu apa pun.
 *
 * `classHref` menentukan apakah nama kelas bisa diklik: admin menuju halaman
 * kelas, keluarga tidak punya halaman itu.
 */

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right">{children}</span>
    </div>
  )
}

/**
 * Garis pemisahnya dipasang oleh WADAHNYA, bukan oleh tiap bagian — lihat
 * selektor `[&>*+*]` di bawah. Kalau tiap bagian menggambar garis atasnya
 * sendiri, bagian pertama ikut menggambar, dan di portal keluarga (yang tidak
 * menampilkan blok profil) hasilnya garis menggantung di puncak kartu tanpa ada
 * yang dipisahkan. Dengan cara ini, siapa pun yang kebetulan jadi yang pertama
 * otomatis tidak bergaris.
 */
function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{judul}</p>
      {children}
    </div>
  )
}

export type SidebarKelas = {
  id: string
  name: string | null
  schedule_days: number[]
  schedule_time: string | null
  subject_names: string[]
}

export default function SiswaSidebar({
  kelasAktif,
  totalSesi,
  hadirPersen,
  sudahBayar = 0,
  belumBayar = 0,
  bergabung,
  studentId,
  tampilkanId = true,
  classHref,
  tampilkanPembayaran = true,
}: {
  kelasAktif: SidebarKelas[]
  totalSesi: number
  hadirPersen: number | null
  /** Hanya dipakai bila `tampilkanPembayaran`. */
  sudahBayar?: number
  belumBayar?: number
  bergabung: string | null
  studentId: string
  /**
   * UUID mentah di blok Akun. Berguna bagi admin saat mencocokkan baris dengan
   * basis data; bagi orang tua ia cuma deretan aksara yang memakan ruang, dan
   * di ponsel ia membungkus jadi tiga baris di dasar halaman.
   */
  tampilkanId?: boolean
  classHref?: (id: string) => string
  /**
   * Blok Pembayaran. Portal keluarga mematikannya: tagihan anak sudah punya
   * halaman sendiri (Tagihan) dan kartu di beranda, dan angka yang sama di tiga
   * tempat adalah resep untuk selisih. Admin tetap melihatnya.
   */
  tampilkanPembayaran?: boolean
}) {
  const masaBergabung = (() => {
    if (!bergabung) return '—'
    const mulai = new Date(bergabung)
    const kini = new Date()
    const bulan =
      (kini.getFullYear() - mulai.getFullYear()) * 12 + (kini.getMonth() - mulai.getMonth())
    return bulan <= 0 ? '< 1 bulan' : `${bulan} bulan`
  })()

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 space-y-4 [&>*+*]:border-t [&>*+*]:border-slate-100 [&>*+*]:pt-4">
      {kelasAktif.length > 0 && (
        <Bagian judul="Kelas Aktif">
          <div className="space-y-3">
            {kelasAktif.map((cls) => {
              const isi = (
                <>
                  <p className="text-sm font-medium text-gray-700">{cls.name}</p>
                  {/*
                    Hari dan mapel tidak dipasangkan: kelas hanya menyimpan
                    daftar hari dan daftar mapel, tanpa tahu hari mana untuk
                    mapel mana. Memasangkan menurut urutan menampilkan
                    pasangan yang bisa saja terbalik.
                  */}
                  <div className="mt-2 space-y-0.5">
                    {cls.schedule_days.length === 0 ? (
                      <p className="text-sm text-gray-500">—</p>
                    ) : (
                      cls.schedule_days.map((hari, i) => (
                        <p key={i} className="text-sm text-gray-500">
                          {HARI[hari]}
                          {cls.schedule_time && `, ${cls.schedule_time.slice(0, 5)}`}
                        </p>
                      ))
                    )}
                  </div>
                  {cls.subject_names.length > 0 && (
                    <p className="mt-1.5 text-sm font-medium text-gray-700">
                      {cls.subject_names.join(' · ')}
                    </p>
                  )}
                </>
              )
              return classHref ? (
                <Link
                  key={cls.id}
                  href={classHref(cls.id)}
                  className="block hover:opacity-80 transition-opacity"
                >
                  {isi}
                </Link>
              ) : (
                <div key={cls.id}>{isi}</div>
              )
            })}
          </div>
        </Bagian>
      )}

      <Bagian judul="Performa">
        <div className="space-y-2">
          <Baris label="Total sesi">
            <span className="font-semibold text-gray-800">{totalSesi}</span>
          </Baris>
          {hadirPersen !== null && (
            <Baris label="Kehadiran">
              <span className="font-semibold text-gray-800">{hadirPersen}%</span>
            </Baris>
          )}
        </div>
      </Bagian>

      {tampilkanPembayaran && (
        <Bagian judul="Pembayaran">
          <div className="space-y-2">
            {/* Jumlah keduanya: yang diterbitkan, selain draft dan yang dibatalkan. */}
            <Baris label="Total tagihan">
              <span className="font-semibold text-gray-800">{rupiah(sudahBayar + belumBayar)}</span>
            </Baris>
            <Baris label="Sudah bayar">
              <span className="font-semibold text-gray-800">{rupiah(sudahBayar)}</span>
            </Baris>
            <Baris label="Belum bayar">
              <span className={`font-semibold ${belumBayar > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {rupiah(belumBayar)}
              </span>
            </Baris>
          </div>
        </Bagian>
      )}

      <Bagian judul="Akun">
        <div className="space-y-2">
          <Baris label="Bergabung">
            {bergabung
              ? new Date(bergabung).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </Baris>
          <Baris label="Masa bergabung">{masaBergabung}</Baris>
        </div>
        {tampilkanId && (
          <p className="font-mono text-[11px] text-gray-300 break-all mt-3 leading-relaxed">
            {studentId}
          </p>
        )}
      </Bagian>
    </div>
  )
}
