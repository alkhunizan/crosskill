import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  reactStrictMode: true,
  webpack: (config) => {
    // Force the browser bundle of @crosskill/core. The default export entry
    // is built with `--target node` and includes a `createRequire` shim that
    // Webpack 5 can't resolve. The browser bundle is in dist/browser/.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@crosskill/core$": resolve(here, "../../packages/core/dist/browser/index.js"),
    };
    return config;
  },
};

export default nextConfig;
