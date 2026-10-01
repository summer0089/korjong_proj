import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: "standalone",
  //basePath: "/korjong",
  images: {
    unoptimized: true,
  },
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
