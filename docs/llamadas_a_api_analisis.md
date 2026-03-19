Resumen rápido
Noticias en Inicio

Origen real de los datos: API Vecino Digital (PUBLIC_API_VECINO_URL → /citizen/news).
Flujo:
En build/SSR, index.astro llama a:
fetchNoticiasAdaptadas() en src/lib/api-vecino/fetch.ts (usa Vecino citizen/news y las adapta a lista_noticias).
Pasa ese array como noticiasApi a CmsInicioClient.
En el navegador, CmsInicioClient:
Hace fetchCMSComponentsInBrowser(PUBLIC_API_URL, ...) (CMS).
Llama a mergeInicioPageComponents(...), que inyecta noticiasApi dentro del componente CMS de tipo noticias_section / noticias.
La sección de noticias del Inicio se renderiza desde CMS, pero su lista_noticias viene poblada con esos datos de Vecino.
Eventos en Inicio (Agenda cultural)

Origen real de los datos: API Vecino Digital (PUBLIC_API_VECINO_URL → /citizen/events).
Flujo:
En build/SSR, index.astro llama a:
fetchEventosAdaptados() en src/lib/api-vecino/fetch.ts (usa Vecino citizen/events, adapta a lista_eventos, ordena por fecha).
Pasa ese array como eventosApi a CmsInicioClient.
En el navegador, CmsInicioClient:
Trae componentes CMS (fetchCMSComponentsInBrowser).
En mergeInicioPageComponents, para el componente agenda_cultural, copia eventosApi a data.lista_eventos y genera categorías, etc.
La grilla “Agenda” del Inicio usa esos eventos ya adaptados.
En resumen: Inicio no pega directo al CMS para noticias/eventos, sino que:

Vecino (API pública) → fetchNoticiasAdaptadas / fetchEventosAdaptados en build
Esos datos se inyectan en los componentes CMS de Inicio (noticias_section, agenda_cultural) vía mergeInicioPageComponents
Y el render final lo hace CmsInicioClient en el cliente.