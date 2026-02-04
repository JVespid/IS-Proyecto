# Políticas de Seguridad RLS para Supabase

Este archivo contiene todas las políticas de Row Level Security (RLS) que debes ejecutar en tu dashboard de Supabase.

## Instrucciones

1. Ve a tu proyecto de Supabase
2. Navega a: SQL Editor
3. Copia y pega cada sección de SQL
4. Ejecuta las queries en orden

---

## 1. Habilitar RLS en todas las tablas

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE "bdLista"."Professors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."Students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."Group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."CurrentGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."TakeAttendance" ENABLE ROW LEVEL SECURITY;
```

---

## 2. Políticas para Professors

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
-- Esto permite que nuevos usuarios se registren sin estar autenticados
CREATE POLICY "professors_insert_public" 
ON "bdLista"."Professors"
FOR INSERT
TO public
WITH CHECK (true);

-- Alternativa: Permitir INSERT solo para usuarios autenticados
-- Usa esta política si prefieres que solo usuarios autenticados puedan crear registros
-- CREATE POLICY "professors_insert_authenticated" 
-- ON "bdLista"."Professors"
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.jwt() ->> 'email' = email);
```

---

## 3. Políticas para Students

```sql
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "students_select_public" ON "bdLista"."Students";
DROP POLICY IF EXISTS "students_insert_public" ON "bdLista"."Students";

-- Cualquiera puede ver estudiantes (para lookup)
CREATE POLICY "students_select_public" 
ON "bdLista"."Students"
FOR SELECT
TO public
USING (true);

-- Cualquiera puede insertar estudiantes (auto-registro al pasar lista)
CREATE POLICY "students_insert_public" 
ON "bdLista"."Students"
FOR INSERT
TO public
WITH CHECK (true);
```

---

## 4. Políticas para Subject

```sql
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "subjects_select_own" ON "bdLista"."Subject";
DROP POLICY IF EXISTS "subjects_insert_own" ON "bdLista"."Subject";
DROP POLICY IF EXISTS "subjects_update_own" ON "bdLista"."Subject";

-- Los profesores pueden ver solo sus propias materias
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

-- Los profesores pueden crear materias
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

-- Los profesores pueden actualizar sus materias
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

---

## 5. Políticas para Group

```sql
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "groups_select_public" ON "bdLista"."Group";
DROP POLICY IF EXISTS "groups_insert_authenticated" ON "bdLista"."Group";

-- Cualquiera puede ver grupos
CREATE POLICY "groups_select_public" 
ON "bdLista"."Group"
FOR SELECT
TO public
USING (true);

-- Solo profesores autenticados pueden crear grupos
CREATE POLICY "groups_insert_authenticated" 
ON "bdLista"."Group"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');
```

---

## 6. Políticas para CurrentGroup (Sesiones)

```sql
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "current_group_select_own" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_insert_own" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_update_own" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_select_public_active" ON "bdLista"."CurrentGroup";

-- Permitir SELECT público para validar sesiones activas (alumnos necesitan esto)
CREATE POLICY "current_group_select_public_active" 
ON "bdLista"."CurrentGroup"
FOR SELECT
TO public
USING (status = 'ACTIVE');

-- Los profesores pueden ver todas sus sesiones
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

-- Los profesores pueden crear sesiones para sus materias
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

-- Los profesores pueden actualizar sus sesiones
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

---

## 7. Políticas para TakeAttendance

```sql
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "attendance_insert_public" ON "bdLista"."TakeAttendance";
DROP POLICY IF EXISTS "attendance_select_professor" ON "bdLista"."TakeAttendance";
DROP POLICY IF EXISTS "attendance_select_own_student" ON "bdLista"."TakeAttendance";

-- Cualquiera puede registrar asistencia (público para que alumnos puedan escanear QR)
CREATE POLICY "attendance_insert_public" 
ON "bdLista"."TakeAttendance"
FOR INSERT
TO public
WITH CHECK (true);

-- Los profesores pueden ver asistencias de sus sesiones
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

-- Los estudiantes pueden ver su propia asistencia
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

## Verificación

Después de ejecutar todas las políticas, verifica que RLS esté activo:

```sql
-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'bdLista';
```

Todas las tablas deben mostrar `rowsecurity = true`.

---

## Notas Importantes

1. **Service Role Key**: Las operaciones desde el backend usando `SUPABASE_SERVICE_ROLE_KEY` ignoran RLS
2. **Anon Key**: Las operaciones desde el cliente usan `SUPABASE_ANON_KEY` y SÍ respetan RLS
3. **Testing**: Prueba las políticas desde el cliente para asegurarte que funcionan correctamente

---

## Troubleshooting

Si tienes problemas con las políticas:

1. Verifica que los nombres de columnas coincidan con tu schema
2. Asegúrate de que Supabase Auth esté configurado
3. Revisa los logs de Supabase para ver errores de RLS
4. Usa el SQL Editor para probar queries manualmente
