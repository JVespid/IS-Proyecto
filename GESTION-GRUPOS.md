# 📚 Documentación de Pantallas de Gestión de Grupos

> **Fecha de creación:** 13 de febrero de 2026  
> **Versión:** 1.0  
> **Desarrollador:** Bernardo Lopez  
> **Propósito:** Documentar las 3 pantallas principales de gestión de grupos para futuras modificaciones con IA

---

## 🎯 Visión General

Este documento describe la implementación de 3 pantallas clave para la gestión de grupos académicos por parte de profesores:

1. **Dashboard Principal** (`/`) - Lista de grupos con acciones
2. **Crear/Editar Grupo** (`/createGroup` y `/editGroup/[id]`) - Formulario de configuración de grupos
3. **Pantalla QR** (`/QR`) - Generación de códigos QR para sesiones

Todas las pantallas están protegidas por autenticación y solo accesibles para profesores autenticados.

---

## 🗂️ Estructura de Archivos

```
src/
├── app/
│   ├── page.js                                    # Dashboard Principal (/)
│   └── (profesor)/
│       ├── createGroup/
│       │   └── page.js                           # Crear Grupo
│       ├── editGroup/
│       │   └── [groupId]/
│       │       └── page.js                       # Editar Grupo
│       ├── QR/
│       │   └── page.js                           # Pantalla QR
│       ├── dashboard/
│       │   └── page.js                           # DEPRECATED - Redirige a /
│       └── generar-qr/
│           └── page.js                           # DEPRECATED - Usar /QR
│
├── components/
│   ├── forms/
│   │   └── GroupForm.js                          # Componente compartido crear/editar
│   └── ui/
│       ├── Table.js                              # Tabla reutilizable
│       ├── Modal.js                              # Modal de confirmación
│       ├── Badge.js                              # Etiquetas de estado
│       ├── Autocomplete.js                       # Input con sugerencias de BD
│       └── Input.js                              # Input de texto simple
│
└── services/
    └── session.service.js                        # Extendido con 3 métodos nuevos
```

---

## 📊 Modelo de Datos

### CurrentGroup (Tabla principal)

**Concepto:** Representa un grupo académico permanente (Materia + Grupo + Profesor + Estudiantes)

**Campos:**
- `id` (UUID, auto) - Identificador único
- `professorId` (UUID, FK) - Profesor titular
- `subjectId` (UUID, FK) - Materia impartida
- `groupId` (UUID, FK) - Grupo asignado
- `status` (ENUM) - `ACTIVE` (vigente) o `INACTIVE` (archivado)
- `degree` (text) - Carrera/Licenciatura
- `curriculum` (text) - Plan de estudios
- `schoolPeriod` (text) - Periodo escolar (ej: "20261")
- `school` (text) - Escuela (default: ESIME Culhuacán)
- `institute` (text) - Institución (default: IPN)
- `created_at` (timestamp)

### Relaciones

```
CurrentGroup
├── Subject (1:N) - Materias
├── Group (1:N) - Grupos
├── Professors (1:N) - Profesor titular
└── TakeAttendance (1:N) - Estudiantes inscritos
```

---

## 🏠 Pantalla 1: Dashboard Principal

**Ruta:** `/`  
**Archivo:** [src/app/page.js](src/app/page.js)

### Funcionalidad

- Muestra tabla con todos los grupos **ACTIVE** del profesor autenticado
- Columnas: Materias, Grupos, Acciones (Editar, Eliminar)
- Botón global "Crear grupo" en header
- Modal de confirmación para eliminar

### Flujo de Datos

```javascript
useAuth() → obtener professor
  ↓
getAllByProfessor(professor.id) → cargar grupos del profesor
  ↓
Filtrar status='ACTIVE'
  ↓
Renderizar en Table
```

### Acciones de Usuario

| Acción | Trigger | Función | Resultado |
|--------|---------|---------|-----------|
| **Crear grupo** | Click botón header | `router.push('/createGroup')` | Navega a formulario crear |
| **Editar** | Click botón en fila | `router.push(\`/editGroup/${id}\`)` | Navega a formulario editar |
| **Eliminar** | Click botón en fila | Abre Modal → `updateStatus(id, 'INACTIVE')` | Cambia status, oculta de lista |

### Estados

- **Loading:** Spinner centrado durante carga de grupos
- **Empty State:** Mensaje "No hay grupos activos" + botón crear
- **Error:** Banner rojo con mensaje de error

