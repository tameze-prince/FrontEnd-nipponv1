import type { NextConfig } from "next";

const backendUrl = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://pme6ad6kdt.us-east-1.awsapprunner.com'
).replace(/\/$/, '');

const nextConfig: NextConfig = {
  /* config options here */
 
  allowedDevOrigins: ['172.20.10.10'],

  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/auth/:path*', destination: `${backendUrl}/auth/:path*` },
      { source: '/admin/:path*', destination: `${backendUrl}/admin/:path*` },
      { source: '/analytics/:path*', destination: `${backendUrl}/analytics/:path*` },
      { source: '/stocks/:path*', destination: `${backendUrl}/stocks/:path*` },
      { source: '/users/:path*', destination: `${backendUrl}/users/:path*` },
    ];
  },
};

export default nextConfig;
