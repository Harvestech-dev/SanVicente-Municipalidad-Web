# Manual: JSON para Componentes Web CMS y Formulario Dinámico

Guía para **otro Cursor** (o desarrollador) sobre cómo configurar y estructurar los JSON para que sean **compatibles y editables** desde la sección **Componentes web** del CMS y con el **formulario dinámico** (`DynamicFormContent`). Incluye especificaciones de configuración, campos ocultos, active, visible, etc.

---

## 1. Dónde vive el JSON

- **Entidad**: componente CMS (colección `cmscomponents` o equivalente).
- **Contenido editable en el formulario dinámico**: el objeto **`data`** del componente.
- **Ruta en el CMS**: Componentes web → listado → “Editar datos” de un componente → se abre el formulario dinámico que edita `data`.

Al guardar, se hace PUT con `{ data: { ... } }`. Todo lo que esté en `data` se persiste; el formulario solo **muestra** ciertas claves según las reglas siguientes.

---

## 2. Estructura general del componente (entidad)

A nivel **documento del componente** (no dentro de `data`):

```json
{
  "_id": "...",
  "name": "Nombre visible en el CMS",
  "key": "clave_unica_snake",
  "page": "Inicio",
  "type": "banner_hero_component",
  "componentPath": "components/banner-hero",
  "data": { ... },
  "thumbnail": { "url": "...", "alt": "..." },
  "description": "...",
  "isVisible": true,
  "isActive": true,
  "isDeleted": false,
  "status": "draft",
  "order": 1,
  "client": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 2.1 Campos de visibilidad y estado (fuera de `data`)

| Campo       | Tipo    | Descripción |
|------------|---------|-------------|
| **isVisible** | boolean | Si el componente se muestra en el front público. `false` = oculto en sitio, sigue visible en el CMS. |
| **isActive**  | boolean | Si el componente está “activo” (habitualmente usado para filtros en listados del CMS). |
| **isDeleted** | boolean | Marca de borrado lógico; los listados suelen excluir `isDeleted: true`. |
| **status**    | string  | `"draft"` \| `"published"` \| `"hidden"` \| `"out_of_stock"` (según tipo de entidad). |

Estos **no** se editan desde el formulario dinámico de “Editar datos”; se gestionan en la pantalla de listado/edición del componente (activar/desactivar, publicar, etc.).

---

## 3. Estructura de `data`: qué es editable en el formulario dinámico

El formulario dinámico **construye los campos a partir de las claves de `data`**. Las reglas son:

- **Inclusión**: toda clave que **no** sea excluida (ver § 4) se convierte en un campo editable.
- **Tipo de campo**: se infiere por **prefijo** de la clave o por estructura del valor (ver § 5).
- **Obligatoriedad**: cualquier clave que **no** termine en `_optional` se considera requerida en el formulario (salvo lógica específica del tipo).

---

## 4. Campos excluidos del formulario (ocultos al editar)

El formulario **excluye** y por tanto **no muestra** como campo editable (pero **sí los conserva** al guardar si ya están en `data`):

- Claves que empiezan por **`_`** (guion bajo).
- Claves que empiezan por **`id`**.
- Claves que terminan en **`_id`**.
- Claves exactas **`style`** y **`className`**.

### 4.1 Uso recomendado del prefijo `_`

Usar **`_`** para:

- **Configuración de comportamiento**: `_configuracion`
- **Orden en la página**: `_orden`
- **Estilos/theme**: `_estilo`
- Cualquier otro dato que quieras **persistir** pero **no** exponer en el formulario dinámico.

Ejemplo de `data` con campos editables y “ocultos” al formulario:

```json
{
  "txt_titulo": "Bienvenido",
  "txt_descripcion": "Texto editable en el form",
  "_orden": 1,
  "_configuracion": {
    "variant": "primary",
    "alignment": "center"
  },
  "_estilo": {
    "background": "gradient",
    "shadow": "medium"
  }
}
```

En “Editar datos” solo se verán y editarán `txt_titulo` y `txt_descripcion`. `_orden`, `_configuracion` y `_estilo` se mantienen en el JSON y se envían al guardar; si quieres editarlos, hay que hacerlo por otra pantalla o no usar `_`.

---

## 5. Prefijos de tipo y formas de valores (compatible con el formulario dinámico)

El tipo de control (texto, imagen, botón, lista, etc.) se deduce por **prefijo** de la clave o por la **estructura** del valor. Usar estos nombres garantiza compatibilidad con el formulario dinámico.

### 5.1 Texto largo (textarea)

- **Prefijo**: `txt_`
- **Valor**: `string`
- **Ejemplos**: `txt_titulo`, `txt_descripcion`, `txt_subtitulo`, `txt_optional` (opcional si la clave termina en `_optional`).

### 5.2 Imagen (selector de media)

- **Prefijo**: `img_`
- **Valor**: `string` (URL de la imagen) o `null`
- **Ejemplos**: `img_fondo`, `img_principal`, `img_perfil`.

### 5.3 Icono (selector de icono)

- **Prefijo**: `icon_`
- **Valor**: `string` (nombre de icono, ej. `FaHome`, `FaWhatsapp`)
- **Ejemplos**: `icon_servicio`, `icon_contacto`, `_icon_servicio` (con `_` no se muestra en el form pero se guarda).

### 5.4 Botón / CTA

- **Prefijo**: `btn_`
- **Valor**: objeto con al menos uno de: `txt_label` o `label`, `link_url` o `url`; opcionalmente `icon`, `link_tipo`.
- **Forma típica**:
  ```json
  {
    "txt_label": "Ver más",
    "link_url": "/propiedades",
    "link_tipo": "internal",
    "icon_btn": "FaArrowRight"
  }
  ```
- El formulario muestra “Texto del botón” y “URL”; si hay selector de icono, también “Icono”.

### 5.5 Enlace

- **Prefijo**: `link_`
- **Valor**: `{ "label": "...", "url": "..." }`
- **Ejemplo**: `link_destino` (como string también se usa en algunos componentes; para objeto con label+url usar `link_`).

### 5.6 Booleano (checkbox)

- **Prefijo**: `boolean_`
- **Valor**: `true` | `false`
- **Ejemplos**: `boolean_visible`, `boolean_destacado`.

### 5.7 Lista de contactos (tipo especial)

- **Clave exacta**: `lista_contacto`, **o** array cuyo primer elemento tiene `icon_contacto`.
- **Valor**: array de objetos con:
  - `icon_contacto`: string (ej. `FaWhatsapp`, `FaEnvelope`)
  - `txt_label`: string
  - `link_destino`: string (URL, tel:, mailto:)
  - `txt_valor`: string (opcional, texto a mostrar)
- **Ejemplo**:
  ```json
  "lista_contacto": [
    {
      "icon_contacto": "FaWhatsapp",
      "txt_label": "WhatsApp",
      "link_destino": "https://wa.me/5491123456789",
      "txt_valor": "+54 11 1234-5678"
    }
  ]
  ```

### 5.8 Listas genéricas (ítems repetibles)

- **Prefijo**: `lista_` o `item_`
- **Valor**: array de objetos. Los campos de cada ítem deben usar los mismos prefijos (`txt_`, `img_`, `icon_`, `btn_`, `link_`, `boolean_`) para que el form los reconozca; las claves que empiecen por `_` no se muestran en el ítem.
- **Ejemplo** (lista de servicios):
  ```json
  "lista_servicios": [
    {
      "txt_nombre": "Servicio A",
      "txt_descripcion": "Descripción A",
      "_icon_servicio": "FaHome",
      "boolean_destacado": true,
      "btn_servicio": {
        "txt_label": "Consultar",
        "link_url": "https://wa.me/..."
      }
    }
  ]
  ```

### 5.9 Galería (varias imágenes / carrusel)

- **Prefijo**: `gallery_`
- **Valor**: array de ítems; cada ítem puede ser:
  - **Formato A (recomendado):** objeto `{ "url": string, "alt"?: string, "order"?: number }`. Permite alt por imagen y orden explícito para el carrusel.
  - **Formato B (mínimo):** string (URL de la imagen). El orden es el índice del array.
- **Uso típico**: carrusel de imágenes en un componente (hero, banner, cards). Preferible a una lista de objetos con `img_` por ítem porque el formulario dinámico puede ofrecer un único control “galería” (añadir/quitar/reordenar imágenes) en lugar de N bloques de lista.
- **Ejemplo**:
  ```json
  "gallery_slider": [
    { "url": "/media/1.jpg", "alt": "Slide 1", "order": 1 },
    { "url": "/media/2.jpg", "alt": "Slide 2", "order": 2 }
  ]
  ```
  o solo URLs:
  ```json
  "gallery_slider": [ "/media/1.jpg", "/media/2.jpg" ]
  ```
- **Estado en el formulario dinámico**: implementado. Los campos `gallery_*` se renderizan con **GalleryManager** (añadir/quitar/reordenar imágenes). El valor se guarda como array de `{ url, alt? }`.

### 5.10 Objeto sin prefijo tipo “botón”

Si una clave **no** tiene prefijo pero su valor es un objeto con `txt_label` o `label` y `link_url` o `url`, el formulario lo trata como **btn**.

---

## 6. Campos opcionales (no obligatorios en el form)

- Cualquier clave que termine en **`_optional`** no se marca como requerida.
- Ejemplo: `txt_subtitulo_optional` → campo de texto no obligatorio.

---

## 7. Configuración interna: `_configuracion` y `_estilo`

### 7.1 `_configuracion`

- **No** se muestra en el formulario dinámico (por el prefijo `_`).
- Se usa para variantes, layout, flags de UI (mostrar CTA, bullets, etc.).
- En el **backend** se valida y sanitiza por `type` del componente (`component-validators.ts`, `component-defaults.ts`). Si añades un tipo nuevo, hay que registrar allí los `allowed` y `validators` para ese tipo.
- **Estructura típica** (depende del tipo):
  ```json
  "_configuracion": {
    "variant": "primary",
    "alignment": "center",
    "showCTA": true,
    "showBulletPoints": true
  }
  ```

### 7.2 `_estilo`

- Objeto libre para estilos/theme (clases, nombres de tema, etc.). Tampoco se edita en el form por el `_`.
- **Ejemplo**: `"_estilo": { "background": "gradient", "border": "primary" }`.

### 7.3 `_orden`

- Número que define el orden del componente en la página. Los listados del CMS suelen ordenar por `data._orden` (y luego `createdAt`).

---

## 8. Cómo hacer un JSON compatible y editable: checklist

1. **Contenido editable**: usar claves con prefijos `txt_`, `img_`, `icon_`, `btn_`, `link_`, `boolean_`, `lista_*`, `item_*`, `gallery_*` y estructuras de valor como en § 5.
2. **No editable pero guardado**: usar claves que empiecen por `_` (`_configuracion`, `_estilo`, `_orden`).
3. **Opcional**: terminar la clave en `_optional` si no debe ser obligatoria.
4. **Listas**: cada ítem con las mismas propiedades y prefijos conocidos; evitar claves que empiecen por `_` si quieres que se editen en el form (o usar `_` para ocultarlas en el ítem).
5. **Contactos**: usar `lista_contacto` y la estructura con `icon_contacto`, `txt_label`, `link_destino`, `txt_valor`.
6. **Galería (carrusel)**: usar `gallery_*` con array de `{ url, alt?, order? }` o de URLs; ver § 5.9. Hoy el form no tiene control galería (ver § 8.1).

---

## 8.1 Galería en el formulario dinámico: análisis

- **¿Se gestiona correctamente?** No. El formulario dinámico **reconoce** el tipo (prefijo `gallery_` → tipo `gallery`, inicialización como array vacío si no hay valor), pero en `renderField` **no hay `case 'gallery'`**. El tipo `gallery` cae en el `default` y se renderiza como **input de texto**, por lo que el usuario no puede editar una galería de imágenes desde el form.
- **Forma actual**: el valor se guarda y se carga; si alguien edita el JSON a mano o desde otra pantalla, el dato es correcto. Solo falta la **UI de edición** dentro del dynamic form (selector múltiple de imágenes, reordenar, quitar).
- **Posibles implementaciones (sin código)**:
  1. **Reutilizar `ImagePicker` + estado de “campo activo” por índice**: igual que `img_` (un solo campo activo + `setActiveField` + abrir ImagePicker), pero el valor del campo es un array. Al elegir imagen: si se está “añadiendo”, hacer push; si se está “reemplazando” un índice, actualizar ese índice. UI: lista de miniaturas (o placeholders) con botón “Cambiar” por ítem y “Añadir imagen” al final. Requiere extender el estado (p. ej. `activeField` + `activeGalleryIndex`) y un `case 'gallery'` en `renderField`.
  2. **Reutilizar `GalleryManager`**: si `GalleryManager` acepta `images` (array) y `onChange(images)`, añadir `case 'gallery'` que renderice `<GalleryManager images={value} onChange={fieldProps.onChange} />`. Normalizar a la estructura que espera GalleryManager (p. ej. `{ id, url, name, alt }`) al cargar y al guardar volver a `{ url, alt? }` o solo URL según la especificación del componente.
  3. **Lista de imágenes mínima**: sin depender de GalleryManager, un bloque que haga `map` del array mostrando miniatura + “Quitar” y un botón “Añadir imagen” que abre el mismo `ImagePicker` ya usado para `img_`, y al seleccionar hace push al array. La estructura en `data` puede ser array de strings (URL) para simplificar; si se quiere alt, array de objetos.

Recomendación: definir en el manual la estructura de galería (ya en § 5.9) y, a la hora de implementar, optar por (2) si GalleryManager encaja con la estructura `gallery_*`, o por (1)/(3) para no acoplar al formato interno de GalleryManager.

---

## 9. Resumen: visibilidad y estado

| Dónde        | Campo       | Efecto |
|-------------|-------------|--------|
| **Entidad** | `isVisible` | Mostrar u ocultar en el sitio; no afecta al CMS. |
| **Entidad** | `isActive`  | Habitualmente para filtrar en listados del CMS. |
| **Entidad** | `isDeleted` | Borrado lógico; excluir de listados. |
| **Entidad** | `status`    | draft / published (u otros según entidad). |
| **data**    | Claves con `_` | Guardadas pero no mostradas en el formulario dinámico. |
| **data**    | Resto de claves con prefijos de § 5 | Mostradas y editables en el formulario dinámico. |

---

## 10. Validador de JSON (mismos parámetros que el backend)

Para validar en el **front** el mismo payload que acepta el creador de componentes globales (API), usar el validador unificado:

**Módulo:** `@/lib/cms-components/component-payload-validator`

### 10.1 Crear componente (POST)

- **Campos requeridos:** `name`, `key`, `page`, `componentPath`, `data` (mismo listado que el backend).
- **Key:** solo `a-z`, `0-9` y `_` (regex: `^[a-z0-9_]+$`).
- **data._configuracion:** se valida según el `type` del componente (allowed + validators); si falta, se aplican defaults.

```ts
import {
  validateComponentCreatePayload,
  REQUIRED_FIELDS_CREATE,
  KEY_REGEX
} from '@/lib/cms-components/component-payload-validator';