### Componentes Utilizados

- `Table` - Tabla de datos con scroll personalizado
- `Modal` - Confirmación de eliminación
- `Button` - Acciones (crear, editar, eliminar)
- `Spinner` - Indicador de carga
- `Badge` - (Preparado para mostrar status, actualmente no usado)

### Estilos Clave

```javascript
// Background
className="min-h-screen bg-gradient-to-br from-green-400 to-green-300"

// Card contenedor
className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border-2 border-blue-200"

// Botón crear
className="bg-white text-green-600 hover:bg-green-50 font-semibold shadow-lg"
```

### Servicios Utilizados

- `session.service.getAllByProfessor(professorId)` - Obtener grupos del profesor
- `session.service.updateStatus(sessionId, 'INACTIVE')` - Eliminar (cambiar status)

---

## 📝 Pantalla 2: Crear/Editar Grupo

**Rutas:**
- Crear: `/createGroup`
- Editar: `/editGroup/[groupId]`

**Archivos:**
- [src/app/(profesor)/createGroup/page.js](src/app/(profesor)/createGroup/page.js)
- [src/app/(profesor)/editGroup/[groupId]/page.js](src/app/(profesor)/editGroup/[groupId]/page.js)
- [src/components/forms/GroupForm.js](src/components/forms/GroupForm.js) (Componente compartido)

### Funcionalidad

**Layout de 2 columnas:**
1. **Izquierda:** Formulario con 5 dropdowns (Grupo, Carrera, Materia, Plan, Periodo)
2. **Derecha:** Tabla de estudiantes inscritos + botones (Cargar Excel, Añadir alumno)

### Componente Compartido: GroupForm

```javascript
<GroupForm 
  mode="create" | "edit"     // Modo de operación
  initialData={null | data}   // Datos pre-cargados (solo edit)
  onSuccess={(groupId) => {}} // Callback al guardar
/>
```

### Flujo de Datos

**Modo CREATE:**
```javascript
Renderizar formulario vacío
  ↓
Usuario completa dropdowns
  ↓
handleSaveGroup() → createSession()
  ↓
Retorna currentGroupId
  ↓
onSuccess(currentGroupId) → (pendiente: redirigir a Dashboard)
```

**Modo EDIT:**
```javascript
getById(groupId) → cargar datos del grupo
  ↓
getBySession(groupId) → cargar estudiantes inscritos
  ↓
Pre-llenar formulario con initialData
  ↓
Usuario modifica campos
  ↓
handleSaveGroup() → updateSession()
  ↓
onSuccess(currentGroupId) → (pendiente: redirigir a Dashboard)
```

### Campos del Formulario

| Campo | Tipo | Origen de Datos | Obligatorio | Permite Escritura Libre | Editable en Modo Edit |
|-------|------|-----------------|-------------|------------------------|----------------------|
| **Grupo** | Autocomplete | `group.service.getAll()` | ✅ Sí | ✅ Sí | ❌ No (deshabilitado) |
| **Materia** | Autocomplete | `subject.service.getAll()` | ✅ Sí | ✅ Sí | ❌ No (deshabilitado) |
| **Carrera** | Input | Usuario escribe | ❌ No | ✅ Sí | ❌ No (deshabilitado) |
| **Plan de estudios** | Input | Usuario escribe | ❌ No | ✅ Sí | ❌ No (deshabilitado) |
| **Periodo escolar** | Input | Usuario escribe | ❌ No | ✅ Sí | ❌ No (deshabilitado) |

**Notas importantes:**
- **Autocomplete:** Permite seleccionar de sugerencias de BD **o** escribir valor personalizado
- **Input:** Campo de texto libre sin sugerencias
- **Grupo y Materia:** Aunque permiten escritura libre, se recomienda seleccionar de las opciones existentes para mantener consistencia
- **Carrera, Plan, Periodo:** Campos completamente libres para adaptarse a diferentes contextos educativos
- **Modo Edición:** Todos los campos del formulario están deshabilitados (`disabled={mode === 'edit'}`) para evitar modificaciones accidentales de la configuración base del grupo. Solo la gestión de estudiantes (agregar/eliminar) está permitida en modo edición.

### Funciones Implementadas

#### ✅ `handleSaveGroup()`

**Propósito:** Crear o actualizar CurrentGroup en BD

