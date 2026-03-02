# Análisis de viabilidad: Sistema de layout dinámico y API CMS

## 1. Resumen ejecutivo

**Conclusión:** La implementación del sistema de layout dinámico y llamadas API desde dynamic-cms es **viable** en el proyecto actual, pero requiere **adaptaciones significativas** debido a la diferencia de stack (el dynamic-cms fue diseñado para React/Next.js y el proyecto usa Astro puro).

---

## 2. Análisis del dynamic-cms

### 2.1 Estructura y componentes

| Elemento | Descripción | Dependencias |
|----------|-------------|--------------|
| **Tipos** (`cms-components.ts`) | Contratos de API: `CMSComponent`, `CMSComponentsResponse` | Ninguna |
| **API Config** (`api-config.ts`) | URLs base, endpoints, `buildApiUrl()` | `process.env`, `window` |
| **Client Config** (`client-config.ts`) | Schema Zod para branding, features, SEO | **zod** |
| **Client Config Loader** | `getClientConfig(hostname)` server-side | **React cache()**, Next.js `headers()` |
| **ClientConfigProvider** | Context React para config global | **React** |
| **useCMSCache** | Caché en localStorage (TTL 5 min) | **React** |
| **useCMSComponents** | Fetch GET `/cms-components`, filtros, deduplicación | **React** |
| **usePageCMS** | Wrapper sobre useCMSComponents con helpers por tipo | **React** |
| **DynamicLayout** | Renderiza componentes por `page` y `_orden` | **React** | 

### 2.2 Contratos de API esperados

**1. Client Config**
- `GET /api/public/v1/client-config?host=<hostname>`
- Respuesta: JSON con schema Zod (branding, features, seo, etc.)

**2. CMS Components**
- `GET /api/public/v1/cms-components`
- Parámetros opcionales: `type`, `page_filter`, `status`
- Respuesta: `{ success, data: { components: CMSComponent[], client } }`
- Cada componente: `_id`, `name`, `type`, `page`, `data`, `status`, `isActive`, `isVisible`, etc.

### 2.3 Flujo de datos

```
Layout raíz → getClientConfig(hostname) → ClientConfigProvider
     ↓
Página → DynamicLayout (pageType="Inicio")
     ↓
useCMSComponents() → fetch cms-components → cache
     ↓
getComponentsByPage(pageType) → ordenar por _orden
     ↓
Para cada componente: cmsTypeToLayoutName[type] → componentMap[name] → React Component
     ↓
Props: { loading, error, data, ..._configuracion }
```

---

## 3. Análisis del proyecto actual (San Vicente Municipalidad)

### 3.1 Stack tecnológico

| Aspecto | Estado actual |
|---------|---------------|
| **Framework** | Astro 5.17.1 |
| **Modo** | Static (SSG) por defecto |
| **Componentes** | `.astro` (HTML + lógica en frontmatter) |
| **Datos** | JSON estáticos importados (`import data from "../data/..."`) |
| **React** | No instalado |
| **Next.js** | No presente |

### 3.2 Estructura de páginas

- **index.astro**: Orden fijo de componentes (HeroCarousel, Banner, Programas, AgendaCultural, Noticias, TelefonosUtiles)
- **Layout.astro**: Usa `sitio.json` para tema y meta
- Componentes consumen JSON directamente (sin API)

### 3.3 Componentes existentes (mapeables a tipos CMS)

| Componente Astro | Tipo CMS sugerido | Datos actuales |
|------------------|-------------------|----------------|
| HeroCarousel | `hero_carousel` / `home_carousel` | carrusel.json |
| Banner | `banner_hero` / `banner_promocional` | banner.json |
| AccesosRapidos | `accesos_rapidos` | accesos-rapidos.json |
| Programas | `programas_section` | programas.json |
| AgendaCultural | `agenda_cultural` | agenda-cultural.json |
| Noticias | `noticias_section` | noticias.json |
| TelefonosUtiles | `telefonos_utiles` | contacto-page.json |

### 3.4 JSON ya adaptados al manual

Los JSON del proyecto ya siguen la convención del manual (prefijos `txt_`, `img_`, `lista_`, `_orden`, etc.), lo que facilita la migración a datos provenientes de la API.

---

## 4. Evaluación de viabilidad

### 4.1 Incompatibilidades directas

| Incompatibilidad | Impacto | Solución |
|-----------------|---------|----------|
| **React vs Astro** | Alto | Integrar React en Astro (`@astrojs/react`) o reescribir lógica en Astro |
| **React cache()** | Medio | Usar `Astro.cache()` o fetch con revalidación manual |
| **Next.js headers()** | Bajo | En Astro: `Astro.request.headers.get("host")` o equivalente |
| **DynamicLayout espera React components** | Alto | Crear wrappers React de componentes Astro, o layout nativo Astro |
| **ClientConfigProvider (Context React)** | Medio | Provider React en isla, o inyección de config vía Astro |

