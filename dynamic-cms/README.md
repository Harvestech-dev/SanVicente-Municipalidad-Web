# Layout dinámico y componentes desde CMS

Carpeta **portable** con la lógica para:

- Cargar **configuración de cliente** desde una API (`client-config`).
- Cargar **componentes de página** desde una API (`cms-components`).
- Renderizar un **layout dinámico** según tipo de página y orden definido en el CMS.

El proyecto de destino usa **sus propios componentes** (hero, FAQ, banners, etc.); aquí solo está el flujo desde la llamada hasta el renderizado.

## Documentación

- **[INSTRUCTIVO_IA.md](./INSTRUCTIVO_IA.md)** — Para un asistente de IA: pasos para implementar este sistema en otro proyecto (APIs, integración en layout, mapeo de componentes, checklist).
- **[MANUAL_USO.md](./MANUAL_USO.md)** — Para humanos: qué hace el sistema, requisitos del backend, uso en layout y páginas, props que reciben los componentes.

## Contenido de la carpeta

| Carpeta/archivo | Descripción |
|-----------------|-------------|
| `types/` | Tipos TypeScript (CMS, respuestas API). |
| `config/` | API (URLs, buildApiUrl), schema y loader de client-config, config por defecto. |
| `contexts/` | `ClientConfigProvider` y `useClientConfig`. |
| `hooks/` | `useCMSCache`, `useCMSComponents`, `usePageCMS`, `useComponentConfig`. |
| `components/` | `DynamicLayout` (genérico; recibe `componentMap` y `cmsTypeToLayoutName` del proyecto). |
| `index.ts` | Re-export de tipos, config, contextos, hooks y `DynamicLayout`. |

## Uso rápido

1. Copiar esta carpeta al proyecto de destino (no mover).
2. Backend: exponer `GET .../client-config?host=...` y `GET .../cms-components`.
3. En el layout raíz: `getClientConfig(hostname)` + `ClientConfigProvider`.
4. En la página: `<DynamicLayout pageType="Inicio" cmsTypeToLayoutName={...} componentMap={...} />` con los componentes del proyecto.

Dependencia: **zod** (para el schema de client-config).
