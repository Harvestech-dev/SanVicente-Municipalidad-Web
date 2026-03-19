# Informe de estado de caché y performance

## Objetivo

Documentar el estado actual del manejo de caché y rendimiento del proyecto, con foco especial en el flujo de **programas** (listado + detalle), y proponer mejoras concretas.

---

## 1) Estado actual de caché

### 1.1 Caché de programas (sí existe)

- Se usa caché en cliente con `sessionStorage`.
- Clave actual: `cms_programas_lista_v1`.
- Implementado en `src/lib/programas-utils.ts`.

Se guarda desde:

- `src/components/cms/CmsInicioClient.tsx`
- `src/components/programas/ProgramasPageClient.tsx`

Se lee desde:

- `src/components/programas/ProgramasDetailClient.tsx`

Comportamiento actual en detalle:

1. intenta resolver el programa por `slug` desde `sessionStorage`;
2. si no encuentra, hace fetch cliente a CMS;
3. vuelve a guardar la lista en caché.

### 1.2 Caché global de CMS (no existe)

- `fetchCMSComponentsInBrowser` (`src/lib/cms/fetch-cms-browser.ts`) hoy hace fetch directo por llamada.
- No hay deduplicación entre componentes/páginas.
- No hay TTL en memoria compartida por pestaña.

Impacto: múltiples llamadas redundantes a `/cms-components` en una misma navegación.

### 1.3 Otras persistencias

- `localStorage` se usa solo para UX puntual en contacto (`vecino-digital-tip-closed`).
- Noticias y agenda no tienen caché persistente propia; usan API/local JSON según entorno.

---

## 2) Manejo de información de programas

## Flujo actual (cliente)

- Home y listado piden componentes CMS en browser.
- Programas se extraen de `lista_programas` y se ordenan.
- Se genera `slug` para la URL de detalle.

Ruta de detalle:

- `/programas/detalle?slug=...`

Detalle:

- Busca por `slug` en caché local de programas;
- si no está, reconsulta CMS desde cliente.

## Consistencia de URL/slug

Se centralizó en utilidades:

- `getProgramSlug(...)`
- `sortProgramList(...)`

Esto evita inconsistencias entre:

- Home (`CmsInicioClient`)
- Página programas (`ProgramasPageClient`)
- Detalle (`ProgramasDetailClient`)

---

## 3) Hallazgos de performance

### 3.1 Llamadas duplicadas a `/cms-components` (alto impacto)

Hoy varias vistas/componentes pueden solicitar la misma data en paralelo o repetidamente:

- inicio
- programas
- detalle programas
- gobierno
- contacto
- footer hidratado (`CmsLayoutHydrator`)

### 3.2 Header innecesario en GET (impacto medio)

En `fetchCMSComponentsInBrowser` se envía `Content-Type: application/json` para GET.
En escenarios CORS esto puede provocar preflight innecesario.

### 3.3 Caché de programas sin expiración (impacto medio)

Actualmente no hay TTL/metadata de validez (`timestamp`, `clientSlug`, `entorno`, `version`), por lo que la data puede quedar stale durante toda la sesión.

### 3.4 Logs de payload completo en inicio (impacto bajo/medio)

En `CmsInicioClient` hay logs de respuesta completa CMS y slider.
En producción conviene desactivarlos o protegerlos detrás de un flag explícito.

### 3.5 Bundle grande de iconos (impacto alto)

El build reporta chunk grande de `SocialIcon` (aprox. ~2.9MB), afectando carga inicial y TTI, sobre todo en móvil.

---

## 4) Recomendaciones priorizadas

## Prioridad 1 (rápido + mayor impacto)

1. **Caché/dedupe global para `fetchCMSComponentsInBrowser`**
   - Map en memoria por pestaña (`cacheKey -> Promise/resultado`).
   - TTL corto (2-5 min).
   - Reuso de promesas concurrentes.

2. **Quitar `Content-Type` en GET** de CMS browser fetch.

3. **Controlar logs de debug**
   - solo con flag (`debug=1`) o `import.meta.env.DEV`.

## Prioridad 2 (programas robusto)

4. **Versionar caché de programas**
   - guardar `{ data, ts, clientSlug, env, version }`.
   - invalidar al cambiar contexto o por TTL.

5. **Reducir payload cacheado**
   - persistir solo campos necesarios para resolver detalle rápido.

## Prioridad 3 (optimización estructural)

6. **Reducir tamaño de `SocialIcon`**
   - imports más selectivos;
   - lazy-load donde aplique.

7. **Reuso transversal de `cms-components`**
   - evitar pedir lo mismo en footer/contacto/gobierno cuando ya existe en memoria.

---

## 5) Plan sugerido de implementación

1. `src/lib/cms/fetch-cms-browser.ts`
   - agregar caché en memoria + dedupe + TTL.

2. `src/lib/programas-utils.ts`
   - evolucionar caché de programas a estructura versionada con metadata.

3. `CmsInicioClient`, `ProgramasPageClient`, `ProgramasDetailClient`
   - usar APIs nuevas de caché (lectura/validación/escritura).

4. `CmsInicioClient`
   - remover logs de payload completo o encapsularlos en debug.

5. `SocialIcon`
   - refactor para split de bundle.

---

## 6) Métricas recomendadas para validar mejora

- Cantidad de requests a `/cms-components` por navegación.
- Tiempo a primer render útil en:
  - Home
  - Programas listado
  - Programas detalle
- Tamaño de bundle inicial (antes/después).
- Tiempo de transición Home -> Detalle programa (cache hit vs miss).

---

## 7) Resumen ejecutivo

- Ya existe una base de caché de programas en cliente y el flujo de detalle cumple el requisito “todo en cliente”.
- El principal cuello actual no está en lógica de negocio sino en **duplicación de fetch CMS** y **peso de bundle**.
- Con dedupe + TTL + ajuste de iconos, se puede mejorar sensiblemente latencia percibida, consumo de red y estabilidad de UX.
