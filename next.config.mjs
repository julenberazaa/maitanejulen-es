/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true }   // evita Image Optimization server-side
};
export default nextConfig;
