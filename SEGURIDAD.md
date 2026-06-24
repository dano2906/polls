# Auditoría de Seguridad — Pollify

**Fecha:** 24 de junio de 2026
**Alcance:** Código fuente completo (`src/`, configuración, variables de entorno)

---

## Resumen Ejecutivo

| Gravedad | Cantidad |
|----------|----------|
| 🔴 **CRÍTICO** | 10 |
| 🟠 **ALTO** | 7 |
| 🟡 **MEDIO** | 9 |
| 🔵 **BAJO** | 6 |

---

## 🔴 CRÍTICOS

### C1. Server Functions de Administración sin Autorización

**Archivo:** `src/modules/auth/actions/user.ts`

Las siguientes funciones **no verifican sesión ni rol de administrador** del lado del servidor. La protección solo existe a nivel de ruta (UI), pero un atacante puede llamar directamente estas `createServerFn`:

| Función | Líneas | Riesgo |
|---------|--------|--------|
| `createUser` | 108-122 | Cualquiera crea cuentas |
| `banUser` | 76-91 | Cualquiera banea usuarios |
| `unbanUser` | 93-106 | Cualquiera desbanea |
| `editUser` | 155-175 | Cualquiera edita perfiles (incluyendo rol → admin) |
| `removeUser` | 124-141 | Cualquiera elimina cuentas (excepto la propia) |
| `changeUserPassword` | 177-203 | Cualquiera cambia contraseñas → **toma de control total** |
| `listUserSessions` | 30-42 | Cualquiera lista sesiones de otro usuario |
| `updateAvatarAction` | 15-28 | Cualquiera cambia avatar de otro |

### C2. `updatePoll` sin Autenticación ni Control de Acceso

**Archivo:** `src/modules/poll/actions/poll.ts:365-412`

No llama `getSession()` ni verifica que el usuario sea el propietario de la encuesta. Cualquier persona puede modificar **cualquier encuesta** (cambiar estado, fechas, título, preguntas).

### C3. `createPoll` acepta `userId` sin validar sesión

**Archivo:** `src/modules/poll/actions/poll.ts:327-363`

El input incluye `userId: z.string()` pero nunca verifica que coincida con la sesión actual. Un atacante puede crear encuestas atribuidas a otros usuarios.

### C4. IDOR Masivo en Server Functions de Usuarios

**Archivo:** `src/modules/auth/actions/user.ts`

Todas las funciones que reciben un `id` de usuario como parámetro **no verifican** que el llamante sea ese usuario o un admin. Esto permite:

- Ver datos de cualquier usuario (`getUser`)
- Listar sesiones de cualquiera (`listUserSessions`)
- Cambiar contraseña de cualquiera (`changeUserPassword`)
- Eliminar cuenta de cualquiera (`removeUser`)

### C5. `forkPoll` sin Control de Acceso

**Archivo:** `src/modules/poll/actions/poll.ts:705-840`

Cualquier persona puede forkear cualquier encuesta por slug, incluyendo borradores privados, y ver toda su estructura interna.

### C6. `BETTER_AUTH_SECRET` Duplicado y en Texto Plano

**Archivos:** `.env.local:7`, `.env.production:4`

El mismo secret `[...secret...]` se usa en local y producción. Está almacenado en texto plano en ambos archivos. Comprometer el entorno local compromete producción.

### C7. Claves de API en Texto Plano en Disco

**Archivo:** `.env.local`

| Secreto | Valor |
|---------|-------|
| BETTER_AUTH_SECRET | `[...secret...]` |
| GOOGLE_CLIENT_SECRET | `[...secret...]` |
| GITHUB_CLIENT_SECRET | `[...secret...]` |
| OPENROUTER_API_KEY | `[...secret...]` |
| CLOUDINARY_API_SECRET | `[...secret...]` |

### C8. Producción apunta a `localhost`

**Archivo:** `.env.production:3,11`

```
BETTER_AUTH_URL=http://localhost:3000
VITE_PUBLIC_APP_URL=http://localhost:3000
```

OAuth redirigirá a localhost. Las URLs públicas de encuestas apuntarán a localhost.

### C9. Race Condition en Envío de Respuestas (TOCTOU)

