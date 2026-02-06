# 🤖 AI CONTEXT - Sistema de Pase de Lista con QR

> **DOCUMENTO CRÍTICO PARA ASISTENTES DE IA**  
> Lee este documento COMPLETO antes de hacer cualquier modificación al proyecto.  
> Última actualización: 2026-02-06

---

## 🚨 INFORMACIÓN CRÍTICA - LEE ESTO PRIMERO

### ⚠️ ESTADO DEL PROYECTO: **FASE DE IMPLEMENTACIÓN DE UI**

Este proyecto está en **fase de implementación de diseño**. Esto significa:

- ✅ **Core functionality está implementada** (100% funcional)
- 🎨 **Implementando diseños finales pantalla por pantalla** (diseños absolutos)
- ✅ **Mock data será reemplazado** conforme se implementen las pantallas
- 🎨 **Los diseños son ABSOLUTOS** - deben verse exactamente como se especifica
- 🚧 **Features avanzadas siguen PLANIFICADAS** (dashboard, reportes, etc.)

### 🛑 QUÉ **NO** HACER (REGLAS ESTRICTAS)

**NUNCA hagas esto sin confirmación explícita del usuario:**

1. ❌ **NO modifiques la arquitectura de servicios** - Está finalizada y probada
2. ❌ **NO cambies los schemas de Zod** - Son validaciones de negocio críticas
3. ❌ **NO modifiques la lógica de firma de QR** - Es el core de seguridad
4. ❌ **NO cambies la estructura de base de datos** - Usa Supabase migration si es necesario
5. ❌ **NO agregues librerías pesadas** sin consultar - El bundle debe ser ligero
6. ❌ **NO reemplaces Tailwind con CSS-in-JS** - Decisión arquitectónica tomada
7. ❌ **NO modifiques middleware.js** sin entender el flujo completo de auth
8. ❌ **NO cambies los clientes de Supabase** (client.js, server.js) - Configuración específica
9. ❌ **NO elimines logging de desarrollo** - Es crítico para debugging
10. ❌ **NO implementes features "avanzadas"** si no están en el roadmap acordado
11. ❌ **NO improvises diseños** - Los diseños son ABSOLUTOS y deben seguirse al pie de la letra

### ✅ QUÉ **SÍ** HACER (CÓMO CONTRIBUIR CORRECTAMENTE)

**Cuando el usuario pida ayuda, sigue estos principios:**

1. ✅ **SIEMPRE lee los archivos existentes** antes de crear nuevos
2. ✅ **SIGUE los patrones establecidos** (ver sección "Patrones y Convenciones")
3. ✅ **USA los servicios existentes** en lugar de duplicar lógica
4. ✅ **VALIDA con Zod** en todos los endpoints
5. ✅ **AGREGA logging** en funciones nuevas (usa el patrón existente)
6. ✅ **IMPLEMENTA diseños EXACTOS** - Los diseños son absolutos, no aproximados
7. ✅ **PREGUNTA si algo del diseño no está claro** antes de asumir
8. ✅ **DOCUMENTA decisiones** en comentarios si cambias algo importante
9. ✅ **USA Tailwind** con las clases exactas especificadas en el diseño
10. ✅ **REVISA píxel a píxel** que el resultado coincida con el diseño proporcionado

---

## 📊 ESTADO ACTUAL vs FUTURO

### ✅ FUNCIONALIDADES 100% COMPLETAS (NO TOCAR)

Estas funcionalidades están **finalizadas y en producción**:

| Funcionalidad | Archivos Clave | Estado | Notas |
|---------------|----------------|--------|-------|
| **Autenticación de Profesores** | `contexts/AuthContext.js`<br>`middleware.js`<br>`app/(auth)/*` | ✅ COMPLETO | Supabase Auth integrado, session management, protected routes |
| **Generación de QR Firmado** | `lib/qr/generator.js`<br>`lib/qr/validator.js`<br>`lib/utils/crypto.js` | ✅ COMPLETO | HMAC-SHA256, expiración, payload firmado |
| **Registro de Asistencia** | `app/(alumno)/asistencia/[sessionId]/page.js`<br>`app/api/attendance/record/route.js` | ✅ COMPLETO | Flujo completo: validar → escanear → confirmar → guardar |
| **Web Scraping de Credenciales** | `lib/scraping/scraper.js`<br>`app/api/scraping/extract-student/route.js` | ✅ COMPLETO | Extrae boleta de HTML con cheerio, reintentos, timeout |
| **Servicios de Datos (6)** | `services/*.service.js` | ✅ COMPLETO | CRUD completo para todas las tablas, validación, logging |
| **Validación de Datos** | `lib/utils/validators.js` | ✅ COMPLETO | 15+ schemas Zod para todas las entidades |
| **Clientes Supabase** | `lib/supabase/client.js`<br>`lib/supabase/server.js` | ✅ COMPLETO | Configuración SSR, cookies, auth helpers |
| **Componentes QR** | `components/qr/QRGenerator.js`<br>`components/qr/QRScanner.js` | ✅ COMPLETO | Funcionalidad completa (estilos básicos) |
| **Hooks Personalizados** | `hooks/useAuth.js`<br>`hooks/useQRScanner.js`<br>`hooks/useCamera.js` | ✅ COMPLETO | Lógica reutilizable extraída |

**REGLA:** Si modificas estos archivos, **DEBES** mantener la funcionalidad existente intacta.

---

### ⚠️ FUNCIONALIDADES CON MOCK DATA (TEMPORAL)

Estas funcionalidades **FUNCIONAN** pero usan **datos temporales**:

#### 1. **Selección de Materias/Grupos** (`app/(profesor)/generar-qr/page.js`)

**Líneas 31-38:**
```javascript
// ⚠️ MOCK DATA - TEMPORAL
const mockSubjects = [
  { value: '1', label: 'Matemáticas' },
  { value: '2', label: 'Programación' },
];
const mockGroups = [
  { value: '1', label: 'Grupo 1' },
  { value: '2', label: 'Grupo 2' },
];
```

**Cómo reemplazar cuando se pida:**
```javascript
// ✅ REEMPLAZO CORRECTO
'use client';
import { useState, useEffect } from 'react';
import { subjectService } from '@/services/subject.service';
import { groupService } from '@/services/group.service';
import { createBrowserClient } from '@/lib/supabase/client';

export default function GenerarQRPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient();
      
      // Cargar materias del profesor actual
      const professorData = await professorService.findByEmail(supabase, user.email);
      const subjectsData = await subjectService.getByProfessorId(supabase, professorData.id);
      
      // Cargar todos los grupos
      const groupsData = await groupService.getAll(supabase);
      
      setSubjects(subjectsData.map(s => ({ value: s.id, label: s.Subject })));
      setGroups(groupsData.map(g => ({ value: g.id, label: g.group })));
      setLoading(false);
    }
    
    if (user) loadData();
  }, [user]);
  
  // ... resto del componente
}
```

**UBICACIÓN:** `src/app/(profesor)/generar-qr/page.js`  
**SERVICIOS DISPONIBLES:** `subject.service.js`, `group.service.js` (ya implementados)  
**PRIORIDAD:** 🔴 Alta (MVP bloqueado)

---

#### 2. **Formulario de Registro Pre-llenado** (`app/(auth)/register/page.js`)

**Líneas 19-22:**
```javascript
// ⚠️ DATOS DE PRUEBA - TEMPORAL
const [formData, setFormData] = useState({
  name: 'Bernardo',
  lastName: 'Lopez',
  email: 'bernardo.abel.ls1@gmail.com',
  password: 'wa ha ha123',
});
```

**Cómo reemplazar cuando se pida:**
```javascript
// ✅ REEMPLAZO CORRECTO - Campos vacíos
const [formData, setFormData] = useState({
  name: '',
  lastName: '',
  email: '',
  password: '',
});
```

**UBICACIÓN:** `src/app/(auth)/register/page.js`  
**PRIORIDAD:** 🟡 Media (cosmético, no afecta funcionalidad)

---

### 🚧 FUNCIONALIDADES NO IMPLEMENTADAS (FUTURAS)

Estas funcionalidades **NO existen** aún. NO las implementes sin aprobación:

