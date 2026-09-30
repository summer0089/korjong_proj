import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/p/reports/:path*",
        destination: "/p/report/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