**Flujo:**
```javascript
if (mode === 'create') {
  const professorData = await buscar profesor por email
  const newGroup = await createSession(...)
  setCurrentGroupId(newGroup.id)
} else {
  await updateSession(currentGroupId, {...})
}

onSuccess(groupId)
```

**Estado:** Completamente funcional, lista para conectar a trigger UI

#### ✅ `handleAddStudentsToGroup(currentGroupId, studentsArray)`

**Propósito:** Inscribir múltiples estudiantes en el grupo (crear registros en TakeAttendance)

**Flujo:**
```javascript
for each student in studentsArray:
  studentRecord = await getOrCreateStudent(nombre, boleta)
  attendance = await recordAttendance(studentId, currentGroupId, {...})
  actualizar lista local con attendance.id
```

**Estado:** Completamente funcional, lista para conectar a trigger UI

#### ✅ `handleRemoveStudent(attendanceId)`

**Propósito:** Eliminar inscripción de estudiante (DELETE en TakeAttendance)

**Flujo:**
```javascript
await removeAttendance(attendanceId)
actualizar lista local (filtrar eliminado)
```

**Estado:** Conectado a botón "Eliminar" en tabla de estudiantes

### Botones Sin Funcionalidad (Pendientes)

#### ❌ Botón "Cargar Excel"

```javascript
<input 
  type="file" 
  accept=".xlsx,.xls" 
  ref={fileInputRef}
/>
<Button onClick={() => fileInputRef.current?.click()}>
  Cargar Excel
</Button>
```

**Comportamiento actual:** Abre file picker, no procesa archivo

**TODO:** Implementar parseo de Excel con librería (ej: xlsx, exceljs)

#### ❌ Botón "Añadir alumno"

```javascript
<Button onClick={() => {
  alert('Funcionalidad pendiente');
}}>
  Añadir alumno
</Button>
```

**Comportamiento actual:** Muestra alert

**TODO:** Implementar modal con formulario (Boleta, Nombre)

### Nota Importante: Sin Botón de Guardar

⚠️ **El diseño NO incluye botón de "Guardar" o "Aplicar Cambios"**

Las funciones `handleSaveGroup()` están **implementadas y listas** pero no conectadas a ningún trigger UI. El equipo debe decidir cuándo/cómo activarlas:

**Opciones posibles:**
1. Auto-guardado al cambiar dropdowns
2. Botón "Guardar" al final del formulario
3. Guardar al cargar Excel
4. Guardar al agregar primer estudiante

### Estilos Clave

```javascript
// Layout 2 columnas
className="grid grid-cols-1 lg:grid-cols-2 gap-8"

// Panel izquierdo (formulario)
className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border-2 border-blue-200 p-8"

// Labels
className="block text-base font-semibold text-gray-800 mb-2"
```

### Servicios Utilizados

- `subject.service.getAll()` - Cargar materias
- `group.service.getAll()` - Cargar grupos
- `session.service.createSession()` - Crear grupo (modo create)
- `session.service.update()` - Actualizar grupo (modo edit)
- `session.service.getById()` - Cargar datos (modo edit)
- `student.service.getOrCreateStudent()` - Inscribir estudiante
- `attendance.service.recordAttendance()` - Crear inscripción
- `attendance.service.remove()` - Eliminar inscripción
- `attendance.service.getBySession()` - Cargar estudiantes (modo edit)

---

## 🎫 Pantalla 3: Generación de QR

**Ruta:** `/QR?currentGroupId=<uuid>`  
**Archivo:** [src/app/(profesor)/QR/page.js](src/app/(profesor)/QR/page.js)

### Funcionalidad

- Muestra QR generado para una sesión/grupo específico
- Permite (eventualmente) configurar duración del QR
- Muestra información del grupo (Materia, Grupo, Periodo)

### Parámetros de URL

```javascript
const currentGroupId = searchParams.get('currentGroupId');
```

**Validación:**
- Si `currentGroupId` no existe → Redirigir a `/` con error
- Si grupo no existe en BD → Redirigir a `/` con error

### Flujo de Datos

```javascript
Obtener currentGroupId de URL
  ↓
getById(currentGroupId) → cargar datos del grupo
  ↓
<QRGenerator sessionId={currentGroupId} duration={90} />
  ↓
Mostrar QR + información del grupo
```

### Componentes de UI

#### Área del QR

```javascript
<div className="bg-gray-200 rounded-lg border-2 border-gray-300 p-8 min-h-[400px]">
  <QRGenerator sessionId={currentGroupId} duration={duration} />
</div>
```

