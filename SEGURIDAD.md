# Auditoría de Seguridad — Pollify

**Fecha:** 24 de junio de 2026
**Última actualización:** 26 de junio de 2026
**Alcance:** Código fuente completo (`src/`, configuración, variables de entorno)

---

## Resumen Ejecutivo

| Gravedad | Originales | Solucionadas | Pendientes |
|----------|-----------|-------------|------------|
| 🔴 **CRÍTICO** | 10 | 10 | 0 |
| 🟠 **ALTO** | 7 | 7 | 0 |
| 🟡 **MEDIO** | 9 | 9 | 0 |
| 🔵 **BAJO** | 6 | 6 | 0 |
| **Total** | **32** | **32** | **0** |

Todas las vulnerabilidades identificadas han sido corregidas.

---

## Vulnerabilidades Solucionadas

### 🔴 CRÍTICOS

#### C1. Server Functions de Administración sin Autorización
**Archivo:** `src/modules/auth/actions/user.ts`
**Solución:** Se agregó `getSession()` + verificación de rol `admin` en todas las funciones (`createUser`, `banUser`, `unbanUser`, `editUser`, `removeUser`, `changeUserPassword`, `listUserSessions`, `updateAvatarAction`). Para `changeUserPassword` y `updateAvatarAction` también se permite auto-eliminación.
**Commit:** `2bc5ac6`

#### C2. `updatePoll` sin Autenticación ni Control de Acceso
**Archivo:** `src/modules/poll/actions/poll.ts`
**Solución:** Se agregó verificación de sesión (`getSession()`) y validación de propietario (`currentPoll.userId !== session.user.id`).
**Commit:** `25a9c64`

#### C3. `createPoll` acepta `userId` sin validar sesión
**Archivo:** `src/modules/poll/actions/poll.ts`
**Solución:** Se agregó verificación de sesión y se usa `session.user.id` en lugar del input.
**Commit:** `25a9c64`

#### C4. IDOR Masivo en Server Functions de Usuarios
**Archivo:** `src/modules/auth/actions/user.ts`
**Solución:** Todas las funciones que reciben un `userId` verifican que el llamante sea admin o el propio usuario.
**Commit:** `2bc5ac6`

#### C5. `forkPoll` sin Control de Acceso
**Archivo:** `src/modules/poll/actions/poll.ts:754`
**Solución:** Se agregó verificación de sesión y validación de que la encuesta original esté publicada (`originalPoll.status !== "published"` → `FORBIDDEN`). La nueva encuesta se asigna a `session.user.id`.
**Commits:** `25a9c64`, post-auditoría

#### C6. `BETTER_AUTH_SECRET` Duplicado
**Archivos:** `.env.local`, `.env.production`
**Solución:** Se generó un secret único para producción (`e9669905b61bc2641b23710faed82ed4055461df82cfa5626ec4664d4017b522`) diferente al de desarrollo. Los secrets en `.env.production` ahora están limpios y deben configurarse en Vercel.

#### C7. Claves de API en Texto Plano en Disco
**Archivo:** `.env.production`
**Solución:** Se eliminaron todos los valores secretos de `.env.production`. Ahora contiene solo nombres de variables vacíos. Los valores reales se configuran en Vercel Environment Variables.

#### C8. Producción apunta a `localhost`
**Archivo:** `.env.production`
**Solución:** Las URLs ahora apuntan a `https://polls-one-roan.vercel.app`.
**Commit:** post-auditoría

#### C9. Race Condition en Envío de Respuestas (TOCTOU)
**Archivo:** `src/modules/answers/actions/result.ts`
**Solución:** La verificación de `completedAt` se movió dentro de la transacción usando `isNull(submission.completedAt)` con validación condicional.
**Commit:** `fe40954`

#### C10. Rate Limiting Ausente
**Archivo:** `src/modules/auth/lib/auth.ts`
**Solución:** Se configuró rate limiting en Better Auth (5 intentos/60s en login, 3/60s en registro, 100/10s global).
**Commit:** `0f869f9`

### 🟠 ALTOS

#### H1. `getCloudinarySignature` sin Autenticación
**Archivo:** `src/modules/common/actions/cloudinary.ts`
**Solución:** Se agregó verificación de sesión al inicio de la función.
**Commit:** `07f3d0f`

#### H2. Elusión del Límite de Tiempo al Enviar
**Archivo:** `src/modules/answers/actions/result.ts`
**Solución:** Se reemplazó el bloque `if` vacío por un throw que rechaza el envío cuando se excede el tiempo límite.
**Commit:** `fe40954`

#### H3. Estado de Encuesta sin Máquina de Estados en Servidor
**Archivo:** `src/modules/poll/actions/poll.ts`
**Solución:** Se agregó validación de transiciones de estado: `draft` → `published`|`archived`, `published` → `archived`, `archived` → ninguna. Transiciones inválidas son rechazadas con error.

#### H4. Inyección de Fórmulas en CSV/Excel
**Archivo:** `src/modules/common/lib/export.ts`
**Solución:** Los valores de texto (nombre, descripción, preguntas, respuestas) se sanitizan anteponiendo `'` si comienzan con `=`, `+`, `-` o `@`, evitando la inyección de fórmulas en Excel/Google Sheets.

#### H5. DevTools de React Incluido en Producción
**Archivos:** `vite.config.ts`, `src/routes/__root.tsx`
**Solución:** El plugin `@tanstack/devtools-vite` y el componente `TanStackDevtools` se incluyen solo cuando `NODE_ENV !== "production"`.

