const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://*.starbizacademy.com',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.starbizacademy.com",
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
