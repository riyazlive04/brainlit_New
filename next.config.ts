import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Founder's contact page: static HTML in public/haja_najmudeen.
      { source: "/haja_najmudeen", destination: "/haja_najmudeen/index.html" },
      { source: "/haja_najmudeen/", destination: "/haja_najmudeen/index.html" },
    ];
  },
};

export default nextConfig;
