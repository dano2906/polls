# Documentación del Proyecto: Pollify

Aplicación web full-stack para crear, publicar, compartir y responder encuestas. Construida con **TanStack Start**, **Drizzle ORM**, **Turso (libSQL)**, **BetterAuth**, **Tailwind CSS** y **ShadCN/ui**.

---

## Stack Tecnológico

| Capa          | Tecnología                         |
| ------------- | ---------------------------------- |
| Framework     | TanStack Start (SSR React)         |
| Ruteo         | TanStack React Router (archivos)   |
| Estado Server | TanStack React Query               |
| Formularios   | TanStack Form                      |
| Base de Datos | Turso / libSQL (SQLite)            |
| ORM           | Drizzle ORM                        |
| Autenticación | BetterAuth (email, Google, GitHub) |
| UI            | Tailwind CSS v4 + ShadCN           |
| IA            | Vercel AI SDK + OpenRouter         |
| Archivos      | Cloudinary                         |
| Exportación   | SheetJS (XLSX)                     |

---

## Estructura del Proyecto

```
src/
├── router.tsx                        # Configuración del router
├── routeTree.gen.ts                  # Árbol de rutas auto-generado
├── routes/                           # Rutas basadas en archivos
│   ├── __root.tsx                    # Layout raíz (HTML, tema, devtools)
│   ├── _landing.tsx                  # Layout público (AuthHeader + Outlet)
│   ├── _protected.tsx                # Layout autenticado (sesión requerida)
│   ├── _landing/                     # Rutas públicas
│   │   ├── index.tsx                 # Landing page (encuestas publicadas)
│   │   ├── auth.tsx                  # Inicio de sesión / Registro
│   │   └── p/$slug/                  # Encuesta pública
│   │       ├── index.tsx             # Formulario de respuestas
│   │       ├── result.tsx            # Resultados de la encuesta
│   │       └── password.tsx          # Pantalla de contraseña
│   ├── _protected/                   # Rutas protegidas
│   │   ├── dashboard.tsx             # Dashboard del usuario
│   │   ├── poll/                     # CRUD de encuestas
│   │   │   ├── new.tsx               # Crear encuesta
│   │   │   ├── update.$slug.tsx      # Editar encuesta
│   │   │   └── import.tsx            # Importar encuesta
│   │   ├── user/                     # Administración de usuarios (admin)
│   │   │   ├── index.tsx             # Lista de usuarios
│   │   │   ├── new.tsx               # Crear usuario
│   │   │   ├── me.tsx                # Perfil propio
│   │   │   ├── $id.tsx               # Detalle de usuario
│   │   │   └── update.$id.tsx        # Editar usuario
│   │   └── org/                      # Organizaciones
│   │       ├── index.tsx             # Lista de organizaciones
│   │       ├── new.tsx               # Crear organización
│   │       └── $orgSlug/             # Detalle de organización
│   │           ├── index.tsx         # Panel principal
│   │           ├── members.tsx       # Gestionar miembros
│   │           ├── invite.tsx        # Invitar miembros
│   │           └── polls.new.tsx     # Crear encuesta en org
│   └── api/
│       ├── auth/$.ts                 # Handler BetterAuth (catch-all)
│       └── poll/generate-questions.ts # Generación IA de preguntas
│
└── modules/                          # Módulos por dominio
    ├── answers/                      # Módulo de respuestas
    ├── auth/                         # Módulo de autenticación
    ├── common/                       # Módulo compartido (DB, UI, utilerías)
    ├── organization/                 # Módulo de organizaciones
    ├── poll/                         # Módulo de encuestas
    └── question/                     # Módulo de preguntas
```

Cada módulo sigue la misma estructura interna:

- **`actions/`** - Server functions (`createServerFn`)
- **`components/`** - Componentes React
- **`lib/`** - Validaciones (Zod), queries (React Query), utilerías, constantes
- **`shared/`** - Tipos TypeScript compartidos

---

## Módulo `common` — Capa Compartida

**Propósito:** Base compartida para toda la aplicación.

### Componentes