#### Botón "Establecer tiempo"

```javascript
<Button 
  className="bg-purple-500 hover:bg-purple-600 text-white"
  onClick={() => alert('Funcionalidad pendiente')}
>
  <ClockIcon /> Establecer tiempo
</Button>
```

**Estado:** Sin funcionalidad

**TODO:** Implementar modal para configurar `duration` (minutos)

#### Campo "Tiempo de vida"

```javascript
<div className="border-b-2 border-gray-300">
  <span>{duration} minutos</span>
</div>
```

**Estado:** Solo lectura, muestra duración actual (default: 90 min)

#### Botón "Generar nuevo QR"

```javascript
<Button 
  disabled
  className="bg-gray-200 text-gray-500 cursor-not-allowed"
>
  Generar nuevo QR
</Button>
```

**Estado:** Deshabilitado (apariencia según diseño)

**TODO:** Implementar regeneración de QR con nueva timestamp

### Información del Grupo

```javascript
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <strong>Materia:</strong> {group.Subject?.Subject}
  <strong>Grupo:</strong> {group.Group?.group}
  <strong>Periodo:</strong> {group.schoolPeriod}
</div>
```

### Estados

- **Loading:** Spinner durante carga de grupo
- **Error:** Mensaje de error + redirección automática
- **Success:** QR visible + información del grupo

### Estilos Clave

```javascript
// Botón morado "Establecer tiempo"
className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg"

// Área QR (placeholder)
className="bg-gray-200 rounded-lg border-2 border-gray-300 p-8"

// Botón deshabilitado
className="bg-gray-200 text-gray-500 cursor-not-allowed"
```

### Servicios Utilizados

- `session.service.getById(currentGroupId)` - Cargar datos del grupo
- `qr/generator.generateSessionQR()` - Generar código QR (vía componente QRGenerator)

---

## 🔧 Servicios Extendidos

### session.service.js - Métodos Nuevos

#### `getAllByProfessor(professorId, client)`

**Propósito:** Obtener TODAS las sesiones de un profesor (sin filtro de status)

**Retorno:**
```javascript
[
  {
    ...currentGroupData,
    Subject: { id, Subject },
    Group: { id, group },
    studentCount: 5 // COUNT de TakeAttendance
  }
]
```

**Uso:**
```javascript
const supabase = createBrowserClient();
const groups = await getAllByProfessor(professorId, supabase);
const activeGroups = groups.filter(g => g.status === 'ACTIVE');
```

#### `update(sessionId, sessionData, client)`

**Propósito:** Actualizar campos de CurrentGroup

**Campos permitidos:**
- `subjectId`
- `groupId`
- `curriculum`
- `schoolPeriod`
- `degree`
- `school`
- `institute`

**Campos NO permitidos:**
- `professorId` (no se puede cambiar titular)
- `status` (usar `updateStatus()` para esto)

**Retorno:** CurrentGroup actualizado con relaciones (Subject, Group)

**Uso:**
```javascript
await update(sessionId, {
  subjectId: 'new-uuid',
  curriculum: '2020',
  schoolPeriod: '20261'
}, supabase);
```

#### `removeIfEmpty(sessionId, client)`

**Propósito:** Eliminar sesión solo si NO tiene estudiantes inscritos

**Flujo:**
1. Verifica si hay TakeAttendance asociados
2. Si hay → Lanza error "No se puede eliminar grupo con estudiantes inscritos"
3. Si está vacío → DELETE de CurrentGroup

**Retorno:**
```javascript
{ success: true, deleted: true }
```

**Uso:**
```javascript
try {
  await removeIfEmpty(sessionId, supabase);
  console.log('Grupo eliminado');
} catch (err) {
  alert(err.message); // "No se puede eliminar..."
}
```

---

## 🎨 Componentes UI Nuevos

### Table.js

**Ubicación:** [src/components/ui/Table.js](src/components/ui/Table.js)

**Props:**
```javascript
<Table
  columns={[
    { key: 'field', label: 'Header', render: (row) => <Custom /> }
  ]}
  data={[{...}]}
  onRowClick={(row) => {}}
  className=""
  unstyled={false}
/>
```

**Características:**
- Scroll horizontal personalizado (scrollbar verde)
- Soporte para render custom por columna
- Empty state automático ("No hay datos para mostrar")
- Hover effect en filas
- Prop `unstyled` para control total

### Modal.js

