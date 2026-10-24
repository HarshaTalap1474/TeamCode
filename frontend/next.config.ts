import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Allow access from local network IPs and localhost
  allowedDevOrigins: ["169.254.83.107", "localhost", "127.0.0.1"],
  ...(process.env.BACKEND_URL
    ? {
        async rewrites() {
          return [
            {
              source: "/api/v1/:path*",
              destination: `${process.env.BACKEND_URL}/v1/:path*`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