- **`db/`** - Configuración de base de datos Turso/libSQL con Drizzle ORM.
  - `schema.ts` - Define **15 tablas**: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `organization_role`, `team`, `team_member`, `poll`, `question`, `poll_question`, `answer`, `submission`, `user_answer`.
  - `migrations/` - Migraciones SQL generadas por Drizzle Kit.
  - `seed.ts` - Script de seed para desarrollo.
- **`actions/cloudinary.ts`** - Server functions para generar firmas de subida y eliminar imágenes de Cloudinary.
- **`components/ui/`** - **40+ componentes primitivos** ShadCN: button, input, card, table, dropdown-menu, tabs, calendar, date-input, slider, checkbox, radio-group, popover, select, separator, skeleton, sonner (toast), spinner, avatar, badge, tooltip, accordion, context-menu, map (MapLibre GL), etc.
- **`components/partials/`** - Componentes compuestos:
  - `DataTable` - Tabla con paginación, ordenamiento, búsqueda, visibilidad de columnas.
  - `DataTablePagination` - Controles de paginación.
  - `FormField` - Renderizador multi-tipo de campos de formulario.
  - `ThemeToggle` - Selector de tema claro/oscuro.
  - `EnhanceContextButton` - Botón para mejorar contexto con IA.
- **`components/tanstack-query/`** - `RootProvider` (fábrica de QueryClient), `Devtools`.
- **`lib/`** - Utilerías: `cn()` (clsx+twMerge), `uploadToCloudinary()`, `passwordSchema`, `filtersSchema`, `export.ts` (import/export JSON/Excel/CSV con SheetJS), `openrouter.ts` (proveedor AI SDK), `theme.ts` (cookies tema), `constants.ts`, `table.tsx`, `validation.ts`.
- **`shared/types.ts`** - Enum `ExportFormat`.
- **`styles/styles.css`** - Estilos globales Tailwind.

---

## Módulo `auth` — Autenticación y Usuarios

**Propósito:** Gestionar autenticación, sesiones, roles y administración de usuarios.

### Funcionalidades

- **Autenticación completa** con BetterAuth:
  - Email y contraseña (con auto-sign-in deshabilitado).
  - OAuth con Google y GitHub.
  - Manejo de sesiones SSR con cookies.
  - Soporte para impersonación.
- **Plugin Admin**: Roles `admin` y `user`, control de acceso personalizado con permisos para `polls`.
- **Plugin Organization**: Soporte multi-tenant, creador como "owner", expiración de invitaciones a 7 días.
- **Server Functions**:
  - `getSession()`, `ensureSession()` - Obtener/validar sesión actual.
  - `hashPassword()`, `verifyPassword()` - Hash y verificación segura de contraseñas (scrypt).
  - CRUD de usuarios: `createUser`, `editUser`, `removeUser`, `getUser`.
  - Gestión de sesiones: `listUserSessions`, `revokeUserSession`.
  - Moderación: `banUser`, `unbanUser`.
  - Avatar: `updateAvatarAction`.
- **Componentes** (18 total):
  - `SignInForm`, `SignUpForm`, `SocialProviders` - Formularios de autenticación.
  - `AuthHeader` - Menú de usuario con navegación y cierre de sesión.
  - `UserTableActions`, `UserRowActions`, `Columns` - Tabla de administración de usuarios.
  - `CreateUserForm`, `EditUserForm`, `BanUserInput`, `UnbanUserButton`, `ChangePasswordInput`, `ChangeUserAvatar`, `RemoveUserButton` - Acciones de administración.
  - `RevokeSessionsButton`, `SessionActions`, `ListUserSessions` - Gestión de sesiones.

---

## Módulo `poll` — Encuestas

**Propósito:** CRUD completo de encuestas, incluyendo publicación, versionado, clonación, exportación/importación y control de acceso.

### Funcionalidades

