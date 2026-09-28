import path from "node:path";
import type { NextConfig } from "next";

// Desarrollo local: una sola `.env` en la raíz del monorepo (Next por defecto solo lee apps/web).
try {
  process.loadEnvFile(path.resolve(__dirname, "../../.env"));
} catch {
  // sin .env en la raíz: variables del entorno
}

const nextConfig: NextConfig = {
  output: "standalone",
  agentRules: false,
};

export default nextConfig;
