# Instrucciones de Configuración de Supabase

## Problemas Identificados

1. **Error RLS**: "new row violates row-level security policy for table Professors"
2. **Error de Schema**: "Could not find the table 'public.Professors' in the schema cache"

## Solución

Las políticas RLS necesitan ser ejecutadas correctamente en Supabase. Sigue estos pasos:

---

## Paso 1: Verificar que las Tablas Existen en el Schema `bdLista`

En Supabase Dashboard → Table Editor, verifica que todas estas tablas existan en el schema `bdLista`:

- `bdLista.Professors`
- `bdLista.Students`
- `bdLista.Subject`
- `bdLista.Group`
- `bdLista.CurrentGroup`
- `bdLista.TakeAttendance`

---

## Paso 2: Ejecutar Políticas RLS

Ve a: **Supabase Dashboard → SQL Editor → New Query**

### 2.1 Habilitar RLS en todas las tablas

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE "bdLista"."Professors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."Students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."Group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."CurrentGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."TakeAttendance" ENABLE ROW LEVEL SECURITY;
```

### 2.2 Políticas para Professors (CRÍTICO para resolver el error de registro)

```sql
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "professors_select_own" ON "bdLista"."Professors";
DROP POLICY IF EXISTS "professors_update_own" ON "bdLista"."Professors";
DROP POLICY IF EXISTS "professors_insert_public" ON "bdLista"."Professors";

-- Los profesores pueden ver solo sus propios datos
CREATE POLICY "professors_select_own" 
ON "bdLista"."Professors"
FOR SELECT
USING (auth.jwt() ->> 'email' = email);

-- Los profesores pueden actualizar sus propios datos
CREATE POLICY "professors_update_own" 
ON "bdLista"."Professors"
FOR UPDATE
USING (auth.jwt() ->> 'email' = email);

-- Permitir INSERT para cualquiera (registro público)
CREATE POLICY "professors_insert_public" 
ON "bdLista"."Professors"
FOR INSERT
TO public
WITH CHECK (true);
```

### 2.3 Políticas para Students

```sql
DROP POLICY IF EXISTS "students_select_public" ON "bdLista"."Students";
DROP POLICY IF EXISTS "students_insert_public" ON "bdLista"."Students";

CREATE POLICY "students_select_public" 
ON "bdLista"."Students"
FOR SELECT
TO public
USING (true);

CREATE POLICY "students_insert_public" 
ON "bdLista"."Students"
FOR INSERT
TO public
WITH CHECK (true);
```

### 2.4 Políticas para Subject

```sql
DROP POLICY IF EXISTS "subjects_select_own" ON "bdLista"."Subject";
DROP POLICY IF EXISTS "subjects_insert_own" ON "bdLista"."Subject";
DROP POLICY IF EXISTS "subjects_update_own" ON "bdLista"."Subject";