| Feature | Estado | Archivos a Crear | Prioridad | Notas |
|---------|--------|------------------|-----------|-------|
| **Dashboard de Asistencias** | ❌ NO EXISTE | `app/(profesor)/sesiones/[id]/page.js`<br>`app/api/attendance/list/route.js` | 🔴 Alta | Ver asistencias de una sesión, tabla de alumnos, estadísticas |
| **Gestión de Materias (UI)** | ❌ NO EXISTE | `app/(profesor)/materias/page.js` | 🔴 Alta | CRUD de materias (servicio ya existe) |
| **Gestión de Grupos (UI)** | ❌ NO EXISTE | `app/(profesor)/grupos/page.js` | 🔴 Alta | CRUD de grupos (servicio ya existe) |
| **Cerrar Sesión Manualmente** | ❌ NO EXISTE | Botón en UI + endpoint | 🟡 Media | Servicio `closeSession()` ya existe |
| **Perfil de Profesor** | ❌ NO EXISTE | `app/(profesor)/perfil/page.js` | 🟢 Baja | Editar datos, cambiar contraseña |
| **Reportes y Exportación** | ❌ NO EXISTE | Múltiples archivos | 🟢 Baja | PDF, Excel, gráficas |
| **Notificaciones** | ❌ NO EXISTE | Integración email/push | 🟢 Baja | Requiere servicio externo |
| **PWA Features** | ❌ NO EXISTE | Service Worker, manifest | 🟢 Baja | Fase futura |

**REGLA:** Si el usuario pide una de estas features, **pregunta primero** si quiere implementarla o si es solo consulta.

---

### 🎨 COMPONENTES UI: IMPLEMENTACIÓN DE DISEÑOS

**ESTADO ACTUAL:** Implementando componentes según diseños absolutos proporcionados pantalla por pantalla.

| Componente | Archivo | Estado | Notas |
|------------|---------|--------|-------|
| **Button** | `ui/Button.js` | ✅ BASE | Se modificará según diseños proporcionados |
| **Card** | `ui/Card.js` | ✅ BASE | Se modificará según diseños proporcionados |
| **Input** | `ui/Input.js` | ✅ BASE | Se modificará según diseños proporcionados |
| **Select** | `ui/Select.js` | ✅ BASE | Se modificará según diseños proporcionados |
| **Spinner** | `ui/Spinner.js` | ✅ BASE | Se modificará según diseños proporcionados |

**COMPONENTES PENDIENTES** (se crearán cuando el diseño los requiera):
- ⏳ Modal/Dialog - Esperar especificaciones
- ⏳ Toast/Alert (`react-hot-toast` instalado) - Esperar especificaciones
- ⏳ Table - Esperar especificaciones
- ⏳ Tabs - Esperar especificaciones
- ⏳ Badge - Esperar especificaciones
- ⏳ Dropdown - Esperar especificaciones

**REGLAS DE IMPLEMENTACIÓN DE DISEÑOS:**
- ✅ **USAR:** Clases Tailwind EXACTAS según especificaciones del diseño
- ✅ **SEGUIR:** Diseños al pie de la letra - colores, espaciado, tipografía, bordes, sombras
- ✅ **VALIDAR:** Que el resultado coincida píxel a píxel con el diseño
- ❌ **NO IMPROVISAR:** Esperar especificaciones del usuario para cualquier elemento visual
- ❌ **NO USAR:** CSS modules, styled-components, emotion
- ❌ **NO AGREGAR:** Librerías de componentes (shadcn/ui, Chakra, MUI) sin consultar
- ⚠️ **PREGUNTAR:** Si algo no está claro en el diseño en lugar de asumir

**🚨 REGLA CRÍTICA PARA COMPONENTES UI:**

**Los estilos personalizados SIEMPRE deben tener prioridad sobre los estilos predeterminados.**

Cuando crees o modifiques componentes UI (Button, Input, Card, etc.), DEBES implementar un sistema que permita sobrescribir completamente los estilos predeterminados. 

**PATRÓN OBLIGATORIO:**

```javascript
// ✅ CORRECTO - Permite sobrescribir estilos predeterminados
export default function Button({ 
  className = '', 
  unstyled = false, // Prop para desactivar estilos predeterminados
  variant = 'primary',
  ...props 
}) {
  // Si unstyled es true, solo usar estilos personalizados
  if (unstyled) {
    return <button className={className} {...props} />;
  }
  
  // Estilos predeterminados
  const baseStyles = 'px-4 py-2 rounded';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props} 
    />
  );
}
```

**USO:**

```javascript
// Con estilos predeterminados
<Button variant="primary">Click me</Button>

// Con estilos completamente personalizados
<Button 
  unstyled={true}
  className="bg-green-500 hover:bg-green-600 px-6 py-4 rounded-lg"
>
  Click me
</Button>
```

**POR QUÉ ES IMPORTANTE:**

- ❌ **PROBLEMA:** Si un componente tiene `bg-blue-600` predeterminado, agregar `className="bg-green-500"` NO lo sobrescribe porque Tailwind aplica ambas clases y la última en el CSS gana, no la última en el HTML
- ✅ **SOLUCIÓN:** La prop `unstyled` permite control total cuando se necesita, sin romper el uso normal del componente
- 🎯 **RESULTADO:** Flexibilidad máxima sin usar `!important` o clases con `!` en Tailwind

**COMPONENTES QUE YA IMPLEMENTAN ESTE PATRÓN:**
- ✅ `Button.js` - Soporta `unstyled={true}`
- ✅ `Input.js` - Soporta `unstyled={true}`

**AL CREAR NUEVOS COMPONENTES UI:**
- [ ] Agregar prop `unstyled` (boolean, default: false)
- [ ] Si `unstyled === true`, aplicar SOLO `className` sin estilos predeterminados
- [ ] Documentar en JSDoc el uso de `unstyled`
- [ ] Agregar ejemplo de uso en comentarios

---

## 🏗️ PATRONES Y CONVENCIONES

### 📁 Estructura de Archivos

**REGLA:** Sigue esta estructura EXACTA para nuevos archivos:

```
src/
├── app/                         # Next.js App Router
│   ├── (grupo)/                # Rutas agrupadas (auth, profesor, alumno)
│   │   ├── ruta/
│   │   │   └── page.js         # Página de la ruta
│   │   └── layout.js           # Layout del grupo
│   ├── api/                    # API Routes
│   │   └── recurso/
│   │       └── accion/
│   │           └── route.js    # Endpoint (GET, POST, etc.)
│   ├── layout.js               # Root layout
│   └── page.js                 # Página raíz
│
├── components/                 # Componentes React
│   ├── categoria/             # Agrupar por categoría (auth, qr, ui)
│   │   └── Componente.js      # PascalCase
│   └── ui/                    # Componentes UI base
│
├── contexts/                  # React Contexts
│   └── NombreContext.js       # PascalCase + Context
│
├── hooks/                     # Custom Hooks
│   └── useNombre.js           # camelCase + "use" prefix
│
├── lib/                       # Librerías y utilidades
│   ├── categoria/            # Agrupar por propósito (qr, scraping, supabase)
│   │   └── modulo.js         # camelCase
│   └── utils/                # Utilidades generales
│
├── services/                  # Capa de servicios
│   └── entidad.service.js    # camelCase + .service.js
│
└── constants/                 # Constantes y configuración
    └── config.js
```

**EJEMPLOS:**
- ✅ `services/attendance.service.js`
- ✅ `components/qr/QRGenerator.js`
- ✅ `hooks/useAuth.js`
- ✅ `app/api/attendance/record/route.js`
- ❌ `services/AttendanceService.js` (PascalCase incorrecto)
- ❌ `components/QRGenerator.js` (falta categoría)
- ❌ `hooks/auth.js` (falta prefijo "use")

---

### 🔤 Naming Conventions

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| **Archivos de Componentes** | PascalCase | `QRScanner.js` |
| **Archivos de Servicios** | camelCase + .service.js | `student.service.js` |
| **Archivos de Hooks** | camelCase + use prefix | `useAuth.js` |
| **Archivos de API Routes** | camelCase + route.js | `route.js` |
| **Archivos de Librerías** | camelCase | `crypto.js`, `generator.js` |
| **Componentes React** | PascalCase | `function QRScanner() {}` |
| **Funciones** | camelCase | `function createSession() {}` |
| **Constantes** | UPPER_SNAKE_CASE | `SESSION_DURATION`, `QR_SECRET_KEY` |
| **Variables** | camelCase | `const userName = ...` |
| **Props** | camelCase | `<Button onClick={...} />` |

**TABLAS DE BD:**
- Usar nombres en inglés (ya establecido)
- PascalCase: `Professors`, `Students`, `CurrentGroup`, `TakeAttendance`
- Foreign keys: `professorId`, `studentId`, `currentGroupId`

---

### 🏛️ Arquitectura de Servicios (PATRÓN CRÍTICO)

**TODOS los servicios DEBEN seguir este patrón EXACTO:**