**Ubicación:** [src/components/ui/Modal.js](src/components/ui/Modal.js)

**Props:**
```javascript
<Modal
  isOpen={boolean}
  onClose={() => {}}
  title="Título"
  footer={<Buttons />}
>
  Contenido del modal
</Modal>
```

**Características:**
- Cierre con tecla ESC
- Cierre con click en overlay
- Previene scroll del body cuando está abierto
- Max-height con scroll interno
- Prop `unstyled` para control total

### Badge.js

**Ubicación:** [src/components/ui/Badge.js](src/components/ui/Badge.js)

**Props:**
```javascript
<Badge variant="success | warning | danger | info | active | inactive">
  Texto
</Badge>
```

**Variantes:**
- `success` - Verde (bg-green-100, text-green-800)
- `warning` - Amarillo (bg-yellow-100, text-yellow-800)
- `danger` - Rojo (bg-red-100, text-red-800)
- `info` - Azul (bg-blue-100, text-blue-800)
- `active` - Verde esmeralda (bg-emerald-100, text-emerald-800)
- `inactive` - Gris (bg-gray-100, text-gray-800)

### Autocomplete.js

**Ubicación:** [src/components/ui/Autocomplete.js](src/components/ui/Autocomplete.js)

**Props:**
```javascript
<Autocomplete
  options={[{ value: 'id', label: 'Nombre' }]}
  value="currentValue"
  onChange={(value) => {}}
  placeholder="Escribe o selecciona..."
  error=""
  className=""
  unstyled={false}
/>
```

**Características:**
- Input de texto que permite escritura libre
- Filtrado dinámico de opciones en tiempo real (case-insensitive)
- Dropdown con sugerencias al escribir
- Selección con click o teclado (Enter, ArrowUp, ArrowDown, Escape)
- Muestra `label` pero guarda `value` en estado
- Cierre automático al hacer click fuera
- Si no hay coincidencia exacta, guarda el texto escrito como valor
- Sincroniza `inputValue` con `value` al inicializar
- Prop `unstyled` para control total

**Uso típico:**
```javascript
// Estado
const [options, setOptions] = useState([
  { value: 'uuid-1', label: '1CM1' },
  { value: 'uuid-2', label: '2CV3' }
]);
const [selectedId, setSelectedId] = useState('');

// Render
<Autocomplete
  options={options}
  value={selectedId}
  onChange={(id) => setSelectedId(id)}
  placeholder="Escribe o selecciona un grupo"
/>
```

### Input.js

**Ubicación:** [src/components/ui/Input.js](src/components/ui/Input.js)

**Props:**
```javascript
<Input
  type="text"
  value=""
  onChange={(e) => {}}
  placeholder=""
  error=""
  className=""
  unstyled={false}
/>
```

**Características:**
- Input de texto simple sin sugerencias
- Mensaje de error debajo del campo
- Estilos predeterminados con Tailwind
- Focus ring azul
- Prop `unstyled` para control total

---

## 🚀 Flujos de Usuario Completos

### Flujo 1: Crear Grupo Nuevo

```
1. Profesor autenticado → Dashboard (/)
2. Click "Crear grupo" → /createGroup
3. Completa campos del formulario:
   - Grupo: Autocomplete (sugerencias de BD o escritura libre)
   - Materia: Autocomplete (sugerencias de BD o escritura libre)
   - Carrera: Input libre
   - Plan de estudios: Input libre
   - Periodo escolar: Input libre
4. [PENDIENTE] Click "Guardar" o auto-guardado
   → handleSaveGroup() ejecuta createSession()
   → CurrentGroup creado con status=ACTIVE
5. [PENDIENTE] Cargar Excel con estudiantes
   → handleAddStudentsToGroup() ejecuta
   → Estudiantes inscritos en TakeAttendance
6. [PENDIENTE] Redirigir a Dashboard
   → Grupo visible en tabla principal
```

### Flujo 2: Editar Grupo Existente

```
1. Dashboard → Click "Editar" en fila
2. Navega a /editGroup/[groupId]
3. Formulario pre-llenado con datos actuales:
   - Autocomplete sincroniza value con label correcto
   - Inputs muestran valores guardados
   - TODOS los campos están deshabilitados (no editables)
4. Tabla muestra estudiantes ya inscritos
5. Usuario puede:
   - Agregar estudiantes (botón "Añadir alumno" o "Cargar Excel")
   - Eliminar estudiantes (botón "Eliminar" en cada fila)
   - NO puede modificar: Grupo, Materia, Carrera, Plan, Periodo
6. [PENDIENTE] Click "Guardar"
   → Solo afecta cambios en la lista de estudiantes
   → La configuración base del grupo permanece inmutable
7. [PENDIENTE] Redirigir a Dashboard

Nota: En modo edición, la función handleSaveGroup() no se ejecuta
automáticamente ya que los campos están deshabilitados. Si se
implementa un botón de guardar, solo debería afectar la gestión
de estudiantes.
```