### 4.2 Factores favorables

1. **JSON compatibles**: Los datos ya usan la estructura del manual.
2. **API config portable**: `api-config.ts` y `buildApiUrl` son framework-agnósticos.
3. **Tipos reutilizables**: `cms-components.ts` no depende de React.
4. **Lógica de caché**: El patrón (localStorage + TTL) es transferible.
5. **Backend existente o planificado**: El manual asume API; si existe, el contrato está definido.

### 4.3 Veredicto

**Viabilidad: SÍ**, con dos rutas posibles:

- **Ruta A (Híbrida)**: Añadir React a Astro, usar DynamicLayout y hooks tal cual, mapeando componentes Astro a wrappers React.
- **Ruta B (Astro nativa)**: Reescribir la lógica en Astro (fetch en build/SSR, layout dinámico con componentes .astro).

---

## 5. Plan de implementación paso a paso

### Fase 0: Requisitos previos (Backend)

- [ ] **0.1** Backend expone `GET /api/public/v1/client-config?host=...` con schema compatible.
- [ ] **0.2** Backend expone `GET /api/public/v1/cms-components` con estructura `CMSComponentsResponse`.
- [ ] **0.3** Los componentes en la API tienen `page`, `type`, `data`, `_orden`, `isActive`, `isVisible`.

### Fase 1: Preparación del proyecto

- [ ] **1.1** Crear `.env` con `PUBLIC_API_URL` (o equivalente para Astro).
- [ ] **1.2** Instalar `zod` (requerido por client-config).
- [ ] **1.3** Decidir ruta: **A (React)** o **B (Astro nativa)**.

---

### RUTA A: Integración híbrida (Astro + React)

#### Fase 2A: Integrar React en Astro

- [ ] **2A.1** Instalar `@astrojs/react` y `react`, `react-dom`.
- [ ] **2A.2** Configurar `astro.config.mjs` con integración React.
- [ ] **2A.3** Crear carpeta `src/lib/cms/` y copiar/adaptar:
  - `api-config.ts` (ajustar `NEXT_PUBLIC_*` a `PUBLIC_*` o `import.meta.env`).
  - `types/cms-components.ts`.
  - `hooks/useCMSCache.ts`, `useCMSComponents.ts`.
  - `contexts/ClientConfigProvider.tsx`.
  - `components/DynamicLayout.tsx`.

- [ ] **2A.4** Adaptar `client-config-loader.ts`:
  - Eliminar `import { cache } from "react"`.
  - Usar `Astro.cache()` si existe, o fetch sin cache de React.
  - Ajustar ruta de fallback JSON si se usa.

#### Fase 3A: Layout y provider

- [ ] **3A.1** En `Layout.astro`, obtener hostname (ej. `new URL(Astro.url).hostname` o header).
- [ ] **3A.2** Crear `ClientConfigWrapper.tsx` (React) que:
  - Llame a `getClientConfig(hostname)` o `loadClientConfigFromAPI` en mount.
  - Renderice `ClientConfigProvider` con la config.
  - Envuelva `children` (slot).

- [ ] **3A.3** En `Layout.astro`, usar `<ClientConfigWrapper client:load>` envolviendo el slot.

#### Fase 4A: Wrappers React para componentes Astro

- [ ] **4A.1** Para cada componente Astro (HeroCarousel, Banner, etc.):
  - Crear un wrapper React que reciba `{ data, loading, error }`.
  - El wrapper renderice el componente Astro usando `renderToStaticMarkup` o, preferiblemente, un componente React que replique la UI del .astro y consuma `data`.

- [ ] **4A.2** Alternativa más limpia: reescribir cada bloque de UI como componente React que acepte las props del CMS (evita duplicar lógica).

- [ ] **4A.3** Definir `cmsTypeToLayoutName` y `componentMap`:

```ts
const cmsTypeToLayoutName = {
  hero_carousel: "hero-carousel",
  banner_hero: "banner-hero",
  accesos_rapidos: "accesos-rapidos",
  programas_section: "programas",
  agenda_cultural: "agenda-cultural",
  noticias_section: "noticias",
  telefonos_utiles: "telefonos-utiles",
};

const componentMap = {
  "hero-carousel": HeroCarouselCMS,
  "banner-hero": BannerCMS,
  // ...
};
```

#### Fase 5A: Página dinámica

- [ ] **5A.1** Crear `DynamicHomePage.tsx` (React) que use `<DynamicLayout pageType="Inicio" ... />`.
- [ ] **5A.2** En `index.astro`, usar `<DynamicHomePage client:load />` en lugar del orden fijo de componentes.
- [ ] **5A.3** Mantener Header y Footer en Astro (fuera del layout dinámico) o incluirlos en el CMS si se desea.