**Archivo:** `src/modules/answers/actions/result.ts:37-56,83-209`

La verificación de `completedAt` está **fuera de la transacción**. Dos solicitudes paralelas pueden pasar ambas la verificación y generar respuestas duplicadas (la tabla `user_answer` no tiene unique constraint en `submissionId + questionId`).

### C10. Rate Limiting Ausente

No hay rate limiting en ningún endpoint. Vulnerable a:

- Fuerza bruta en inicio de sesión
- Ataques de denegación de servicio
- Enumeración de cuentas

---

## 🟠 ALTOS

### H1. `getCloudinarySignature` sin Autenticación

**Archivo:** `src/modules/common/actions/cloudinary.ts:5-44`

Cualquier persona (incluso sin sesión) puede obtener una firma válida de Cloudinary y subir archivos arbitrarios.

### H2. Elusión del Límite de Tiempo al Enviar

**Archivo:** `src/modules/answers/actions/result.ts:59-67`

Cuando se excede el `timeLimit`, el bloque `if` está **vacío** — no se rechaza el envío. La respuesta se guarda igual. La validación solo funciona en carga de página.

### H3. Estado de Encuesta sin Máquina de Estados en Servidor

**Archivo:** `src/modules/poll/actions/poll.ts:396-401`

El servidor acepta cualquier estado (`draft`, `published`, `archived`) sin validar la transición. Un atacante puede pasar de `draft` a `archived` directamente o revertir una publicada a borrador.

### H4. Inyección de Fórmulas en CSV/Excel

**Archivo:** `src/modules/common/lib/export.ts:278-290`

Los valores de encuesta no se sanitizan antes de exportar. Si un texto de pregunta/respuesta comienza con `=`, `+`, `-` o `@`, se ejecutará como fórmula al abrirse en Excel/Google Sheets (CSV Injection).

### H5. DevTools de React Incluido en Producción

**Archivo:** `vite.config.ts:12`

El plugin `@tanstack/devtools-vite` está incluido sin condición. En producción expone el árbol de componentes, estado interno y caché de queries.

### H6. Token de Sesión Expuesto en UI

**Archivo:** `src/modules/auth/components/columns.tsx:207-208`

La tabla de sesiones pasa `row.original.token` al componente de acciones. Los tokens de sesión aparecen en el HTML y son accesibles desde DevTools.

### H7. `process.env` en Código Cliente

**Archivo:** `src/modules/auth/lib/auth-client.ts:6`

Usa `process.env.BETTER_AUTH_URL` en un archivo que se ejecuta **en el navegador**. Vite no provee `process.env` en cliente; puede resolverse a `undefined`.

---

## 🟡 MEDIOS

### M1. Geolocalización con `max` incorrecto

**Archivo:** `src/modules/answers/lib/validation.ts:18-21`

```ts
lng: z.number().min(-180).max(-180)  // Debería ser max(180)
```

Solo se acepta longitud exactamente `-180`. Ninguna coordenada real pasa la validación.

### M2. Validación de Slug Invertida

**Archivo:** `src/modules/poll/lib/validation.ts:36-45`

```ts
return data.slug.length < 6;  // Solo acepta slugs de ≤5 caracteres
```

La función `generateRandomCode()` genera slugs de 6 caracteres, pero la validación los rechaza. La funcionalidad de slug personalizado no funciona.

### M3. Cookie de Contraseña en Base64 (sin encriptar)

**Archivo:** `src/modules/poll/actions/poll.ts:1058-1072`

El payload `{ slug, userId, unlockedAt }` se codifica con `btoa()` (base64), no se encripta. Cualquiera que lea la cookie puede decodificarlo trivialmente.

### M4. `Math.random()` para Generar Slugs

**Archivo:** `src/modules/poll/lib/utils.ts:1-3`

`Math.random()` no es criptográficamente seguro. Los slugs son predecibles.

### M5. Inyección de Prompts en IA

**Archivo:** `src/modules/question/actions/question.ts:378,402`
**Archivo:** `src/routes/api/poll/generate-questions.ts:34`

El contexto del usuario se interpola directamente en el prompt de la IA sin sanitización. Un usuario puede inyectar instrucciones maliciosas.

### M6. Exportación Incluye `isCorrect` (Clave de Respuestas)