- **CRUD de encuestas**: Crear, editar, eliminar, publicar, archivar.
- **Versionado**: Al editar una encuesta con respuestas existentes, se crea una nueva versión (incrementa `version`) manteniendo el mismo `rootId` para formar un árbol familiar.
- **Fork/Clonación**: `forkPoll()` - Clona profundamente una encuesta con nuevo slug y versión.
- **Control de acceso por estado**: Draft (creador), Published (cualquiera con link), Archived (oculta).
- **Contraseña**: Encuestas protegidas con contraseña usando cookies HTTP-only.
- **Ventana de tiempo**: `startDate` / `endDate` para habilitar la encuesta solo en un período.
- **Límite de respuestas**: Configurable vía `metadata.limitResponses`.
- **Límite de tiempo por usuario**: Time limit para responder.
- **Prevención de duplicados**: Una respuesta por usuario por encuesta.
- **Compartir**: Link directo, código QR, copia al portapapeles.
- **Exportación**: JSON, CSV, Excel (SheetJS).
- **Importación**: JSON, Excel, CSV mediante drag-and-drop.
- **Server Functions** (15):
  - `getPublishedPolls`, `getListedUserPolls`, `getCompactUserPolls` - Listados.
  - `getPollDetails` - Encuesta completa con preguntas y respuestas.
  - `createPoll`, `updatePoll`, `deletePollBySlug` - CRUD.
  - `validatePollAccess` - Validación compleja de acceso (estado, fechas, contraseña, envío previo, límite de tiempo, límite de respuestas).
  - `validatePollPassword` - Verificación de contraseña con cookie HTTP-only.
  - `importPollAction` - Importación transaccional.
  - `forkPoll` - Clonación profunda con versionado.
  - `getUserPollResults` - Resultados del usuario.
  - `createPollPublicURL`, `exportPollFn` - Funciones cliente.
- **Componentes** (19 total):
  - `PollForm` - Formulario crear/editar encuesta.
  - `PollFilterBar` - Barra de búsqueda y filtros.
  - `PollPasswordForm`, `PollQRCodePopover`, `TimeLimitInput` - Configuración.
  - `ChangePollStatus`, `DeletePollButton`, `ExportMenuButton`, `ForkPollButton`, `GoToPollLink`, `CopyClipboardPoll` - Acciones.
  - `CardContextMenu` - Menú contextual en tarjetas.
  - `ListPublishedPolls`, `ListUserPolls`, `CompactUserPolls` - Listados.
  - `PollCardLanding`, `PollCardDashboardList`, `PollCardDashboardCompact` - Variantes de tarjeta.
  - `ImportPollZone` - Zona de importación drag-and-drop.

---

## Módulo `question` — Preguntas

**Propósito:** Gestión de preguntas con 9 tipos distintos, incluyendo generación IA.

### Funcionalidades

- **9 tipos de pregunta**:
  | Tipo | Descripción |
  |------|-------------|
  | `single_choice` | Selección única (radio) |
  | `multiple_choice` | Selección múltiple (checkbox) |
  | `open_answer` | Respuesta abierta (texto) |
  | `rating` | Escala de valoración (1-5/1-10) |
  | `ranking` | Ordenamiento por preferencia (drag & drop) |
  | `date_single` | Fecha única |
  | `date_range` | Rango de fechas |
  | `point_distribution` | Distribución de puntos entre opciones |
  | `geolocation` | Ubicación geográfica (MapLibre GL) |
- **Metadatos por tipo**: Cada tipo tiene su propio esquema Zod con validaciones específicas (min/max opciones, valores de rating, etc.).
- **Imágenes**: Soporte para subir imágenes a preguntas y respuestas vía Cloudinary.
- **IA**: Generación automática de preguntas y respuestas usando OpenRouter.
  - `generateQuestionsFromContext()` - Genera preguntas basadas en un contexto.
  - `enhanceGenerateQuestionContext()` - Mejora el contexto ingresado con IA.
- **Batch upsert**: `saveQuestionsBatch()` - Guardado masivo con manejo de versionado (archiva encuesta anterior si tiene respuestas y crea nueva versión).
- **Componentes**:
  - `QuestionForm` - Constructor dinámico de preguntas según tipo seleccionado.
  - `GenerateQuestionsButton` - Botón para activar generación IA.

---

## Módulo `answers` — Respuestas

**Propósito:** Capturar, validar y almacenar las respuestas de los usuarios a las encuestas.

### Funcionalidades

