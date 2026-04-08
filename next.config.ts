import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.wasm$/,
        type: "asset/resource",
      });

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        perf_hooks: false,
        os: false,
        worker_threads: false,
        crypto: false,
        stream: false,
      };
    }
    return config;
  },
};

export default nextConfig;