#### Fase 6A: Fallback y resiliencia

- [ ] **6A.1** Si la API falla o no hay componentes, mostrar layout estático actual (JSON locales) como fallback.
- [ ] **6A.2** Considerar `output: "hybrid"` en Astro si se necesita SSR para la carga inicial de config.

---

### RUTA B: Implementación Astro nativa

#### Fase 2B: Módulos framework-agnósticos

- [ ] **2B.1** Copiar `api-config.ts`, `types/cms-components.ts`, `client-config.ts` (schema Zod).
- [ ] **2B.2** Crear `src/lib/cms/fetch-cms.ts`:
  - `fetchClientConfig(hostname)`: fetch a client-config, validar con Zod.
  - `fetchCMSComponents(filters?)`: fetch a cms-components, devolver componentes filtrados.

- [ ] **2B.3** Crear `src/lib/cms/cache.ts` (opcional): caché en memoria con TTL para desarrollo; en build, cada request es independiente.

#### Fase 3B: Carga de datos en Astro

- [ ] **3B.1** En `Layout.astro` (o en cada página que use CMS):
  - Obtener hostname.
  - Llamar a `fetchClientConfig(hostname)`.
  - Pasar config al layout (por ejemplo, como prop o store global para el cliente).

- [ ] **3B.2** Para **static**: en `getStaticPaths` o en el frontmatter de `index.astro`, llamar a `fetchCMSComponents()` en build time. Los datos se embeben en el HTML.

- [ ] **3B.3** Para **dinámico en runtime**: usar `output: "server"` o `output: "hybrid"` en Astro y hacer fetch en cada request.

#### Fase 4B: Layout dinámico en Astro

- [ ] **4B.1** Crear `DynamicLayout.astro` que reciba:
  - `components: CMSComponent[]` (ya filtrados por página y ordenados).
  - `componentMap`: objeto que mapee `type` → componente Astro.

- [ ] **4B.2** En el template de `DynamicLayout.astro`, iterar sobre `components` y usar `<Fragment set:html={...}>` o componentes dinámicos. Astro no soporta `<Component dynamic={...} />` de forma nativa para componentes arbitrarios, pero se puede usar un `switch`/mapa de tipos:

```astro
---
const componentMap = {
  "hero_carousel": HeroCarousel,
  "banner_hero": Banner,
  // ...
};
---
{components.map((c) => {
  const Component = componentMap[c.type];
  if (!Component) return null;
  return <Component data={c.data} loading={false} error={null} />;
})}
```

- [ ] **4B.3** Cada componente Astro debe aceptar `data` como prop y usarla en lugar del import estático de JSON.

#### Fase 5B: Página principal

- [ ] **5B.1** En `index.astro`, obtener componentes con `fetchCMSComponents({ page_filter: "Inicio" })`.
- [ ] **5B.2** Ordenar por `data._orden` o `data.order`.
- [ ] **5B.3** Pasar a `DynamicLayout.astro` o renderizar directamente con el mapa de componentes.

#### Fase 6B: Fallback y caché

- [ ] **6B.1** Si fetch falla, usar JSON locales (como hoy).
- [ ] **6B.2** Para static: considerar `revalidate` o rebuild programado si la API cambia.

---

## 6. Comparativa de rutas

| Criterio | Ruta A (React) | Ruta B (Astro nativa) |
|----------|----------------|----------------------|
| **Esfuerzo inicial** | Mayor (React + wrappers) | Medio (lógica nueva en Astro) |
| **Mantenimiento** | Dos paradigmas (Astro + React) | Solo Astro |
| **Fidelidad al dynamic-cms** | Alta (reutiliza casi todo) | Baja (reescribe) |
| **Caché cliente** | useCMSCache (localStorage) | No aplica en static; en SSR, caché servidor |
| **Hydratación** | Solo islas React | Ninguna extra |
| **Recomendación** | Si se planea más React en el futuro | Si se quiere mantener Astro puro |

---

## 7. Recomendación final

Para **San Vicente Municipalidad**:

- Si el objetivo es **integrar rápido** con un backend CMS existente y se acepta añadir React: **Ruta A**.
- Si se prefiere **mantener el stack Astro puro** y tener control total: **Ruta B**.

En ambos casos, la **Fase 0** (backend) es crítica. Sin API operativa, se puede desarrollar contra mocks (JSON que simulen la respuesta de la API) para validar el flujo.

---

## 8. Referencias

- `dynamic-cms/README.md`
- `dynamic-cms/MANUAL_USO.md`
- `dynamic-cms/INSTRUCTIVO_IA.md`
- `dynamic-cms/MANUAL_JSON_COMPONENTES_CMS_FORMULARIO_DINAMICO.md`
- [Astro - React integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Astro - Server-side rendering](https://docs.astro.build/en/guides/server-side-rendering/)
