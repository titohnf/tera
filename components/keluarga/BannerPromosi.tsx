import Link from 'next/link'

/**
 * Banner promosi di puncak beranda keluarga — "muncul bila ada".
 *
 * Belum ada tabelnya, dan itu disengaja: satu tabel plus halaman admin untuk
 * mengisinya adalah pekerjaan tersendiri, sementara bentuk barunya perlu
 * berdiri lebih dulu. Sampai tabel itu ada, isinya diketik di sini — satu
 * konstanta, satu tempat, dan halamannya tidak menampilkan apa pun selama
 * konstanta ini `null`.
 *
 * Yang harus dijaga saat tabelnya nanti dibuat: komponen ini tetap yang
 * memutuskan "tampil atau tidak", supaya beranda tidak perlu tahu.
 */

type Promo = {
  judul: string
  teks: string
  /** Boleh null — banner yang cuma memberi tahu tidak perlu tujuan. */
  href: string | null
}

// `href: null` — belum ada halaman referal untuk dituju. Begitu ada (atau
// begitu kode referal keluarga bisa ditampilkan), isi kolom ini supaya
// bannernya bisa diketuk alih-alih cuma memberi tahu.
const PROMO: Promo | null = {
  judul: 'Ajak teman, mereka dapat Rp100.000',
  teks: 'Teman yang mendaftar dengan memasukkan kode referal Anda langsung mendapat voucher diskon Rp100.000.',
  href: null,
}

export default function BannerPromosi() {
  if (!PROMO) return null

  const isi = (
    <>
      <p className="text-base font-semibold text-gray-900">{PROMO.judul}</p>
      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{PROMO.teks}</p>
    </>
  )

  if (!PROMO.href) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">{isi}</div>
    )
  }

  return (
    <Link
      href={PROMO.href}
      className="block rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 active:bg-amber-100 transition-colors"
    >
      {isi}
    </Link>
  )
}
