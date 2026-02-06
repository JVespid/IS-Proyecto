# Arquitectura del Sistema de Pase de Lista con QR

## 📐 Visión General

Este sistema está construido con **Next.js 16** (App Router), **Supabase** como backend, y será desplegado en **Vercel**. Utiliza una arquitectura modular y escalable basada en servicios.

**Estado Actual:** Fase de Implementación de UI - Diseñando pantallas con especificaciones absolutas mientras se mantiene la arquitectura funcional existente.

---

## 🏗️ Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTACIÓN                          │
│  (Páginas, Componentes UI, Hooks personalizados)       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    LÓGICA DE NEGOCIO                     │
│     (API Routes, Services, Validaciones)                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    INTEGRACIÓN                           │
│  (Supabase Client, QR Generator, Web Scraper)          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    DATOS                                 │
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
│   │   └── register/        # Página de registro
│   ├── (profesor)/          # Grupo de rutas de profesores
│   │   ├── dashboard/       # Panel del profesor
│   │   └── generar-qr/      # Generación de QR
│   ├── (alumno)/            # Grupo de rutas de alumnos
│   │   └── asistencia/[id]/ # Tomar asistencia
│   └── api/                 # API Routes
│       ├── auth/callback/   # Callback de auth
│       ├── attendance/      # Endpoints de asistencia
│       └── scraping/        # Endpoint de web scraping
│
├── components/              # Componentes React
│   ├── auth/               # Componentes de autenticación
│   ├── qr/                 # Componentes de QR
│   └── ui/                 # Componentes UI base
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
│   ├── qr/                # Sistema de QR
│   ├── scraping/          # Web scraping
│   └── utils/             # Utilidades generales
│
├── services/              # Capa de servicios
│   ├── professor.service.js
│   ├── student.service.js
│   ├── subject.service.js
│   ├── group.service.js
│   ├── session.service.js
│   └── attendance.service.js
│
└── constants/             # Constantes y configuración
    └── config.js
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

### Flujo 2: Generación de QR (Profesor)

```
Profesor → /generar-qr
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

### Flujo 3: Registro de Asistencia (Alumno)

```
Alumno escanea QR del profesor
   ↓
Redirige a: /asistencia/[sessionId]?signature=xxx&timestamp=xxx
   ↓
[AsistenciaPage] Carga
   ↓
GET /api/attendance/validate-session
   ↓
qr/validator.validateQRCode()
  1. Valida firma
  2. Verifica que no haya expirado
   ↓
session.service.isSessionActive()
  1. Verifica que sesión existe en BD
  2. Verifica que status='active'
   ↓
Si válido: Muestra QRScanner
   ↓
Alumno escanea QR de su credencial
   ↓
[QRScanner] Detecta QR con URL
   ↓
POST /api/scraping/extract-student
   ↓
scraping/scraper.extractStudentData()
  1. Hace HTTP request a la URL
  2. Parsea HTML con cheerio
  3. Busca <div class="boleta">
  4. Extrae texto (número de boleta)
  5. Valida y sanitiza
   ↓
Retorna: {reportCard, fullName, scannedUrl}
   ↓
Muestra datos para confirmación
   ↓
Alumno confirma
   ↓
POST /api/attendance/record
   ↓
student.service.getOrCreateStudent()
  1. Busca estudiante por boleta
  2. Si no existe, lo crea con UUID
   ↓
attendance.service.checkDuplicate()
  1. Verifica si ya pasó lista en esta sesión
   ↓
Si no es duplicado:
  attendance.service.recordAttendance()
  1. Crea registro en TakeAttendance
  2. Guarda datos completos en campo JSON
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
├── group (nombre)
└── created_at

CurrentGroup (Sesiones de pase de lista)
├── id (UUID, PK)
├── subjectId (FK → Subject)
├── groupId (FK → Group)
├── professorId (FK → Professors)
├── status (active|closed|expired)
└── created_at

TakeAttendance
├── id (UUID, PK)
├── studentId (FK → Students)
├── currentGroupId (FK → CurrentGroup)
├── takeAttendanceStudentData (JSON)
│   ├── reportCard
│   ├── fullName
│   ├── scannedUrl
│   ├── scannedAt
│   └── additionalData
└── created_at
```

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

## 🚦 Estados y Flujos de Estado

### Estado de Sesión (CurrentGroup.status)

- **active**: Sesión activa, alumnos pueden registrarse
- **closed**: Sesión cerrada manualmente por profesor
- **expired**: Sesión expiró por tiempo

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

- **validating**: Validando sesión
- **scan**: Listo para escanear credencial
- **confirm**: Datos extraídos, esperando confirmación
- **success**: Asistencia registrada
- **error**: Error en el proceso

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

### Próximas Features Planificadas

1. **Dashboard de Asistencias**
   - Visualización de asistencias por sesión
   - Filtros por fecha, materia, grupo
   - Estadísticas (promedio de asistencia, etc.)

2. **Gestión de Materias/Grupos**
   - CRUD completo de materias
   - CRUD completo de grupos
   - Asignación de grupos a materias

3. **Reportes**
   - Exportar a PDF/Excel
   - Reportes por alumno
   - Reportes por periodo

4. **Notificaciones**
   - Email al alumno al registrar asistencia
   - Recordatorios a profesores

5. **PWA**
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
- Rutas grupadas para organización
- Middleware nativo
- API Routes integradas

### ¿Por qué Supabase?

- PostgreSQL completo
- Auth integrado
- RLS para seguridad
- Real-time capabilities (futuro)
- Fácil deploy

### ¿Por qué Tailwind CSS?

- Utility-first para prototipado rápido
- Fácil de personalizar después
- Consistencia de estilos
- Pequeño bundle size

### ¿Por qué firma de QR?

- Previene QR falsificados
- Seguridad sin autenticación del alumno
- Expiración automática
- No requiere conexión constante a BD

---

## 📈 Escalabilidad

### Actual

- Soporta miles de usuarios concurrentes (Vercel + Supabase)
- Web scraping con reintentos y timeout
- RLS en base de datos

### Futuras Mejoras

- Cache de Redis para sesiones frecuentes
- Queue system para web scraping masivo
- CDN para imágenes de QR
- Load balancing en múltiples regiones

---

Este documento será actualizado conforme el proyecto evolucione en futuras fases.
