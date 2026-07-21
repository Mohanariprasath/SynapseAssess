import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