**Archivo:** `src/modules/poll/components/export-menu-button.tsx:41-76`

El exportador incluye qué respuestas son correctas. Quien exporte la encuesta ve la clave de respuestas.

### M7. Error Revela Nombre de Variable de Entorno

**Archivo:** `src/modules/common/actions/cloudinary.ts:7-10`

```
"No se encuentra la variable CLOUDINARY_API_SECRET"
```

Los mensajes de error revelan exactamente qué variable falta.

### M8. Sin Protección Server-Side en Módulo OpenRouter

**Archivo:** `src/modules/common/lib/openrouter.ts:4`

No hay guardia que impida importar este módulo desde el cliente. Un import accidental expondría la API key.

### M9. `VITE_PUBLIC_APP_URL` Horneado en Bundle Cliente

**Archivo:** `src/modules/poll/actions/poll.ts:43`

Las variables `VITE_*` se incrustan en el bundle JS de producción. El valor `http://localhost:3000` queda visible.

---

## 🔵 BAJOS

### B1. Seed Destructivo Podría Ejecutarse en Producción

**Archivo:** `src/modules/common/db/seed.ts:51-53`
Hace `DELETE FROM` en 15 tablas. Si se ejecuta en producción, destruye la base de datos.

### B2. Sin Validación de `name` en Registro

**Archivo:** `src/modules/auth/lib/validation.ts:11`
`name: z.string()` sin límite de longitud. Permite nombres de 100k caracteres o vacíos.

### B3. Validación Débil de Email en Invitación

**Archivo:** `src/routes/_protected/org/$orgSlug/invite.tsx:62`
Solo verifica `value.includes("@")`. Cualquier string con `@` pasa.

### B4. `TURSO_AUTH_TOKEN` sin Validación

**Archivo:** `src/modules/common/db/index.ts:14`
`authToken: process.env.TURSO_AUTH_TOKEN as string` — sin verificar si es null/vacío.

### B5. Importación Pierde Contraseña de Encuesta

**Archivo:** `src/modules/poll/actions/poll.ts:597-610`
Al importar una encuesta, el campo `password` no se restaura.

### B6. GET Handler Crea Registros en DB (Efecto Secundario)

**Archivo:** `src/modules/poll/actions/poll.ts:260-279`
`getPollDetails()` crea un `submission` al leer la encuesta. Cuando el autor edita su encuesta, se le crea un intento de respuesta.

---

## Recomendaciones Priorizadas

### Inmediatas (día 1)

1. **Agregar `getSession()` + verificación de admin** en todas las server functions de `auth/actions/user.ts`
2. **Agregar verificación de propietario** en `updatePoll`, `deletePollBySlug`, `forkPoll`
3. **Agregar verificación de sesión** en `createPoll` (usar `session.user.id` en vez de input)
4. **Rotar todos los secretos** (`BETTER_AUTH_SECRET`, OAuth secrets, OpenRouter, Cloudinary)
5. **Agregar rate limiting** en endpoints de autenticación
6. **Corregir `.env.production`** — cambiar URLs de localhost a producción

### Corto plazo (1-2 semanas)

7. **Arreglar el TOCTOU** moviendo la verificación de `completedAt` dentro de la transacción y agregando unique constraint en `user_answer`
8. **Agregar validación de estado (state machine)** del lado del servidor en `updatePoll`
9. **Sanitizar exportación CSV/Excel** contra inyección de fórmulas
10. **Corregir validación de geolocalización** (`.max(180)`)
11. **Corregir validación de slug** (`.length === 6`)
12. **Condicionar DevTools** solo para desarrollo
13. **Encriptar cookie de contraseña** en vez de base64
14. **Usar `crypto.randomUUID()`** para slugs

### Mediano plazo

15. **Implementar CSRF tokens** explícitos
16. **Agregar server-only guard** en `openrouter.ts`
17. **Sanitizar prompts de IA** contra inyección
18. **Mover secretos a secrets manager** (Vercel Environment Variables, AWS Secrets Manager)
19. **Agregar rate limiting en todas las server functions**
20. **No exponer tokens de sesión en UI**

---

*Auditoría generada el 24 de junio de 2026 basada en análisis estático del código fuente.*
