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

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: 'Bernardo Lopez',
    email: 'bernardo.abel.ls1@gmail.com',
    password: 'wa ha ha123',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register({
      name: formData.name,
      lastName: null,
      email: formData.email,
      password: formData.password,
    });

    if (result?.success) {
      router.push('/');
    } else {
      setError(result?.error || 'Error al registrarse');
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Líneas horizontales de fondo, centrado verticalmente */}
      <div className="absolute inset-0 pointer-events-none flex items-center">
        <div className="w-full">
          <div className="w-full h-48 bg-[#108e3a]"></div>
          <div className="w-full h-20 bg-[#8fb09e]"></div>
          <div className="w-full h-48 bg-[#bfc7c5]"></div>
        </div>
      </div>

      {/* Formulario */}
      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-[#3eb575] rounded-3xl shadow-2xl p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-black mb-3">
              Crear una cuenta
            </h1>
            <p className="text-gray-700 text-base">
              completa el formulario para registrarte en el sistema
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {/* Email */}
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Correo electronico:
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="ejemplo@ipn.mx"
                required
                unstyled={true}
                className="w-full px-4 py-3 bg-[#d9d9d9] text-gray-800 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Nueva contraseña:
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="ejemplo@ipn.mx"
                required
                unstyled={true}
                className="w-full px-4 py-3 bg-[#d9d9d9] text-gray-800 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            
            {/* Name */}
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Nombre del maestro:
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="ejemplo@ipn.mx"
                required
                unstyled={true}
                className="w-full px-4 py-3 bg-[#d9d9d9] text-gray-800 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              unstyled={true}
              className="w-full bg-[#53b099] hover:bg-[#5aba9f] cursor-pointer text-black font-semibold py-2 rounded-4xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>

          {/* Footer Message */}
          <div className="mt-8 text-center">
            <p className="text-gray-700 text-sm">
              Se enviará un correo de confirmacion a su correo @ipn.mx para verificar su cuenta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
