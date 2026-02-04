/**
 * Página de Registro
 * Permite a los profesores registrarse
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: 'Bernardo',
    lastName: 'Lopez',
    email: 'bernardo.abel.ls1@gmail.com',
    password: 'wa ha ha123',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    
    const result = await register(formData);

    if (result?.success) {
      router.push('/dashboard');
    } else {
      setError(result?.error || 'Error al registrarse');
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <Card title="Registro de Profesor">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nombre"
              required
            />
            
            <Input
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Apellido"
              required
            />
            
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Email"
              required
            />
            
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Contraseña (mín. 6 caracteres)"
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Registrarse
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a href="/login" className="text-blue-600 hover:underline text-sm">
              ¿Ya tienes cuenta? Inicia sesión
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
