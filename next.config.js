/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@distube/ytdl-core"],
  webpack: (config) => {
    config.externals = [...config.externals, "undici"];
    return config;
  },
};

module.exports = nextConfig;
