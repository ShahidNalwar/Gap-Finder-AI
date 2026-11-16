import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingIncludes: {
    "/api/upload/sample": ["./sample-data/*.txt"],
  },
};

export default nextConfig;
