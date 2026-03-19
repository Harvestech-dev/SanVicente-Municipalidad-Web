1. Dónde se está llamando hoy a la API Vecino en build
Buscando fetchNoticiasAdaptadas / fetchEventosAdaptados / fetchVecinoNews / fetchVecinoEvents:

Inicio (/) – src/pages/index.astro

Hace en build:
const [noticiasApi, eventosApi] = await Promise.all([ fetchNoticiasAdaptadas(), fetchEventosAdaptados() ])
Pasa esos arrays como props a CmsInicioClient:
<CmsInicioClient client:load noticiasApi={noticiasApi} eventosApi={eventosApi} ... />
CmsInicioClient + mergeInicioPageComponents inyectan esos datos en los componentes CMS (noticias_section, agenda_cultural).
Agenda (/agenda) – src/pages/agenda.astro

En build:
const eventos = await fetchEventosAdaptados();
Renderiza el HTML inicial (hero, filtros, cards) con esos eventos, y el script sólo hace filtros/busqueda en cliente.
Noticias detalle estático (/Noticias/[slug]) – src/pages/Noticias/[slug].astro

getStaticPaths():
Pide noticias a Vecino via fetchNoticiasAdaptadas() y, si viene vacío, cae al JSON local.
El contenido de la página se hidrata con esa noticia recibida por props.
Otros usos:

src/lib/api-vecino/fetch.ts se usa sólo desde estos puntos (inicio, agenda, noticias estáticas).
2. Principio que querés: todas las llamadas a Vecino en el cliente
Objetivo: que ningún fetchVecino* / fetchNoticiasAdaptadas / fetchEventosAdaptados se llame en frontmatter Astro (build/SSR), sino que:

Las páginas entreguen shells/HTML mínimo.
Las secciones que dependen de Vecino hagan fetch en el navegador (como /noticias.astro ya hace).
Eso implica:

Inicio (/):

Quitar las llamadas a fetchNoticiasAdaptadas y fetchEventosAdaptados en index.astro.
CmsInicioClient deberá:
Recibir sólo clientSlug, isDevelopment.
Además de fetchCMSComponentsInBrowser(PUBLIC_API_URL), hacer fetch en cliente a Vecino:
GET ${PUBLIC_API_VECINO_URL}/citizen/news
GET ${PUBLIC_API_VECINO_URL}/citizen/events
Adaptar en el cliente con las mismas funciones que ahora (adaptVecinoNewsToNoticia, adaptVecinoEventToEvento), y pasar esos arrays al merge o directamente a los bloques (probablemente mejor inyectarlos a mano sin pasar otra vez por mergeInicioPageComponents, para mantener simple).
Nota: esto reintroduce CORS para Vecino en la home; si la API no habilita tu origen, vas a necesitar un proxy igual que en noticias.
Agenda (/agenda):

Convertir agenda.astro en una shell:
Dejar el markup básico (hero, secciones vacías, contenedores).
Reemplazar el uso de eventos en frontmatter por un componente React AgendaPageClient (client:load) que:
Lea PUBLIC_API_VECINO_URL vía import.meta.env.
Haga fetch desde el navegador a /citizen/events.
Aplique el mismo adaptador que hoy (adaptVecinoEventToEvento), ordenación y filtros/búsqueda, pero ya en TSX.
El script inline actual de filtros se puede migrar casi 1:1 a React.
Noticias detalle estático (/Noticias/[slug]): Dos alternativas:

A. Mantener rutas estáticas pero detalle en cliente (similar a licitaciones):
getStaticPaths deja de llamar a Vecino; genera paths vacíos o basados en otro origen (por ejemplo, sólo slug string).
La página Noticias/[slug].astro monta un NoticiaDetailClient (client:load) que:
Lee slug de Astro.params.slug o de la URL.
Llama en el navegador a GET ${PUBLIC_API_VECINO_URL}/citizen/news y busca la noticia por _slug (o idealmente a un endpoint de detalle si existe).
Renderiza el contenido (como hoy), manejando estados loading / notFound.
B. Páginas 100 % cliente para detalle:
El listado /noticias ya construye links a /Noticias/${slug}; podrías cambiar a /noticias/detalle?slug=... y crear una página noticias/detalle.astro que haga el fetch sólo en cliente (como hicimos con licitaciones).
Plan razonable: seguir el patrón de licitaciones: rutas “detalles” tipo noticias/detalle?slug= con un NoticiaDetailClient que fetchée Vecino.
Eliminar fetchVecino* de cualquier frontmatter Astro

index.astro, agenda.astro, Noticias/[slug].astro dejarían de importar fetchNoticiasAdaptadas / fetchEventosAdaptados.
Esas funciones seguirían existiendo, pero sólo para uso interno en cliente (reutilizando adaptadores), o se moverían a helpers puros (sin fetch) y helpers de fetch específicos para cliente.
3. Plan de implementación paso a paso
Inicio (index.astro + CmsInicioClient)


Modificar
index.astro
:
Quitar import de fetchNoticiasAdaptadas / fetchEventosAdaptados.
Quitar cálculo de noticiasApi / eventosApi y props asociadas.

En
CmsInicioClient.tsx
:
Añadir hooks useState/useEffect para noticiasVecino y eventosVecino.
Implementar fetch a ${PUBLIC_API_VECINO_URL}/citizen/news / /citizen/events en cliente, usando los adaptadores actuales desde lib/api-vecino/adapters.
Ajustar la parte de noticias_section y agenda_cultural para que usen esos estados en lugar de depender de mergeInicioPageComponents basado en datos de build (o pasar esos arrays al merge dentro del cliente).
Agenda (agenda.astro → AgendaPageClient)


Crear
src/components/AgendaPageClient.tsx
que:
Implemente la misma UI que agenda.astro pero en React.
Haga fetch en cliente a /citizen/events y use adaptVecinoEventToEvento.

Cambiar
agenda.astro
a:
Sólo: <Layout> <AgendaPageClient client:load /> </Layout>.
Mover el <style> actual a agenda-page-client.css importado por el TSX o marcar is:global si preferís mantenerlo allí.

Borrar el
fetchEventosAdaptados
del frontmatter.
Noticias detalle


Elegir patrón:
Recomendado: noticias/detalle.astro + NoticiaDetailClient similar a LicitacionDetailClient.

Implementar
NoticiaDetailClient.tsx
:
Props: slug.
Fetch cliente a /citizen/news, buscar la noticia por _slug.
Mostrar loading / notFound, etc.

Actualizar
/noticias
para linkear a
noticias/detalle?slug=...
.

Dejar de usar
getStaticPaths
con Vecino en
Noticias/[slug].astro
o directamente reemplazar esa ruta por la nueva variante
detalles
sólo cliente.
Limpieza de API Vecino en build


Quitar cualquier uso restante de
fetchNoticiasAdaptadas
/
fetchEventosAdaptados
en
.astro
.

Mantener los adaptadores (
adaptVecinoNewsToNoticia
,
adaptVecinoEventToEvento
) como funciones puras reutilizables tanto en cliente como en servidor.
CORS & DX


Asegurarse de NO añadir headers extra (
Content-Type
) en los
fetch
cliente a Vecino (como ya ajustamos en
/noticias
).


