import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    frequent: {
      stale: 15,
      revalidate: 30,
      expire: 300,
    },
    dashboard: {
      stale: 60,
      revalidate: 300,
      expire: 3600,
    },
    courses: {
      stale: 300,
      revalidate: 900,
      expire: 86400,
    },
    static: {
      stale: 3600,
      revalidate: 86400,
      expire: 604800,
    },
  },
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    const backendUrl = process.env.DOTNET_API_URL || "http://localhost:5045";
    return [
      {
        source: "/api/courses/:path*",
        destination: `${backendUrl}/api/courses/:path*`,
      },
      {
        source: "/api/classes/:path*",
        destination: `${backendUrl}/api/classes/:path*`,
      },
      {
        source: "/api/members/:path*",
        destination: `${backendUrl}/api/members/:path*`,
      },
      {
        source: "/api/schedule/:path*",
        destination: `${backendUrl}/api/schedule/:path*`,
      },
      {
        source: "/api/sessions/:path*",
        destination: `${backendUrl}/api/sessions/:path*`,
      },
      {
        source: "/api/notifications/:path*",
        destination: `${backendUrl}/api/notifications/:path*`,
      },
      {
        source: "/api/dashboard/:path*",
        destination: `${backendUrl}/api/dashboard/:path*`,
      },
    ];
  },
};

export default nextConfig;
