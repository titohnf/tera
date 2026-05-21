import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
