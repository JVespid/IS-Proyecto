# Arquitectura del Sistema de Pase de Lista con QR

## 📐 Visión General

Este sistema está construido con **Next.js 16** (App Router), **Supabase** como backend, y será desplegado en **Vercel**. Utiliza una arquitectura modular y escalable basada en servicios.

**Estado Actual:** Fase de Implementación Avanzada

- ✅ Sistema de autenticación funcional
- ✅ Generación y validación de QR criptográficos
- ✅ Registro de asistencia diaria con historial
- ✅ Gestión completa de grupos (crear/editar/importar estudiantes)
- ✅ Componentes UI completos y reutilizables
- ✅ Dashboard de visualización de asistencias (en progreso)
- 🚧 Sistema de reportes y exportación (planificado)

---

## 🏗️ Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTACIÓN                          │
│  (Páginas, Componentes UI, Hooks personalizados)        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   LÓGICA DE NEGOCIO                     │
│     (API Routes, Services, Validaciones)                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    INTEGRACIÓN                          │
│  (Supabase Client, QR Generator, Web Scraper)           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    DATOS                                │
│         (Supabase PostgreSQL + Auth)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Grupo de rutas de autenticación
│   │   ├── login/           # Página de login
│   │   ├── register/        # Página de registro
│   │   └── logout/          # Logout route
│   ├── (profesor)/          # Grupo de rutas de profesores
│   │   ├── dashboard/       # Panel del profesor
│   │   ├── createGroup/     # Crear nuevo grupo
│   │   ├── editGroup/       # Editar grupo existente
│   │   │   └── [groupId]/   # Parámetro dinámico de grupo
│   │   ├── list/            # Listar grupos y asistencias
│   │   ├── generar-qr/      # Generación de QR (legacy)
│   │   └── QR/              # Generación y gestión de QR
│   ├── (alumno)/            # Grupo de rutas de alumnos
│   │   └── asistencia/      # Sistema de asistencia
│   │       ├── [sessionId]/ # Validar sesión y mostrar info
│   │       ├── scan/        # Escanear QR de credencial
│   │       ├── validate/    # Validar y confirmar datos
│   │       └── result/      # Resultado de registro
│   ├── api/                 # API Routes
│   │   ├── auth/callback/   # Callback de auth
│   │   ├── attendance/      # Endpoints de asistencia
│   │   │   ├── create-session/  # Crear sesión
│   │   │   ├── validate-qr/     # Validar QR de sesión
│   │   │   ├── validate-session/ # Validar sesión activa
│   │   │   ├── mark/            # Marcar asistencia diaria
│   │   │   └── record/          # Registrar asistencia
│   │   └── scraping/        # Endpoint de web scraping
│   │       └── extract-student/ # Extraer datos de credencial
│   ├── layout.js            # Layout raíz
│   ├── page.js              # Página de inicio
│   ├── not-found.js         # Página 404
│   └── globals.css          # Estilos globales
│
├── components/              # Componentes React
│   ├── auth/               # Componentes de autenticación
│   │   └── AuthProvider.js # Provider de autenticación
│   ├── forms/              # Formularios complejos
│   │   └── GroupForm.js    # Formulario de crear/editar grupo
│   ├── qr/                 # Componentes de QR
│   │   ├── QRGenerator.js  # Generador de códigos QR
│   │   └── QRScanner.js    # Escáner de QR
│   └── ui/                 # Componentes UI base
│       ├── AppleIcons.js   # Iconos estilo Apple
│       ├── AttendanceIcons.js # Iconos de asistencia
│       ├── Autocomplete.js # Input con autocompletado
│       ├── Badge.js        # Insignias y etiquetas
│       ├── Button.js       # Botones
│       ├── Card.js         # Tarjetas
│       ├── DropdownMenu.js # Menús desplegables
│       ├── Input.js        # Inputs de texto
│       ├── Modal.js        # Modales/diálogos
│       ├── Select.js       # Selectores
│       ├── Spinner.js      # Indicadores de carga
│       └── Table.js        # Tablas
│
├── contexts/               # React Contexts
│   └── AuthContext.js      # Contexto de autenticación
│
├── hooks/                  # Custom Hooks
│   ├── useAuth.js          # Hook de autenticación
│   ├── useCamera.js        # Hook de cámara
│   └── useQRScanner.js     # Hook de escáner QR
│
├── lib/                    # Librerías y utilidades
│   ├── supabase/          # Clientes de Supabase
│   │   ├── client.js      # Cliente del navegador
│   │   ├── server.js      # Cliente del servidor
│   │   ├── admin.js       # Cliente admin
│   │   └── middleware.js  # Cliente para middleware
│   ├── qr/                # Sistema de QR
│   │   ├── generator.js   # Generación de QR
│   │   └── validator.js   # Validación de QR
│   ├── scraping/          # Web scraping
│   │   └── scraper.js     # Extracción de datos
│   └── utils/             # Utilidades generales
│       ├── crypto.js      # Funciones de encriptación
│       └── validators.js  # Schemas de validación (Zod)
│
├── services/              # Capa de servicios
│   ├── professor.service.js      # Gestión de profesores
│   ├── student.service.js        # Gestión de estudiantes
│   ├── subject.service.js        # Gestión de materias
│   ├── group.service.js          # Gestión de grupos
│   ├── session.service.js        # Gestión de sesiones (CurrentGroup)
│   ├── attendance.service.js     # Gestión de asistencias
│   └── dailyAttendance.service.js # Gestión de asistencia diaria
│
├── constants/             # Constantes y configuración
│   └── config.js         # Configuración global
│
└── middleware.js         # Middleware de Next.js (protección de rutas)
```

---

## 🔄 Flujos de Funcionamiento

### Flujo 1: Autenticación del Profesor

```
Usuario → /login
   ↓
