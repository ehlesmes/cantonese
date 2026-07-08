import { defineConfig } from "astro/config";
import istanbul from "vite-plugin-istanbul";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://ehlesmes.github.io",
  base: "/cantonese",
  vite: {
    plugins: [
      process.env.COVERAGE === "true" &&
        istanbul({
          include: "src/client/**",
          exclude: ["node_modules", "tests/**"],
          extension: [".js"],
          requireEnv: false,
        }),
    ].filter(Boolean),
  },
});
