# ADR 000X – Envío de email con link de galería a todos los usuarios que subieron fotos

## Contexto
Después de la boda, el organizador quiere poder enviar a todos los participantes que subieron alguna foto un enlace que contenga la galería completa. Actualmente no existe ninguna forma de hacerlo desde el panel de administración.

## Decisión
Se implementará un botón **"Enviar email a todos los usuarios con fotos"** dentro del admin panel. Al hacer click se mostrará un modal de confirmación y, una vez aceptado, el backend generará un enlace único (token JWT con expiración) que apunta a una vista pública con la galería completa y enviará un email a cada usuario que haya subido al menos una foto.

## Detalles de la solución

### Frontend (React / RSuite)
- Añadir botón en `src/components/Admin/PhotosManager/index.tsx`.
- Usar componentes RSuite (`Button`, `Modal`, `Loader`) y el tema de acento ya definido (`--accent`).
- Mostrar **ConfirmModal** con texto explicativo y opción *Enviar*.
- Desactivar el botón y mostrar loader mientras se procesa la petición.
- Notificar al usuario con `Toast` de éxito o error.

### API
- **Endpoint**: `POST /api/admin/send-gallery-link` (protected por `AdminRoute`).
- Lógica del controlador:
  1. Consultar la tabla de fotos y obtener correos distintos de usuarios que tengan al menos una foto (`SELECT DISTINCT email FROM photos`).
  2. Generar un **link único** que apunte a `/gallery/:token` (token JWT con expiración, por ejemplo 7 días).
  3. Enviar email a la lista usando la **API de Resend** (proveedor de email transaccional).
  4. Registrar el envío en tabla `email_logs` (fecha, número de destinatarios, link, estado).

### Servicio de email
- Wrapper `src/server/services/emailService.ts` con método `sendBulkEmail(to: string[], subject: string, html: string)`. 
- Variables de entorno necesarias:
  - `EMAIL_PROVIDER_API_KEY`
  - `FROM_ADDRESS`

### Generación del link
- **Opción A – Ruta interna**: crear página pública `/gallery/:token` que, a partir del token, consulte todas las fotos y las renderice. El token lleva payload `{eventId, exp}` y se firma con una secret del proyecto.
- **Opción B – Bucket externo**: subir todas las fotos a un bucket (S3, Cloudinary) bajo `gallery/<event-id>/` y generar una URL firmada con expiración.
- Se elige la opción que mejor encaje con la infraestructura actual (si ya se usa un bucket, usar la opción B).

### Persistencia
- Nueva tabla `email_logs` con columnas:
  - `id`
  - `sent_at`
  - `recipients_count`
  - `link`
  - `status` (`sent`, `failed`)
  - `error_message`
- Permite auditoría y re‑envío seguro.

### Tests
- **Unitarios**: `emailService.test.ts`, `galleryLinkService.test.ts`.
- **E2E** (Cypress/Playwright): Simular click en el botón del admin y verificar que se llama al endpoint y que el toast muestra el mensaje correcto.

### Documentación
- Añadir este ADR al directorio `docs/adr/`.
- Actualizar `README.md` bajo **Admin features** con una breve descripción del nuevo botón y su uso.

## Consecuencias
- **Ventajas**: automatiza la comunicación post‑evento, mejora la experiencia del cliente y reduce trabajo manual.
- **Desventajas / Riesgos**:
  - Límites de envío del proveedor de email (se controla con lotes y logs).
  - Necesidad de proteger el enlace (token con expiración).
  - Posible carga en el servidor al generar la lista de correos; se puede mover a un worker si la escala crece.
- **Mitigaciones**: 
  - Uso de token JWT de corta duración.
  - Registro de envíos en `email_logs` para auditoría.
  - Envío en lotes y re‑intentos parcializados.

## Estado
- **Propuesta** – Aprobada para implementación en la próxima iteración.
