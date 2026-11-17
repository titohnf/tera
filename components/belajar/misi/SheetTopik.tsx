'use client'

import Link from 'next/link'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { alamatMisi } from '@/lib/belajar/alamat-misi'
import type { TopikPeta } from '@/lib/belajar/topik-peta'
import type { LangkahTopik, PaketRingkas } from '@/lib/belajar/langkah'
import { dasarBagiKelas, sebutPrasyarat } from '@/lib/belajar/fringe'
import { namaTemaAnak } from '@/lib/belajar/tema-topik'
import { IkonTemaPutih, TigaBintang } from './Gambar'
import { gayaTema, hitungBintang } from './gaya'
import { DeretPaket, LabelStatus, teksLangkah, ringkasKartu } from './bahan'
import { useMulaiLangkah } from './useMulaiLangkah'

/**
 * Lembar rincian sebuah topik, naik dari bawah layar saat simpulnya diketuk.
 *
 * Di sinilah kartu topik yang lama pindah: badannya KABAR, tombolnya PINTU.
 * Aturan lamanya tetap — tidak ada ketukan yang akibatnya harus ditebak. Badan
 * lembar cuma bercerita (tema, bintang, deret level, kabar kunci dan prasyarat),
 * dan dua hal yang bisa diketuk berdiri di dasarnya dengan kata kerjanya
 * sendiri: "Mulai/Ulangi …" yang MENULIS (melahirkan sesi), dan "Lihat detail"
 * yang cuma membaca.
 *
 * Lembar menempel di bawah karena ibu jari ada di sana; `z-50` di atas bilah
 * navigasi bawah (`z-40`), sama seperti `SaringSheet`.
 */
export default function SheetTopik({
  topik: t,
  langkah,
  paket,
  namaTopik,
  kelas,
  anak,
  hariIni,
  onTutup,
}: {
  topik: TopikPeta | null
  langkah?: LangkahTopik
  paket: PaketRingkas[]
  namaTopik: Map<string, string>
  kelas: number | null
  anak: string | undefined
  hariIni: string
  onTutup: () => void
}) {
  const { galat, sibuk, mulai, hapusGalat } = useMulaiLangkah(anak)

  return (
    <DialogPrimitive.Root
      open={t != null}
      onOpenChange={buka => {
        if (!buka) {
          hapusGalat()
          onTutup()
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="sheet-tirai fixed inset-0 z-50 bg-black/45" />
        <DialogPrimitive.Popup className="sheet-bawah fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] max-w-xl flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl outline-none">
          {t && (
            <Isi
              t={t}
              langkah={langkah}
              paket={paket}
              namaTopik={namaTopik}
              kelas={kelas}
              anak={anak}
              hariIni={hariIni}
              galat={galat}
              sibuk={sibuk}
              mulai={() => mulai(t.id)}
            />
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Isi({
  t,
  langkah,
  paket,
  namaTopik,
  kelas,
  anak,
  hariIni,
  galat,
  sibuk,
  mulai,
}: {
  t: TopikPeta
  langkah?: LangkahTopik
  paket: PaketRingkas[]
  namaTopik: Map<string, string>
  kelas: number | null
  anak: string | undefined
  hariIni: string
  galat: string | null
  sibuk: boolean
  mulai: () => void
}) {
  const g = gayaTema(t.elemen)
  const langsung = langkah != null && langkah.paketId != null && !langkah.terkunci
  const alamat = alamatMisi(anak, t.id)
  const kabar = ringkasKartu(t, langkah, paket, hariIni)
  const bintang = hitungBintang(t, paket)

  return (
    <>
      <div className="flex justify-center pt-2.5 pb-1">
        <span className="h-1.5 w-10 rounded-full bg-slate-300" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-2">
        <div className="flex items-start gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: g.dasar, boxShadow: `0 4px 0 ${g.tua}` }}
          >
            <IkonTemaPutih elemen={t.elemen} ukuran={30} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: g.tua }}>
              {namaTemaAnak(t.elemen)} · {t.id}
            </p>
            <DialogPrimitive.Title className="mt-0.5 text-xl font-extrabold leading-snug text-slate-900">
              {t.nama}
            </DialogPrimitive.Title>
            <div className="mt-2 flex items-center gap-3">
              <TigaBintang jumlah={bintang} ukuran={20} />
              <LabelStatus status={t.status} />
            </div>
          </div>
        </div>

        {kabar && (
          <p
            className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{ background: g.muda, color: g.teks }}
          >
            {kabar}
          </p>
        )}

        {paket.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-extrabold text-slate-700">Level-levelmu</p>
            <DeretPaket paket={paket} sekarang={langkah?.paketId ?? null} />
          </div>
        )}

        {dasarBagiKelas(t, kelas) && (
          <p className="mt-4 text-sm text-slate-500">
            Topik dasar dari kelas {t.kelasMulai}, bagus untuk menguatkan fondasi.
          </p>
        )}

        {!t.prasyaratTerpenuhi && t.status !== 'tuntas' && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Lebih mudah kalau {sebutPrasyarat(t.prasyaratKurang, namaTopik)} sudah dituntaskan dulu.
            Tapi kamu tetap boleh mencoba!
          </p>
        )}

        {galat && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
            {galat}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 pb-4 pt-4">
        {langsung && (
          <button
            type="button"
            disabled={sibuk}
            onClick={mulai}
            className="misi-tombol w-full rounded-2xl px-5 py-4 text-lg font-extrabold text-white disabled:opacity-70"
            style={{ background: g.dasar, boxShadow: `0 5px 0 ${g.tua}` }}
          >
            {sibuk ? 'Menyiapkan soal…' : teksLangkah(langkah)}
          </button>
        )}
        {alamat && (
          <Link
            href={alamat}
            className={
              langsung
                ? 'w-full rounded-2xl bg-slate-100 px-5 py-3 text-center text-base font-bold text-slate-700 transition active:bg-slate-200'
                : 'misi-tombol w-full rounded-2xl px-5 py-4 text-center text-lg font-extrabold text-white'
            }
            style={langsung ? undefined : { background: g.dasar, boxShadow: `0 5px 0 ${g.tua}` }}
          >
            Lihat detail
          </Link>
        )}
      </div>
    </>
  )
}
