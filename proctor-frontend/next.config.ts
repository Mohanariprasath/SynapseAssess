import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
