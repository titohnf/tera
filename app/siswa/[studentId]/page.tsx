import { Suspense } from 'react'
import { anakOrRedirect } from '@/lib/keluarga'
import { learnerAnak } from '@/lib/belajar/sesi'
import { asesmenAnak } from '@/lib/belajar/asesmen'
import { retestJatuhTempo } from '@/lib/belajar/retest'
import { tryOutTerdekat } from '@/lib/tryout/terdekat'
import { kelasAnak, sapaanWaktu } from '@/lib/siswa/sapaan'
import { RangkaHero } from '@/components/ui/Rangka'
import {
  BarisLatihan,
  BarisLatihanData,
  BarisMateri,
  BarisMisi,
  BarisMisiData,
  BarisTryOut,
  BarisTryOutData,
  HeroSiswa,
} from '@/components/siswa/BerandaData'

/**
 * Beranda siswa bimbel yang masuk dengan kode. Sapaan dan empat pintu menu tampil SEKETIKA;
 * hero ("apa yang dikerjakan sekarang") dan penanda di baris menu menyusul lewat `Suspense`,
 * karena datanya berat (peta Misi, langkah, paket, sesi). Semua kueri dimulai di sini, serentak,
 * lalu dibagikan sebagai promise — tidak ada yang menunggu giliran.
 *
 * Murid bimbel sudah berhak atas seluruh bank soal, jadi tidak ada pintu yang terkunci.
 */
export default async function BerandaSiswa({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)

  // Dimulai sekarang, tidak ditunggu di sini. `.catch` supaya yang tak terpakai tidak menjadi
  // unhandled rejection; `learnerAnak` hanya MEMBACA (tidak membuat baris pelajar).
  const learnerIdP = learnerAnak(studentId).catch(() => null)
  const tryOutP = tryOutTerdekat(studentId)
  const tugasP = asesmenAnak(studentId)
    .then((t) => t.filter((x) => !x.selesai && x.bisaDikerjakan).length)
    .catch(() => 0)
  const retestP = learnerIdP.then((id) => (id ? retestJatuhTempo(id).then((r) => r.length) : 0)).catch(() => 0)

  const kelas = await kelasAnak(studentId)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tera text-lg font-extrabold text-white">
          {anak.nama_pendek.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold leading-tight tracking-tight text-slate-900">
            {sapaanWaktu()}, {anak.nama_pendek}
          </h1>
          {kelas && <p className="text-sm font-semibold text-slate-500">{kelas}</p>}
        </div>
      </div>

      <Suspense fallback={<RangkaHero />}>
        <HeroSiswa studentId={studentId} learnerIdP={learnerIdP} tryOutP={tryOutP} />
      </Suspense>

      <div className="space-y-3">
        <Suspense fallback={<BarisLatihan studentId={studentId} />}>
          <BarisLatihanData studentId={studentId} tugasP={tugasP} />
        </Suspense>
        <Suspense fallback={<BarisMisi studentId={studentId} />}>
          <BarisMisiData studentId={studentId} retestP={retestP} />
        </Suspense>
        <BarisMateri studentId={studentId} />
        <Suspense fallback={<BarisTryOut studentId={studentId} />}>
          <BarisTryOutData studentId={studentId} tryOutP={tryOutP} />
        </Suspense>
      </div>
    </div>
  )
}
