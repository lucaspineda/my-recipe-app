/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/recipe-app-1bbdc-images/**',
      },
    ],
  },
};

export default nextConfig;
