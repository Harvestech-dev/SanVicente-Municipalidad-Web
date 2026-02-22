# Manual de uso: Layout dinámico y componentes desde CMS

Este manual describe cómo usar el sistema de **layout dinámico** y **componentes desde CMS** en un proyecto. Está pensado para desarrolladores y mantenedores (humanos).

---

## ¿Qué hace este sistema?

1. **Configuración por cliente:** Carga desde una API la configuración del “cliente” (branding, colores, logo, features, SEO) según el dominio desde el que se entra.
2. **Componentes desde CMS:** Obtiene de una API la lista de componentes que debe mostrar cada página (hero, FAQ, banners, etc.) y en qué orden.
3. **Renderizado dinámico:** En cada página, se renderizan solo los componentes que el CMS indica para esa página, en el orden definido, pasándoles los datos que vienen del CMS.

El proyecto define **sus propios componentes de presentación** (hero, FAQ, banners, etc.). Este paquete solo proporciona la lógica: llamadas a la API, caché, filtrado por página, orden y construcción de props.

---

## Requisitos del backend

Tu backend debe ofrecer dos endpoints.

### Configuración de cliente

- **Método y ruta:** `GET /api/public/v1/client-config`
- **Parámetro:** `host` (ej. `?host=midominio.com`).
- **Respuesta:** Un JSON con la configuración del cliente (colores, logo, features, SEO, etc.). La estructura debe coincidir con el schema definido en `config/client-config.ts` (o el backend puede devolver ese objeto dentro de `data` si la respuesta es `{ success, data, message }`).

El backend debe identificar el cliente por el valor de `host` (o por el header `Host` de la petición) y devolver la config correspondiente.

### Componentes CMS

- **Método y ruta:** `GET /api/public/v1/cms-components`
- **Respuesta:** Un JSON con esta forma:

```json
{
  "success": true,
  "data": {
    "components": [
      {
        "_id": "...",
        "name": "Hero principal",
        "type": "hero_search",
        "page": "Inicio",
        "data": { ... },
        "status": "published",
        "isActive": true,
        "isVisible": true,
        "clientName": "...",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "client": { "id": "...", "name": "...", "slug": "..." }
  }
}
```

Cada elemento de `components` debe tener al menos: `_id`, `name`, `type`, `page`, `data`, `status`, `isActive`, `isVisible`, `clientName`, `createdAt`, `updatedAt`.

- **`type`:** Identificador del tipo de componente (ej. `hero_search`, `faq_section`). El frontend lo mapea a un componente React concreto.
- **`page`:** Página donde se muestra (ej. `"Inicio"`, `"Contacto"`). Debe coincidir con el `pageType` que uses en `<DynamicLayout>`.
- **`data`:** Datos del componente. Puede incluir:
  - **`_configuracion`** o **`config`:** Opciones (variante, alineación, etc.) que se pasan como props al componente.
  - **`_orden`** o **`order`:** Número para ordenar los componentes en la página (menor = antes).

El backend suele identificar el cliente por el dominio de la petición (Host o cabeceras que reenvíes).

---

## Uso en el proyecto

### 1. Layout raíz

En el layout principal (por ejemplo `app/layout.tsx` en Next.js):

- Obtén el hostname del request (p. ej. con `headers().get("host")`).
- Llama a `getClientConfig(hostname)` (desde esta carpeta).
- Envuelve la aplicación con `ClientConfigProvider` y pásale la config:

```tsx
import { getClientConfig } from "@/portable-dynamic-cms/config/client-config-loader";
import { ClientConfigProvider } from "@/portable-dynamic-cms/contexts/ClientConfigProvider";

export default async function RootLayout({ children }) {
  const hostname = (await headers()).get("host") ?? "";
  const config = await getClientConfig(hostname).catch(() => null);
  return (
    <html>
      <body>
        <ClientConfigProvider initialConfig={config}>
          {children}
        </ClientConfigProvider>
      </body>
    </html>
  );
}
```

Así toda la app tiene acceso a la configuración del cliente (por ejemplo para branding o features).

### 2. Variables de entorno

- **`NEXT_PUBLIC_API_URL`:** URL base del backend (ej. `https://api.tudominio.com`).
- Opcional en desarrollo: **`NEXT_PUBLIC_CLIENT_SLUG`** si quieres cargar la config desde un JSON local cuando la API no esté disponible (la ruta del JSON se puede ajustar en `config/client-config-loader.ts`).

