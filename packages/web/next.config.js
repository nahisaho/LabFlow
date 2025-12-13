/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Transpile workspace packages
  transpilePackages: ['@labflow/core'],
};

export default nextConfig;
