/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for pages using Firebase Auth
  // (all routes are protected or redirect, so SSG is not needed)
  output: "standalone",
};

export default nextConfig;