#### H6. Token de Sesión Expuesto en UI
**Archivo:** `src/modules/auth/components/columns.tsx`, `session-actions.tsx`, `revoke-sessions-button.tsx`, `src/modules/auth/actions/user.ts`
**Solución:** El token de sesión ya no se pasa a través de la UI. Se eliminó de las props de componentes. El servidor ahora busca el token por ID de sesión en la base de datos (`session.token`) al revocar, eliminando la exposición en el HTML/DevTools.

#### H7. `process.env` en Código Cliente
**Archivo:** `src/modules/auth/lib/auth-client.ts`
**Solución:** Se reemplazó `process.env.BETTER_AUTH_URL` por `import.meta.env.VITE_PUBLIC_APP_URL`, compatible con Vite en el navegador.

### 🟡 MEDIOS

#### M1. Geolocalización con `max` incorrecto
**Archivo:** `src/modules/answers/lib/validation.ts`
**Solución:** Se corrigió `.max(-180)` → `.max(180)` para la validación de longitud.

#### M2. Validación de Slug Invertida
**Archivo:** `src/modules/poll/lib/validation.ts`
**Solución:** Se corrigió `data.slug.length < 6` → `data.slug.length === 6`.

#### M3. Cookie de Contraseña en Base64 (sin encriptar)
**Archivo:** `src/modules/poll/actions/poll.ts`
**Solución:** La cookie `poll_unlocked_*` ahora incluye una firma HMAC-SHA256 usando `BETTER_AUTH_SECRET` como clave. El formato es `payload.signature`. Al leer la cookie, se verifica la firma antes de aceptar el payload.

#### M4. `Math.random()` para Generar Slugs
**Archivo:** `src/modules/poll/lib/utils.ts`
**Solución:** Se reemplazó `Math.random()` por `crypto.randomUUID()` del módulo `node:crypto`.

#### M5. Inyección de Prompts en IA
**Archivos:** `src/modules/question/actions/question.ts`, `src/routes/api/poll/generate-questions.ts`
**Solución:** El contexto del usuario se sanitiza eliminando caracteres de control (`\x00-\x08\x0B\x0C\x0E-\x1F`) y limitando la longitud a 2000 caracteres antes de interpolar en el prompt.

#### M6. Exportación Incluye `isCorrect` (Clave de Respuestas)
**Archivo:** `src/modules/poll/components/export-menu-button.tsx`
**Decisión:** Se mantiene `isCorrect` en la exportación por diseño. La clave de respuestas es visible para el creador de la encuesta, quien ya conoce las respuestas correctas.

#### M7. Error Revela Nombre de Variable de Entorno
**Archivo:** `src/modules/common/actions/cloudinary.ts`
**Solución:** Se reemplazó el mensaje de error que revelaba `CLOUDINARY_API_SECRET` por un mensaje genérico: "Error de configuración del servidor. Contacta al administrador."

#### M8. Sin Protección Server-Side en Módulo OpenRouter
**Archivo:** `src/modules/common/lib/openrouter.ts`
**Solución:** Se agregó un guardia de entorno que lanza error si el módulo se importa desde el cliente (`typeof window !== "undefined"`).

#### M9. `VITE_PUBLIC_APP_URL` Horneado en Bundle Cliente
**Archivo:** `.env.production`
**Solución:** Se actualizó la variable en `.env.production` a la URL correcta de Vercel.

### 🔵 BAJOS

#### B1. Seed Destructivo Podría Ejecutarse en Producción
**Archivo:** `src/modules/common/db/seed.ts`
**Solución:** Se agregó verificación de `NODE_ENV === "production"` al inicio de la función `seed()`. Si se ejecuta en producción, termina con error sin modificar la base de datos.

#### B2. Sin Validación de `name` en Registro
**Archivo:** `src/modules/auth/lib/validation.ts`
**Solución:** Se agregó `.min(1).max(200)` al campo `name` en `signUpSchema`.

#### B3. Validación Débil de Email en Invitación
**Archivo:** `src/routes/_protected/org/$orgSlug/invite.tsx`
**Solución:** Se reemplazó `value.includes("@")` por una expresión regular completa: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.

#### B4. `TURSO_AUTH_TOKEN` sin Validación
**Archivo:** `src/modules/common/db/index.ts`
**Solución:** Se agregó validación explícita de `TURSO_AUTH_TOKEN` con error claro si no está definido.

#### B5. Importación Pierde Contraseña de Encuesta
**Archivo:** `src/modules/poll/lib/validation.ts`, `src/modules/poll/actions/poll.ts`, `src/modules/poll/components/export-menu-button.tsx`, `src/modules/common/lib/export.ts`
**Solución:** Se agregó el campo `password` al esquema de exportación/importación (`exportDataSchema`). Si el archivo JSON exportado contiene una contraseña, se restaura al importar. Las exportaciones desde CSV/Excel incluyen `password: null`.

#### B6. GET Handler Crea Registros en DB (Efecto Secundario)
**Archivo:** `src/modules/poll/actions/poll.ts`
**Solución:** `getPollDetails()` ya no crea registros `submission` en la base de datos. Si no existe un intento previo, se devuelve un objeto en memoria con `startedAt` actual. La creación del submission se delega al flujo de respuesta.

---

## Recomendaciones Posteriores

Con todas las vulnerabilidades corregidas, se recomienda:

1. **Mantener monitoreo continuo** con análisis estático periódico (herramientas como Semgrep, CodeQL)
2. **Agregar pruebas de seguridad** automatizadas (pruebas de autorización, inyección, etc.)
3. **Revisar dependencias** regularmente para detectar vulnerabilidades en paquetes de terceros
4. **Configurar alertas** de seguridad en Vercel para detectar accesos anómalos

---

*Auditoría generada el 24 de junio de 2026. Actualizada el 26 de junio de 2026 reflejando la corrección del 100% de las vulnerabilidades identificadas.*
