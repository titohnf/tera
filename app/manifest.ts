import type { MetadataRoute } from 'next'

/** Agar Tera bisa dipasang di layar utama HP dan terbuka tanpa bilah peramban. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bimbel Tera',
    short_name: 'Tera',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1f5f9',
    theme_color: '#ffffff',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
  }
}
