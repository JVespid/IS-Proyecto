/**
 * Página de Generación de QR
 * Permite al profesor crear una sesión y generar QR
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import QRGenerator from '@/components/qr/QRGenerator';
import Spinner from '@/components/ui/Spinner';

export default function GenerarQRPage() {
  const router = useRouter();
  const { user, professor, loading } = useAuth();
  const [session, setSession] = useState(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    groupId: '',
    duration: '90',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Mock data - en producción, cargar desde API
  const mockSubjects = [
    { value: '1', label: 'Matemáticas' },
    { value: '2', label: 'Programación' },
  ];

  const mockGroups = [
    { value: '1', label: 'Grupo 1' },
    { value: '2', label: 'Grupo 2' },
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await fetch('/api/attendance/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: formData.subjectId,
          groupId: formData.groupId,
          duration: parseInt(formData.duration, 10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear sesión');
      }

      setSession(data.session);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            ← Volver al Dashboard
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Generar Código QR</h1>

        {!session ? (
          <Card title="Configurar Sesión">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Materia</label>
                <Select
                  options={mockSubjects}
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, subjectId: e.target.value }))
                  }
                  placeholder="Selecciona una materia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Grupo</label>
                <Select
                  options={mockGroups}
                  value={formData.groupId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, groupId: e.target.value }))
                  }
                  placeholder="Selecciona un grupo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Duración (minutos)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="180"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, duration: e.target.value }))
                  }
                  placeholder="90"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={creating}
                disabled={creating || !formData.subjectId || !formData.groupId}
              >
                Generar QR
              </Button>
            </form>
          </Card>
        ) : (
          <div>
            <QRGenerator sessionId={session.id} duration={session.duration} />
            <div className="mt-4 text-center">
              <Button onClick={() => setSession(null)} variant="secondary">
                Crear Nueva Sesión
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
