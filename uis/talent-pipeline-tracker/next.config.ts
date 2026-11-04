import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_INVENTORY_API_URL: "/api/inventory",
  },
  async rewrites() {
    const apiUrl = (process.env.INVENTORY_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
    const inventoryUrl = apiUrl.endsWith("/inventory") ? apiUrl : `${apiUrl}/inventory`;
    return [
      {
        source: "/api/inventory/:path*",
        destination: `${inventoryUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
