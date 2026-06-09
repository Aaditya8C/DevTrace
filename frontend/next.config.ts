import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*", // Proxy API requests to backend
      },
      {
        source: "/oauth2/:path*",
        destination: "http://localhost:8080/oauth2/:path*", // Proxy OAuth authorization routes
      },
      {
        source: "/login/oauth2/:path*",
        destination: "http://localhost:8080/login/oauth2/:path*", // Proxy OAuth callback routes
      },
    ];
  },
};

export default nextConfig;
