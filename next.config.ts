import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For file uploads in public/Uploads
  output: 'standalone',   // ← Add this for Render

  images: {
    domains: ['localhost', 'your-app.onrender.com'],
  },
};

export default nextConfig;