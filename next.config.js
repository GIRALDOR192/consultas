/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '0ec8ed3997626603f7bad0f9644dda9e.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
