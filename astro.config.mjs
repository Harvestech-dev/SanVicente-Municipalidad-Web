// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const vecinoUseLocalJson =
  String(process.env.ENVIRONMENT ?? process.env.ENVIROMENT ?? "").toLowerCase() === "development";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    define: {
      __VECINO_USE_LOCAL_JSON__: JSON.stringify(vecinoUseLocalJson),
    },
  },
});