### Flujo 3: Eliminar Grupo

```
1. Dashboard → Click "Eliminar" en fila
2. Modal de confirmación se abre
3. Click "Eliminar" en modal
   → updateStatus(groupId, 'INACTIVE')
   → Grupo ya no visible en Dashboard (filtro ACTIVE)
4. Modal se cierra, tabla se actualiza
```

### Flujo 4: Generar QR para Sesión

```
1. Dashboard → [PENDIENTE: Agregar botón "Generar QR" por fila]
2. Navega a /QR?currentGroupId=X
3. Datos del grupo se cargan
4. QR se genera con sessionId + timestamp + firma
5. [OPCIONAL] Click "Establecer tiempo"
   → Modal para configurar duración
   → Regenerar QR con nueva duración
6. Profesor muestra QR a alumnos para escanear
```

---

## ⚙️ Configuración y Constantes

### Opciones Hardcoded (IPN ESIME Culhuacán)

#### Carreras (`degreeOptions`)

```javascript
const degreeOptions = [
  { value: 'Ingeniería Mecánica', label: 'Ingeniería Mecánica' },
  { value: 'Ingeniería Eléctrica', label: 'Ingeniería Eléctrica' },
  { value: 'Ingeniería Electrónica', label: 'Ingeniería Electrónica' },
  { value: 'Ingeniería en Control y Automatización', label: '...' },
  { value: 'Ingeniería en Comunicaciones y Electrónica', label: '...' },
];
```

#### Planes de Estudio (`curriculumOptions`)

```javascript
const curriculumOptions = [
  { value: '2020', label: 'Plan 2020' },
  { value: '2016', label: 'Plan 2016' },
  { value: '2009', label: 'Plan 2009' },
];
```

#### Periodos Escolares (`schoolPeriodOptions`)

```javascript
const schoolPeriodOptions = [
  { value: '20261', label: '2026-1' },
  { value: '20262', label: '2026-2' },
  { value: '20251', label: '2025-1' },
  { value: '20252', label: '2025-2' },
];
```

### Valores por Defecto

```javascript
// Duración de QR
const DEFAULT_QR_DURATION = 90; // minutos

// Status de nuevos grupos
const DEFAULT_GROUP_STATUS = 'ACTIVE';

// Escuela e Instituto (auto-llenado)
const DEFAULT_SCHOOL = 'ESCUELA SUPERIOR DE INGENIERIA MECANICA Y ELECTRICA UNIDAD CULHUACAN';
const DEFAULT_INSTITUTE = 'INSTITUTO POLITECNICO NACIONAL';
```

---

## 🐛 Limitaciones Conocidas y TODOs

### Funcionalidades Pendientes

#### Alta Prioridad

- [ ] **Botón de Guardar en formulario crear/editar**
  - Decisión de UX necesaria: ¿auto-guardado o botón explícito?
  - Funciones `handleSaveGroup()` ya implementadas

- [ ] **Cargar Excel con estudiantes**
  - Input file funcional, falta parseo
  - Librerías sugeridas: `xlsx`, `exceljs`
  - Formato esperado: Columnas [Boleta, Nombre]

- [ ] **Modal de Añadir alumno manual**
  - Formulario simple: Input Boleta + Input Nombre
  - Validación de boleta (única)
  - Llamar a `handleAddStudentsToGroup()`

- [ ] **Botón "Generar QR" en Dashboard**
  - Agregar columna en tabla con botón/icono
  - Redirigir a `/QR?currentGroupId=${row.id}`

#### Media Prioridad

- [ ] **Modal Establecer tiempo en /QR**
  - Input numérico para minutos
  - Botón "Aplicar" que actualiza `duration` state
  - Regenerar QR con nueva duración

- [ ] **Botón "Generar nuevo QR"**
  - Regenerar QR con nueva timestamp (mismo duration)
  - Útil cuando QR actual ha expirado

