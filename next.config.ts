import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/-878107",
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
