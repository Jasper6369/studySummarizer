import type { NextConfig } from "next";
import os from "os";

function getLocalDevOrigins(): string[] {
  const origins = new Set<string>([
    "studysummarizer",
    "localhost",
    "127.0.0.1",
  ]);

  const interfaces = os.networkInterfaces();
  for (const ifaceList of Object.values(interfaces)) {
    for (const iface of ifaceList ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        origins.add(iface.address);
      }
    }
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  reactStrictMode: true,
  ...(process.env.NODE_ENV === "development"
    ? { allowedDevOrigins: getLocalDevOrigins() }
    : {}),
  serverExternalPackages: [
    "pdf-parse",
    "pdf-to-img",
    "mammoth",
    "word-extractor",
  ],
};

export default nextConfig;