[LoginPage] Ingresa credenciales
   ↓
AuthContext.login()
   ↓
Supabase Auth.signInWithPassword()
   ↓
Supabase valida credenciales
   ↓
Obtiene user de Auth
   ↓
professor.service.findByEmail()
   ↓
Carga datos del profesor
   ↓
Redirige a /dashboard
```

### Flujo 2: Gestión de Grupos (NUEVO)

```
Profesor → /createGroup o /editGroup/[groupId]
   ↓
[GroupForm] Carga formulario
   ↓
Si modo = 'edit':
  - Cargar CurrentGroup existente
  - Cargar estudiantes inscritos (TakeAttendance)
   ↓
Profesor ingresa/edita:
  - Grupo (5 caracteres alfanuméricos - validación estricta)
  - Carrera
  - Materia (Autocomplete + creación dinámica)
  - Plan de estudios
  - Periodo escolar
   ↓
Profesor carga estudiantes:
  OPCIÓN A: Archivo Excel/CSV
    - Columnas: Nombre, Boleta
    - Validación: boleta de 8+ dígitos
    - Filtrado de duplicados
  OPCIÓN B: Agregar manualmente
    - Modal con campos Nombre y Boleta
    - Validación en tiempo real
   ↓
[handleSaveGroup] Guardar
   ↓
Si modo = 'create':
  session.service.createSession()
    → Crea CurrentGroup
    → Retorna sessionId/groupId
Si modo = 'edit':
  session.service.updateSession()
    → Actualiza CurrentGroup
   ↓
Procesar estudiantes nuevos:
  Para cada estudiante:
    student.service.getOrCreateStudent(nombre, boleta)
    attendance.service.recordAttendance(studentId, groupId, {...})
      → Crea registro en TakeAttendance
      → Si modo='edit': Sincroniza con registros existentes
         (copia estructura de fechas de otros estudiantes)
   ↓
Actualizar números de lista:
  attendance.service.updateNumberOfList()
   ↓
