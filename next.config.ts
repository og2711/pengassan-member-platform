import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The member assistant reads its knowledge files from disk at runtime.
  outputFileTracingIncludes: {
    '/api/assistant': ['./lib/knowledge/**/*'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
