// import type { NextConfig } from "next";
// import createNextIntlPlugin from "next-intl/plugin";

// const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
//   ? "standalone"
//   : undefined;

// export default () => {
//   const nextConfig: NextConfig = {
//     output: BUILD_OUTPUT,
//     cleanDistDir: true,
//     devIndicators: {
//       position: "bottom-right",
//     },
//     env: {
//       NO_HTTPS: process.env.NO_HTTPS,
//     },
//     experimental: {
//       taint: true,
//     },
//   };
//   const withNextIntl = createNextIntlPlugin();
//   return withNextIntl(nextConfig);
// };

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

export default () => {
  const nextConfig: NextConfig = {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    devIndicators: {
      position: "bottom-right",
    },
    env: {
      NO_HTTPS: process.env.NO_HTTPS,
    },
    experimental: {
      taint: true,
    },
    // Tambahkan konfigurasi server
    serverRuntimeConfig: {
      host: "0.0.0.0",
      port: 3000,
    },
  };
  const withNextIntl = createNextIntlPlugin();
  return withNextIntl(nextConfig);
};