Redirige a /dashboard o callback onSuccess
```

### Flujo 3: Generación de QR (Profesor)

```
Profesor → /generar-qr o /QR
   ↓
[GenerarQRPage] Selecciona materia/grupo
   ↓
Submit Form
   ↓
POST /api/attendance/create-session
   ↓
session.service.createSession()
   ↓
Crea registro en CurrentGroup (status='active')
   ↓
Retorna sessionId
   ↓
[QRGenerator] Genera QR
   ↓
qr/generator.generateSessionQR()
   ↓
  1. Genera payload: {sessionId, timestamp, expiresAt}
  2. Firma payload con HMAC-SHA256
  3. Crea URL: /asistencia/[sessionId]?signature=xxx&timestamp=xxx
  4. Genera imagen QR con librería qrcode
   ↓
Muestra QR en pantalla
```

### Flujo 4: Registro de Asistencia Diaria (Alumno) - ACTUALIZADO

```
Alumno escanea QR del profesor
   ↓
Redirige a: /asistencia/[sessionId]?signature=xxx&timestamp=xxx
   ↓
[AsistenciaPage] Carga
   ↓
GET /api/attendance/validate-qr
   ↓
qr/validator.validateQRCode()
  1. Valida firma HMAC-SHA256
  2. Verifica que no haya expirado (timestamp + duración)
   ↓
session.service.isSessionActive()
  1. Verifica que sesión existe en BD
  2. Verifica que status='ACTIVE'
   ↓
dailyAttendance.service.hasDateRecord()
  1. Extrae fecha actual: AAMMDD
  2. Busca en takeAttendanceStudentData de cualquier alumno
  3. Verifica si existe registro para hoy
   ↓
Si NO existe registro de hoy:
  dailyAttendance.service.createDailyRecords()
    Para cada estudiante inscrito:
      - Obtener takeAttendanceStudentData (array)
      - Agregar objeto: {attended: false, absent: true, delayed: false, date: "AAMMDD-HH:MM"}
      - Actualizar TakeAttendance
   ↓
Retorna: {valid: true, requiresSetup: boolean}
   ↓
Si válido: Redirige a /asistencia/scan
   ↓
[QRScanner] Solicita permiso de cámara
   ↓
Alumno escanea QR de su credencial
   ↓
[QRScanner] Detecta QR con URL
   ↓
POST /api/scraping/extract-student
   ↓
scraping/scraper.extractStudentData()
  1. Hace HTTP request a la URL de la credencial
  2. Parsea HTML con cheerio
  3. Busca <div class="boleta">
  4. Extrae texto (número de boleta)
  5. Busca nombre completo
  6. Valida y sanitiza
   ↓
Retorna: {reportCard, fullName, scannedUrl}
   ↓
Redirige a /asistencia/validate con datos
   ↓
Alumno revisa y confirma datos
   ↓
POST /api/attendance/mark
   ↓
student.service.getOrCreateStudent()
  1. Busca estudiante por boleta
  2. Si no existe, lo crea con UUID
   ↓
dailyAttendance.service.markAttendance()
  1. Obtiene registro de TakeAttendance del estudiante
  2. Busca en takeAttendanceStudentData el objeto con fecha de hoy
  3. Actualiza: {attended: true, absent: false, delayed: false, date: "AAMMDD-HH:MM"}
  4. Guarda en BD
   ↓
Redirige a /asistencia/result
   ↓
