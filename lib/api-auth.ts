import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { bolehBacaMurid, siapa } from '@/lib/akses'

/**
 * Penjaga untuk route di `app/api`.
 *
 * Route PDF di sana merender berkas memakai service role, dan sampai sekarang
 * tidak satu pun memeriksa siapa yang meminta. Proxy tidak menolongnya: matcher
 * di `lib/supabase/middleware.ts` hanya menjaga `/tutor`, `/admin`, dan
 * `/keluarga` — `/api` lewat begitu saja. Akibatnya laporan bulanan, invoice,
 * kuitansi, dan surat pengingat bisa diunduh siapa pun yang tahu satu UUID,
 * tanpa login. Yang menahannya cuma UUID itu sulit ditebak, padahal ia tampil
 * di halaman admin, ikut di query string, dan mengendap di riwayat browser.
 *
 * Aturannya sengaja sempit: admin boleh semua, keluarga hanya berkas anaknya
 * sendiri. Tutor tidak diberi akses karena memang tidak ada halaman tutor yang
 * menautkan berkas-berkas ini — kalau nanti ada, tambahkan di sini dengan sadar,
 * jangan lewat celah.
 */

/**
 * Yang belum masuk DIARAHKAN ke login, bukan ditolak mentah.
 *
 * Tautan berkas ini memang dibagikan ke orang tua lewat WhatsApp, dan yang
 * mengklik sering belum punya sesi di ponselnya. Menjawab 401 berupa teks polos
 * membuat tautan itu jadi jalan buntu; mengarahkannya ke login dengan `next`
 * membuat berkasnya terbuka sendiri begitu ia masuk. Yang berubah cuma satu
 * langkah tambahan — bukan hilangnya cara kerja yang sudah berjalan.
 */
function keLogin(req: NextRequest): NextResponse {
  const url = new URL('/login', req.url)
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}

/** Arahkan ke login kalau belum masuk, 403 kalau bukan haknya, null kalau boleh. */
export async function denyUnlessCanReadStudent(
  studentId: string,
  req: NextRequest,
): Promise<NextResponse | null> {
  if (!(await siapa())) return keLogin(req)
  if (await bolehBacaMurid(studentId)) return null
  return new NextResponse('Tidak berhak atas berkas ini', { status: 403 })
}

/**
 * Sama, tapi untuk berkas yang dikenali lewat invoice. Murid pemilik invoice
 * dicari lebih dulu, lalu aturan yang sama berlaku — supaya tidak ada dua
 * definisi "berhak" yang bisa berbeda.
 */
export async function denyUnlessCanReadInvoice(
  invoiceId: string,
  req: NextRequest,
): Promise<NextResponse | null> {
  if (!(await siapa())) return keLogin(req)

  const admin = createAdminClient()
  const { data: invoice } = await admin
    .from('invoices')
    .select('student_id')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice?.student_id) {
    return new NextResponse('Tidak berhak atas berkas ini', { status: 403 })
  }

  return denyUnlessCanReadStudent(invoice.student_id as string, req)
}