CREATE POLICY "subjects_select_own" 
ON "bdLista"."Subject"
FOR SELECT
TO authenticated
USING (
  "professorId" IN (
    SELECT id FROM "bdLista"."Professors" 
    WHERE email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "subjects_insert_own" 
ON "bdLista"."Subject"
FOR INSERT
TO authenticated
WITH CHECK (
  "professorId" IN (
    SELECT id FROM "bdLista"."Professors" 
    WHERE email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "subjects_update_own" 
ON "bdLista"."Subject"
FOR UPDATE
TO authenticated
USING (
  "professorId" IN (
    SELECT id FROM "bdLista"."Professors" 
    WHERE email = auth.jwt() ->> 'email'
  )
);
```

### 2.5 Políticas para Group

```sql
DROP POLICY IF EXISTS "groups_select_public" ON "bdLista"."Group";
DROP POLICY IF EXISTS "groups_insert_authenticated" ON "bdLista"."Group";

CREATE POLICY "groups_select_public" 
ON "bdLista"."Group"
FOR SELECT
TO public
USING (true);

CREATE POLICY "groups_insert_authenticated" 
ON "bdLista"."Group"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');
```

### 2.6 Políticas para CurrentGroup (Sesiones)

**IMPORTANTE**: El enum `statusCurrentGroup` usa valores en MAYÚSCULAS: `'ACTIVE'` o `'INACTIVE'`

```sql
DROP POLICY IF EXISTS "current_group_select_public_active" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_select_own" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_insert_own" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_update_own" ON "bdLista"."CurrentGroup";

-- Primero: SELECT público para sesiones activas (alumnos lo necesitan)
CREATE POLICY "current_group_select_public_active" 
ON "bdLista"."CurrentGroup"
FOR SELECT
TO public
USING (status = 'ACTIVE');

-- Segundo: Profesores pueden ver todas sus sesiones
CREATE POLICY "current_group_select_own" 
ON "bdLista"."CurrentGroup"
FOR SELECT
TO authenticated
USING (
  "subjectId" IN (
    SELECT id FROM "bdLista"."Subject" 
    WHERE "professorId" IN (
      SELECT id FROM "bdLista"."Professors" 
      WHERE email = auth.jwt() ->> 'email'
    )
  )
);

CREATE POLICY "current_group_insert_own" 
ON "bdLista"."CurrentGroup"
FOR INSERT
TO authenticated
WITH CHECK (
  "subjectId" IN (
    SELECT id FROM "bdLista"."Subject" 
    WHERE "professorId" IN (
      SELECT id FROM "bdLista"."Professors" 
      WHERE email = auth.jwt() ->> 'email'
    )
  )
);

CREATE POLICY "current_group_update_own" 
ON "bdLista"."CurrentGroup"
FOR UPDATE
TO authenticated
USING (
  "subjectId" IN (
    SELECT id FROM "bdLista"."Subject" 
    WHERE "professorId" IN (
      SELECT id FROM "bdLista"."Professors" 
      WHERE email = auth.jwt() ->> 'email'
    )
  )
);
```

### 2.7 Políticas para TakeAttendance

```sql
DROP POLICY IF EXISTS "attendance_insert_public" ON "bdLista"."TakeAttendance";
DROP POLICY IF EXISTS "attendance_select_professor" ON "bdLista"."TakeAttendance";
DROP POLICY IF EXISTS "attendance_select_own_student" ON "bdLista"."TakeAttendance";

CREATE POLICY "attendance_insert_public" 
ON "bdLista"."TakeAttendance"
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "attendance_select_professor" 
ON "bdLista"."TakeAttendance"
FOR SELECT
TO authenticated
USING (
  "currentGroupId" IN (
    SELECT id FROM "bdLista"."CurrentGroup" 
    WHERE "subjectId" IN (
      SELECT id FROM "bdLista"."Subject" 
      WHERE "professorId" IN (
        SELECT id FROM "bdLista"."Professors" 
        WHERE email = auth.jwt() ->> 'email'
      )
    )
  )
);

CREATE POLICY "attendance_select_own_student" 
ON "bdLista"."TakeAttendance"
FOR SELECT
TO public
USING (
  "studentId" IN (
    SELECT id FROM "bdLista"."Students" 
    WHERE "reportCard" = auth.jwt() ->> 'reportCard'
  )
);
```

---

## Paso 3: Verificar RLS está Habilitado

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'bdLista';
```

Todas las tablas deben mostrar `rowsecurity = true`.

---

## Paso 4: Verificar Auth está Configurado

1. Ve a: **Authentication → Providers**
2. Asegúrate que **Email** esté habilitado
3. Desactiva "Confirm email" si quieres permitir registro inmediato (para desarrollo)

---

## Paso 5: Probar Registro

Después de ejecutar todas las políticas:

1. Ve a `http://localhost:3000/register`
2. Intenta registrarte con un nuevo usuario
3. Revisa la consola del navegador para ver si hay errores

---

## Notas Importantes

- **TO public**: Permite acceso no autenticado (necesario para registro y escaneo de QR)
- **TO authenticated**: Solo usuarios autenticados
- **WITH CHECK (true)**: Permite cualquier inserción
- Las políticas con `DROP POLICY IF EXISTS` pueden ejecutarse múltiples veces sin error

---

## Si Aún Tienes Problemas

1. **Verifica el schema**: Asegúrate que las tablas estén en `bdLista`, no en `public`
2. **Revisa logs**: En Supabase Dashboard → Logs → Postgres Logs
3. **Prueba manual**: En SQL Editor, intenta insertar un profesor manualmente:

```sql
INSERT INTO "bdLista"."Professors" (name, "lastName", email)
VALUES ('Test', 'User', 'test@test.com');
```

Si esto funciona pero el código no, el problema está en la aplicación, no en las políticas.
