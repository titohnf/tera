/**
 * Alamat try out. Sora dipasang di bawah `/tryout` pada alamat Tera (rewrite di
 * `next.config.ts`), jadi di dalam Tera cukup jalur relatif `/tryout/...` dan
 * sesi login ikut terbawa. `TRYOUT_URL_PUBLIK` adalah alamat lengkapnya untuk
 * pesan WhatsApp; ganti lewat NEXT_PUBLIC_TRYOUT_URL saat alamat utama
 * berpindah (mis. ke app.bimbeltera.com).
 */
export const TRYOUT_PATH = '/tryout'
export const TRYOUT_URL_PUBLIK = (process.env.NEXT_PUBLIC_TRYOUT_URL ?? 'https://bimbeltera.vercel.app/tryout').replace(/\/$/, '')