- [ ] **Filtros en Dashboard**
  - Toggle entre ver ACTIVE / INACTIVE / TODOS
  - Búsqueda por materia o grupo

#### Baja Prioridad

- [ ] **Paginación en tabla de grupos**
  - Necesario si profesor tiene > 20 grupos
  - Componente Table ya soporta paginación externa

- [ ] **Exportar lista de estudiantes**
  - Botón "Exportar Excel" en formulario
  - Generar archivo con estudiantes inscritos

- [ ] **Historial de cambios en grupo**
  - Log de modificaciones (quién, cuándo, qué cambió)
  - Requiere nueva tabla de auditoría

### Bugs Conocidos

- **Ninguno reportado** (implementación reciente)

### Mejoras de UX

- [ ] Confirmación visual al guardar (toast notification)
- [ ] Loading states en botones durante operaciones async
- [ ] Breadcrumbs en formularios (Dashboard > Crear Grupo)
- [ ] Shortcuts de teclado (Esc para cerrar modales, Ctrl+S para guardar)

---

## 📱 Responsive Design

### Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### Ajustes por Pantalla

#### Dashboard
- **Mobile:** Tabla con scroll horizontal, botones apilados
- **Desktop:** Tabla completa visible

#### Formulario Crear/Editar
- **Mobile:** Columnas apiladas verticalmente (`grid-cols-1`)
- **Desktop:** 2 columnas lado a lado (`lg:grid-cols-2`)

#### Pantalla QR
- **Mobile:** QR más pequeño (máx 300px)
- **Desktop:** QR grande (máx 600px)

---

## 🔐 Seguridad

### Protección de Rutas

Todas las pantallas están protegidas por [middleware.js](src/middleware.js):

```javascript
// Rutas públicas
const publicRoutes = ['/login', '/register', '/logout'];

// Cualquier otra ruta requiere autenticación
if (!isPublicRoute && !session) {
  redirect('/login');
}
```

### Validación de Datos

- Todos los servicios usan **Zod schemas** para validar inputs
- Campos obligatorios: `subjectId`, `groupId` (mínimo para crear grupo)
- Boletas deben ser únicas (validación en `student.service`)

### Permisos

- ✅ Profesor solo ve **sus propios grupos** (`getAllByProfessor` filtra por `professorId`)
- ✅ No puede modificar grupos de otros profesores (validación en backend vía RLS)
- ✅ No puede cambiar `professorId` de un grupo existente

---

## 🧪 Testing Manual

### Checklist de Pruebas

#### Dashboard

- [ ] Login como profesor → redirige a `/` automáticamente
- [ ] Dashboard vacío → muestra "No hay grupos activos"
- [ ] Click "Crear grupo" → navega a `/createGroup`
- [ ] Grupos en tabla → renderiza Materia y Grupo correctos
- [ ] Click "Editar" → navega a `/editGroup/[id]` con ID correcto
- [ ] Click "Eliminar" → abre modal de confirmación
- [ ] Confirmar eliminación → grupo desaparece de tabla
- [ ] Scroll horizontal en tabla → funciona en pantalla pequeña

#### Crear Grupo

- [ ] Dropdowns de Materia y Grupo → cargan datos de BD
- [ ] Dropdowns de Carrera, Plan, Periodo → muestran opciones hardcoded
- [ ] Cambiar valores en dropdowns → `formData` se actualiza
- [ ] Click "Cargar Excel" → abre file picker
- [ ] Seleccionar archivo → muestra alert "Funcionalidad pendiente"
- [ ] Click "Añadir alumno" → muestra alert
- [ ] Tabla de estudiantes vacía → muestra mensaje
- [ ] Click "Volver" → regresa a Dashboard

#### Editar Grupo

- [ ] Acceder con ID válido → carga datos del grupo
- [ ] Formulario pre-llenado → valores correctos
- [ ] Tabla de estudiantes → muestra inscritos actuales
- [ ] Click "Eliminar" en estudiante → elimina de lista y BD
- [ ] Modificar dropdowns → `formData` se actualiza
- [ ] Acceder con ID inválido → muestra error y redirige

#### Pantalla QR

- [ ] Acceder sin `currentGroupId` → muestra error y redirige
- [ ] Acceder con ID válido → carga QR
- [ ] QR visible → muestra código generado
- [ ] Información del grupo → Materia, Grupo, Periodo correctos
- [ ] Click "Establecer tiempo" → muestra alert
- [ ] Botón "Generar nuevo QR" → está deshabilitado
- [ ] Click "Volver" → regresa a Dashboard