Muestra confirmación: "¡Asistencia registrada!"
```

---

## 🔐 Seguridad

### Capa 1: Autenticación (Supabase Auth)

- Email/Password authentication
- JWT tokens en cookies HTTP-only
- Refresh token automático

### Capa 2: Autorización (RLS - Row Level Security)

Políticas en Supabase:

- Profesores solo ven sus propios datos
- Estudiantes solo ven su propia asistencia
- Sesiones activas son públicas (para validación)
- Inserción de asistencia es pública (alumnos no autenticados)

### Capa 3: Middleware de Next.js

- Protege rutas de profesor (`/dashboard`, `/generar-qr`)
- Redirige a `/login` si no autenticado
- Valida sesión de Supabase en cada request

### Capa 4: Validación de QR

- **Firma criptográfica**: Cada QR tiene firma HMAC-SHA256
- **Timestamp**: Previene uso de QR antiguos
- **Expiración**: QR expira según duración configurada
- **Validación en servidor**: Siempre se verifica en backend

### Capa 5: Validación de Datos (Zod)

- Todos los inputs se validan con schemas
- Sanitización de strings para prevenir XSS
- Validación de UUIDs, emails, URLs
- Validaciones en tiempo real en formularios:
  - **Grupo**: Exactamente 5 caracteres alfanuméricos, filtrado automático
  - **Boleta**: Mínimo 8 dígitos numéricos
  - **Nombre**: Requerido, sin caracteres especiales peligrosos
  - **numberOfList**: String numérico positivo

---

## 🗄️ Modelo de Datos

### Entidades Principales

```
Professors
├── id (UUID, PK)
├── name
├── lastName
├── email (único, vinculado a Auth)
└── created_at

Students
├── id (UUID, PK, generado manualmente)
├── fullName
├── reportCard (número de boleta, único)
└── created_at

Subject
├── id (UUID, PK)
├── Subject (nombre)
└── created_at

Group
├── id (UUID, PK)
├── group (nombre - 5 caracteres alfanuméricos)
└── created_at

CurrentGroup (Sesiones de pase de lista)
├── id (UUID, PK)
├── subjectId (FK → Subject)
├── groupId (FK → Group)
├── professorId (FK → Professors)
├── status (ACTIVE|INACTIVE)
├── curriculum (varchar, opcional)
├── schoolPeriod (varchar, opcional)
├── degree (varchar, opcional)
├── school (varchar, default: 'ESCUELA SUPERIOR...')
├── institute (varchar, default: 'INSTITUTO POLITECNICO...')
└── created_at

