import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Avoid "Application error" when opening via 127.0.0.1 while the
  // dev server advertises localhost (or vice versa).
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.100.55"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
