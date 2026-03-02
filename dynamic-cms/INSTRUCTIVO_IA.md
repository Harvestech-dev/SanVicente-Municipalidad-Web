# Instructivo para IA: Implementar layout dinámico y componentes CMS en otro proyecto

Este documento permite a un asistente de IA integrar el flujo **desde la llamada API hasta el renderizado de componentes** en un proyecto distinto, **sin copiar componentes de presentación** (hero, banners, etc.). El proyecto de destino usa sus propias páginas y componentes.

---

## 1. Contrato de APIs (backend)

El frontend espera dos endpoints.

### 1.1 Configuración de cliente

- **URL:** `GET /api/public/v1/client-config?host=<hostname>`
- **Headers opcionales:** `X-Original-Host: <hostname>`
- **Respuesta:** JSON que cumpla el schema Zod en `config/client-config.ts` (o envuelto en `{ success, data, message }`; si viene envuelto, se usa `data`).

El backend debe identificar el cliente por `host` (query) o por header `Host`/`X-Original-Host` y devolver la config (branding, features, seo, etc.).

### 1.2 Componentes CMS

- **URL:** `GET /api/public/v1/cms-components` (opcional: `?type=...&page_filter=...&status=...`)
- **Respuesta:**  
  `{ success: true, data: { components: CMSComponent[], client: { id, name, slug } }, message?: string }`

Cada **CMSComponent** debe tener al menos:

- `_id`, `name`, `type`, `page`, `data`, `status`, `isActive`, `isVisible`, `createdAt`, `updatedAt`, `clientName`
- `data`: objeto libre; puede incluir `_configuracion` o `config` para opciones del componente, y `_orden` o `order` para orden en la página.

El backend identifica el cliente por el dominio de la petición (Host / cabeceras que reenvíes).

---

## 2. Copiar la carpeta al proyecto de destino

- Copiar la carpeta **`portable-dynamic-cms`** al proyecto (por ejemplo `src/portable-dynamic-cms` o `lib/portable-dynamic-cms`).
- No mover; es una copia para que el otro repo tenga su propia versión.

---

## 3. Dependencias

- **React** (client components).
- **zod** (ya usado en `config/client-config.ts`).
- **Next.js** (recomendado): uso de `headers()`, `cache()`, y rutas. Si el proyecto no es Next.js, habrá que adaptar:
  - `getClientConfig`: en lugar de `cache()` de React, usar otra estrategia de caché o llamada única por request.
  - Layout raíz: donde se inyecte `ClientConfigProvider` y se llame a la función que carga la config (equivalente a `getClientConfig(hostname)`).

---

## 4. Variables de entorno

En el proyecto de destino configurar:

- `NEXT_PUBLIC_API_URL`: URL base del backend (ej. `https://api.ejemplo.com` o `https://api.ejemplo.com/api/public/v1`).
- Opcional en desarrollo:
  - `NEXT_PUBLIC_CLIENT_SLUG`: para fallback a JSON local.
  - Ruta de JSON: si se usa fallback local, ajustar en `config/client-config-loader.ts` la ruta `@/public/data/client-configs/${clientSlug}.json` a la que use el proyecto.

---

## 5. Integración en el layout raíz (Next.js)

En el **layout raíz** (por ejemplo `app/layout.tsx`):

1. Obtener el hostname del request (p. ej. con `headers().get("host")`).
2. Llamar a `getClientConfig(hostname)` (desde `config/client-config-loader`).
3. Envolver la app con `ClientConfigProvider` pasando `initialConfig={config}`.
4. No es obligatorio un “CMSProvider” global; los hooks de CMS pueden usarse donde haga falta (p. ej. en la página que use `DynamicLayout`).

Ejemplo mínimo:

