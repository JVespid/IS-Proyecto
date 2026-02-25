/**
 * Componente GroupForm - Formulario compartido para crear/editar grupos
 * Modo: 'create' | 'edit'
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Autocomplete from '@/components/ui/Autocomplete';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';
import { getAll as getAllSubjects, getOrCreate as getOrCreateSubject } from '@/services/subject.service';
import { getAll as getAllGroups, getOrCreate as getOrCreateGroup } from '@/services/group.service';
import { createSession, update as updateSession } from '@/services/session.service';
import { getOrCreateStudent } from '@/services/student.service';
import { recordAttendance, remove as removeAttendance, getBySession } from '@/services/attendance.service';

export default function GroupForm({ 
  mode = 'create', 
  initialData = null,
  onSuccess 
}) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Opciones de dropdowns
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    groupId: '',
    subjectId: '',
    degree: '',
    curriculum: '',
    schoolPeriod: '',
  });
  
  // Estudiantes inscritos
  const [students, setStudents] = useState([]);
  const [currentGroupId, setCurrentGroupId] = useState(null);

  // Extraer solo el ID para evitar re-renders por objeto completo
  const initialDataId = initialData?.id;

  // Cargar datos iniciales
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Cargar materias y grupos
        const [subjectsData, groupsData] = await Promise.all([
          getAllSubjects(supabase),
          getAllGroups(supabase),
        ]);
        
        // Mapear a formato de Select
        setSubjects(subjectsData.map((s) => ({ value: s.id, label: s.Subject })));
        setGroups(groupsData.map((g) => ({ value: g.id, label: g.group })));
        
        // Si es modo edición, pre-llenar datos
        if (mode === 'edit' && initialData) {
          setFormData({
            groupId: initialData.groupId || '',
            subjectId: initialData.subjectId || '',
            degree: initialData.degree || '',
            curriculum: initialData.curriculum || '',
            schoolPeriod: initialData.schoolPeriod || '',
          });
          setCurrentGroupId(initialData.id);
          
          // Cargar estudiantes inscritos
          const attendances = await getBySession(initialData.id, supabase);
          console.log('Attendances cargadas:', attendances);
          
          const studentsData = attendances.map((att, index) => ({
            id: att.id, // ID de TakeAttendance para eliminar
            studentId: att.Students?.id,
            boleta: att.Students?.reportCard || 'N/A',
            nombre: att.Students?.fullName || 'Sin nombre',
            tempId: index,
          }));
          
          console.log('Estudiantes mapeados:', studentsData);
          setStudents(studentsData);
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos del formulario');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialDataId]);

  // Manejar cambios en formulario
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Helper: Verificar si un valor es UUID o texto libre
   * Y obtener/crear el registro de Subject correspondiente
   */
  const resolveSubjectId = async (value, supabase) => {
    // Si es UUID válido, retornar directamente
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(value)) {
      return value;
    }

    // Si es texto, buscar o crear Subject
    console.log('Subject es texto libre, buscando o creando:', value);
    const subject = await getOrCreateSubject(value, supabase);
    console.log('Subject resuelto:', subject);
    return subject.id;
  };

  /**
   * Helper: Verificar si un valor es UUID o texto libre
   * Y obtener/crear el registro de Group correspondiente
   */
  const resolveGroupId = async (value, supabase) => {
    // Si es UUID válido, retornar directamente
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(value)) {
      return value;
    }

    // Si es texto, buscar o crear Group
    console.log('Group es texto libre, buscando o creando:', value);
    const group = await getOrCreateGroup(value, supabase);
    console.log('Group resuelto:', group);
    return group.id;
  };

  /**
   * FUNCIÓN LISTA PARA USAR: Guardar grupo
   * Crea o actualiza CurrentGroup en la BD
   */
  const handleSaveGroup = async () => {
    try {
      setSaving(true);
      setError('');
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar campos requeridos
      if (!formData.subjectId || !formData.groupId) {
        throw new Error('Materia y Grupo son obligatorios');
      }

      // Resolver subjectId y groupId (crear si es necesario)
      const resolvedSubjectId = await resolveSubjectId(formData.subjectId, supabase);
      const resolvedGroupId = await resolveGroupId(formData.groupId, supabase);

      console.log('IDs resueltos:', { resolvedSubjectId, resolvedGroupId });

      let groupId;

      if (mode === 'create') {
        // Crear nuevo grupo
        // Necesitamos obtener el professorId del profesor actual
        const { data: professorData } = await supabase
          .schema('bdLista')
          .from('Professors')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!professorData) {
          throw new Error('Profesor no encontrado');
        }

        const newGroup = await createSession(
          resolvedSubjectId,
          resolvedGroupId,
          professorData.id,
          {
            curriculum: formData.curriculum,
            schoolPeriod: formData.schoolPeriod,
            degree: formData.degree,
          },
          'ACTIVE',
          supabase
        );
        
        groupId = newGroup.id;
        setCurrentGroupId(groupId);
      } else {
        // Actualizar grupo existente
        await updateSession(
          currentGroupId,
          {
            subjectId: resolvedSubjectId,
            groupId: resolvedGroupId,
            curriculum: formData.curriculum,
            schoolPeriod: formData.schoolPeriod,
            degree: formData.degree,
          },
          supabase
        );
        
        groupId = currentGroupId;
      }

      // Guardar estudiantes nuevos (los que vienen del Excel)
      const newStudents = students.filter(s => s.tempId && !s.id);
      
      if (newStudents.length > 0) {
        console.log(`Guardando ${newStudents.length} estudiantes nuevos en la BD...`);
        await handleAddStudentsToGroup(groupId, newStudents);
        console.log(`✓ ${newStudents.length} estudiantes agregados exitosamente`);
      }

      // Callback de éxito
      if (onSuccess) {
        onSuccess(groupId);
      }

      return groupId;
    } catch (err) {
      console.error('Error al guardar grupo:', err);
      setError(err.message || 'Error al guardar el grupo');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * FUNCIÓN LISTA PARA USAR: Agregar estudiantes al grupo
   * Inscribe múltiples estudiantes en TakeAttendance
   */
  const handleAddStudentsToGroup = async (currentGroupId, studentsArray) => {
    try {
      const supabase = createClient();
      
      for (const student of studentsArray) {
        // Crear o obtener estudiante
        const studentRecord = await getOrCreateStudent(
          student.nombre,
          student.boleta,
          supabase
        );
        
        // Crear inscripción en TakeAttendance con número de lista
        const attendance = await recordAttendance(
          studentRecord.id,
          currentGroupId,
          {
            reportCard: student.boleta,
            fullName: student.nombre,
          },
          student.numeroLista ? String(student.numeroLista) : null, // Convertir a string
          supabase
        );
        
        // Actualizar lista local con ID de TakeAttendance
        setStudents((prev) =>
          prev.map((s) =>
            s.tempId === student.tempId
              ? { ...s, id: attendance.id, studentId: studentRecord.id }
              : s
          )
        );
      }
    } catch (err) {
      console.error('Error al agregar estudiantes:', err);
      throw err;
    }
  };

  /**
   * FUNCIÓN LISTA PARA USAR: Eliminar estudiante del grupo
   * Elimina la inscripción de TakeAttendance
   */
  const handleRemoveStudent = async (attendanceId) => {
    try {
      if (!attendanceId) {
        console.error('Error: attendanceId es undefined o null');
        setError('Error: No se puede eliminar el estudiante (ID inválido)');
        return;
      }

      console.log('Eliminando estudiante con attendanceId:', attendanceId);
      
      const supabase = createClient();
      await removeAttendance(attendanceId, supabase);
      
      console.log('Estudiante eliminado exitosamente');
      
      // Actualizar lista local
      setStudents((prev) => prev.filter((s) => s.id !== attendanceId));
    } catch (err) {
      console.error('Error al eliminar estudiante:', err);
      setError(`Error al eliminar el estudiante: ${err.message}`);
    }
  };

  /**
   * FUNCIÓN: Cargar estudiantes desde archivo Excel/CSV
   * Procesa archivos .xlsx, .xls y .csv con soporte UTF-8
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      console.log('Procesando archivo:', file.name);

      // Leer archivo como ArrayBuffer
      const data = await file.arrayBuffer();
      
      // Parsear con xlsx (codepage 65001 = UTF-8)
      const workbook = XLSX.read(data, { 
        type: 'array',
        codepage: 65001, // UTF-8 para caracteres especiales
        raw: false // Convertir todo a strings
      });

      // Obtener primera hoja
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet, { 
        header: 1, // Retornar como array de arrays
        raw: false, // Convertir todo a strings
        defval: '' // Valor por defecto para celdas vacías
      });

      console.log('Datos parseados:', jsonData);

      if (jsonData.length < 2) {
        throw new Error('El archivo está vacío o no tiene datos suficientes');
      }

      // Primera fila son los headers
      const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
      console.log('Headers encontrados:', headers);

      // Buscar índices de columnas (case-insensitive)
      const nombreIndex = headers.findIndex(h => 
        h === 'nombre' || h === 'name' || h === 'nombres' || h === 'fullname'
      );
      const boletaIndex = headers.findIndex(h => 
        h === 'boleta' || h === 'reportcard' || h === 'matricula' || h === 'id'
      );

      if (nombreIndex === -1 || boletaIndex === -1) {
        throw new Error(
          'El archivo debe contener columnas "Nombre" y "Boleta". ' +
          `Columnas encontradas: ${headers.join(', ')}`
        );
      }

      // Procesar filas (saltar header en índice 0)
      const nuevosEstudiantes = [];
      let numeroLista = students.length + 1; // Continuar desde el último número

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const nombre = String(row[nombreIndex] || '').trim();
        const boleta = String(row[boletaIndex] || '').trim();

        // Saltar filas vacías
        if (!nombre && !boleta) {
          console.log(`Fila ${i + 1}: vacía, saltando...`);
          continue;
        }

        // Validar que ambos campos tengan datos
        if (!nombre || !boleta) {
          console.warn(`Fila ${i + 1}: datos incompletos (nombre: "${nombre}", boleta: "${boleta}"). Saltando...`);
          continue;
        }

        // Validar formato de boleta (solo números, mínimo 8 dígitos)
        if (!/^\d{8,}$/.test(boleta)) {
          console.warn(`Fila ${i + 1}: boleta inválida "${boleta}". Debe tener al menos 8 dígitos. Saltando...`);
          continue;
        }

        // Verificar si ya existe en la lista actual
        const yaExiste = students.some(s => s.boleta === boleta);
        if (yaExiste) {
          console.log(`Fila ${i + 1}: estudiante con boleta ${boleta} ya existe. Saltando...`);
          continue;
        }

        nuevosEstudiantes.push({
          tempId: Date.now() + i, // ID temporal único
          boleta: boleta,
          nombre: nombre,
          numeroLista: numeroLista++
        });
      }

      if (nuevosEstudiantes.length === 0) {
        throw new Error('No se encontraron estudiantes válidos en el archivo');
      }

      // Agregar estudiantes a la lista
      setStudents(prev => [...prev, ...nuevosEstudiantes]);
      
      console.log(`✓ ${nuevosEstudiantes.length} estudiantes agregados desde archivo`);
      alert(`✓ Se agregaron ${nuevosEstudiantes.length} estudiantes correctamente`);

    } catch (err) {
      console.error('Error al procesar archivo:', err);
      setError(`Error al procesar archivo: ${err.message}`);
      alert(`Error al procesar archivo: ${err.message}`);
    } finally {
      // Limpiar input para permitir cargar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Columnas de la tabla de estudiantes
  const studentColumns = [
    {
      key: 'boleta',
      label: 'Boleta',
    },
    {
      key: 'nombre',
      label: 'Nombre',
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant="danger"
            onClick={() => handleRemoveStudent(row.id)}
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#CCFED9]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#CCFED9] p-8 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-6xl h-[85vh] bg-[#EEFEF1] border-2 border-black rounded-[30px] shadow-[8px_8px_0px_rgba(0,0,0,1)] relative flex flex-col pt-20 px-12 pb-12">
        
        {/* Botón Atrás */}
        <div className="absolute top-8 left-8">
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-[#D9D9D9] border-2 border-black rounded-[5px] w-12 h-12 flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-gray-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
            unstyled={true}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>

        {/* Botón Guardar datos */}
        <div className="absolute top-8 right-8">
          <Button
            onClick={handleSaveGroup}
            disabled={saving}
            className="bg-[#8B80F9] text-white border-2 border-black rounded-full px-6 py-2 flex items-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-[#7a6ee6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all font-bold text-lg"
            unstyled={true}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 21 20.4142 21H19ZM19 21V14H5V21M15 3V8H9V3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {saving ? 'Guardando...' : 'Guardar datos'}
          </Button>
        </div>

        {error && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-red-100 border-2 border-red-500 text-red-700 px-4 py-2 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] z-50 flex items-center gap-3">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-700 hover:text-red-900 font-bold text-xl leading-none"
              aria-label="Cerrar error"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex-1 flex gap-12 mt-4 overflow-hidden">
          {/* Panel izquierdo: Formulario */}
          <div className="w-1/3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-4">
            {/* Grupo */}
            <div>
              <label className="block text-lg font-medium text-black mb-2">
                Grupo:
              </label>
              <div className="flex">
                <Autocomplete
                  options={groups}
                  value={formData.groupId}
                  onChange={(value) => handleChange('groupId', value)}
                  disabled={mode === 'edit'}
                  className={`w-full px-4 py-2 border-2 border-black border-r-0 rounded-l-[10px] focus:outline-none ${mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  unstyled={true}
                />
                <div className="bg-[#D9D9D9] border-2 border-black rounded-r-[10px] w-12 flex items-center justify-center">
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L8 8L14 2" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Carrera */}
            <div>
              <label className="block text-lg font-medium text-black mb-2">
                Carrera:
              </label>
              <div className="flex">
                <Input
                  value={formData.degree}
                  onChange={(e) => handleChange('degree', e.target.value)}
                  disabled={mode === 'edit'}
                  className={`w-full px-4 py-2 border-2 border-black border-r-0 rounded-l-[10px] focus:outline-none ${mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  unstyled={true}
                />
                <div className="bg-[#D9D9D9] border-2 border-black rounded-r-[10px] w-12 flex items-center justify-center">
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L8 8L14 2" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Materia */}
            <div>
              <label className="block text-lg font-medium text-black mb-2">
                Materia:
              </label>
              <div className="flex">
                <Autocomplete
                  options={subjects}
                  value={formData.subjectId}
                  onChange={(value) => handleChange('subjectId', value)}
                  disabled={mode === 'edit'}
                  className={`w-full px-4 py-2 border-2 border-black border-r-0 rounded-l-[10px] focus:outline-none ${mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  unstyled={true}
                />
                <div className="bg-[#D9D9D9] border-2 border-black rounded-r-[10px] w-12 flex items-center justify-center">
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L8 8L14 2" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Plan de estudios */}
            <div>
              <label className="block text-lg font-medium text-black mb-2">
                Plan de estudios:
              </label>
              <div className="flex">
                <Input
                  value={formData.curriculum}
                  onChange={(e) => handleChange('curriculum', e.target.value)}
                  disabled={mode === 'edit'}
                  className={`w-full px-4 py-2 border-2 border-black border-r-0 rounded-l-[10px] focus:outline-none ${mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  unstyled={true}
                />
                <div className="bg-[#D9D9D9] border-2 border-black rounded-r-[10px] w-12 flex items-center justify-center">
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L8 8L14 2" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Periodo escolar */}
            <div>
              <label className="block text-lg font-medium text-black mb-2">
                Periodo escolar:
              </label>
              <div className="flex">
                <Input
                  value={formData.schoolPeriod}
                  onChange={(e) => handleChange('schoolPeriod', e.target.value)}
                  disabled={mode === 'edit'}
                  className={`w-full px-4 py-2 border-2 border-black border-r-0 rounded-l-[10px] focus:outline-none ${mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  unstyled={true}
                />
                <div className="bg-[#D9D9D9] border-2 border-black rounded-r-[10px] w-12 flex items-center justify-center">
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L8 8L14 2" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho: Tabla de estudiantes */}
          <div className="w-2/3 flex flex-col">
            {/* Botón Cargar Excel */}
            <div className="flex justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#D9D9D9] border-2 border-black border-b-0 rounded-t-[5px] px-4 py-2 flex items-center gap-2 text-black font-medium text-sm relative top-[2px] z-10"
                unstyled={true}
              >
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2H3C2.46957 2 1.96086 2.21071 1.58579 2.58579C1.21071 2.96086 1 3.46957 1 4V16C1 16.5304 1.21071 17.0391 1.58579 17.4142C1.96086 17.7893 2.46957 18 3 18H13C13.5304 18 14.0391 17.7893 14.4142 17.4142C14.7893 17.0391 15 16.5304 15 16V7L10 2Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Cargar Excel
              </Button>
            </div>

            {/* Contenedor de la tabla */}
            <div className="flex-1 border-2 border-black bg-[#CCFED9] overflow-hidden flex flex-col relative z-0">
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#CCFED9] z-10">
                    <tr>
                      <th className="border-b-2 border-r-2 border-black p-4 text-center font-medium text-black w-1/3">Boleta</th>
                      <th className="border-b-2 border-r-2 border-black p-4 text-center font-medium text-black w-1/3">Nombre</th>
                      <th className="border-b-2 border-black p-2 text-center w-1/3">
                        <Button
                          onClick={() => alert('Funcionalidad de Añadir alumno pendiente de implementar')}
                          className="bg-[#D9D9D9] border-2 border-black rounded-[5px] px-3 py-1 flex items-center justify-center gap-2 text-black text-xs font-bold mx-auto shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                          unstyled={true}
                        >
                          <div className="flex items-center justify-center w-4 h-4 border-2 border-black rounded-full">
                            <span className="text-black text-xs font-bold leading-none">+</span>
                          </div>
                          Añadir alumno
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-12 text-gray-500 border-b-2 border-black">
                          No hay estudiantes inscritos
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id || student.tempId}>
                          <td className="border-b-2 border-r-2 border-black p-4 text-center text-gray-500 font-medium text-lg">
                            {student.boleta}
                          </td>
                          <td className="border-b-2 border-r-2 border-black p-4 text-center text-[#88c999] font-medium text-lg">
                            {student.nombre}
                          </td>
                          <td className="border-b-2 border-black p-4 text-center">
                            <Button
                              onClick={() => handleRemoveStudent(student.id)}
                              className="bg-[#D9D9D9] border-2 border-black rounded-[5px] px-3 py-1 flex items-center justify-center gap-2 text-black text-xs font-bold mx-auto shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                              unstyled={true}
                            >
                              <div className="flex items-center justify-center w-4 h-4 border-2 border-black rounded-full">
                                <span className="text-black text-xs font-bold leading-none">x</span>
                              </div>
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