- **Validación dinámica**: `createDynamicResponseSchema()` genera esquemas Zod en tiempo real según los metadatos de cada pregunta.
- **Verificación de sesión**: Requiere sesión activa del usuario.
- **Validación de estado de la encuesta**: Solo responde si está publicada y dentro de la ventana de tiempo.
- **Límite de tiempo**: Si la encuesta tiene `timeLimit`, se valida que no haya expirado desde que el usuario empezó.
- **Mapeo de respuestas**: Convierte respuestas crudas del formulario a objetos `UserAnswerValue` tipados según el tipo de pregunta.
- **Duplicados**: Previene múltiples envíos del mismo usuario a la misma encuesta.
- **Componentes**:
  - `QuestionsResponseForm` - Formulario principal de respuesta, renderiza preguntas según tipo.
  - `ResponseCountdown` - Cuenta regresiva para encuestas con límite de tiempo.
  - `ResultResponseRenderer` - Renderiza respuestas enviadas por tipo de pregunta.

---

## Módulo `organization` — Organizaciones

**Propósito:** Gestión multi-tenant con organizaciones, equipos, miembros y roles.

### Funcionalidades

- **CRUD de organizaciones**: Crear, editar, eliminar organizaciones.
- **Gestión de miembros**: Invitar por email, aceptar/rechazar invitaciones, remover miembros, cambiar roles.
- **Roles**: Owner, admin, member (definidos por BetterAuth).
- **Invitaciones**: Con expiración a 7 días.
- **Encuestas por organización**: Las encuestas pueden pertenecer a una organización (`organizationId`).
- **Server Functions** (10):
  - `listOrganizations`, `getFullOrganization`, `getOrganizationBySlug` - Listado/detalle.
  - `createOrganizationAction`, `updateOrganizationAction`, `deleteOrganizationAction` - CRUD.
  - `listOrgMembersAction`, `inviteMemberAction`, `removeMemberAction`, `updateMemberRoleAction` - Gestión de miembros.
  - `getOrganizationPolls` - Encuestas de la organización.
- **Componentes**:
  - `OrgCardDashboardList`, `OrgCardContextMenu` - Tarjetas de organización.
  - `OrgSwitcher` - Selector de organización activa.
  - `MembersTable`, `MembersTableActions` - Tabla de miembros.
  - `RoleBadge` - Badge visual de rol.
  - `Columns` - Definiciones de columnas para tabla.

---

## Base de Datos — Esquema

**15 tablas** definidas con Drizzle ORM + Zod (`drizzle-zod`):

| Tabla                 | Campos clave                                                                                                               | Relaciones                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **user**              | id, name, email, role (admin/user), banned, banReason                                                                      | -> sessions, accounts, polls, members |
| **session**           | id, token, userId, expiresAt, ipAddress, userAgent, impersonatedBy                                                         | -> user                               |
| **account**           | id, accountId, providerId, userId, password (hash)                                                                         | -> user                               |
| **verification**      | id, identifier, value, expiresAt                                                                                           | (standalone)                          |
| **organization**      | id, name, slug, logo, metadata                                                                                             | -> members, invitations               |
| **member**            | id, userId, organizationId, role                                                                                           | -> user, organization                 |
| **invitation**        | id, email, inviterId, organizationId, role, status, expiresAt                                                              | -> organization, user                 |
| **organization_role** | id, organizationId, role, permission                                                                                       | -> organization                       |
| **team**              | id, name, organizationId                                                                                                   | -> organization                       |
| **team_member**       | id, teamId, userId                                                                                                         | -> team, user                         |
| **poll**              | id, userId, rootId, name, slug (único), status, version, timeLimit, password, startDate, endDate, organizationId, metadata | -> user, questions, submissions       |
| **question**          | id, type (9 tipos), questionText, hasCorrectAnswers, maxSelections, isRequired, imageUrl, metadata                         | -> answers, polls (via poll_question) |
| **poll_question**     | pollId, questionId, order                                                                                                  | -> poll, question                     |
| **answer**            | id, questionId, answerText, isCorrect, order, imageUrl, metadata                                                           | -> question                           |
| **submission**        | id, pollId, userId, submittedAt, startedAt, completedAt                                                                    | -> poll, user                         |
| **user_answer**       | id, submissionId, questionId, value (JSON)                                                                                 | -> submission, question               |

---

## Flujo de Autenticación

