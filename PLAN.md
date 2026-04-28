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

- [ ] **T2-1: Paginación / infinite scroll en la galería**
  - Endpoint `GET /files/get-all` con params `page` + `limit` (ej. 20 fotos por página)
  - Frontend: Intersection Observer para cargar más al llegar al final
  - RSuite no tiene infinite scroll nativo; implementar con hook `useIntersectionObserver`

- [ ] **T2-2: Toast notifications para upload y acciones**
  - Usar `toaster` + `useToaster` de RSuite
  - Notificar éxito/error en upload, delete, like
  - Reemplazar el `alert()` en el login por toast

- [ ] **T2-3: Skeleton screens durante carga**
  - Usar `Placeholder.Graph` de RSuite mientras cargan fotos
  - Aplicar en `AllPhotos` y en `Challenges`

- [ ] **T2-4: Event ID dinámico**
  - Sacar `684c7a1e6ceed1ce4c79c9af` hardcodeado a `VITE_EVENT_ID` en `.env`
  - Actualizar todos los componentes que lo referencian

---

## Tier 3 — Medio (mejoras importantes)

- [ ] **T3-1: Real-time para likes y nuevas fotos**
  - Implementar SSE (Server-Sent Events) en el backend: `GET /events/stream`
  - Frontend: `EventSource` para escuchar eventos de nuevas fotos y likes
  - WebSocket es overkill; SSE alcanza y no requiere librería extra

- [ ] **T3-2: Descarga masiva de fotos**
  - Endpoint `GET /files/download-all?eventId=...` que genere un ZIP con `archiver`
  - Frontend: botón "Descargar todo" en la galería

- [ ] **T3-3: Feedback de progreso real por archivo**
  - El `Uploader` de RSuite soporta `onProgress` — conectarlo al estado
  - Mostrar porcentaje de carga por archivo en la lista de preview

- [ ] **T3-4: Countdown del challenge cada segundo**
  - Cambiar `setInterval` de 60000ms a 1000ms en `Challenge/util.ts`

---

## Tier 4 — Nice to have

- [ ] **T4-1: Links compartibles por foto**
  - Route `/photo/:id` con meta Open Graph tags para WhatsApp/Twitter
  - Botón "Compartir" en el lightbox

- [ ] **T4-2: Búsqueda y filtros en la galería**
  - Dropdown de fotógrafos (usuarios que subieron fotos)
  - Filtro por rango de fechas
  - Búsqueda del lado del cliente (sin backend) para eventos pequeños

- [ ] **T4-3: Captions en fotos**
  - Campo de texto opcional al subir
  - Mostrar caption en el lightbox si existe

- [ ] **T4-4: Respetar dark/light mode del sistema**
  - Detectar `prefers-color-scheme` y pasarlo a `CustomProvider` de RSuite
  - Toggle manual para override

- [ ] **T4-5: EXIF stripping antes de subir a Cloudinary**
  - Las fotos pueden tener GPS metadata
  - `sharp` ya puede limpiar metadata con `.withMetadata(false)`
  - Agregar al pipeline de procesamiento existente en `files.ts`
