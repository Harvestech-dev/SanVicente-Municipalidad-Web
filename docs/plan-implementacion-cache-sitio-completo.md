# Plan detallado de implementación
## Cache y mejora de navegación en todo el sitio

## Objetivo

Mejorar la percepción de velocidad al navegar entre páginas ya visitadas, evitando recargas “en frío” de datos CMS y Vecino cuando ya existe información válida en cliente.

El foco es:

- mostrar contenido más rápido al volver a una página;
- mantener consistencia de datos (cache + revalidación);
- evitar regresiones visuales/funcionales;
- aplicar una estrategia uniforme en todas las páginas del sitio.

---

## Alcance

### Incluye

- Home (`CmsInicioClient`)
- Programas (listado y detalle)
- Gobierno (`GobiernoPageClient`)
- Contacto (`ContactoPageClient`)
- Footer hidratado (`CmsLayoutHydrator`)
- Agenda (listado y detalle)
- Noticias (listado y detalle)

### No incluye (por ahora)

- Migraciones de routing estructural (SPA/transition API completa)
- Reescritura total de arquitectura de datos
- Service Worker offline-first

---

## Problema actual (resumen)

- Navegación MPA: al cambiar de página se reinicia estado JS.
- Muchos componentes vuelven a pedir datos aunque el usuario ya los vio.
- La cache actual de programas existe, pero no está extendida de forma homogénea.
- El usuario percibe “cargando” al volver a pantallas previamente visitadas.

---

## Principios de solución

1. **Cache-first visual**  
   Si hay cache válida, render inmediato.

2. **Stale-while-revalidate**  
   Render con cache + fetch en segundo plano para actualizar silenciosamente.

3. **Cache contextual**  
   Separar por `clientSlug`, ambiente (`development`/`production`) y versión de esquema.

4. **TTL explícito**  
   Definir expiración por tipo de dato para evitar stale indefinido.

5. **No romper UX existente**  
   Mantener estilos, estructura y rutas actuales.

---

## Arquitectura propuesta

## 1) Capa común de cache cliente

Crear utilitario único en `src/lib/cache/client-cache.ts` (o equivalente) con:

- `getCache<T>(key, context)`
- `setCache<T>(key, data, context, ttlMs)`
- `isCacheValid(meta, context)`
- `clearCache(key)` / `clearByPrefix(prefix)`

Payload estándar:

```ts
{
  version: number;
  ts: number;
  ttlMs: number;
  clientSlug: string;
  env: "development" | "production";
  data: T;
}
```

Storage:

- `sessionStorage` como default para navegación de sesión.
- opcional `localStorage` en datos de baja volatilidad (fase posterior).

## 2) Cache en fetch CMS browser

Extender `fetchCMSComponentsInBrowser` para doble capa:

- **memoria (Map)**: ultra rápida, por pestaña, dedupe de requests concurrentes;
- **persistente (sessionStorage)**: sobrevive a recargas/navegación.

Estrategia:

1. intentar memoria;
2. si no, intentar storage;
3. devolver cache rápido si válida;
4. revalidar en segundo plano;
5. actualizar memoria + storage.

## 3) Cache por dominio funcional

Además del cache global de `cms-components`, mantener caches derivadas para lecturas frecuentes:

- `programas:list`
- `agenda:list`
- `noticias:list`
- `gobierno:page`
- `contacto:page`

Esto evita repetir parse/normalización pesada.

---

## Plan por fases

## Fase 0 - Preparación técnica

### Tareas

- Crear módulo común de cache (`client-cache.ts`).
- Definir constantes:
  - `CACHE_VERSION`
  - TTL por recurso.
- Definir convenciones de keys:
  - `cms:components:v{version}:{clientSlug}:{env}`
  - `programas:list:v{version}:{clientSlug}:{env}`
  - etc.

### Entregable

- Infra base de cache reutilizable.

---

## Fase 1 - CMS base + dedupe global

### Tareas

- Integrar módulo común en `fetchCMSComponentsInBrowser`.
- Conservar timeout y manejo de errores actual.
- Eliminar headers innecesarios en GET (si no aplica payload).
- Mantener retorno consistente (`CMSComponent[]`).

### Criterios de aceptación

