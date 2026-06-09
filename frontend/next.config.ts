import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`, // Proxy API requests to backend
      },
      {
        source: "/oauth2/:path*",
        destination: `${BACKEND_URL}/oauth2/:path*`, // Proxy OAuth authorization routes
      },
      {
        source: "/login/oauth2/:path*",
        destination: `${BACKEND_URL}/login/oauth2/:path*`, // Proxy OAuth callback routes
      },
    ];
  },
};

export default nextConfig;