```javascript
// src/services/entidad.service.js

import { log, logError } from '@/lib/utils/logger';
import { entidadSchema } from '@/lib/utils/validators';

const MODULE_NAME = 'entidad.service';

/**
 * Servicio para gestión de Entidades
 */
export const entidadService = {
  
  /**
   * Encuentra una entidad por campo
   * @param {SupabaseClient} supabase - Cliente de Supabase
   * @param {string} valor - Valor a buscar
   * @returns {Promise<Object|null>}
   */
  async findByCampo(supabase, valor) {
    log(MODULE_NAME, 'Finding entidad by campo', { valor });
    
    try {
      // Validar input
      const validated = entidadSchema.parse({ campo: valor });
      
      const { data, error } = await supabase
        .from('Entidades')
        .select('*')
        .eq('campo', validated.campo)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          log(MODULE_NAME, 'Entidad not found');
          return null;
        }
        throw error;
      }
      
      log(MODULE_NAME, 'Entidad found', { id: data.id });
      return data;
      
    } catch (error) {
      logError(MODULE_NAME, 'Error finding entidad', error);
      throw error;
    }
  },
  
  /**
   * Crea una nueva entidad
   * @param {SupabaseClient} supabase - Cliente de Supabase
   * @param {Object} entidadData - Datos de la entidad
   * @returns {Promise<Object>}
   */
  async create(supabase, entidadData) {
    log(MODULE_NAME, 'Creating entidad', { entidadData });
    
    try {
      // Validar input
      const validated = entidadSchema.parse(entidadData);
      
      const { data, error } = await supabase
        .from('Entidades')
        .insert([validated])
        .select()
        .single();
      
      if (error) throw error;
      
      log(MODULE_NAME, 'Entidad created', { id: data.id });
      return data;
      
    } catch (error) {
      logError(MODULE_NAME, 'Error creating entidad', error);
      throw error;
    }
  },
  
  // ... más métodos siguiendo el mismo patrón
};
```

**ELEMENTOS OBLIGATORIOS:**
1. ✅ Import de `log` y `logError`
2. ✅ Import de schema de validación
3. ✅ Constante `MODULE_NAME`
4. ✅ JSDoc en cada método
5. ✅ Cliente Supabase como primer parámetro
6. ✅ Validación con Zod schema
7. ✅ Try-catch en cada método
8. ✅ Logging al inicio y al final
9. ✅ Manejo de error `PGRST116` (not found)
10. ✅ Export como objeto con métodos

**EJEMPLOS EXISTENTES:**
- `services/attendance.service.js` (más completo)
- `services/student.service.js` (patrón de getOrCreate)
- `services/session.service.js` (update de status)

---

### ✅ Validación con Zod (PATRÓN CRÍTICO)

**UBICACIÓN:** `src/lib/utils/validators.js`

**PATRÓN PARA SCHEMAS:**

```javascript
import { z } from 'zod';

// Schema base
export const entidadSchema = z.object({
  id: z.string().uuid().optional(),
  campo1: z.string().min(1, 'Campo1 es requerido'),
  campo2: z.string().email('Email inválido'),
  campo3: z.number().positive(),
  created_at: z.string().datetime().optional(),
});

// Schema para creación (sin campos autogenerados)
export const createEntidadSchema = entidadSchema.omit({
  id: true,
  created_at: true,
});

// Schema para actualización (campos opcionales)
export const updateEntidadSchema = entidadSchema.partial();

// Schema para API request
export const entidadRequestSchema = z.object({
  campo1: z.string().min(1),
  campo2: z.string().email(),
});
```

**DÓNDE USAR:**
1. ✅ **En servicios** - Validar datos antes de insert/update
2. ✅ **En API routes** - Validar request body
3. ✅ **En componentes** (opcional) - Validación frontend

**EJEMPLO DE USO EN API:**

