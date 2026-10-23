/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kept out of webpack so the Cloudflare adapter's bundler packs Prisma, including the
  // query compiler .wasm that src/lib/prisma-runtime.ts loads through "@prisma/client/wasm".
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // `next dev` (Turbopack) runs on Node, which can't load Prisma's Workers build, so it
  // gets the Node build instead. Production builds use webpack and keep the Workers build.
  turbopack: {
    resolveAlias: {
      "@/lib/prisma-runtime": "./src/lib/prisma-runtime.node.ts",
    },
  },
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

// Lets `next dev` read Cloudflare bindings through getCloudflareContext(). Skipped for
// builds, which don't need bindings and can't open the remote R2 session without a login.
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
