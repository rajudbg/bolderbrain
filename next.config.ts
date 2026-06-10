import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // @ts-expect-error next.js type issue
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingRoot: appRoot,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  serverExternalPackages: ["pg", "@prisma/client"],
  async redirects() {
    return [
      { source: "/super-admin/competencies", destination: "/super-admin/templates", permanent: true },
      { source: "/super-admin/competencies/:path*", destination: "/super-admin/templates", permanent: true },
    ];
  },
};

import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
  tunnelRoute: "/monitoring",
});
