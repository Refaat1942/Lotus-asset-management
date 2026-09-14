/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
};

module.exports = nextConfig;
