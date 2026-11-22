import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { COOKIE_DARI } from '@/lib/belajar/cookie-dari'

export async function proxy(request: NextRequest) {
  const respons = await updateSession(request)

  // Mengingat tampilan mana yang sedang dipakai (siswa atau keluarga), untuk halaman /belajar yang
  // alamatnya tidak membawa penanda itu. Lihat `lib/belajar/permukaan.ts`.
  const jalur = request.nextUrl.pathname
  const tampilan = jalur.startsWith('/siswa/') ? 'siswa' : jalur.startsWith('/keluarga') ? 'keluarga' : null
  if (tampilan && request.cookies.get(COOKIE_DARI)?.value !== tampilan) {
    respons.cookies.set(COOKIE_DARI, tampilan, { path: '/', sameSite: 'lax', httpOnly: true })
  }
  return respons
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