```tsx
// app/layout.tsx
import { headers } from "next/headers";
import { getClientConfig } from "@/portable-dynamic-cms/config/client-config-loader";
import { ClientConfigProvider } from "@/portable-dynamic-cms/contexts/ClientConfigProvider";

export default async function RootLayout({ children }) {
  const hostname = (await headers()).get("host") ?? "";
  let config = null;
  try {
    config = await getClientConfig(hostname);
  } catch (e) {
    console.error(e);
  }
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

---

## 6. Definir el mapeo de tipos CMS → componentes del proyecto

El proyecto de destino **no** debe usar componentes de este repo (hero, banners, etc.). Debe definir:

1. **`cmsTypeToLayoutName`:** mapa de `type` del CMS a un nombre interno de “layout” (ej. `hero_search` → `hero-search`, `faq_section` → `faq-section`).
2. **`componentMap`:** mapa de ese nombre de layout a un componente React del proyecto (ej. `hero-search` → `MiHero`, `faq-section` → `MiFaq`).

Cada componente del proyecto debe aceptar al menos las props que devuelve la función por defecto de `getComponentProps` (o la personalizada): típicamente `loading`, `error`, `data`, y el resto de `_configuracion`/`config` en props.

---

## 7. Usar DynamicLayout en una página

En la página que quiera “layout dinámico por CMS” (por ejemplo la home):

1. Importar `DynamicLayout` desde esta carpeta.
2. Construir `cmsTypeToLayoutName` y `componentMap` con **componentes del proyecto**.
3. Pasar `pageType` igual al valor de `page` que devuelve el CMS para esa página (ej. `"Inicio"`, `"Home"`, `"properties"`).

Ejemplo:

```tsx
// app/page.tsx (o la ruta que corresponda)
"use client";

import { DynamicLayout } from "@/portable-dynamic-cms";
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

Opcional: `LoadingComponent`, `EmptyComponent`, `getComponentProps` personalizado (ver tipos en `components/DynamicLayout.tsx`).

---

## 8. Flujo de datos (resumen)

1. **Servidor (layout):** `getClientConfig(hostname)` → API `client-config?host=...` → se pasa a `ClientConfigProvider`.
2. **Cliente (página con DynamicLayout):**  
   - `useClientConfig()` para branding/config global.  
   - `useCMSComponents()` hace una sola petición a `cms-components`, cache en memoria/localStorage.  
   - `usePageCMS()` reutiliza esos componentes y expone por tipo (about, contact, faq, etc.).  
3. **DynamicLayout:**  
   - Filtra componentes por `pageType` (campo `page`).  
   - Ordena por `_orden`/`order`.  
   - Para cada componente, resuelve el nombre de layout con `cmsTypeToLayoutName`, obtiene el React component de `componentMap`, construye props con `getComponentProps` (por defecto: `data`, `loading`, `error`, y spread de `_configuracion`/`config`).  
   - Renderiza cada componente con esas props.

No se copian componentes de UI del proyecto origen; solo esta lógica y tipos.

---

## 9. Ajustes opcionales en el proyecto de destino

- **Schema de client-config:** Si el backend tiene campos extra, extender el schema en `config/client-config.ts` (Zod).
- **Tipos CMS:** Si la API devuelve campos adicionales en cada componente, extender `CMSComponent` en `types/cms-components.ts`.
- **Cache CMS:** TTL y clave en `hooks/useCMSCache.ts`; desduplicación de request en `hooks/useCMSComponents.ts`.
- **Split / combinación de componentes:** Si se necesita lógica tipo “about_split + contact_split → un solo bloque”, implementarla en el proyecto (preprocesando la lista antes de pasarla o en un wrapper de `DynamicLayout` que transforme la lista de componentes y/o `getComponentProps`).

---

## 10. Checklist de implementación

- [ ] Backend expone `GET /api/public/v1/client-config?host=...` y responde con el schema esperado.
- [ ] Backend expone `GET /api/public/v1/cms-components` y responde con `{ success, data: { components, client } }`.
- [ ] Carpeta `portable-dynamic-cms` copiada al proyecto; imports resueltos (alias `@/portable-dynamic-cms` o ruta relativa).
- [ ] `zod` instalado.
- [ ] Layout raíz obtiene hostname, llama a `getClientConfig(hostname)` y envuelve con `ClientConfigProvider`.
- [ ] Definidos `cmsTypeToLayoutName` y `componentMap` con componentes del proyecto (no del repo origen).
- [ ] Una página usa `<DynamicLayout pageType="..." cmsTypeToLayoutName={...} componentMap={...} />`.
- [ ] Componentes del proyecto reciben y usan `data`, `loading`, `error` y props de configuración según necesidad.

Con esto, el otro proyecto aplica la misma lógica y flujo desde la llamada hasta el renderizado, usando solo sus propios componentes.
