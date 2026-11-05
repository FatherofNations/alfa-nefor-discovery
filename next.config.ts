import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Вёрстка использует обычные <img> с путями в /public (не next/image).
  // Линт живёт отдельно от билда (npm run lint, --max-warnings 0, в CI);
  // встроенный в next build раннер deprecated и удаляется в Next 16.
  eslint: { ignoreDuringBuilds: true },
  // Figma-ассеты неизменяемы (новая версия = новое имя файла) → вечный кеш.
  // Только в production: в dev immutable-кеш протухает при перезаписи файлов.
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
