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
  async redirects() {
    return [
      {
        source: '/scan/:token',
        destination: '/login',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