const result = validateComponentCreatePayload(body, {
  validateKeyFormat: true,  // default true
  sanitize: true            // devuelve payload con data._configuracion saneada
});

if (!result.isValid) {
  console.error(result.errors); // ['Campo requerido faltante: name', ...]
  return;
}

// Enviar result.sanitizedPayload ?? body
await fetch('/api/cms-components', {
  method: 'POST',
  body: JSON.stringify(result.sanitizedPayload ?? body)
});
```

### 10.2 Actualizar componente (PUT) o solo data

- **Actualización completa:** validar con `validateComponentUpdatePayload(body, componentType, { sanitize: true })`.
- **Solo edición de data (formulario dinámico):** usar `validateComponentData(data, componentType, { sanitize: true })` o `prepareComponentDataForApi(data, componentType)` para obtener el `data` listo para enviar.

```ts
import {
  validateComponentUpdatePayload,
  validateComponentData,
  prepareComponentDataForApi
} from '@/lib/cms-components/component-payload-validator';

// Opción A: validar payload completo de PUT
const result = validateComponentUpdatePayload(body, existingComponent.type, { sanitize: true });

// Opción B: solo validar/sanitizar el objeto data (ej. antes de guardar desde el form de datos)
const dataResult = validateComponentData(formData, component.type, { sanitize: true });
if (!dataResult.isValid) {
  setErrors(dataResult.errors);
  return;
}
const dataToSend = dataResult.sanitizedData ?? formData;

