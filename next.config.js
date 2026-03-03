/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["lucide-react", "@jchaffin/voicekit"],

  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  output: "standalone",
  turbopack: {},
};

export default nextConfig;
