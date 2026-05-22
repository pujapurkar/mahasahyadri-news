import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  images: {
    domains: [
      'localhost',
      'mahasahyadri-news.onrender.com',
      'res.cloudinary.com'
    ],
  },
};

export default nextConfig;