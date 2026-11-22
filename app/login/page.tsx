import { headers } from 'next/headers'
import { hostUntuk, tampilanDariHost } from '@/lib/tampilan'
import FormLoginHalaman from './form-login'

/**
 * Satu cara masuk per alamat: `sora.` memakai kode, `app.` memakai email dan password
 * (lihat `lib/tampilan.ts`). Tautan ke alamat pasangannya dihitung di sini karena hostname
 * hanya terbaca di server.
 */
export default async function LoginPage() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const tampilan = tampilanDariHost(host)
  const lawan = hostUntuk(host, tampilan === 'sora' ? 'app' : 'sora')
  const protokol = h.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https')
  const hrefLawan = lawan ? `${protokol}://${lawan}/login` : null
  return <FormLoginHalaman tampilan={tampilan} hrefLawan={hrefLawan} />
}
