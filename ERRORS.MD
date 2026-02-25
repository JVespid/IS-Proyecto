```
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:52.821Z] [Supabase Client] Cliente de Supabase creado para browser 
GroupForm.js:176 IDs resueltos: {resolvedSubjectId: 'a01dcb98-f36e-4155-b8b3-6237a857a4e0', resolvedGroupId: '8e8528f9-6826-417d-b8b7-fa6d8c40d8cb'}
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:53.065Z] [SessionService] Actualizando sesión {sessionId: 'e39921f0-7121-410e-8a12-d40825de9088', sessionData: {…}}
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:53.293Z] [SessionService] Sesión actualizada exitosamente {sessionId: 'e39921f0-7121-410e-8a12-d40825de9088'}
GroupForm.js:230 Guardando 7 estudiantes nuevos en la BD...
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:53.293Z] [Supabase Client] Cliente de Supabase creado para browser 
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:53.293Z] [StudentService] Obteniendo o creando estudiante {reportCard: '2022351614'}
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:53.293Z] [StudentService] Buscando estudiante por boleta {reportCard: '2022351614'}
fetch.ts:7  GET https://hpexvqdkxgrnfavjxmek.supabase.co/rest/v1/Students?select=*&reportCard=eq.2022351614 406 (Not Acceptable)
(anonymous) @ fetch.ts:7
(anonymous) @ fetch.ts:34
await in (anonymous)
then @ PostgrestBuilder.ts:125
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:53.576Z] [StudentService] Estudiante no encontrado {reportCard: '2022351614'}
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:53.576Z] [Crypto] UUID generado {uuid: '915dcb89-ff16-4405-a164-679980b24b14'}
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:53.577Z] [StudentService] Creando estudiante {reportCard: '2022351614', studentId: '915dcb89-ff16-4405-a164-679980b24b14'}
config.js:75 [Sistema Pase Lista] [2026-02-25T01:24:53.883Z] [StudentService] Estudiante creado exitosamente {studentId: '915dcb89-ff16-4405-a164-679980b24b14'}
config.js:125 [Sistema Pase Lista] [2026-02-25T01:24:53.884Z] [AttendanceService] ERROR: Error al registrar asistencia {error: '[\n  {\n    "code": "invalid_type",\n    "expected": …essage": "Expected string, received number"\n  }\n]', name: 'ZodError', stack: 'ZodError\n    at get error (http://localhost:3000/_…00/_next/static/chunks/src_1bc222d3._.js:2032:17)'}
error @ intercept-console-error.ts:42
logError @ config.js:125
recordAttendance @ attendance.service.js:81
handleAddStudentsToGroup @ GroupForm.js:267
await in handleAddStudentsToGroup
handleSaveGroup @ GroupForm.js:231
await in handleSaveGroup
executeDispatch @ react-dom-client.development.js:20543
runWithFiberInDEV @ react-dom-client.development.js:986
processDispatchQueue @ react-dom-client.development.js:20593
(anonymous) @ react-dom-client.development.js:21164
batchedUpdates$1 @ react-dom-client.development.js:3377
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20747
dispatchEvent @ react-dom-client.development.js:25693
dispatchDiscreteEvent @ react-dom-client.development.js:25661
GroupForm.js:288 Error al agregar estudiantes: ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "takeAttendanceStudentData",
      "scannedUrl"
    ],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "numberOfList"
    ],
    "message": "Expected string, received number"
  }
]
    at get error (types.js:39:31)
    at ZodObject.parse (types.js:114:22)
    at recordAttendance (attendance.service.js:43:44)
    at handleAddStudentsToGroup (GroupForm.js:267:50)
    at async handleSaveGroup (GroupForm.js:231:9)
error @ intercept-console-error.ts:42
handleAddStudentsToGroup @ GroupForm.js:288
await in handleAddStudentsToGroup
handleSaveGroup @ GroupForm.js:231
await in handleSaveGroup
executeDispatch @ react-dom-client.development.js:20543
runWithFiberInDEV @ react-dom-client.development.js:986
processDispatchQueue @ react-dom-client.development.js:20593
(anonymous) @ react-dom-client.development.js:21164
batchedUpdates$1 @ react-dom-client.development.js:3377
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20747
dispatchEvent @ react-dom-client.development.js:25693
dispatchDiscreteEvent @ react-dom-client.development.js:25661
GroupForm.js:242 Error al guardar grupo: ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "takeAttendanceStudentData",
      "scannedUrl"
    ],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "numberOfList"
    ],
    "message": "Expected string, received number"
  }
]
    at get error (types.js:39:31)
    at ZodObject.parse (types.js:114:22)
    at recordAttendance (attendance.service.js:43:44)
    at handleAddStudentsToGroup (GroupForm.js:267:50)
    at async handleSaveGroup (GroupForm.js:231:9)
error @ intercept-console-error.ts:42
handleSaveGroup @ GroupForm.js:242
await in handleSaveGroup
executeDispatch @ react-dom-client.development.js:20543
runWithFiberInDEV @ react-dom-client.development.js:986
processDispatchQueue @ react-dom-client.development.js:20593
(anonymous) @ react-dom-client.development.js:21164
batchedUpdates$1 @ react-dom-client.development.js:3377
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20747
dispatchEvent @ react-dom-client.development.js:25693
dispatchDiscreteEvent @ react-dom-client.development.js:25661
GroupForm.js:246 Uncaught (in promise) ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "takeAttendanceStudentData",
      "scannedUrl"
    ],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "numberOfList"
    ],
    "message": "Expected string, received number"
  }
]
    at get error (types.js:39:31)
    at ZodObject.parse (types.js:114:22)
    at recordAttendance (attendance.service.js:43:44)
    at handleAddStudentsToGroup (GroupForm.js:267:50)
    at async handleSaveGroup (GroupForm.js:231:9)
get error @ types.js:39
parse @ types.js:114
recordAttendance @ attendance.service.js:43
handleAddStudentsToGroup @ GroupForm.js:267
await in handleAddStudentsToGroup
handleSaveGroup @ GroupForm.js:231
await in handleSaveGroup
executeDispatch @ react-dom-client.development.js:20543
runWithFiberInDEV @ react-dom-client.development.js:986
processDispatchQueue @ react-dom-client.development.js:20593
(anonymous) @ react-dom-client.development.js:21164
batchedUpdates$1 @ react-dom-client.development.js:3377
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20747
dispatchEvent @ react-dom-client.development.js:25693
dispatchDiscreteEvent @ react-dom-client.development.js:25661

```
