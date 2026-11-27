import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray package-lock.json exists in the home folder; pin the root to this project.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