```javascript
// app/api/recurso/route.js
import { NextResponse } from 'next/server';
import { entidadRequestSchema } from '@/lib/utils/validators';
import { entidadService } from '@/services/entidad.service';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validar request
    const validated = entidadRequestSchema.parse(body);
    
    // Usar servicio
    const result = await entidadService.create(supabase, validated);
    
    return NextResponse.json({ success: true, data: result });
    
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**SCHEMAS EXISTENTES EN VALIDATORS.JS:**
- `professorSchema`, `createProfessorSchema`
- `studentSchema`, `createStudentSchema`
- `subjectSchema`, `createSubjectSchema`
- `groupSchema`, `createGroupSchema`
- `sessionSchema`, `createSessionSchema`
- `attendanceSchema`, `createAttendanceSchema`
- `loginSchema`, `registerSchema`
- `qrPayloadSchema`, `scrapingRequestSchema`

**REGLA:** NUNCA modifiques schemas existentes sin confirmar impacto en BD y servicios.

---

### 🚨 Manejo de Errores (PATRÓN ESTÁNDAR)

**PATRÓN EN SERVICIOS:**

```javascript
try {
  // Validación
  const validated = schema.parse(data);
  
  // Operación de BD
  const { data, error } = await supabase.from('tabla')...;
  
  // Manejo de error específico
  if (error) {
    if (error.code === 'PGRST116') {
      log(MODULE_NAME, 'Not found');
      return null; // o throw new Error('Not found')
    }
    if (error.code === '23505') {
      throw new Error('Duplicate entry');
    }
    throw error;
  }
  
  // Éxito
  log(MODULE_NAME, 'Operation successful');
  return data;
  
} catch (error) {
  logError(MODULE_NAME, 'Operation failed', error);
  throw error; // Re-throw para que el caller maneje
}
```

**PATRÓN EN API ROUTES:**

```javascript
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validación
    const validated = schema.parse(body);
    
    // Lógica de negocio
    const result = await service.metodo(supabase, validated);
    
    // Respuesta exitosa
    return NextResponse.json({ 
      success: true, 
      data: result 
    });
    
  } catch (error) {
    // Error de validación
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    // Error de autenticación
    if (error.message.includes('not authenticated')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Error genérico
    console.error('[API Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**CÓDIGOS DE ERROR SUPABASE COMUNES:**
- `PGRST116` - Not found (sin resultados)
- `23505` - Duplicate key violation
- `23503` - Foreign key violation
- `42P01` - Tabla no existe
- `42703` - Columna no existe

---

### 📝 Logging (PATRÓN DE DESARROLLO)

**UBICACIÓN:** Los logs se agregan inline en funciones (no hay archivo logger.js separado)

**PATRÓN ACTUAL:**

```javascript
// Al inicio de función
console.log(`[${MODULE_NAME}] Operación iniciada`, { params });

// En puntos clave
console.log(`[${MODULE_NAME}] Paso intermedio`, { data });

// Al final exitoso
console.log(`[${MODULE_NAME}] Operación exitosa`, { result });

// En errores
console.error(`[${MODULE_NAME}] Error en operación`, error);
```

**DÓNDE AGREGAR LOGS:**
1. ✅ Al inicio de cada método de servicio
2. ✅ Antes de operaciones de BD
3. ✅ Después de operaciones exitosas
4. ✅ En todos los catch blocks
5. ✅ En validaciones críticas

**REGLA:** Los logs se deshabilitan en producción via `NODE_ENV`. NO elimines console.log del código.

---

## 🧠 DECISIONES DE ARQUITECTURA

### ¿Por qué Next.js App Router?

**DECISIÓN:** Usar Next.js 16 con App Router (no Pages Router)

**RAZONES:**
1. ✅ **Server Components** - Mejor performance, menos JavaScript al cliente
2. ✅ **Rutas agrupadas** - Organización clara (`(auth)`, `(profesor)`, `(alumno)`)
3. ✅ **Layouts anidados** - Compartir UI entre rutas
4. ✅ **API Routes integradas** - Mismo proyecto, misma codebase
5. ✅ **Middleware nativo** - Protección de rutas elegante
6. ✅ **Streaming y Suspense** - Mejor UX con loading states

**IMPLICACIONES PARA IA:**
- ❌ **NO uses** `getServerSideProps`, `getStaticProps` (Pages Router)
- ✅ **USA** `async` components para fetch de datos
- ✅ **USA** `'use client'` solo cuando necesites interactividad
- ✅ **USA** layouts para compartir estructura

**EJEMPLO CORRECTO:**

```javascript
// app/dashboard/page.js (Server Component)
import { getCurrentUser } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const user = await getCurrentUser(); // Fetch directo en server
  
  return <div>Hola {user.name}</div>;
}
```

```javascript
// app/dashboard/page.js (Client Component si necesitas estado)
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth(); // Hook de cliente
  
  return <div>Hola {user.name}</div>;
}
```

---

### ¿Por qué Supabase?

**DECISIÓN:** Usar Supabase como backend completo

**RAZONES:**
1. ✅ **PostgreSQL completo** - No es solo un wrapper, es SQL real
2. ✅ **Auth integrado** - Email/password, OAuth, magic links
3. ✅ **Row Level Security** - Seguridad a nivel de BD
4. ✅ **Real-time capabilities** - Para features futuras (live updates)
5. ✅ **Edge Functions** - Serverless functions si se necesitan
6. ✅ **Storage** - Para almacenar archivos futuros
7. ✅ **Fácil deploy** - Cloud managed, no administrar servidores

**IMPLICACIONES PARA IA:**
- ✅ **USA** servicios en lugar de queries directas
- ✅ **USA** `createBrowserClient()` en componentes cliente
- ✅ **USA** `createServerClient()` en API routes
- ✅ **RESPETA** RLS policies (no uses service_role en cliente)
- ❌ **NO expongas** `SUPABASE_SERVICE_ROLE_KEY` al cliente

**CLIENTES DISPONIBLES:**

```javascript
// En componentes de cliente
import { createBrowserClient } from '@/lib/supabase/client';
const supabase = createBrowserClient();

// En API routes
import { createServerClient } from '@/lib/supabase/server';
const supabase = createServerClient();

// En server components
import { createServerComponentSupabaseClient } from '@/lib/supabase/server';
const supabase = createServerComponentSupabaseClient();
```

---

### ¿Por qué Firma de QR?

**DECISIÓN:** QR codes firmados con HMAC-SHA256

**RAZONES:**
1. ✅ **Seguridad sin autenticación** - Alumnos no necesitan login
2. ✅ **Previene QR falsificados** - No se puede replicar sin clave secreta
3. ✅ **Expiración automática** - QR inválido después de tiempo configurado
4. ✅ **Stateless** - No requiere guardar QR en BD
5. ✅ **Validación rápida** - Verificar firma es O(1)

**CÓMO FUNCIONA:**

```
1. Profesor genera QR:
   payload = { sessionId, timestamp, expiresAt }
   signature = HMAC-SHA256(payload, QR_SECRET_KEY)
   qrData = base64({ payload, signature })
   url = /asistencia/sessionId?data=qrData

2. Alumno escanea QR:
   Extrae qrData de URL
   Decodifica payload y signature
   Recalcula signature con QR_SECRET_KEY
   Compara signatures
   Verifica timestamp < expiresAt
   Verifica sessionId existe y está activa
```

**IMPLICACIONES PARA IA:**
- ❌ **NO modifiques** `lib/qr/generator.js` o `lib/qr/validator.js`
- ❌ **NO cambies** el algoritmo de firma
- ✅ **USA** `generateSessionQR()` para crear QR
- ✅ **USA** `validateQRCode()` para validar
- ❌ **NO expongas** `QR_SECRET_KEY` al cliente

**ARCHIVOS CRÍTICOS:**
- `lib/qr/generator.js` - Generación de QR
- `lib/qr/validator.js` - Validación de firma
- `lib/utils/crypto.js` - Funciones HMAC
- `constants/config.js` - Configuración de QR

---

### ¿Por qué Servicios Separados?

**DECISIÓN:** Capa de servicios independiente de rutas y componentes

**RAZONES:**
1. ✅ **Reutilización** - Misma lógica en API routes, server components, etc.
2. ✅ **Testabilidad** - Fácil de testear sin Next.js
3. ✅ **Separación de responsabilidades** - Lógica de negocio != presentación
4. ✅ **Consistencia** - Validación y logging centralizados
5. ✅ **Escalabilidad** - Fácil agregar nuevos servicios

**ARQUITECTURA:**

```
┌─────────────────────────────────────┐
│     PRESENTACIÓN                     │
│  (Páginas, Componentes, API Routes) │
└──────────────┬──────────────────────┘
               │ Llaman a servicios
               ↓
┌─────────────────────────────────────┐
│     SERVICIOS (LÓGICA DE NEGOCIO)   │
│  (Validación, transformación, CRUD) │
└──────────────┬──────────────────────┘
               │ Usan cliente Supabase
               ↓
┌─────────────────────────────────────┐
│     DATOS (SUPABASE)                │
│  (PostgreSQL + RLS + Auth)          │
└─────────────────────────────────────┘
```

**EJEMPLO DE USO:**

```javascript
// ❌ INCORRECTO - Lógica duplicada en componente
'use client';
export default function Page() {
  const handleSubmit = async () => {
    const supabase = createBrowserClient();
    
    // ❌ Validación inline
    if (!email) return alert('Email required');
    
    // ❌ Query directa
    const { data } = await supabase.from('Students').insert([{ email }]);
  }
}

// ✅ CORRECTO - Usa servicio
'use client';
import { studentService } from '@/services/student.service';

export default function Page() {
  const handleSubmit = async () => {
    const supabase = createBrowserClient();
    
    // ✅ Servicio maneja validación y lógica
    const student = await studentService.create(supabase, { email });
  }
}
```

**REGLA:** SIEMPRE usa servicios para operaciones de BD. NO dupliques lógica.

---

### ¿Por qué Tailwind CSS?

**DECISIÓN:** Usar Tailwind CSS 4 para implementar diseños exactos

**RAZONES:**
1. ✅ **Diseños absolutos** - Los diseños deben verse exactamente como se especifican
2. ✅ **Utility-first** - Máximo control sobre cada elemento visual
3. ✅ **Performance** - Bundle pequeño, solo clases usadas
4. ✅ **No vendor lock-in** - No atado a librería de componentes
5. ✅ **Precisión** - Cada clase Tailwind mapea directamente a CSS específico

**IMPLICACIONES PARA IA:**
- ✅ **USA** las clases Tailwind exactas del diseño proporcionado
- ✅ **SIGUE** las especificaciones de colores, espaciado, tipografía al pie de la letra
- ❌ **NO agregues** CSS modules, styled-components
- ❌ **NO instales** shadcn/ui, Chakra, MUI sin consultar
- ❌ **NO improvises** estilos - el usuario proporcionará las especificaciones exactas
- ⚠️ **PREGUNTA** si algo del diseño no está claro en lugar de asumir

**EJEMPLO ACTUAL:**

```javascript
// components/ui/Button.js - Estilos básicos funcionales
const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
};

return (
  <button className={`px-4 py-2 rounded-md ${variants[variant]}`}>
    {children}
  </button>
);
```

---

## 🗂️ MOCK DATA Y TEMPORALIDADES

### 📍 Ubicación Completa de Mock Data

| Archivo | Líneas | Tipo | Reemplazo |
|---------|--------|------|-----------|
| `app/(profesor)/generar-qr/page.js` | 31-38 | Mock de materias/grupos | Cargar desde `subject.service` y `group.service` |
| `app/(auth)/register/page.js` | 19-22 | Datos de prueba pre-llenados | Vaciar valores iniciales |
| `app/(profesor)/dashboard/page.js` | 73 | Botón "Mis Materias" deshabilitado | Crear página de gestión de materias |

### ⚠️ Datos Hardcodeados en BD

**Valores por defecto en schema:**

```sql
-- CurrentGroup table
school text DEFAULT 'ESCUELA SUPERIOR DE INGENIERIA MECANICA Y ELECTRICA UNIDAD CULHUACAN'
institute text DEFAULT 'INSTITUTO POLITECNICO NACIONAL'
```

**NOTA:** Estos valores son **correctos** para el contexto académico (IPN - ESIME). No son temporales.

### 🔄 Cómo Reemplazar Mock Data

#### 1. **Mock de Materias/Grupos** (PRIORIDAD ALTA)

**ANTES (app/(profesor)/generar-qr/page.js):**
```javascript
const mockSubjects = [
  { value: '1', label: 'Matemáticas' },
  { value: '2', label: 'Programación' },
];
```

**DESPUÉS:**
```javascript
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase/client';
import { subjectService } from '@/services/subject.service';
import { groupService } from '@/services/group.service';

export default function GenerarQRPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      if (!user?.email) return;
      
      try {
        const supabase = createBrowserClient();
        
        // 1. Cargar TODAS las materias (ahora son genéricas)
        const subjectsData = await subjectService.getAll(supabase);
        setSubjects(subjectsData.map(s => ({
          value: s.id,
          label: s.Subject
        })));
        
        // 2. Cargar todos los grupos
        const groupsData = await groupService.getAll(supabase);
        setGroups(groupsData.map(g => ({
          value: g.id,
          label: g.group
        })));
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user]);
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // ... resto del componente con subjects y groups reales
}
```

**VALIDACIÓN:**
- ✅ Verificar que el profesor tenga materias creadas en BD
- ✅ Verificar que existan grupos en BD
- ✅ Si están vacíos, mostrar mensaje para crear primero

**DEPENDENCIAS:**
- Requiere que existan registros en tablas `Subject` y `Group`
- Si no existen, implementar primero gestión de materias/grupos

---

#### 2. **Formulario de Registro Pre-llenado** (PRIORIDAD MEDIA)

**CAMBIO SIMPLE:**

```javascript
// ANTES
const [formData, setFormData] = useState({
  name: 'Bernardo',
  lastName: 'Lopez',
  email: 'bernardo.abel.ls1@gmail.com',
  password: 'wa ha ha123',
});

// DESPUÉS
const [formData, setFormData] = useState({
  name: '',
  lastName: '',
  email: '',
  password: '',
});
```

**ARCHIVO:** `src/app/(auth)/register/page.js` líneas 19-22

---

### 🚫 Datos que NO son Mock (No Tocar)

Estos valores son **configuración real del sistema**:

1. **Variables de Entorno** (`.env`)
   - `NEXT_PUBLIC_SESSION_DURATION=90` - Duración de sesión en minutos
   - `NEXT_PUBLIC_APP_URL` - URL de la aplicación
   - `QR_SECRET_KEY` - Clave de firma (generada aleatoriamente)

2. **Constantes de Configuración** (`constants/config.js`)
   - `QR_SIZE = 256` - Tamaño de imagen QR
   - `ERROR_CORRECTION_LEVEL = 'M'` - Nivel de corrección
   - `SCRAPING_TIMEOUT = 10000` - Timeout de scraping
   - `BOLETA_CLASS = 'boleta'` - Clase CSS a buscar en credencial

3. **Valores de BD** (schema defaults)
   - `school` - Nombre de la escuela (ESIME Culhuacán)
   - `institute` - Instituto (IPN)

**REGLA:** NO modifiques estas configuraciones sin aprobación explícita.

---

## 🗺️ ROADMAP Y PRIORIDADES

### FASE 1: MVP FUNCIONAL (100% COMPLETO) ✅

**Estado:** COMPLETADA - Toda la funcionalidad core está implementada y probada.

**Features Implementadas:**
- ✅ Autenticación de profesores
- ✅ Generación de QR firmado
- ✅ Registro de asistencia (alumno)
- ✅ Web scraping de credenciales
- ✅ Validación de seguridad
- ✅ Servicios de datos completos
- ✅ Componentes UI básicos funcionales

**Notas:**
- Mock data será reemplazado conforme se implementen las pantallas con diseño final
- La arquitectura de servicios está completa y probada
- La lógica de negocio NO cambiará en la fase de UI

---

### FASE 2: IMPLEMENTACIÓN DE UI (EN PROGRESO) 🎨

**Estado:** ACTIVA - Implementando diseños pantalla por pantalla.

**Objetivos:**
- 🎨 Implementar diseños finales con precisión absoluta
- 🎨 Integrar funcionalidades existentes con las nuevas pantallas
- 🎨 Mantener la funcionalidad mientras se mejora la UI
- 🎨 Crear componentes según diseños proporcionados
- 🎨 Reemplazar mock data conforme se implementan las pantallas

**Reglas de Implementación:**
- ✅ **Los diseños son ABSOLUTOS** - deben verse exactamente como se especifican
- ✅ **No improvisar** - esperar especificaciones del usuario
- ✅ **Pantalla por pantalla** - implementar de forma secuencial según se proporcionen diseños
- ✅ **Validar diseño** - confirmar que el resultado coincide píxel a píxel
- ✅ **Mantener funcionalidad** - la UI es cosmética, los servicios/lógica no cambian

**Prioridades:**
1. 🔴 **Implementar pantallas según se proporcionen** (orden definido por usuario)
2. 🔴 **Integrar servicios existentes** con cada pantalla
3. 🟡 **Crear componentes custom** según diseños
4. 🟡 **Reemplazar mock data** cuando sea necesario para la pantalla
5. 🟢 **Agregar animaciones/transiciones** si están especificadas en el diseño

**Método de Trabajo:**
- Usuario proporciona diseño de pantalla
- IA implementa diseño EXACTO
- IA integra funcionalidad existente
- Usuario valida resultado
- Pasar a siguiente pantalla

**Estimado por pantalla:** 2-4 horas (según complejidad)

---

### FASE 3: DASHBOARD Y GESTIÓN (20% COMPLETO) 🚧

**Estado:** Servicios listos, UI no existe.

**Features a Implementar:**

#### 1. **Dashboard de Asistencias** (ALTA PRIORIDAD)
- 📄 Página: `app/(profesor)/sesiones/[sessionId]/page.js`
- 🔌 API: `app/api/attendance/list/route.js`
- 📊 Mostrar tabla de alumnos que pasaron lista
- 📊 Estadísticas: total, porcentaje, hora de registro
- 🔄 Actualización en tiempo real (Supabase Realtime)
- 💾 Exportar a CSV/PDF (básico)

**Servicios Disponibles:**
- ✅ `attendance.service.getBySession()` - Ya implementado
- ✅ `attendance.service.getSessionStats()` - Ya implementado

**Estimado:** 6-8 horas

---

#### 2. **Gestión de Materias** (ALTA PRIORIDAD)
- 📄 Página: `app/(profesor)/materias/page.js`
- 📝 CRUD completo (crear, listar, editar, eliminar)
- 🔗 Vincular materias al profesor actual
- 📋 Listado con búsqueda y filtros

**Servicios Disponibles:**
- ✅ `subject.service.getByProfessorId()` - Ya implementado
- ✅ `subject.service.create()` - Ya implementado
- ✅ `subject.service.update()` - Ya implementado
- ✅ `subject.service.remove()` - Ya implementado

**Estimado:** 4-5 horas

---

#### 3. **Gestión de Grupos** (ALTA PRIORIDAD)
- 📄 Página: `app/(profesor)/grupos/page.js`
- 📝 CRUD completo
- 📋 Listado simple

**Servicios Disponibles:**
- ✅ `group.service.getAll()` - Ya implementado
- ✅ `group.service.create()` - Ya implementado
- ✅ `group.service.update()` - Ya implementado
- ✅ `group.service.remove()` - Ya implementado

**Estimado:** 3-4 horas

---

#### 4. **Gestión de Sesiones** (MEDIA PRIORIDAD)
- 📄 Sección en `/dashboard`
- 📋 Lista de sesiones activas
- ⏸️ Cerrar sesión manualmente
- 📊 Ver stats en tiempo real

**Servicios Disponibles:**
- ✅ `session.service.getActiveSessionsByProfessor()` - Ya implementado
- ✅ `session.service.closeSession()` - Ya implementado

**Estimado:** 3-4 horas

---

#### 5. **Perfil de Profesor** (BAJA PRIORIDAD)
- 📄 Página: `app/(profesor)/perfil/page.js`
- ✏️ Editar nombre, apellido
- 🔑 Cambiar contraseña (Supabase Auth)
- 📧 Cambiar email (requiere re-autenticación)

**Servicios Disponibles:**
- ✅ `professor.service.updateProfessor()` - Ya implementado

**Estimado:** 2-3 horas

**Total Fase 3:** 18-24 horas

---

### FASE 4: FEATURES AVANZADAS (0% COMPLETO) 🔮

**Estado:** Planificadas para futuro. NO implementar sin aprobación.

#### 1. **Reportes y Exportación**
- 📊 Reportes por alumno (historial de asistencias)
- 📊 Reportes por periodo (semana, mes, semestre)
- 📄 Exportar a PDF (jsPDF, react-pdf)
- 📄 Exportar a Excel (xlsx)
- 📈 Gráficas de asistencia (recharts, chart.js)

**Dependencias:**
- Requiere dashboard de asistencias implementado
- Requiere librería de PDF (jsPDF)
- Requiere librería de Excel (xlsx)

**Estimado:** 10-12 horas

---

#### 2. **Notificaciones**
- 📧 Email al alumno al registrar asistencia
- 📧 Recordatorios a profesores
- 🔔 Notificaciones push (PWA)

**Dependencias:**
- Servicio de email (SendGrid, Resend, Mailgun)
- Configuración en Supabase (Email Templates)
- Service Worker para push notifications

**Estimado:** 8-10 horas

---

#### 3. **PWA (Progressive Web App)**
- 📱 Instalable como app nativa
- 🔌 Funcionamiento offline limitado
- 🔔 Push notifications
- 📦 Service Worker con estrategias de cache
- 📄 Manifest.json

**Dependencias:**
- next-pwa
- Service Worker
- HTTPS obligatorio

**Estimado:** 6-8 horas

---

#### 4. **Real-time Updates**
- 🔄 Dashboard se actualiza automáticamente
- 🔄 Ver alumnos llegando en vivo
- 🔄 Contador de asistencias en tiempo real

**Dependencias:**
- Supabase Realtime (ya incluido en Supabase)
- Subscripciones a tabla `TakeAttendance`

**Estimado:** 4-5 horas

---

#### 5. **Gestión de Asistencias por Alumno**
- 📄 Vista para alumnos (opcional)
- 📊 Ver su historial de asistencias
- 📧 Autenticación de alumnos (si se requiere)

**Dependencias:**
- Sistema de auth para alumnos
- Nueva tabla de usuarios alumnos (diferente a Students)

**Estimado:** 8-10 horas

**Total Fase 4:** 36-45 horas

---

### 📋 ORDEN DE IMPLEMENTACIÓN ACTUAL

**FASE ACTUAL: IMPLEMENTACIÓN DE UI (Diseños Absolutos)**

**Metodología:**
- El usuario proporciona diseños pantalla por pantalla
- Cada diseño se implementa de forma EXACTA (píxel a píxel)
- Se integran funcionalidades existentes con cada pantalla
- Se valida el resultado antes de pasar a la siguiente pantalla
- El orden lo define el usuario según prioridades del proyecto

**Proceso por Pantalla:**
1. 📐 Usuario proporciona especificaciones de diseño
2. 🔍 IA analiza diseño y componentes necesarios
3. 💻 IA implementa diseño EXACTO con Tailwind
4. 🔗 IA integra servicios/lógica existente
5. ✅ Usuario valida resultado
6. ➡️ Pasar a siguiente pantalla

**Pantallas Pendientes de Diseño:**
- ⏳ Todas las pantallas se implementarán según el usuario las proporcione
- ⏳ No hay orden predefinido - depende de prioridades del usuario
- ⏳ Mock data se reemplaza conforme se requiera en cada pantalla

**IMPORTANTE:**
- ✅ La funcionalidad NO cambia - solo la presentación visual
- ✅ Los servicios y lógica de negocio ya están completos
- ✅ Cada pantalla es independiente - se puede empezar por cualquiera
- ❌ NO se implementan pantallas sin diseño específico

---

## 🚀 GUÍA RÁPIDA DE IMPLEMENTACIÓN

### � Cómo Implementar una Pantalla con Diseño (PRIORIDAD ACTUAL)

**CHECKLIST PARA IMPLEMENTACIÓN DE UI:**

1. **Recepción de Diseño** (1-2 min)
   - [ ] Usuario proporciona especificaciones de diseño (imagen, Figma, descripción detallada)
   - [ ] Identificar qué pantalla/componente se va a implementar
   - [ ] Confirmar que se entienden todas las especificaciones visuales

2. **Análisis de Componentes** (3-5 min)
   - [ ] ¿Qué componentes UI se necesitan? (Button, Input, Card, nuevos componentes)
   - [ ] ¿Los componentes existentes sirven o hay que crear nuevos?
   - [ ] ¿Qué servicios existentes se van a integrar?
   - [ ] ¿Se necesita reemplazar mock data en esta pantalla?

3. **Implementación de Diseño** (30-120 min según complejidad)
   - [ ] Crear/modificar archivo de página/componente
   - [ ] Implementar estructura HTML/JSX exacta
   - [ ] Aplicar clases Tailwind EXACTAS según diseño
   - [ ] Verificar colores, espaciado, tipografía, bordes, sombras
   - [ ] Asegurar responsive design si está especificado

4. **Integración de Funcionalidad** (15-45 min)
   - [ ] Importar servicios necesarios
   - [ ] Integrar useAuth, useQRScanner u otros hooks si aplica
   - [ ] Conectar eventos (onClick, onChange, onSubmit)
   - [ ] Agregar validación de formularios si aplica
   - [ ] Manejar estados de loading/error

5. **Validación Visual** (5-10 min)
   - [ ] Comparar píxel a píxel con el diseño proporcionado
   - [ ] Verificar colores exactos
   - [ ] Verificar espaciado y alineación
   - [ ] Verificar tipografía (tamaño, peso, familia)
   - [ ] Verificar estados (hover, focus, active, disabled)

6. **Testing Funcional** (10-15 min)
   - [ ] Probar que la funcionalidad existente sigue funcionando
   - [ ] Verificar integración con servicios
   - [ ] Probar casos de error
   - [ ] Verificar responsive (si aplica)

**REGLAS CRÍTICAS:**
- ✅ El diseño es ABSOLUTO - no improvisar
- ✅ Preguntar si algo no está claro
- ✅ La funcionalidad NO cambia - solo la presentación
- ✅ Usar servicios existentes - no duplicar lógica
- ❌ NO crear funcionalidad nueva sin aprobación
- ❌ NO modificar servicios/lógica de negocio

---

### 🆕 Cómo Agregar una Nueva Feature (FUNCIONALIDAD, NO UI)

**CHECKLIST COMPLETO:**

1. **Planificación** (5-10 min)
   - [ ] ¿Ya existe servicio para esta feature? (revisar `services/`)
   - [ ] ¿Necesita nueva tabla en BD? (revisar `schema.sql`)
   - [ ] ¿Necesita nuevo schema de validación? (revisar `validators.js`)
   - [ ] ¿Es API route, página, o ambos?

2. **Base de Datos** (si aplica)
   - [ ] Crear migración en Supabase
   - [ ] Agregar columnas/tablas necesarias
   - [ ] Configurar RLS policies
   - [ ] Actualizar `schema.sql` para documentación

3. **Validación** (obligatorio)
   - [ ] Agregar schema en `lib/utils/validators.js`
   - [ ] Exportar schema
   - [ ] Documentar con JSDoc

4. **Servicio** (si necesita lógica de datos)
   - [ ] Crear archivo `services/nombre.service.js`
   - [ ] Seguir patrón de servicios existentes
   - [ ] Agregar logging
   - [ ] Manejar errores correctamente

5. **API Route** (si necesita endpoint)
   - [ ] Crear `app/api/recurso/accion/route.js`
   - [ ] Validar request con Zod
   - [ ] Usar servicio correspondiente
   - [ ] Retornar respuesta consistente
   - [ ] Manejar errores

6. **Página/Componente**
   - [ ] Decidir si es Server o Client Component
   - [ ] Crear en ubicación correcta (`app/` o `components/`)
   - [ ] Usar componentes UI existentes
   - [ ] Agregar loading states
   - [ ] Manejar errores

7. **Testing Manual**
   - [ ] Probar happy path
   - [ ] Probar casos de error
   - [ ] Verificar validaciones
   - [ ] Verificar permisos (RLS)

---

### 🛠️ Cómo Crear un Nuevo Servicio

**TEMPLATE:**

```javascript
// src/services/nombre.service.js

/**
 * Servicio para gestión de [Entidad]
 * 
 * Métodos disponibles:
 * - getAll(supabase): Obtiene todos los registros
 * - getById(supabase, id): Obtiene por ID
 * - create(supabase, data): Crea nuevo registro
 * - update(supabase, id, data): Actualiza registro
 * - remove(supabase, id): Elimina registro
 */
export const nombreService = {
  
  /**
   * Obtiene todos los registros
   * @param {SupabaseClient} supabase - Cliente de Supabase
   * @returns {Promise<Array>}
   */
  async getAll(supabase) {
    const MODULE_NAME = 'nombre.service.getAll';
    console.log(`[${MODULE_NAME}] Fetching all records`);
    
    try {
      const { data, error } = await supabase
        .from('NombreTabla')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log(`[${MODULE_NAME}] Found ${data.length} records`);
      return data;
      
    } catch (error) {
      console.error(`[${MODULE_NAME}] Error:`, error);
      throw error;
    }
  },
  
  /**
   * Obtiene un registro por ID
   * @param {SupabaseClient} supabase - Cliente de Supabase
   * @param {string} id - UUID del registro
   * @returns {Promise<Object|null>}
   */
  async getById(supabase, id) {
    const MODULE_NAME = 'nombre.service.getById';
    console.log(`[${MODULE_NAME}] Fetching record`, { id });
    
    try {
      const { data, error } = await supabase
        .from('NombreTabla')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`[${MODULE_NAME}] Record not found`);
          return null;
        }
        throw error;
      }
      
      console.log(`[${MODULE_NAME}] Record found`);
      return data;
      
    } catch (error) {
      console.error(`[${MODULE_NAME}] Error:`, error);
      throw error;
    }
  },
  
  /**
   * Crea un nuevo registro
   * @param {SupabaseClient} supabase - Cliente de Supabase
   * @param {Object} data - Datos del registro
   * @returns {Promise<Object>}
   */
  async create(supabase, data) {
    const MODULE_NAME = 'nombre.service.create';
    console.log(`[${MODULE_NAME}] Creating record`, { data });
    
    try {
      // Importar y validar schema
      const { createNombreSchema } = await import('@/lib/utils/validators');
      const validated = createNombreSchema.parse(data);
      
      const { data: created, error } = await supabase
        .from('NombreTabla')
        .insert([validated])
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`[${MODULE_NAME}] Record created`, { id: created.id });
      return created;
      
    } catch (error) {
      console.error(`[${MODULE_NAME}] Error:`, error);
      throw error;
    }
  },
  
  /**
   * Actualiza un registro
   * @param {SupabaseClient} supabase - Cliente de Supabase
   * @param {string} id - UUID del registro
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async update(supabase, id, data) {
    const MODULE_NAME = 'nombre.service.update';
    console.log(`[${MODULE_NAME}] Updating record`, { id, data });
    
    try {
      // Importar y validar schema
      const { updateNombreSchema } = await import('@/lib/utils/validators');
      const validated = updateNombreSchema.parse(data);
      
      const { data: updated, error } = await supabase
        .from('NombreTabla')
        .update(validated)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`[${MODULE_NAME}] Record updated`);
      return updated;
      
    } catch (error) {
      console.error(`[${MODULE_NAME}] Error:`, error);
      throw error;
    }
  },
  
  /**
   * Elimina un registro
   * @param {SupabaseClient} supabase - Cliente de Supabase
   * @param {string} id - UUID del registro
   * @returns {Promise<void>}
   */
  async remove(supabase, id) {
    const MODULE_NAME = 'nombre.service.remove';
    console.log(`[${MODULE_NAME}] Removing record`, { id });
    
    try {
      const { error } = await supabase
        .from('NombreTabla')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log(`[${MODULE_NAME}] Record removed`);
      
    } catch (error) {
      console.error(`[${MODULE_NAME}] Error:`, error);
      throw error;
    }
  },
  
};
```

**PASOS:**
1. Copiar template
2. Reemplazar `nombre` con nombre de entidad
3. Reemplazar `NombreTabla` con nombre real de tabla
4. Agregar métodos específicos si es necesario
5. Crear schemas de validación en `validators.js`

---

### 🎨 Cómo Crear un Nuevo Componente

**TEMPLATE PARA CLIENT COMPONENT:**

```javascript
// src/components/categoria/NombreComponente.js
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Componente para [descripción]
 * 
 * @param {Object} props
 * @param {string} props.prop1 - Descripción
 * @param {Function} props.onAction - Callback
 */
export function NombreComponente({ prop1, onAction }) {
  const [state, setState] = useState(null);
  
  const handleAction = () => {
    // Lógica
    onAction?.();
  };
  
  return (
    <Card>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">{prop1}</h2>
        
        <Button onClick={handleAction}>
          Acción
        </Button>
      </div>
    </Card>
  );
}
```

**TEMPLATE PARA SERVER COMPONENT:**

```javascript
// src/components/categoria/NombreComponente.js

import { createServerComponentSupabaseClient } from '@/lib/supabase/server';
import { nombreService } from '@/services/nombre.service';

/**
 * Componente server para [descripción]
 * 
 * @param {Object} props
 * @param {string} props.id - ID del recurso
 */
export async function NombreComponente({ id }) {
  const supabase = createServerComponentSupabaseClient();
  const data = await nombreService.getById(supabase, id);
  
  if (!data) {
    return <div>No encontrado</div>;
  }
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{data.name}</h2>
    </div>
  );
}
```

**REGLAS:**
- ✅ Usar `'use client'` solo si necesitas useState, useEffect, eventos
- ✅ Server components para fetch de datos
- ✅ Exportar con `export function` (named export)
- ✅ Agregar JSDoc con props
- ✅ Usar componentes UI existentes

---

### 🔌 Cómo Crear una Nueva API Route

**TEMPLATE:**

```javascript
// src/app/api/recurso/accion/route.js

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { nombreSchema } from '@/lib/utils/validators';
import { nombreService } from '@/services/nombre.service';

/**
 * POST /api/recurso/accion
 * Descripción de la acción
 */
export async function POST(request) {
  try {
    // 1. Obtener cliente Supabase
    const supabase = createServerClient();
    
    // 2. Verificar autenticación (si aplica)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // 3. Parsear y validar body
    const body = await request.json();
    const validated = nombreSchema.parse(body);
    
    // 4. Ejecutar lógica de negocio (usar servicio)
    const result = await nombreService.create(supabase, validated);
    
    // 5. Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    console.error('[API Error]', error);
    
    // Error de validación Zod
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    // Error genérico
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recurso/accion
 * Descripción del GET
 */
export async function GET(request) {
  try {
    const supabase = createServerClient();
    
    // Obtener query params
    const { searchParams } = new URL(request.url);
    const param = searchParams.get('param');
    
    // Lógica
    const result = await nombreService.getById(supabase, param);
    
    return NextResponse.json({ success: true, data: result });
    
  } catch (error) {
    console.error('[API Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**CHECKLIST:**
- [ ] Importar `NextResponse` de `next/server`
- [ ] Crear cliente Supabase con `createServerClient()`
- [ ] Verificar autenticación si la ruta es protegida
- [ ] Validar body con Zod schema
- [ ] Usar servicio para lógica de datos
- [ ] Manejar errores de validación (ZodError)
- [ ] Retornar formato consistente `{ success, data }` o `{ error }`
- [ ] Agregar logging con console.log/error

---

### 🗄️ Cómo Trabajar con Supabase

#### 1. **En Componentes de Cliente**

```javascript
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { nombreService } from '@/services/nombre.service';

export function MiComponente() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createBrowserClient();
        const result = await nombreService.getAll(supabase);
        setData(result);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  if (loading) return <div>Cargando...</div>;
  
  return <div>{/* Renderizar data */}</div>;
}
```

#### 2. **En Server Components**

```javascript
// No necesita 'use client'

import { createServerComponentSupabaseClient } from '@/lib/supabase/server';
import { nombreService } from '@/services/nombre.service';

export default async function MiPage() {
  const supabase = createServerComponentSupabaseClient();
  const data = await nombreService.getAll(supabase);
  
  return <div>{/* Renderizar data */}</div>;
}
```

#### 3. **En API Routes**

```javascript
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request) {
  const supabase = createServerClient();
  // ... lógica
}
```

#### 4. **Subscripciones Real-time**

```javascript
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export function MiComponente() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const supabase = createBrowserClient();
    
    // Suscripción a cambios en tabla
    const subscription = supabase
      .channel('tabla-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'bdLista',
          table: 'NombreTabla'
        },
        (payload) => {
          console.log('Change received:', payload);
          // Actualizar estado
          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return <div>{/* Renderizar data */}</div>;
}
```

**REGLAS:**
- ✅ SIEMPRE usar servicios, no queries directas
- ✅ SIEMPRE pasar cliente Supabase a servicios
- ✅ USAR `createBrowserClient()` en cliente
- ✅ USAR `createServerClient()` en API routes
- ✅ USAR `createServerComponentSupabaseClient()` en server components
- ❌ NUNCA exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente
- ❌ NUNCA hacer queries directas, usar servicios

---

## 📚 REFERENCIAS RÁPIDAS

### 🗺️ Mapa de Archivos Importantes

**AUTENTICACIÓN:**
- `src/contexts/AuthContext.js` - Contexto global de auth
- `src/hooks/useAuth.js` - Hook para usar auth en componentes
- `src/middleware.js` - Protección de rutas
- `src/lib/supabase/client.js` - Cliente para navegador
- `src/lib/supabase/server.js` - Cliente para server
- `src/app/(auth)/login/page.js` - Página de login
- `src/app/(auth)/register/page.js` - Página de registro

**QR Y SEGURIDAD:**
- `src/lib/qr/generator.js` - Generación de QR firmado
- `src/lib/qr/validator.js` - Validación de firma
- `src/lib/utils/crypto.js` - Funciones HMAC

**ASISTENCIA:**
- `src/app/(profesor)/generar-qr/page.js` - Generar QR (profesor)
- `src/app/(alumno)/asistencia/[sessionId]/page.js` - Tomar asistencia (alumno)
- `src/app/api/attendance/create-session/route.js` - Crear sesión
- `src/app/api/attendance/validate-session/route.js` - Validar QR
- `src/app/api/attendance/record/route.js` - Registrar asistencia
- `src/app/api/scraping/extract-student/route.js` - Extraer boleta de credencial

**SERVICIOS:**
- `src/services/attendance.service.js` - Asistencias
- `src/services/session.service.js` - Sesiones
- `src/services/student.service.js` - Estudiantes
- `src/services/professor.service.js` - Profesores
- `src/services/subject.service.js` - Materias
- `src/services/group.service.js` - Grupos

**VALIDACIÓN:**
- `src/lib/utils/validators.js` - Todos los schemas Zod

**COMPONENTES UI:**
- `src/components/ui/Button.js`
- `src/components/ui/Card.js`
- `src/components/ui/Input.js`
- `src/components/ui/Select.js`
- `src/components/ui/Spinner.js`

**CONFIGURACIÓN:**
- `src/constants/config.js` - Constantes del sistema
- `.env.example` - Variables de entorno
- `package.json` - Dependencias

---

### 🔧 Servicios Disponibles

| Servicio | Métodos Principales | Uso |
|----------|-------------------|-----|
| **attendance.service** | `recordAttendance`, `checkDuplicate`, `getBySession`, `getByStudent`, `getSessionStats` | Gestión de asistencias |
| **session.service** | `createSession`, `getById`, `updateStatus`, `closeSession`, `isSessionActive`, `getActiveSessionsByProfessor` | Gestión de sesiones de pase de lista |
| **student.service** | `findByReportCard`, `getById`, `createStudent`, `getOrCreateStudent`, `updateStudent` | Gestión de estudiantes |
| **professor.service** | `findByEmail`, `getById`, `createProfessor`, `updateProfessor`, `getOrCreateProfessor` | Gestión de profesores |
| **subject.service** | `getByProfessorId`, `getAll`, `getById`, `create`, `update`, `remove` | Gestión de materias |
| **group.service** | `getAll`, `getById`, `create`, `findByName`, `update`, `remove` | Gestión de grupos |

**EJEMPLO DE USO:**

```javascript
import { createBrowserClient } from '@/lib/supabase/client';
import { subjectService } from '@/services/subject.service';

async function ejemplo() {
  const supabase = createBrowserClient();
  
  // Obtener TODAS las materias (ahora son genéricas)
  const allSubjects = await subjectService.getAll(supabase);
  
  // Obtener materias usadas por un profesor en sus sesiones
  const subjects = await subjectService.getByProfessorId(supabase, professorId);
  
  // Crear nueva materia (ya no requiere professorId)
  const newSubject = await subjectService.create(supabase, {
    Subject: 'Cálculo Diferencial',
  });
  
  // Actualizar materia
  const updated = await subjectService.update(supabase, subjectId, {
    Subject: 'Cálculo Integral',
  });
  
  // Eliminar materia
  await subjectService.remove(supabase, subjectId);
}
```

---

### 🎨 Componentes UI Disponibles

**Button:**
```javascript
import { Button } from '@/components/ui/Button';

<Button variant="primary" onClick={handleClick}>
  Click me
</Button>

// Variantes: primary, secondary, danger, outline
// Props: variant, onClick, disabled, children, className
```

**Card:**
```javascript
import { Card } from '@/components/ui/Card';

<Card>
  <div className="p-4">
    Contenido
  </div>
</Card>

// Props: children, className
```

**Input:**
```javascript
import { Input } from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  placeholder="tu@email.com"
/>

// Props: label, type, value, onChange, error, placeholder, className
```

**Select:**
```javascript
import { Select } from '@/components/ui/Select';

<Select
  label="Materia"
  value={selectedSubject}
  onChange={(e) => setSelectedSubject(e.target.value)}
  options={subjects}
  placeholder="Selecciona una materia"
/>

// Props: label, value, onChange, options, placeholder, error, className
// options: [{ value: '1', label: 'Matemáticas' }, ...]
```

**Spinner:**
```javascript
import { Spinner } from '@/components/ui/Spinner';

<Spinner size="md" />

// Tamaños: sm, md, lg
// Props: size, className
```

**QRGenerator:**
```javascript
import { QRGenerator } from '@/components/qr/QRGenerator';

<QRGenerator sessionId={sessionId} />

// Genera y muestra QR firmado
// Props: sessionId, size (opcional)
```

**QRScanner:**
```javascript
import { QRScanner } from '@/components/qr/QRScanner';

<QRScanner
  onScanSuccess={(data) => console.log('Escaneado:', data)}
  onScanError={(error) => console.error('Error:', error)}
/>

// Props: onScanSuccess, onScanError
```

---

### 🔑 Variables de Entorno

**OBLIGATORIAS:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # ⚠️ SECRETO

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Seguridad
QR_SECRET_KEY=clave_secreta_minimo_32_caracteres # ⚠️ SECRETO
```

**OPCIONALES:**

```env
# Configuración
NEXT_PUBLIC_SESSION_DURATION=90  # Duración en minutos (default: 90)
NODE_ENV=development             # development | production
```

**GENERACIÓN DE CLAVES:**

```bash
# Generar QR_SECRET_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**DÓNDE OBTENER:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard → Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API → anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Settings → API → service_role (⚠️ secreto)

---

### 💻 Comandos Útiles

**Desarrollo:**
```bash
npm run dev          # Iniciar servidor de desarrollo (localhost:3000)
npm run build        # Crear build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar ESLint
```

**Supabase:**
```bash
# Generar tipos de TypeScript (si se migra a TS)
npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
```

**Git:**
```bash
git status           # Ver cambios
git add .            # Agregar todos los cambios
git commit -m "msg"  # Commit
git push             # Push a remoto
```

**Útiles:**
```bash
# Limpiar caché de Next.js
rm -rf .next

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Ver tamaño del bundle
npm run build
# Revisa output en .next/
```

---

## 🎯 RESUMEN PARA IA

### TL;DR - Lo Esencial

**1. ESTADO DEL PROYECTO:**
- 95% funcional, esperando diseño final y reglas de negocio completas
- Componentes UI básicos y temporales
- Mock data en 2 lugares (materias/grupos y formulario registro)

**2. QUÉ NO TOCAR:**
- ❌ Arquitectura de servicios
- ❌ Lógica de firma de QR
- ❌ Schemas de validación Zod
- ❌ Clientes de Supabase
- ❌ Middleware de autenticación

**3. PATRONES A SEGUIR:**
- ✅ Todos los servicios siguen mismo patrón (ver template)
- ✅ Validación con Zod en todos los endpoints
- ✅ Logging con console.log en desarrollo
- ✅ Manejo de errores con try-catch
- ✅ Componentes UI con Tailwind básico

**4. PRIORIDADES ACTUALES:**
1. Conectar mock data de materias/grupos
2. Implementar dashboard de asistencias
3. Implementar gestión de materias/grupos (UI)
4. Mejorar componentes UI cuando haya diseño

**5. CÓMO AYUDAR:**
- Lee archivos existentes antes de modificar
- Usa servicios en lugar de queries directas
- Sigue estructura de archivos establecida
- Pregunta antes de agregar librerías pesadas
- Mantén estilos simples con Tailwind

---

## 📞 PREGUNTAS FRECUENTES PARA IA

**P: ¿Puedo modificar los servicios existentes?**  
R: Sí, pero solo para agregar nuevos métodos. NO modifiques métodos existentes sin confirmar.

**P: ¿Debo usar TypeScript?**  
R: No, el proyecto usa JavaScript. NO conviertas a TypeScript sin aprobación.

**P: ¿Puedo agregar shadcn/ui o Chakra UI?**  
R: NO sin consultar primero. El proyecto está en fase de componentes básicos.

**P: ¿Cómo sé si debo crear Server o Client Component?**  
R: Usa Server Component si solo renderas datos. Usa Client Component si necesitas useState, useEffect, onClick, etc.

**P: ¿Puedo hacer queries directas a Supabase?**  
R: NO. SIEMPRE usa servicios. Si no existe el método, agrégalo al servicio.

**P: ¿Dónde pongo validaciones?**  
R: En `lib/utils/validators.js` usando Zod schemas.

**P: ¿Cómo manejo errores?**  
R: Sigue el patrón de try-catch en servicios y API routes (ver templates).

**P: ¿Puedo usar CSS modules o styled-components?**  
R: NO. Solo Tailwind inline classes.

**P: ¿Cómo agrego una nueva feature?**  
R: Sigue la "Guía Rápida de Implementación" en este documento.

**P: ¿Hay tests?**  
R: No. NO agregues tests sin consultar.

**P: El usuario pidió implementar [feature futura]. ¿La hago?**  
R: Pregunta primero si quiere implementarla ahora o es solo consulta. Verifica el roadmap.

**P: ¿Qué hago si encuentro código duplicado?**  
R: Refactoriza a un servicio o utilidad. El proyecto sigue DRY (Don't Repeat Yourself).

**P: ¿Puedo modificar el schema de base de datos?**  
R: Solo con aprobación explícita. Las migraciones deben hacerse en Supabase primero.

**P: ¿Debo actualizar ARCHITECTURE.md cuando hago cambios?**  
R: Sí, si agregas nuevas features importantes o cambias decisiones arquitectónicas.

---

## ✅ CHECKLIST FINAL ANTES DE MODIFICAR CÓDIGO

Antes de hacer cualquier cambio, verifica:

- [ ] ¿Leí el archivo que voy a modificar?
- [ ] ¿Entiendo el contexto de inicialización del proyecto?
- [ ] ¿Hay un servicio existente que pueda usar?
- [ ] ¿Estoy siguiendo los patrones establecidos?
- [ ] ¿Agregué validación con Zod si es necesario?
- [ ] ¿Agregué logging apropiado?
- [ ] ¿Manejé errores correctamente?
- [ ] ¿Usé Tailwind básico para estilos?
- [ ] ¿Es una feature del roadmap o debo preguntar?
- [ ] ¿Mantuve la funcionalidad existente intacta?

**Si respondiste NO a cualquiera, detente y consulta este documento o pregunta al usuario.**

---

## 📝 CHANGELOG DEL DOCUMENTO

- **2026-02-04**: Documento inicial creado
  - Estado del proyecto documentado (MVP 95%)
  - Patrones y convenciones establecidos
  - Roadmap y prioridades definidos
  - Templates y guías de implementación agregados

---

**FIN DEL DOCUMENTO AI_CONTEXT.md**

> Este documento es CRÍTICO para el correcto funcionamiento de asistentes IA.  
> Mantenlo actualizado cuando el proyecto evolucione.  
> Versión: 1.0.0
