/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.easternnewsnetwork.com" }],
        destination: "https://easternnewsnetwork.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
