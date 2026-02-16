/**
 * Componente GroupForm - Formulario compartido para crear/editar grupos
 * Modo: 'create' | 'edit'
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Autocomplete from '@/components/ui/Autocomplete';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';
import { getAll as getAllSubjects } from '@/services/subject.service';
import { getAll as getAllGroups } from '@/services/group.service';
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
          const studentsData = attendances.map((att, index) => ({
            id: att.id, // ID de TakeAttendance para eliminar
            studentId: att.Students?.id,
            boleta: att.Students?.reportCard || 'N/A',
            nombre: att.Students?.fullName || 'Sin nombre',
            tempId: index,
          }));
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
   * FUNCIÓN LISTA PARA USAR: Guardar grupo
   * Crea o actualiza CurrentGroup en la BD
   */
  const handleSaveGroup = async () => {
    try {
      setSaving(true);
      setError('');
      
      const supabase = createClient();
      const { user } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar campos requeridos
      if (!formData.subjectId || !formData.groupId) {
        throw new Error('Materia y Grupo son obligatorios');
      }

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
          formData.subjectId,
          formData.groupId,
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
            subjectId: formData.subjectId,
            groupId: formData.groupId,
            curriculum: formData.curriculum,
            schoolPeriod: formData.schoolPeriod,
            degree: formData.degree,
          },
          supabase
        );
        
        groupId = currentGroupId;
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
        
        // Crear inscripción en TakeAttendance
        const attendance = await recordAttendance(
          studentRecord.id,
          currentGroupId,
          {
            reportCard: student.boleta,
            fullName: student.nombre,
          },
          null, // numberOfList (opcional)
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
      const supabase = createClient();
      await removeAttendance(attendanceId, supabase);
      
      // Actualizar lista local
      setStudents((prev) => prev.filter((s) => s.id !== attendanceId));
    } catch (err) {
      console.error('Error al eliminar estudiante:', err);
      alert('Error al eliminar el estudiante');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-300">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-300 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mb-4 bg-white hover:bg-gray-50"
          >
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            {mode === 'create' ? 'Crear Grupo' : 'Editar Grupo'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo: Formulario */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border-2 border-blue-200 p-8">
            <div className="space-y-6">
              {/* Grupo */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Grupo:
                </label>
                <Autocomplete
                  options={groups}
                  value={formData.groupId}
                  onChange={(value) => handleChange('groupId', value)}
                  placeholder="Escribe o selecciona un grupo (ej: 1CM1, 2CV3)"
                  disabled={mode === 'edit'}
                  className={mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
              </div>

              {/* Carrera */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Carrera:
                </label>
                <Input
                  value={formData.degree}
                  onChange={(e) => handleChange('degree', e.target.value)}
                  placeholder="Ingeniería Mecánica, Ingeniería Eléctrica, etc."
                  disabled={mode === 'edit'}
                  className={mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
              </div>

              {/* Materia */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Materia:
                </label>
                <Autocomplete
                  options={subjects}
                  value={formData.subjectId}
                  onChange={(value) => handleChange('subjectId', value)}
                  placeholder="Escribe o selecciona una materia"
                  disabled={mode === 'edit'}
                  className={mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
              </div>

              {/* Plan de estudios */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Plan de estudios:
                </label>
                <Input
                  value={formData.curriculum}
                  onChange={(e) => handleChange('curriculum', e.target.value)}
                  placeholder="Plan 2020, Plan 2016, etc."
                  disabled={mode === 'edit'}
                  className={mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
              </div>

              {/* Periodo escolar */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Periodo escolar:
                </label>
                <Input
                  value={formData.schoolPeriod}
                  onChange={(e) => handleChange('schoolPeriod', e.target.value)}
                  placeholder="2026-1, 2026-2, etc."
                  disabled={mode === 'edit'}
                  className={mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
              </div>
            </div>

            {/* Nota sobre funcionalidades */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Las funciones de guardado están implementadas pero
                no hay botón de &quot;Guardar&quot; en el diseño actual. El equipo debe agregar el
                trigger correspondiente.
              </p>
            </div>
          </div>

          {/* Panel derecho: Tabla de estudiantes */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border-2 border-blue-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Estudiantes</h2>
              <div className="flex gap-3">
                {/* Botón Cargar Excel - Solo UI */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={() => {
                    // TODO: Implementar parseo de Excel
                    alert('Funcionalidad de Cargar Excel pendiente de implementar');
                    fileInputRef.current.value = '';
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Cargar Excel
                </Button>

                {/* Botón Añadir alumno - Sin funcionalidad */}
                <Button
                  onClick={() => {
                    // TODO: Implementar modal de agregar alumno manual
                    alert('Funcionalidad de Añadir alumno pendiente de implementar');
                  }}
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Añadir alumno
                </Button>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay estudiantes inscritos
              </div>
            ) : (
              <Table columns={studentColumns} data={students} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
