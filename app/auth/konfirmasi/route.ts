import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Penukaran tautan konfirmasi email menjadi sesi.
 *
 * Rute pertama di bawah `/auth`, yang sejak awal sudah diloloskan sebagai
 * publik oleh `lib/supabase/middleware.ts` tapi belum pernah ada isinya —
 * sampai pendaftaran mandiri membutuhkannya.
 *
 * Sesudah berhasil, pengguna dilempar ke `/`, yang menyortir tujuan menurut
 * peran. Jadi rute ini tidak perlu tahu apa-apa tentang langganan atau
 * halaman mana yang pantas: satu tempat saja yang memutuskan itu.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=konfirmasi`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Tautan kedaluwarsa atau sudah dipakai. Dikembalikan ke login dengan
    // penanda, bukan ke halaman galat: yang perlu dilakukan orangnya memang
    // masuk, dan kalau tautannya basi ia bisa minta yang baru dari sana.
    return NextResponse.redirect(`${origin}/login?error=konfirmasi`)
  }

  return NextResponse.redirect(`${origin}/`)
}
