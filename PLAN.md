# Wedding Image Uploader — Implementation Plan

## Tier 1 — Crítico (seguridad, antes de producción)

- [x] **T1-1: Validar JWT de Google en el backend**
  - Instalar `google-auth-library` en el servidor
  - Verificar firma del token en `/user/login` con `OAuth2Client.verifyIdToken()`
  - Actualizar middleware `authenticateUser` para exigir `google-token` header y validarlo contra el email del usuario en DB
  - Frontend: enviar `google-token` header en todas las requests autenticadas

- [x] **T1-2: Mover credenciales de Cloudinary a env vars**
  - Sacar `cloud_name` y `api_key` hardcodeados de `useCloudinary.ts`
  - Usar `CLOUDINARY_CLOUD_NAME` y `CLOUDINARY_API_KEY` desde `process.env`
  - Actualizar `server/.env.example`

- [x] **T1-3: Validar tipo MIME real y tamaño de archivos en upload**
  - Agregar límite de 20MB a multer
  - Agregar `fileFilter` que rechace archivos que no sean imágenes por MIME type
  - Validar con `sharp` que el buffer sea una imagen real antes de procesar

- [x] **T1-4: Rate limiting en endpoint de upload**
  - Instalar `express-rate-limit`
  - Aplicar límite de 30 requests/minuto por IP en `/files/upload`

---

## Tier 2 — Alta prioridad (UX roto sin esto)

- [x] **T2-1: Paginación / infinite scroll en la galería**
  - Endpoint `GET /files/get-all` con params `page` + `limit` (ej. 20 fotos por página)
  - Frontend: Intersection Observer para cargar más al llegar al final
  - RSuite no tiene infinite scroll nativo; implementar con hook `useIntersectionObserver`

- [x] **T2-2: Toast notifications para upload y acciones**
  - Usar `toaster` + `useToaster` de RSuite
  - Notificar éxito/error en upload, delete, like
  - Reemplazar el `alert()` en el login por toast

- [x] **T2-3: Skeleton screens durante carga**
  - Usar `Placeholder.Graph` de RSuite mientras cargan fotos
  - Aplicar en `AllPhotos` y en `Challenges`

- [x] **T2-4: Event ID dinámico**
  - Sacar `684c7a1e6ceed1ce4c79c9af` hardcodeado a `VITE_EVENT_ID` en `.env`
  - Actualizar todos los componentes que lo referencian

---

## Tier 3 — Medio (mejoras importantes)

- [x] **T3-1: Real-time para likes y nuevas fotos** — SSE con keep-alive 25s (Cloudflare)
- [x] **T3-2: Descarga masiva de fotos** — ZIP streaming con archiver
- [x] **T3-3: Feedback de progreso real por archivo** — barra por fileKey via onProgress
- [x] **T3-4: Countdown del challenge cada segundo**

---

## Tier 4 — Nice to have

- [x] **T4-1: Links compartibles por foto** — `?photo=:id` + YARL Share plugin
- [x] **T4-2: Búsqueda y filtros en la galería** — dropdown fotógrafo + rango de fechas
- [x] **T4-3: Captions en fotos** — textarea al subir + YARL Captions plugin en lightbox
- [x] **T4-4: Respetar dark/light mode del sistema** — `prefers-color-scheme` + toggle manual
- [x] **T4-5: EXIF stripping** — sharp lo hace por defecto

---

## Tier 5 — UI polish

- [ ] **T5-1: Toolbar AllPhotos** — separar acciones (upload/refresh/download) de controles (sort/filter), fix bug CSS donde `.extraFilters` estaba anidado en `.actions` pero es sibling en el JSX
- [ ] **T5-2: FilterBar cohesiva** — reemplazar dos date inputs sueltos por `DateRangePicker` de RSuite; panel visual para todos los filtros; badge de filtros activos
- [ ] **T5-3: Challenge cards dark mode** — reemplazar `#ddd` / `#b8b8b8` hardcodeados por variables CSS de RSuite
- [ ] **T5-4: Header** — más presencia, subtítulo o decoración acorde a boda
- [ ] **T5-5: Upload page** — diseño centrado con mejor tipografía
- [ ] **T5-6: Limpiar boilerplate** — eliminar CSS de Vite de `App.css` e `index.css`
