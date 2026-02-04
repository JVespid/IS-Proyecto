/**
 * Página de inicio
 * Landing page del sistema
 */

'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sistema de Pase de Lista con QR
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gestiona la asistencia de tus alumnos de forma rápida y eficiente
            usando códigos QR
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          <Card className="text-center">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h2 className="text-2xl font-semibold mb-3">Para Profesores</h2>
            <p className="text-gray-600 mb-6">
              Genera códigos QR para tomar asistencia en tus clases
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Iniciar Sesión
              </Button>
              <Button
                onClick={() => router.push('/register')}
                variant="outline"
                className="w-full"
              >
                Registrarse
              </Button>
            </div>
          </Card>

          <Card className="text-center">
            <div className="text-4xl mb-4">🎓</div>
            <h2 className="text-2xl font-semibold mb-3">Para Alumnos</h2>
            <p className="text-gray-600 mb-6">
              Escanea el QR del profesor y registra tu asistencia
            </p>
            <p className="text-sm text-gray-500">
              No necesitas registrarte. Solo escanea el código QR que te
              proporcione tu profesor.
            </p>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card title="¿Cómo funciona?">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">El profesor genera un QR</h3>
                  <p className="text-gray-600 text-sm">
                    Selecciona su materia y grupo, y el sistema genera un código QR único
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">El alumno escanea el QR</h3>
                  <p className="text-gray-600 text-sm">
                    Con su teléfono móvil, escanea el código QR del profesor
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Escanea su credencial</h3>
                  <p className="text-gray-600 text-sm">
                    El alumno escanea el QR de su credencial para extraer su boleta
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">¡Asistencia registrada!</h3>
                  <p className="text-gray-600 text-sm">
                    El sistema registra automáticamente la asistencia del alumno
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