1. **BetterAuth** maneja registro, inicio de sesión, OAuth y sesiones.
2. `getSession()` se ejecuta en cada carga de ruta raíz para obtener la sesión actual.
3. `ensureSession()` redirige a `/` si no hay sesión (usado en layout protegido).
4. Las rutas de administrador verifican `session.user.role !== "admin"` y redirigen.
5. Las encuestas protegidas por contraseña usan cookies HTTP-only con payload encriptado.

---

## Flujo de Encuesta (Ciclo de Vida)

1. **Creación**: Usuario crea encuesta con título, preguntas y configuración.
2. **Publicación**: Se genera slug único de 6 caracteres, cambia estado a `published`.
3. **Compartir**: Link directo, QR, exportación, fork por otros usuarios.
4. **Respuesta**: Usuarios acceden vía `/p/{slug}`, validan acceso, responden.
5. **Resultados**: Visualización de resultados agregados (creador) o públicos.
6. **Edición**: Si no hay respuestas, se edita directamente. Si hay respuestas, se crea nueva versión.
7. **Archivado**: Se cierra la encuesta para nuevas respuestas.

---

## Sugerencias de Nuevas Funcionalidades

### Prioridad Alta

1. **Página "Mi Perfil" completa**
   - Actualmente es un placeholder (`_protected/user/me.tsx`).
   - Agregar: historial de encuestas respondidas, preferencias (tema, idioma).

2. **Notificaciones en tiempo real**
   - Notificar al creador cuando alguien responde su encuesta.
   - Notificar cuando una invitación a organización es aceptada.
   - Usar WebSockets o Server-Sent Events.

3. **Panel de análisis avanzado**
   - Gráficos interactivos por tipo de pregunta (barras, pastel, líneas).
   - Exportación de resultados a PDF.
   - Tiempo promedio de respuesta.
   - Tasa de abandono por pregunta.
   - Filtros temporales y por segmento de usuarios.

4. **Preguntas condicionales (branching)**
   - Mostrar/ocultar preguntas según respuestas anteriores.
   - Flujos de encuesta adaptativos.

### Prioridad Media

5. **Multilenguaje (i18n)**
   - Soporte para múltiples idiomas en la interfaz.
   - Encuestas multi-idioma (el usuario responde en su idioma).

6. **Templates de encuestas**
   - Biblioteca de plantillas prediseñadas (NPS, feedback, registro, quiz).
   - Permitir guardar encuestas como plantillas reutilizables.

7. **Colaboración en tiempo real en el editor**
   - Varios usuarios editando la misma encuesta simultáneamente.
   - Similar a Google Docs.

8. **Límite de respuestas por opción**
   - Configurar cupo máximo por opción (ej. "máximo 50 personas pueden elegir esta opción").

9. **Modo encuesta anónima**
   - Respuestas completamente anónimas (sin asociar al usuario).
   - Actualmente todas las respuestas se vinculan al `userId`.

10. **Encuestas embed**
    - Código iframe para embeber encuestas en sitios externos.
    - Script con auto-height responsivo.

### Prioridad Baja

11. **App móvil nativa**
    - Usar Expo para crear app mobile conectada al mismo backend.

12. **Gamificación**
    - Badges por completar encuestas, puntos, rankings.

13. **API pública**
    - API REST pública para integraciones de terceros.
    - Tokens de API por usuario/organización.

14. **Webhooks**
    - Notificar sistemas externos cuando se reciben respuestas.
    - Integración con Zapier/Make.

15. **Modo quizz (evaluación)**
    - Preguntas con respuestas correctas/incorrectas.
    - Puntuación automática y feedback al encuestado.

16. **Encuestas programadas**
    - Programar publicación y cierre automático.
    - Envío automático por email a participantes.

17. **Importación desde otros servicios**
    - Google Forms, Typeform, SurveyMonkey, Microsoft Forms.

18. **Firma digital en respuestas**
    - Para encuestas oficiales que requieren autenticación reforzada.

19. **Dashboard público de resultados**
    - Página pública con resultados en tiempo real (ej. elecciones, votaciones).

20. **Integración con calendario**
    - Agregar fechas de encuestas a Google Calendar / Outlook.
