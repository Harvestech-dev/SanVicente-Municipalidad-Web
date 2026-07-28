# API de contenido público — Noticias y Eventos

Documentación para el equipo que mantiene la web institucional del municipio
(`https://sanvicente.com.ar`) sobre cómo consumir las noticias y eventos desde la API nueva
de VecinoDigital.

---

## Índice

1. [Qué cambia y por qué](#1-qué-cambia-y-por-qué)
2. [El cambio en el sitio](#2-el-cambio-en-el-sitio)
3. [Endpoints](#3-endpoints)
4. [Formato de respuesta](#4-formato-de-respuesta)
5. [Diferencias con la API vieja](#5-diferencias-con-la-api-vieja)
6. [Autenticación y CORS](#6-autenticación-y-cors)
7. [Paginación y caché](#7-paginación-y-caché)
8. [Aviso importante sobre las imágenes](#8-aviso-importante-sobre-las-imágenes)
9. [Checklist y verificación](#9-checklist-y-verificación)

---

## 1. Qué cambia y por qué

El sitio consume hoy la API vieja (PHP):

```
https://api-sanvicente.vecino.digital/citizen/news
```

Ese backend fue reemplazado por uno nuevo (.NET) que corre en otro servidor, y **el subdominio
`api-sanvicente.vecino.digital` va a dejar de existir**. En la arquitectura nueva todo vive bajo
un solo dominio y la API pasa a colgar de `/api/`:

```
https://sanvicente.vecino.digital/api/...
```

Cuando se apague el subdominio viejo, la sección de noticias del sitio queda vacía sin ningún
error visible: el `fetch` falla y el `catch` actual lo ignora en silencio. **Hay que hacer el
cambio antes de esa fecha**; coordinarla con el equipo backend.

Se agregaron endpoints nuevos, pensados específicamente para consumo desde sitios de terceros,
bajo el prefijo `/api/public/`. Son de **solo lectura** y devuelven **solo contenido publicado**.

---

## 2. El cambio en el sitio

En la página de noticias, el `<main>` lleva hoy:

```html
<main class="main-content page-noticias"
      data-api-vecino-base="https://api-sanvicente.vecino.digital"
      data-vecino-dev-local="false">
```

y el script hace:

```js
const res = await fetch(`${apiBase}/citizen/news`);
```

Cambian **dos cosas**:

| | Antes | Ahora |
|---|---|---|
| Base | `https://api-sanvicente.vecino.digital` | `https://sanvicente.vecino.digital/api` |
| Path | `/citizen/news` | `/public/news` |

Es decir, la URL final pasa de
`https://api-sanvicente.vecino.digital/citizen/news` a
`https://sanvicente.vecino.digital/api/public/news`.

**El resto del código no necesita tocarse.** La función `adaptVecinoNewsToNoticia` usa
`id`, `name`, `extract`, `body`, `published_from`, `is_important`, `more_info`,
`categories[0].name` e `images[0].url`, y todos esos campos vienen con el mismo nombre y el
mismo tipo que antes. También sigue funcionando `toAbsoluteImageUrl`, aunque en la práctica las
URLs de imagen ya llegan absolutas.

---

## 3. Endpoints

Base de producción: `https://sanvicente.vecino.digital/api`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/public/news` | Noticias publicadas |
| `GET` | `/public/news/{id}` | Detalle de una noticia publicada |
| `GET` | `/public/events` | Eventos vigentes |
| `GET` | `/public/events/{id}` | Detalle de un evento vigente |

Solo `GET`. Cualquier otro método se rechaza.

### Query params (opcionales, en los dos listados)

| Parámetro  | Tipo | Descripción |
|------------|------|-------------|
| `page`     | int  | Número de página, empieza en 1 |
| `per_page` | int  | Items por página. Máximo **50**; valores mayores se recortan |

**Sin parámetros se devuelve el listado completo**, igual que la API vieja. Ver
[Paginación y caché](#7-paginación-y-caché) para por qué conviene usarlos igual.

### Qué se ve y qué no

- **Noticias**: solo las que están dentro de su ventana de publicación
  (`published_from` ya pasó y `published_to` todavía no). Las programadas a futuro y las vencidas
  no aparecen, ni en el listado ni por id (`/public/news/{id}` de una noticia no publicada
  devuelve **404**, no el contenido).
- **Eventos**: además de la ventana de publicación, dejan de mostrarse un día después de
  terminados. Es el mismo criterio que usa la app del vecino.

---

## 4. Formato de respuesta

`GET /api/public/news` → `200 OK`, array de objetos:

```json
[
  {
    "id": 76,
    "name": "PREVENCIÓN CLIMÁTICA: SAN VICENTE PARTICIPÓ DE LA REUNIÓN PROVINCIAL",
    "extract": "Ante los informes que anticipan un escenario de lluvias intensas...",
    "body": "Ante los informes que anticipan un escenario de lluvias intensas...\r\n\r\nEn representación de San Vicente participaron...",
    "more_info": null,
    "landmark_id": null,
    "landmark_name": null,
    "event_id": null,
    "event_name": null,
    "published_from": "2026-07-20T00:00:00Z",
    "published_to": null,
    "is_important": false,
    "created_at": "2026-07-20T12:04:21Z",
    "updated_at": "2026-07-20T12:04:21Z",
    "images": [
      {
        "id": 376,
        "name": "749286647_1533745932125518.jpg",
        "url": "https://sanvicente.vecino.digital/uploads/news/abc123.jpg",
        "order": 1
      }
    ],
    "categories": [
      { "id": 50, "name": "Protección Civil" }
    ]
  }
]
```

`GET /api/public/news/{id}` → el mismo objeto, sin el array.

`GET /api/public/events` → array con esta forma:

```json
[
  {
    "id": 12,
    "name": "Fiesta Patronal",
    "body": "Descripción del evento...",
    "landmark_id": 3,
    "landmark_name": "Plaza Central",
    "inscription_event_id": null,
    "inscription_event_name": null,
    "published_from": "2026-07-01T00:00:00Z",
    "published_to": null,
    "active_from": "2026-08-10T18:00:00Z",
    "active_to": "2026-08-10T23:00:00Z",
    "is_important": true,
    "created_at": "2026-06-20T10:00:00Z",
    "updated_at": null,
    "images": [],
    "categories": []
  }
]
```

En eventos, `active_from` / `active_to` son las fechas de **realización** del evento (lo que se
muestra al visitante), mientras que `published_from` / `published_to` son las de **publicación**
(cuándo se muestra). Para una agenda, ordenar por `active_from`.

### Códigos de respuesta

| Código | Significado |
|--------|-------------|
| `200`  | OK |
| `404`  | No existe, o existe pero no está publicado / ya no está vigente |
| `405`  | Se usó un método distinto de GET |
| `429`  | Demasiadas requests desde la misma IP (ver [rate limit](#rate-limit)) |

---

## 5. Diferencias con la API vieja

El contrato es **compatible con el adaptador actual del sitio**, pero la respuesta es más chica.

**Campos que ya no vienen** en cada noticia:

`deleted_at`, `landmark`, `event`, `links`, `sounds`, `videos`

De esos, el único que el código actual toca es `deleted_at`:

```js
items = Array.isArray(data) ? data.filter((n) => !n.deleted_at) : [];
```

Ese filtro **sigue funcionando** (el campo llega `undefined` y `!undefined` es `true`, así que no
descarta nada) — la API nueva ya excluye las noticias borradas por su cuenta. Conviene sacarlo
igual, para que quede claro que el borrado lo resuelve el servidor.

**Campos que vienen más simples**:

- `images[]`: antes traía `path`, `type`, `mediable_type`, `mediable_id`, `created_at`,
  `updated_at`. Ahora solo `id`, `name`, `url`, `order`. `url` es lo único que usa el sitio.
- `categories[]`: antes traía `category_id`, `external_id`, `created_at`, `updated_at` y un objeto
  `pivot`. Ahora solo `id` y `name`.

Si en algún momento se necesita alguno de los campos eliminados, pedirlo al equipo backend en vez
de asumir que no existe: en varios casos el dato está y solo falta exponerlo.

---

## 6. Autenticación y CORS

### No hay API key — y no debería haberla

Estos endpoints **no requieren token ni API key**. Es deliberado: el sitio hace el `fetch` desde
el navegador, así que cualquier clave que se le pasara quedaría visible en el HTML público de la
página. No sería un secreto, solo una molestia para mantener.

El contenido es información que el municipio ya publica; no hay nada confidencial que proteger.
Lo que sí se controla es el abuso, con rate limit y caché del lado del servidor.

**No pongas credenciales, tokens ni claves en el código del sitio para consumir esta API.**

### CORS

El navegador solo permite leer la respuesta si el origen del sitio está en una allowlist del
servidor. Ya están habilitados:

```
https://sanvicente.com.ar
https://www.sanvicente.com.ar
```

Si el sitio se sirve desde **otro dominio** (un preview de Vercel/Netlify, un staging, un dominio
nuevo), hay que **pedirle al equipo backend que lo agregue**; si no, el fetch falla con un error
de CORS en la consola. Con y sin `www` son orígenes distintos: ambos tienen que estar listados.

Los pedidos se hacen con `fetch(url)` a secas. **No agregues headers custom ni
`credentials: 'include'`**: eso convierte el pedido en uno "no simple", dispara un preflight y
además los orígenes de terceros están habilitados explícitamente sin credenciales.

### Rate limit

Hay un límite por IP en el servidor (20 req/s con ráfagas de hasta 40). Un visitante normal ni se
acerca. Si se supera, la respuesta es `429`. Conviene que el sitio trate el `429` como "no hay
datos nuevos" y siga mostrando lo que tenga cacheado, en vez de vaciar la grilla.

---

## 7. Paginación y caché

El listado completo de noticias pesa hoy **~170 KB** (~83 KB comprimido) porque incluye el `body`
completo de todas las noticias. Recomendaciones, en orden de impacto:

1. **Pedir la primera página** en el listado: `?page=1&per_page=12`. La grilla del sitio pagina de
   a 6, así que traer 12 alcanza para la primera pantalla.
2. **Usar el detalle por id** (`/public/news/{id}`) en la vista de nota, en vez de arrastrar el
   `body` de todas. Requiere tener el `id` en la URL de detalle; hoy el sitio usa un slug derivado
   del título más el id, así que el id ya está disponible.
3. **Mantener el caché en `sessionStorage`** que ya existe (5 minutos). Se complementa bien con el
   caché del servidor, que guarda cada respuesta 60 segundos.

Como el servidor cachea 60 segundos, una noticia recién publicada puede tardar hasta un minuto en
aparecer. Es esperado; no es un bug.

---

## 8. Aviso importante sobre las imágenes

Las noticias que venían del sistema anterior tienen la imagen apuntando al **servidor viejo**:

```json
"url": "https://api-sanvicente.vecino.digital/storage/images/abc123.jpg"
```

La API devuelve esa URL tal cual. **Cuando se apague `api-sanvicente.vecino.digital`, esas
imágenes van a dejar de cargar** — en la web institucional y también en la app del vecino. Las
noticias nuevas, cargadas desde el panel actual, apuntan al dominio nuevo y no tienen ese problema.

La migración de esas imágenes es tarea del equipo backend y es independiente de este cambio. Si
después del switch aparecen imágenes rotas en noticias viejas, **no es un problema del sitio**:
avisar al equipo backend.

Mientras tanto conviene que la tarjeta de noticia tenga un placeholder cuando la imagen no carga
(`onerror`), en vez de dejar el hueco.

---

## 9. Checklist y verificación

### Cambios a aplicar

- [ ] `data-api-vecino-base` → `https://sanvicente.vecino.digital/api`
- [ ] `fetch(\`${apiBase}/citizen/news\`)` → `fetch(\`${apiBase}/public/news\`)`
- [ ] Agregar `?page=1&per_page=12` al listado (opcional pero recomendado)
- [ ] Sacar el `.filter((n) => !n.deleted_at)` (opcional, ya no aplica)
- [ ] Placeholder de imagen rota en la tarjeta de noticia (recomendado)
- [ ] Avisar al equipo backend si el sitio se va a servir desde algún dominio adicional

### Probar antes de publicar

Desde la terminal, simulando el origen del sitio:

```bash
curl -i -H "Origin: https://sanvicente.com.ar" \
  "https://sanvicente.vecino.digital/api/public/news?page=1&per_page=3"
```

Tiene que responder `200` e incluir el header:

```
Access-Control-Allow-Origin: https://sanvicente.com.ar
```

Si ese header **no** aparece, el origen no está habilitado: avisar al equipo backend antes de
seguir. En el navegador, el síntoma es un error de CORS en la consola y la grilla vacía.

En el sitio ya desplegado en un preview: abrir `/noticias`, verificar que se rendericen las
tarjetas, que la consola no muestre errores y que las imágenes carguen.

---

## Contacto

Para habilitar orígenes nuevos, reportar campos faltantes o coordinar la fecha del apagado del
servidor viejo: equipo backend de VecinoDigital.