- Menos requests duplicadas a `/cms-components`.
- Navegar y volver entre páginas reduce “cargando en frío”.

---

## Fase 2 - Programas (hardening)

### Tareas

- Unificar completamente cache de programas en nuevo módulo común.
- Mantener `sortProgramList` + `getProgramSlug` centralizados.
- Detalle de programas:
  - resolver por cache primero;
  - fallback CMS;
  - no mostrar “No se especificó…” cuando hay `slug` válido en URL.

### Criterios de aceptación

- Al volver a `/programas` o `/programas/detalle?slug=...` la carga percibida mejora.
- No hay errores de resolución de slug.

---

## Fase 3 - Gobierno + Contacto + Footer

### Tareas

- `GobiernoPageClient`: usar cache de componentes filtrados por página.
- `ContactoPageClient`: idem.
- `CmsLayoutHydrator`: reusar cache CMS para redes/contacto del footer.
- Evitar múltiples fetch iguales en la misma visita.

### Criterios de aceptación

- Navegar Home -> Gobierno -> Contacto -> Home con menor latencia visual.
- Footer no dispara fetch redundante cuando ya hay cache válida.

---

## Fase 4 - Agenda y Noticias

### Tareas

- Estandarizar cache de datasets adaptados (`fetchNoticiasAdaptadas`, `fetchEventosAdaptados`).
- Mantener modo development con JSON local como fuente prioritaria.
- Aplicar stale-while-revalidate donde sea seguro.

### Criterios de aceptación

- Agenda/Noticias muestran contenido casi inmediato al volver.
- Revalidación no rompe filtros/paginación.

---

## Fase 5 - UX de carga y revalidación

### Tareas

- Cambiar loading blocking por estados más suaves:
  - skeleton breve o “actualizando…” no intrusivo.
- Mostrar contenido cacheado primero cuando exista.
- Evitar saltos de layout.

### Criterios de aceptación

- Menor percepción de espera.
- Menos “flicker” al volver a páginas visitadas.

---

## Fase 6 - Observabilidad y métricas

### Tareas

- Instrumentar logs de debug (solo dev) para:
  - cache hit/miss
  - revalidaciones
  - tiempo de fetch
- Medir baseline vs final:
  - # requests por navegación
  - tiempo a contenido visible
  - tamaño de bundles críticos

### Criterios de aceptación

- Evidencia cuantitativa de mejora.

---

## TTL sugerido por recurso

- `cms-components`: 3 minutos
- `programas:list`: 10 minutos
- `gobierno:page`: 10 minutos
- `contacto:page`: 10 minutos
- `noticias:list`: 5 minutos
- `agenda:list`: 5 minutos

Notas:

- En `development`, TTL puede ser menor (1-2 min) para facilitar edición.
- Si cambia `CACHE_VERSION`, invalidar automáticamente todo.

---

## Riesgos y mitigaciones

1. **Datos stale visibles por más tiempo**
   - Mitigación: TTL + revalidación background + invalidación por versión.

2. **Desalineación entre caches derivadas**
   - Mitigación: derivar siempre desde una fuente cacheada consistente (`cms-components`).

3. **Aumento de complejidad**
   - Mitigación: módulo único, interfaces tipadas, tests de utilitarios.

4. **Errores por contexto (`clientSlug`, env)**
   - Mitigación: contexto obligatorio en lectura/escritura de cache.

---

## Plan de pruebas

## Funcionales

- Navegar ida/vuelta entre páginas y confirmar menor tiempo percibido.
- Programas detalle: abrir desde home/listado y por URL directa con query slug.
- Validar que filtros/paginación no se rompan tras revalidación.

## Técnicas

- Verificar en DevTools:
  - reducción de requests repetidas
  - timings de red
  - contenido de `sessionStorage`.

## Regresión visual

- Home, Programas, Gobierno, Contacto, Agenda, Noticias.
- Revisar estados vacíos/error/cargando.

---

## Orden recomendado de implementación

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6

---

## Resultado esperado

- Navegación significativamente más fluida en páginas ya visitadas.
- Menor dependencia de fetch en frío.
- Menor sensación de “cargando contenido” al volver.
- Base técnica estable para futuras optimizaciones (bundle/code-splitting/transiciones).