### 3. Mapeo de tipos CMS a tus componentes

Tienes que definir dos cosas:

- **Tipos del CMS → nombre interno:** Por cada `type` que devuelva el CMS (ej. `hero_search`, `faq_section`), asigna un nombre corto (ej. `hero-search`, `faq-section`).
- **Nombre interno → componente React:** Por cada nombre, asigna el componente de tu proyecto que debe renderizarse.

Ejemplo:

```ts
const cmsTypeToLayoutName = {
  hero_search: "hero-search",
  faq_section: "faq-section",
  banner_promocional: "promotional-banner",
};

const componentMap = {
  "hero-search": MiHero,           // Tus componentes
  "faq-section": MiFaq,
  "promotional-banner": MiBanner,
};
```

Los componentes (MiHero, MiFaq, MiBanner) deben aceptar al menos las props que les envía el sistema: típicamente `loading`, `error`, `data` y el resto de opciones que vengan en `data._configuracion` o `data.config`.

### 4. Página con layout dinámico

En la página que quieras que se arme con el CMS (por ejemplo la home):

```tsx
"use client";

import { DynamicLayout } from "@/portable-dynamic-cms";
// Importar tus componentes
import { MiHero } from "@/components/MiHero";
import { MiFaq } from "@/components/MiFaq";

const cmsTypeToLayoutName = {
  hero_search: "hero-search",
  faq_section: "faq-section",
};

const componentMap = {
  "hero-search": MiHero,
  "faq-section": MiFaq,
};

export default function HomePage() {
  return (
    <DynamicLayout
      pageType="Inicio"
      cmsTypeToLayoutName={cmsTypeToLayoutName}
      componentMap={componentMap}
    />
  );
}
```

- **`pageType`:** Debe coincidir con el valor de `page` que envía el CMS para esa página (ej. `"Inicio"`).
- **`cmsTypeToLayoutName`** y **`componentMap`:** Los mismos que definiste arriba.

Solo se mostrarán los componentes que el CMS devuelva para la página `"Inicio"`, en el orden indicado por `_orden`/`order`.

---

## Qué recibe cada componente

Por defecto, cada componente recibe:

- **`loading`:** Si los datos del CMS siguen cargando.
- **`error`:** Mensaje de error si falló la carga.
- **`data`:** El objeto `data` del componente en la respuesta del CMS (textos, imágenes, listas, etc.).
- El resto de propiedades de **`data._configuracion`** o **`data.config`** se pasan también como props (por ejemplo `variant`, `alignment`).

Puedes usar en tu componente algo como:

```tsx
export function MiFaq({ loading, error, data, title, variant }) {
  if (loading) return <Skeleton />;
  if (error) return <Error message={error} />;
  const preguntas = data?.lista_faqs ?? data?.lista_preguntas ?? [];
  return ( ... );
}
```

Si necesitas una lógica de props distinta, puedes pasar una función `getComponentProps` a `DynamicLayout` (ver tipos en `components/DynamicLayout.tsx`).

---

## Caché y una sola llamada CMS

- La lista de componentes del CMS se pide **una vez** por sesión (y se reutiliza en memoria y, opcionalmente, en localStorage con TTL).
- Varias partes de la app pueden usar `useCMSComponents()` o `usePageCMS()` sin hacer varias llamadas; comparten los mismos datos hasta que se invaliden o expire el caché.

---

## Resumen rápido

| Qué quieres hacer              | Dónde / cómo |
|--------------------------------|--------------|
| Cargar config del cliente      | Layout raíz: `getClientConfig(hostname)` + `ClientConfigProvider`. |
| Usar la config en la app       | Hook `useClientConfig()` dentro de `ClientConfigProvider`. |
| Obtener componentes del CMS   | Hooks `useCMSComponents()` o `usePageCMS()` (en cliente). |
| Renderizar una página por CMS  | `<DynamicLayout pageType="..." cmsTypeToLayoutName={...} componentMap={...} />` con **tus** componentes. |
| Ajustar props por componente   | Prop opcional `getComponentProps` de `DynamicLayout`. |

Con esto puedes aplicar la lógica y el flujo desde la llamada a la API hasta el renderizado en cualquier proyecto que use sus propios componentes de página.
