import { redirect } from 'next/navigation'

/** Alamat lama: masuk dengan kode kini sebuah tab di halaman login. */
export default function MasukKodePage() {
  redirect('/login?tab=kode')
}
