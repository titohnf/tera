import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { hostUntuk, tampilanDariHost } from '@/lib/tampilan'

/**
 * Pengalihan antar alamat (lihat `lib/tampilan.ts`). Yang bukan miliknya dilempar ke alamat
 * pasangannya dengan jalur yang sama; host yang tidak dikenal dibiarkan.
 */
function alihkanLintasHost(request: NextRequest): NextResponse | null {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const tampilan = tampilanDariHost(host)
  const { pathname } = request.nextUrl
  const di = (awal: string) => pathname === awal || pathname.startsWith(`${awal}/`)

  const ke = (tujuan: 'app' | 'sora', jalur: string) => {
    const hostTujuan = hostUntuk(host, tujuan)
    if (!hostTujuan) return null
    const url = request.nextUrl.clone()
    url.host = hostTujuan
    url.port = ''
    url.pathname = jalur
    if (jalur === '/login') url.search = ''
    return NextResponse.redirect(url)
  }

  if (tampilan === 'sora') {
    // Admin, tutor, dan portal keluarga hanya di alamat app. Siswa yang masuk dengan kode memakai
    // sesi akun keluarga, jadi /keluarga/<id> di sini dipetakan ke tampilan siswanya.
    if (di('/admin') || di('/tutor') || pathname === '/keluarga') return ke('app', pathname)
    const m = pathname.match(/^\/keluarga\/([^/]+)/)
    if (m) {
      const url = request.nextUrl.clone()
      url.pathname = `/siswa/${m[1]}`
      url.search = ''
      return NextResponse.redirect(url)
    }
    return null
  }

  // Alamat app: tampilan siswa dan peserta umum, serta tab Kode, pindah ke alamat sora.
  if (di('/siswa') || di('/umum')) return ke('sora', pathname)
  if (di('/masuk-kode')) return ke('sora', '/login')
  if (di('/login') && request.nextUrl.searchParams.get('tab') === 'kode') {
    return ke('sora', '/login')
  }
  return null
}

export async function proxy(request: NextRequest) {
  const lintas = alihkanLintasHost(request)
  if (lintas) return lintas
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