// Opción C: preparar data con defaults y _configuracion sanitizada (sin validar errores)
const dataToSend = prepareComponentDataForApi(formData, component.type);
```

### 10.3 Constantes y re-exportaciones

- **REQUIRED_FIELDS_CREATE**: `['name', 'key', 'page', 'componentPath', 'data']`
- **KEY_REGEX**: `/^[a-z0-9_]+$/`
- **validateKey(key)**: `{ valid, error? }`
- **getDefaultConfiguration(type)**, **ensureConfiguration(data, type)**, **validateComponentConfiguration(config, type)**, **sanitizeConfiguration(config, type)** están re-exportados para usar las mismas reglas que el backend.

Así, al pasar el JSON desde el front se pueden usar los mismos parámetros y mensajes de error que en el creador de componentes globales.

---

## 11. Referencias en el código

- **Formulario dinámico**: `src/components/common/DynamicFormContent.tsx`  
  - Exclusión de campos: `shouldExcludeField` (claves `_`, `id`, `_id`, `style`, `className`).  
  - Tipo de campo: `getFieldType` (prefijos y estructura).  
  - Agrupación: `groupFields` (Contenido general, Botones y enlaces, Listas y elementos).
- **Validador de payload**: `src/lib/cms-components/component-payload-validator.ts` (crear/actualizar/data; mismos requisitos que la API).
- **Tipos**: `src/types/form.ts` (`FieldType`, `FormField`), `src/types/components.ts` (`ComponentData`, `isVisible`, `isActive`, etc.).
- **Configuración por tipo**: `src/lib/cms-components/component-defaults.ts`, `src/lib/cms-components/component-validators.ts`.
- **Estructura esperada por tipo**: `docs/config_client/CMS_COMPONENTS_STRUCTURE.md`.
- **Clave, página, tipo, ruta**: `docs/CMS_COMPONENT_FIELDS_EXPLAINED.md`.

Con esta convención de nombres y estructura, los JSON serán compatibles con el CMS en la sección Componentes web y editables desde el formulario dinámico, con control explícito de qué queda oculto (`_`) y qué flags de componente (visible, active, etc.) se gestionan a nivel entidad.
