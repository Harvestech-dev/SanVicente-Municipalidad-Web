// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { loadEnv } from 'vite';

const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const env = loadEnv(mode, process.cwd(), "");
const vecinoUseLocalJson =
  String(env.ENVIRONMENT ?? env.ENVIROMENT ?? "").toLowerCase() === "development";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    define: {
      __VECINO_USE_LOCAL_JSON__: JSON.stringify(vecinoUseLocalJson),
    },
  },
});
