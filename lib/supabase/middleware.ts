import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // `getClaims()`, bukan `getUser()`: proyek ini menandatangani token dengan kunci asimetrik
  // (ES256, lihat /auth/v1/.well-known/jwks.json), jadi tanda tangannya diperiksa LOKAL dengan
  // JWKS yang di-cache — tanpa perjalanan ke layanan auth di setiap permintaan, termasuk setiap
  // prefetch dan perpindahan halaman. Penyegaran token kedaluwarsa tetap berjalan seperti
  // biasa (cookie ditulis lewat `setAll`). Yang hilang hanyalah pengecekan "sesi ini dicabut
  // dari server?" per permintaan; di sini penjaga cuma menjawab "sudah masuk atau belum", dan
  // izin sebenarnya tetap ditegakkan layout/halaman (`getUser()` di lib/supabase/get-user) dan RLS.
  let user: { id: string } | null = null
  try {
    const { data } = await Promise.race([
      supabase.auth.getClaims(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('auth timeout')), 8000)
      ),
    ])
    user = data?.claims?.sub ? { id: data.claims.sub } : null
  } catch {
    // Auth service unreachable/slow: let the request through rather than
    // hanging the edge function until the platform kills it.
    return supabaseResponse
  }

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/daftar')
  const isDashboard =
    pathname.startsWith('/tutor') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/keluarga') ||
    // Rumah pelanggan langganan dan permukaan belajar. Di sini hanya soal
    // "sudah login atau belum"; peran dan hak pakainya diperiksa layout
    // masing-masing, karena blok try di atas SENGAJA meloloskan permintaan saat
    // layanan auth lambat — penjaga yang bisa gagal terbuka tidak boleh jadi
    // satu-satunya.
    pathname.startsWith('/mandiri') ||
    pathname.startsWith('/belajar')
  const isPublic = pathname.startsWith('/unauthorized') || pathname.startsWith('/auth')

  if (isPublic) return supabaseResponse

  if (!user && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Tujuan aslinya dibawa serta. Tanpa ini, tautan ke halaman tertentu selalu
    // berakhir di beranda peran setelah masuk, dan orang harus mencari sendiri
    // apa yang tadi mau dibukanya.
    url.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
