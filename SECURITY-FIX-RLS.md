# 🔒 Corrección de Seguridad RLS - Row Level Security

**Fecha:** 16 de febrero de 2026  
**Problema:** Los profesores pueden acceder a información de otros profesores  
**Causa:** Políticas RLS no aplicadas o mal configuradas en Supabase

---

## 🔴 Problema Identificado

El código actual tiene un problema de seguridad donde:
- Un profesor puede ver/modificar datos de otros profesores
- Las consultas no están completamente protegidas por RLS
- Las políticas pueden no estar aplicadas correctamente en Supabase

---

## ✅ Solución: Aplicar Políticas RLS Correctamente

### Paso 1: Verificar RLS en Supabase

Ve a tu dashboard de Supabase → SQL Editor y ejecuta:

```sql
-- Verificar que RLS está habilitado en todas las tablas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'bdLista'
ORDER BY tablename;
```

**Resultado esperado:** Todas las tablas deben tener `rowsecurity = true`

---

### Paso 2: Limpiar Políticas Existentes

```sql
-- IMPORTANTE: Ejecuta esto primero para limpiar políticas antiguas/conflictivas

-- Professors
DROP POLICY IF EXISTS "professors_select_own" ON "bdLista"."Professors";
DROP POLICY IF EXISTS "professors_update_own" ON "bdLista"."Professors";
DROP POLICY IF EXISTS "professors_insert_public" ON "bdLista"."Professors";

-- CurrentGroup
DROP POLICY IF EXISTS "current_group_select_own" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_insert_own" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_update_own" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_select_public_active" ON "bdLista"."CurrentGroup";
DROP POLICY IF EXISTS "current_group_delete_own" ON "bdLista"."CurrentGroup";

-- TakeAttendance
DROP POLICY IF EXISTS "attendance_insert_public" ON "bdLista"."TakeAttendance";
DROP POLICY IF EXISTS "attendance_select_professor" ON "bdLista"."TakeAttendance";
DROP POLICY IF EXISTS "attendance_select_own_student" ON "bdLista"."TakeAttendance";
DROP POLICY IF EXISTS "attendance_select_all" ON "bdLista"."TakeAttendance";
```

---

### Paso 3: Aplicar Políticas Correctas

#### A. Habilitar RLS en todas las tablas

```sql
ALTER TABLE "bdLista"."Professors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."Students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."Group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."CurrentGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bdLista"."TakeAttendance" ENABLE ROW LEVEL SECURITY;
```

#### B. Políticas para Professors (CRÍTICO)

```sql
-- Los profesores SOLO pueden ver sus propios datos
CREATE POLICY "professors_select_own" 
ON "bdLista"."Professors"
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = email);

-- Los profesores SOLO pueden actualizar sus propios datos
CREATE POLICY "professors_update_own" 
ON "bdLista"."Professors"
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = email)
WITH CHECK (auth.jwt() ->> 'email' = email);

-- Permitir INSERT solo durante registro (público)
CREATE POLICY "professors_insert_public" 
ON "bdLista"."Professors"
FOR INSERT
TO public
WITH CHECK (true);
```

#### C. Políticas para CurrentGroup (CRÍTICO)

```sql
-- Permitir SELECT público SOLO para sesiones ACTIVAS (alumnos necesitan validar QR)
CREATE POLICY "current_group_select_public_active" 
ON "bdLista"."CurrentGroup"
FOR SELECT
TO public
USING (status = 'ACTIVE');

-- Los profesores SOLO pueden ver sus propias sesiones
CREATE POLICY "current_group_select_own" 
ON "bdLista"."CurrentGroup"
FOR SELECT
TO authenticated
USING (
  "professorId" IN (
    SELECT id FROM "bdLista"."Professors" 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Los profesores SOLO pueden crear sesiones con su propio professorId
CREATE POLICY "current_group_insert_own" 
ON "bdLista"."CurrentGroup"
FOR INSERT
TO authenticated
WITH CHECK (
  "professorId" IN (
    SELECT id FROM "bdLista"."Professors" 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Los profesores SOLO pueden actualizar sus propias sesiones
CREATE POLICY "current_group_update_own" 
ON "bdLista"."CurrentGroup"
FOR UPDATE
TO authenticated
USING (
  "professorId" IN (
    SELECT id FROM "bdLista"."Professors" 
    WHERE email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  "professorId" IN (
    SELECT id FROM "bdLista"."Professors" 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Los profesores SOLO pueden eliminar sus propias sesiones
CREATE POLICY "current_group_delete_own" 
ON "bdLista"."CurrentGroup"
FOR DELETE
TO authenticated
USING (
  "professorId" IN (
    SELECT id FROM "bdLista"."Professors" 
    WHERE email = auth.jwt() ->> 'email'
  )
);
```

