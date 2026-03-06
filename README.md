# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Deploy en Netlify

Las **noticias y eventos** se cargan desde la API Vecino **en tiempo de build** (no en el navegador). Para que aparezcan en el sitio desplegado:

1. En Netlify: **Site settings** → **Environment variables**.
2. Definir **`PUBLIC_API_VECINO_URL`** con la URL base de la API (ej. `https://api-sanvicente.vecino.digital`).
3. Definir **`PUBLIC_API_URL`** si se usa el CMS (componentes del inicio).

Si `PUBLIC_API_VECINO_URL` no está definida en el build de Netlify, las noticias y la agenda quedarán vacías. La API debe ser accesible desde los servidores de Netlify (sin restricción por IP).

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
