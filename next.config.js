/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["lucide-react", "@jchaffin/voicekit", "@layline/agents"],

  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  output: "standalone",
  turbopack: {},
};

export default nextConfig;