#### D. Políticas para TakeAttendance

```sql
-- Cualquiera puede registrar asistencia (para escaneo QR)
CREATE POLICY "attendance_insert_public" 
ON "bdLista"."TakeAttendance"
FOR INSERT
TO public
WITH CHECK (true);

-- Los profesores SOLO pueden ver asistencias de SUS sesiones
CREATE POLICY "attendance_select_professor" 
ON "bdLista"."TakeAttendance"
FOR SELECT
TO authenticated
USING (
  "currentGroupId" IN (
    SELECT id 
    FROM "bdLista"."CurrentGroup"
    -- RLS de CurrentGroup ya filtra por professorId automáticamente
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

#### E. Políticas para Students, Subject y Group

```sql
-- Students: Acceso público para lookup
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

-- Subject: Acceso público (materias genéricas)
CREATE POLICY "subjects_select_public" 
ON "bdLista"."Subject"
FOR SELECT
TO public
USING (true);

CREATE POLICY "subjects_insert_authenticated" 
ON "bdLista"."Subject"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Group: Acceso público (grupos genéricos)
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

---

### Paso 4: Verificar Políticas Aplicadas

```sql
-- Ver todas las políticas aplicadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'bdLista'
ORDER BY tablename, policyname;
```

---

## 🧪 Testing de Seguridad

### Prueba 1: Verificar aislamiento de profesores

1. Inicia sesión como Profesor A
2. Abre DevTools → Network
3. Ve al dashboard
4. Verifica que solo veas tus grupos

### Prueba 2: Intentar acceso no autorizado

En el SQL Editor de Supabase, ejecuta (con usuario autenticado):

```sql
-- Como profesor, intenta ver TODOS los grupos (debería fallar o mostrar solo los tuyos)
SELECT * FROM "bdLista"."CurrentGroup";
```

**Esperado:** Solo ver tus propios grupos

### Prueba 3: Verificar que RLS bloquea acceso

```sql
-- Intenta insertar con professorId de otro profesor
INSERT INTO "bdLista"."CurrentGroup" 
("subjectId", "groupId", "professorId") 
VALUES ('uuid', 'uuid', 'otro-profesor-id');
```

**Esperado:** Error - RLS debe bloquear esta operación

---

## 📊 Checklist de Verificación

- [ ] RLS habilitado en todas las tablas
- [ ] Políticas antiguas eliminadas
- [ ] Nuevas políticas aplicadas
- [ ] Verificación de políticas ejecutada
- [ ] Prueba de aislamiento de profesores exitosa
- [ ] No hay errores en logs de Supabase

---

## ⚠️ Importante

1. **Service Role Key**: NO uses `SUPABASE_SERVICE_ROLE_KEY` en el cliente
   - Solo úsala en Server Components cuando necesites bypass RLS
   - NUNCA la expongas en el frontend

2. **Anon Key**: Siempre usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el cliente
   - Esta key respeta RLS
   - Es segura para exponer

3. **Testing**: Siempre prueba con múltiples usuarios
   - Crea 2 profesores de prueba
   - Verifica que no puedan ver datos del otro

---

## 🔍 Debugging

Si después de aplicar las políticas aún hay problemas:

1. **Revisa los logs de Supabase:**
   - Dashboard → Logs → Postgres Logs
   - Busca errores de RLS

2. **Verifica el JWT:**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('JWT:', session.access_token);
   // Decodifica en jwt.io para ver el email
   ```

3. **Verifica que el email coincida:**
   ```sql
   SELECT email FROM "bdLista"."Professors" WHERE id = 'tu-professor-id';
   SELECT auth.jwt() ->> 'email';
   ```

---

**Última actualización:** 16 de febrero de 2026
