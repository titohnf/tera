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
