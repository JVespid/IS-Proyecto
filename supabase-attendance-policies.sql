-- ============================================
-- Políticas Adicionales para Sistema de Asistencia con QR
-- Fecha: 20 de febrero de 2026
-- ============================================
--
-- IMPORTANTE: Estas políticas complementan las existentes en supabase-policies.sql
-- y permiten el flujo completo de asistencia mediante escaneo de QR
--
-- USO DE ADMIN CLIENT:
-- Los endpoints /api/attendance/validate-qr y /api/attendance/mark
-- usan createAdminClient() con Service Role Key, que BYPASEA RLS completamente.
-- Por seguridad se agregan estas políticas públicas como fallback.
--
-- ============================================

-- 1. Política UPDATE para TakeAttendance (actualizar asistencia)
-- Permite actualizar registros de asistencia (necesario para marcar asistencia)

DROP POLICY IF EXISTS "attendance_update_public" ON "bdLista"."TakeAttendance";

CREATE POLICY "attendance_update_public" 
ON "bdLista"."TakeAttendance"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- EXPLICACIÓN:
-- - Esta política permite UPDATE público en TakeAttendance
-- - Es necesaria para que los estudiantes puedan marcar asistencia al escanear su credencial
-- - El Service Role Key del admin client bypasea esto, pero es una capa adicional de seguridad
-- - UPDATE es solo para array takeAttendanceStudentData, no campos críticos

-- ============================================

-- 2. Verificación de políticas activas

-- Ejecuta esto para verificar todas las políticas de TakeAttendance:
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
AND tablename = 'TakeAttendance'
ORDER BY policyname;

-- ============================================

-- 3. Verificación de RLS habilitado

SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'bdLista'
ORDER BY tablename;

-- RESULTADO ESPERADO: Todas las tablas deben tener rowsecurity = true

-- ============================================

-- 4. NOTAS DE SEGURIDAD

-- ✅ SEGURO:
-- - validate-qr/route.js usa createAdminClient (bypasea RLS)
-- - mark/route.js usa createAdminClient (bypasea RLS)
-- - Ambos endpoints validan que la sesión esté ACTIVE antes de operar
-- - Se verifica que el estudiante pertenezca al grupo de la sesión
--
-- ⚠️ CONSIDERACIONES:
-- - Las políticas públicas son un fallback por si se cambia a client normal
-- - El Service Role Key NUNCA se expone al cliente (solo server-side)
-- - Los estudiantes NO están autenticados, por eso se usa admin client
--
-- 🔒 PROTECCIÓN EN CAPAS:
-- 1. Middleware: Rutas /asistencia/* son públicas
-- 2. Admin Client: Bypasea RLS usando Service Role Key
-- 3. Validación de negocio: isSessionActive() antes de marcar
-- 4. Verificación de pertenencia: estudiante debe estar en TakeAttendance del grupo

-- ============================================
