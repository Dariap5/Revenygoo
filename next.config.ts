import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/history",
        destination: "/chat",
        permanent: false,
      },
    ];
  },
  /**
   * Если HMR «замирает» (изменения не подхватываются без перезапуска), запустите
   * `npm run dev:poll` — включится polling вместо нативного file watcher
   * (актуально для iCloud Desktop, сетевых дисков, лимитов inotify).
   */
  webpack: (config, { dev }) => {
    if (dev && process.env.WATCHPACK_POLLING === "true") {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