---

## 🤖 Prompts para Modificaciones con IA

### Prompt: Agregar Botón de Guardar

```
"Agrega un botón de 'Guardar Cambios' al final del formulario en GroupForm.js. 

Requisitos:
- Ubicar en panel izquierdo, después de los dropdowns
- Botón verde con icono de check
- Al hacer click, ejecutar handleSaveGroup()
- Mostrar loading state durante guardado
- Después de guardar exitosamente, redirigir a Dashboard (/)
- Si hay error, mostrar mensaje en banner rojo

Mantén los estilos actuales del diseño (gradientes, bordes, etc.)"
```

### Prompt: Implementar Cargar Excel

```
"Implementa la funcionalidad de parseo de Excel en el botón 'Cargar Excel' de GroupForm.js.

Requisitos:
- Instala librería xlsx con: npm install xlsx
- Al seleccionar archivo .xlsx, parsear contenido
- Esperar columnas: 'Boleta' y 'Nombre' (validar que existan)
- Convertir filas a array de {boleta, nombre, tempId}
- Actualizar state 'students' con datos del Excel
- Validar que boletas no estén duplicadas
- Mostrar mensaje de éxito con cantidad de estudiantes cargados
- Si falta columna o archivo inválido, mostrar error

Mantén el estilo UI actual del componente."
```

### Prompt: Modal de Añadir Alumno

```
"Crea un modal para añadir alumno manualmente en GroupForm.js.

Requisitos:
- Estado local para controlar modal: isAddStudentModalOpen
- Formulario con 2 inputs: Boleta (text) y Nombre (text)
- Validación: ambos campos obligatorios
- Botones: 'Cancelar' (cierra modal) y 'Agregar' (guarda)
- Al agregar, actualizar state 'students' con nuevo alumno
- Asignar tempId único (max tempId + 1)
- Cerrar modal después de agregar
- Usar componente Modal.js existente
- Si hay error, mostrar en input con borde rojo

Estilos: seguir diseño actual (inputs blancos, botón azul)"
```

### Prompt: Botón Generar QR en Dashboard

```
"Agrega una columna 'QR' a la tabla del Dashboard con botón para generar código QR.

Requisitos:
- Nueva columna entre 'Grupos' y 'Acciones'
- Botón con icono de QR code (SVG)
- Al hacer click, navegar a /QR?currentGroupId={row.id}
- Botón con estilo verde claro, hover más oscuro
- Icono: usar heroicons o lucide-react
- Actualizar array 'columns' en page.js

Mantener estilos actuales de la tabla."
```

### Prompt: Modal Establecer Tiempo en /QR

```
"Implementa modal para configurar duración del QR en la pantalla /QR.

Requisitos:
- Estado local: isTimeModalOpen, tempDuration
- Modal con título 'Establecer tiempo de vida del QR'
- Input numérico para minutos (valor por defecto: 90)
- Rango permitido: 5-240 minutos
- Botones: 'Cancelar' y 'Aplicar'
- Al aplicar, actualizar state 'duration' y cerrar modal
- QRGenerator se re-renderiza automáticamente con nueva duración
- Usar componente Modal.js existente

Estilos: seguir diseño actual (botón morado con icono de reloj)"
```

---

## 📞 Contacto y Soporte

**Desarrollador:** Bernardo Lopez  
**Equipo:** Sistema de Pase de Lista con QR - ESIME Culhuacán  
**Fecha de última actualización:** 13 de febrero de 2026

Para modificaciones o dudas sobre estas pantallas, consultar:
- Este documento (GESTION-GRUPOS.md)
- [AI_CONTEXT.md](AI_CONTEXT.md) - Contexto general del proyecto
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitectura completa

---

## 🎓 Glosario

- **CurrentGroup:** Tabla que representa un grupo académico permanente (no temporal)
- **TakeAttendance:** Tabla de inscripciones (relación Estudiante-Grupo), NO asistencias individuales
- **status ACTIVE:** Grupo vigente este semestre
- **status INACTIVE:** Grupo archivado (terminado o eliminado)
- **sessionId:** ID de CurrentGroup (nombre legacy, NO es "sesión temporal")
- **QR dinámico:** QR generado en tiempo real (no almacenado en BD)
- **Boleta:** Número de estudiante IPN (único por alumno)

---

**FIN DE DOCUMENTACIÓN**
