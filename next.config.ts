import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fkieereilqfiqtjmpher.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Rute lama "Materi dan Bank Soal" tetap hidup: link ini sudah beredar di
  // bookmark dan pesan WhatsApp ke staf. Sementara, bukan permanen (308) —
  // pengalihan permanen di-cache browser dan sulit ditarik kembali kalau
  // penamaannya ternyata masih berubah lagi.
  // Noindex untuk seluruh panel. Ditaruh di sini, bukan di netlify.toml:
  // `[[headers]]` Netlify hanya kena ke berkas statis, sementara semua halaman
  // di app ini dirender di server — terbukti hilang di respons /login setelah
  // deploy pertama. Ini kerapian, bukan pengaman; aksesnya dijaga RLS +
  // proxy.ts.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/admin/materi-bank-soal',
        destination: '/admin/materi-latihan-soal',
        permanent: false,
      },
    ]
  },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
    serverActions: {
      bodySizeLimit: '52mb',
    },
  },
};

export default nextConfig;
