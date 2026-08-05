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

  let user = null
  try {
    const { data } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('auth timeout')), 8000)
      ),
    ])
    user = data.user
  } catch {
    // Auth service unreachable/slow: let the request through rather than
    // hanging the edge function until the platform kills it.
    return supabaseResponse
  }

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login')
  const isDashboard =
    pathname.startsWith('/tutor') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/keluarga')
  const isPublic = pathname.startsWith('/unauthorized') || pathname.startsWith('/auth')

  if (isPublic) return supabaseResponse

  if (!user && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
