# Sistema de Pase de Lista con QR - Guía de Configuración

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración de Supabase](#configuración-de-supabase)
- [Variables de Entorno](#variables-de-entorno)
- [Desarrollo Local](#desarrollo-local)
- [Despliegue en Vercel](#despliegue-en-vercel)

---

## ✅ Requisitos Previos

- **Node.js** 18.x o superior
- **npm** o **yarn**
- Cuenta de **Supabase** (https://supabase.com)
- Cuenta de **Vercel** (opcional, para deploy)

---

## 🚀 Instalación

1. **Clonar o descargar el proyecto**

```bash
cd IS-Proyecto
```

2. **Instalar dependencias**

```bash
npm install
```

---

## 🔧 Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Crea un nuevo proyecto
3. Anota la **URL del proyecto** y las **API Keys**

### 2. Ejecutar Schema de Base de Datos

El archivo `schema.sql` ya existe en tu proyecto. Supabase lo ha creado automáticamente.

### 3. Configurar Autenticación

1. En tu dashboard de Supabase, ve a: **Authentication → Providers**
2. Habilita **Email Provider**
3. Configura las URLs:
   - **Site URL**: `http://localhost:3000` (desarrollo)
   - **Redirect URLs**: 
     - `http://localhost:3000/api/auth/callback`
     - `https://tu-app.vercel.app/api/auth/callback` (producción)

### 4. Aplicar Políticas de Seguridad (RLS)

1. Ve a: **SQL Editor** en Supabase
2. Abre el archivo `supabase-policies.sql` del proyecto
3. Copia y pega cada sección en el SQL Editor
4. Ejecuta las queries en orden

---

## 🔑 Variables de Entorno

### 1. Copiar el archivo de ejemplo

```bash
cp .env.example .env.local
```

### 2. Completar las variables

Edita `.env.local` con tus credenciales:

```env
# SUPABASE (Obtén estos valores de tu dashboard de Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# APP
# En desarrollo: El QR detecta automáticamente localhost:PUERTO (opcional)
# En producción: Debes configurar la URL de Vercel
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SESSION_DURATION=90

# SECURITY (Generar clave aleatoria)
QR_SECRET_KEY=tu_clave_secreta_aleatoria_minimo_32_caracteres
```

### 3. Generar QR_SECRET_KEY

Ejecuta en terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y úsalo como `QR_SECRET_KEY`.

### 4. Obtener credenciales de Supabase

En tu dashboard de Supabase:
- Ve a: **Settings → API**
- Copia:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** (¡cuidado, es secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 💻 Desarrollo Local

1. **Iniciar servidor de desarrollo**

```bash
npm run dev
```

2. **Abrir en navegador**

Navega a: http://localhost:3000

3. **Crear cuenta de profesor**

- Ve a `/register`
- Completa el formulario
- Verifica tu email (si configuraste email verification)
- Inicia sesión en `/login`

---

## 🎯 Flujo de Uso

### Para Profesores:

1. **Login** en `/login`
2. **Dashboard** en `/dashboard`
3. **Generar QR** en `/generar-qr`:
   - Selecciona materia y grupo
   - Define duración de la sesión
   - Genera el QR
4. Muestra el QR a los alumnos

### Para Alumnos:

1. **Escanean el QR del profesor** con su teléfono
2. Son redirigidos a `/asistencia/[sessionId]`
3. El sistema valida la sesión
4. **Escanean el QR de su credencial**
5. El sistema extrae su boleta
6. Confirman sus datos
7. ¡Asistencia registrada!

---

## 🚢 Despliegue en Vercel

### 1. Conectar Repositorio

1. Ve a https://vercel.com
2. Importa tu proyecto de GitHub/GitLab/Bitbucket
3. Selecciona el framework: **Next.js**

### 2. Configurar Variables de Entorno

En Vercel, ve a: **Settings → Environment Variables**

Agrega todas las variables de `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (usar la URL de Vercel, ej: `https://tu-app.vercel.app`)
- `NEXT_PUBLIC_SESSION_DURATION`
- `QR_SECRET_KEY`
- `NODE_ENV=production`

### 3. Deploy

1. Click en **Deploy**
2. Espera a que termine el build
3. Visita tu app en la URL asignada

### 4. Actualizar URLs en Supabase

1. En Supabase, ve a: **Authentication → URL Configuration**
2. Agrega tu URL de Vercel a:
   - **Site URL**: `https://tu-app.vercel.app`
   - **Redirect URLs**: `https://tu-app.vercel.app/api/auth/callback`

---

## 🧪 Testing

### Probar autenticación:

```bash
# Registro
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","lastName":"User","email":"test@test.com","password":"123456"}'
```

### Probar creación de sesión:

Primero inicia sesión, luego:

```bash
curl -X POST http://localhost:3000/api/attendance/create-session \
  -H "Content-Type: application/json" \
  -d '{"subjectId":"uuid","groupId":"uuid","duration":90}'
```

---

## 📝 Notas Importantes

### Seguridad:

- ✅ **NUNCA** commitees `.env.local` a Git
- ✅ Las políticas RLS protegen los datos en Supabase
- ✅ Los QR están firmados criptográficamente
- ✅ Las sesiones expiran según la duración configurada

### Web Scraping:

- El sistema busca un `<div class="boleta">` en la URL escaneada
- Asegúrate de que las credenciales de alumnos tengan este formato
- Si no encuentra la clase, retorna error

### Limitaciones Actuales:

- No hay gestión completa de materias/grupos (usar mock data por ahora)
- No hay visualización de asistencias tomadas
- No hay reportes/estadísticas
- Estas features se agregarán en futuras fases

---

## 🆘 Troubleshooting

### Error: "No autenticado"

- Verifica que iniciaste sesión
- Revisa que las cookies estén habilitadas
- Comprueba que Supabase Auth esté configurado

### Error: "QR inválido"

- Verifica que `QR_SECRET_KEY` sea la misma en todos los ambientes
- Comprueba que la sesión no haya expirado

### Error: "No se encontró el número de boleta"

- Verifica que la URL de la credencial contenga `<div class="boleta">`
- Comprueba que la URL sea accesible públicamente

### La cámara no funciona:

- Solo funciona en HTTPS (o localhost)
- Verifica permisos del navegador
- Prueba en un navegador diferente

---

## 📞 Soporte

Para problemas o dudas:
1. Revisa los logs en la consola del navegador
2. Revisa los logs en Supabase Dashboard
3. Verifica las políticas RLS
4. Consulta la documentación de Next.js y Supabase

---

## 🎓 Próximas Fases

Este proyecto se irá extendiendo con:
- Dashboard de asistencias
- Gestión completa de materias/grupos
- Reportes y estadísticas
- Exportación de datos
- Notificaciones
- PWA para instalación en móviles

¡El sistema está listo para comenzar a trabajar! 🚀
