import type { NextConfig } from "next";

// Restaurant photos are plain <img> tags pointing at Supabase Storage, so no
// next/image config (and no Vercel image-optimization quota) is needed.
const nextConfig: NextConfig = {};

export default nextConfig;