TakeAttendance
├── id (UUID, PK)
├── studentId (FK → Students)
├── currentGroupId (FK → CurrentGroup)
├── numberOfList (string numérico, opcional - número de lista del estudiante)
├── takeAttendanceStudentData (JSONB - Array de registros diarios)
│   └── [
│         {
│           attended: boolean,     // Presente
│           absent: boolean,       // Ausente
│           delayed: boolean,      // Retardo
│           date: string          // Formato: AAMMDD-HH:MM (ej: "260220-14:30")
│         },
│         ...
│       ]
└── created_at
```

### Estructura de takeAttendanceStudentData (ACTUALIZADO)

El campo `takeAttendanceStudentData` ahora almacena un **array de registros diarios** en lugar de un objeto único. Cada elemento representa un día de clase:

```javascript
takeAttendanceStudentData: [
  {
    attended: true,      // El alumno asistió
    absent: false,       // No estuvo ausente
    delayed: false,      // No llegó tarde
    date: "260220-14:30" // 20 de febrero de 2026 a las 14:30
  },
  {
    attended: false,
    absent: true,
    delayed: false,
    date: "270220-14:35" // 21 de febrero de 2026 a las 14:35
  },
  {
    attended: true,
    absent: false,
    delayed: true,       // Llegó tarde pero asistió
    date: "280220-14:45" // 22 de febrero de 2026 a las 14:45
  }
]
```

**Formato de fecha:** `AAMMDD-HH:MM`

- `AA`: Últimos 2 dígitos del año
- `MM`: Mes (01-12)
- `DD`: Día (01-31)
- `HH:MM`: Hora en formato 24h

**Comportamiento:**

1. Al validar QR por primera vez en el día, se crean registros con `absent: true` para todos los estudiantes
2. Cuando un estudiante escanea su credencial, se actualiza su registro del día a `attended: true`
3. Los profesores pueden modificar el estado (`delayed`) posteriormente

### Relaciones

```
Professors (1) → (N) CurrentGroup
Subject (1) + Group (1) + Professor (1) → (N) CurrentGroup
CurrentGroup (1) → (N) TakeAttendance
Students (1) → (N) TakeAttendance
```

---

## 🔧 Tecnologías Utilizadas

### Frontend

- **Next.js 16** - Framework React con App Router
- **React 19** - Biblioteca de UI
- **Tailwind CSS 4** - Estilos
- **html5-qrcode** - Escáner de QR en navegador
- **qrcode** - Generación de QR
- **xlsx** - Importación de archivos Excel/CSV

### Backend

- **Next.js API Routes** - Endpoints
- **Supabase** - Base de datos + Auth
- **Zod** - Validación de schemas
- **cheerio** - Parsing de HTML (web scraping)
- **axios** - HTTP client

### Seguridad

- **crypto-js** - Encriptación y firma
- **HMAC-SHA256** - Firma de QR
- **Supabase RLS** - Row Level Security

### Deploy

- **Vercel** - Hosting y CI/CD
- **Supabase Cloud** - Base de datos

---

## 📦 Servicios de la Aplicación

### attendance.service.js

Gestiona inscripciones de estudiantes a grupos (TakeAttendance)

- `recordAttendance()` - Inscribir estudiante a un grupo
- `getBySession()` - Obtener estudiantes de un grupo
- `remove()` - Eliminar inscripción
- `updateNumberOfList()` - Actualizar número de lista

### dailyAttendance.service.js (NUEVO)

Gestiona registros de asistencia diaria dentro de takeAttendanceStudentData

- `formatDateForAttendance()` - Genera fecha en formato AAMMDD-HH:MM
- `extractDateOnly()` - Extrae solo AAMMDD de una fecha
- `hasDateRecord()` - Verifica si existe registro para un día específico
- `createDailyRecords()` - Crea registros de ausencia para todos los estudiantes
- `markAttendance()` - Marca asistencia de un estudiante en una fecha
- `getAttendanceByDate()` - Obtiene registro de asistencia de un alumno en una fecha

### session.service.js

Gestiona sesiones de pase de lista (CurrentGroup)

- `createSession()` - Crear nueva sesión
- `update()` - Actualizar sesión existente
- `isSessionActive()` - Verificar si sesión está activa
- `getById()` - Obtener sesión por ID
- `getByProfessor()` - Obtener sesiones de un profesor

### professor.service.js

Gestiona profesores

- `findByEmail()` - Buscar profesor por email
- `create()` - Crear nuevo profesor

### student.service.js

Gestiona estudiantes

- `getOrCreateStudent()` - Buscar o crear estudiante por boleta
- `getByReportCard()` - Buscar por número de boleta

### subject.service.js

Gestiona materias

- `getAll()` - Listar todas las materias
- `getOrCreate()` - Buscar o crear materia

### group.service.js

Gestiona grupos

- `getAll()` - Listar todos los grupos
- `getOrCreate()` - Buscar o crear grupo

---

## 🚦 Estados y Flujos de Estado

### Estado de Sesión (CurrentGroup.status)

- **ACTIVE**: Sesión activa, alumnos pueden registrarse
- **INACTIVE**: Sesión cerrada (manual o por inactividad)

### Estado de Autenticación

- **loading**: Verificando sesión inicial
- **authenticated**: Usuario autenticado
- **unauthenticated**: Sin sesión

### Estado de Escáner QR

- **idle**: No iniciado
- **requesting**: Solicitando permiso de cámara
- **granted**: Permiso concedido, escaneando
- **denied**: Permiso denegado

### Estado de Asistencia

- **validating**: Validando sesión del QR
- **scan**: Listo para escanear credencial del alumno
- **confirm**: Datos extraídos, esperando confirmación
- **success**: Asistencia registrada
- **error**: Error en el proceso

### Estado de Registro Diario (takeAttendanceStudentData)

- **absent**: `{attended: false, absent: true, delayed: false}` - Estado inicial del día
- **attended**: `{attended: true, absent: false, delayed: false}` - Alumno presente
- **delayed**: `{attended: true, absent: false, delayed: true}` - Alumno llegó tarde

---

## 📊 Logging y Debugging

El sistema incluye logging estructurado en desarrollo:

```javascript
log(MODULE_NAME, 'Mensaje', { data: value });
logError(MODULE_NAME, 'Error', errorObject);
```

Todos los logs incluyen:

- Timestamp
- Módulo que genera el log
- Datos contextuales

En producción (`NODE_ENV=production`), los logs se deshabilitan automáticamente.

---

## 🔮 Extensibilidad

### Features Implementadas Recientemente

1. **✅ Gestión de Grupos**

   - CRUD completo de grupos (CurrentGroup)
   - Formulario compartido para crear/editar
   - Importación masiva desde Excel/CSV
   - Validación estricta de formato de grupo (5 caracteres alfanuméricos)
   - Sincronización de registros de asistencia entre estudiantes
2. **✅ Sistema de Asistencia Diaria**

   - Registro automático de ausencias al inicio del día
   - Actualización de asistencia en tiempo real
   - Historial completo por estudiante
   - Formato de fecha optimizado (AAMMDD-HH:MM)
3. **✅ Componentes UI Completos**

   - Autocomplete con creación dinámica
   - Modal para formularios
   - Sistema de iconos (Apple style + Attendance)
   - Tablas, Cards, Badges, DropdownMenus

### Próximas Features Planificadas

1. **Dashboard de Asistencias**

   - Visualización de asistencias por fecha
   - Vista de lista completa por grupo
   - Filtros por fecha, materia, grupo
   - Estadísticas (promedio de asistencia, retardos, ausencias)
   - Gráficas de tendencias
2. **Edición Manual de Asistencia**

   - Modificar estado de asistencia (presente/ausente/retardo)
   - Agregar notas por alumno/día
   - Justificar ausencias
   - Historial de modificaciones
3. **Reportes**

   - Exportar a PDF (lista de asistencia completa)
   - Exportar a Excel (datos tabulares)
   - Reportes por alumno (porcentaje de asistencia)
   - Reportes por periodo académico
4. **Gestión de Sesiones**

   - Panel de sesiones activas
   - Cerrar sesión manualmente
   - Configurar duración de QR por sesión
   - Historial de sesiones
5. **Notificaciones**

   - Email al alumno al registrar asistencia
   - Recordatorios a profesores
   - Alertas de baja asistencia
6. **PWA**

   - Instalable como app nativa
   - Funcionamiento offline limitado
   - Push notifications

### Puntos de Extensión

- **Services**: Agregar nuevos métodos o servicios
- **API Routes**: Crear nuevos endpoints
- **Components**: Componentes reutilizables listos para diseño
- **Hooks**: Custom hooks para nueva funcionalidad
- **Validaciones**: Schemas Zod extensibles

---

## 🎯 Decisiones de Diseño

### ¿Por qué Next.js App Router?

- Server Components para mejor performance
- Rutas grupadas para organización (`(profesor)`, `(alumno)`, `(auth)`)
- Middleware nativo para protección de rutas
- API Routes integradas

### ¿Por qué Supabase?

- PostgreSQL completo con tipos estrictos
- Auth integrado con RLS
- Real-time capabilities (futuro)
- Fácil deploy y escalamiento
- SDK completo para JavaScript

### ¿Por qué Tailwind CSS?

- Utility-first para prototipado rápido
- Fácil de personalizar después
- Consistencia de estilos garantizada
- Pequeño bundle size (tree-shaking)
- No requiere CSS modules

### ¿Por qué firma criptográfica de QR?

- Previene QR falsificados o manipulados
- Seguridad sin requerir autenticación del alumno
- Expiración automática por timestamp
- Validación en servidor (no confiar en cliente)
- No requiere conexión constante a BD

### ¿Por qué array de registros diarios en takeAttendanceStudentData?

- **Escalabilidad**: Un solo registro por estudiante-grupo, múltiples fechas
- **Performance**: Menos filas en BD, consultas más rápidas
- **Simplicidad**: Un UPDATE en lugar de INSERT por cada asistencia
- **Flexibilidad**: JSONB permite estructura flexible sin migraciones
- **Consultas**: Fácil filtrar/agregar registros por fecha con operadores JSONB

**Alternativa rechazada:** Tabla separada `DailyAttendance` con FK a TakeAttendance

- Requeriría múltiples JOINs para consultas
- Mayor complejidad en sincronización
- Más registros en BD (más costoso)

### ¿Por qué validación estricta de 5 caracteres alfanuméricos para grupos?

- **Consistencia**: Formato estandarizado (ej: `3CM12`, `2BM15`)
- **Prevención**: Evita datos inconsistentes en producción
- **Usabilidad**: Filtrado en tiempo real sin bloquear el flujo
- **Cumplimiento**: Alineado con nomenclatura institucional del IPN

### ¿Por qué formulario compartido (GroupForm) entre crear/editar?

- **DRY**: No duplicar lógica compleja
- **Consistencia**: Misma UX en ambos flujos
- **Mantenibilidad**: Un solo lugar para bugs y features
- **Reutilización**: Escalable a otros contextos (duplicar grupo, plantillas)

### ¿Por qué sincronización automática de registros de asistencia?

Cuando se agrega un estudiante a un grupo donde ya hay registros de fechas anteriores:

- El nuevo estudiante recibe automáticamente registros de ausencia para esas fechas
- Mantiene coherencia: todos los estudiantes tienen el mismo historial de fechas
- Facilita reportes: no hay "huecos" en los datos
- Realista: un estudiante que se inscribe tarde está ausente en clases previas

---

## � Importación y Exportación de Datos

### Importación de Estudiantes desde Excel/CSV

El sistema permite importar listas de estudiantes desde archivos Excel (.xlsx, .xls) o CSV:

**Formato Requerido:**

- Columna `Nombre` o `name` o `nombres` o `fullname`
- Columna `Boleta` o `reportcard` o `matricula` o `id`

**Características:**

- Detección automática de columnas (case-insensitive)
- Soporte UTF-8 para caracteres especiales (acentos, ñ)
- Validación de boletas (mínimo 8 dígitos)
- Filtrado de filas vacías o inválidas
- Detección de duplicados
- Feedback detallado de errores

**Proceso:**

1. Usuario selecciona archivo Excel/CSV
2. Sistema parsea con biblioteca `xlsx`
3. Valida estructura y datos
4. Filtra duplicados con estudiantes existentes
5. Asigna números de lista secuenciales
6. Agrega a lista temporal (no guarda hasta confirmar)
7. Usuario confirma y guarda grupo

**Librerías utilizadas:**

- `xlsx` - Lectura y parseo de archivos Excel/CSV

### Exportación de Datos (Planificado)

Funcionalidad en desarrollo para exportar:

- Listas de asistencia en PDF
- Reportes tabulares en Excel
- Resúmenes estadísticos en JSON

---

## 🀽� Escalabilidad

### Actual

- Soporta miles de usuarios concurrentes (Vercel + Supabase)
- Web scraping con reintentos y timeout
- RLS en base de datos

### Futuras Mejoras

- Cache de Redis para sesiones frecuentes
- Queue system para web scraping masivo
- CDN para imágenes de QR
- Load balancing en múltiples regiones
- Optimización de consultas JSONB con índices GIN

---

**Última actualización:** 4 de marzo de 2026
Este documento refleja el estado actual del proyecto y se actualiza continuamente conforme evolucionan las implementaciones.
