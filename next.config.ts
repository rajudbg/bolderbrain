import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
