import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable dark mode support
  },
  // Ensure proper dark mode handling
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Handle hydration warnings better
  typescript: {
    // Ignore build errors during development
    ignoreBuildErrors: false,
  },
};

export default nextConfig;