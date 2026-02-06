/**
 * Página de Login
 * Permite a los profesores iniciar sesión
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      {/* Card verde */}
      <div className="w-full max-w-2xl">
        <div className="bg-[#3eb575] rounded-3xl shadow-2xl p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-3">
              Inicio de sesión
            </h1>
            <p className="text-gray-700 text-base">
              ingresa tus datos para acceder al sistema
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@ipn.mx"
                required
                unstyled={true}
                className="w-full px-4 py-3 bg-[#d9d9d9] text-gray-800 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-black text-base font-medium mb-2">
                contraseña:
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  unstyled={true}
                  className="w-full px-4 py-3 pr-24 bg-[#d9d9d9] text-gray-800 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#a8a8a8] hover:bg-[#959595] text-black text-sm rounded transition-colors"
                >
                  Mostrar
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              unstyled={true}
              className="w-full bg-[#53b099] hover:bg-[#5aba9f] cursor-pointer text-black font-semibold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'iniciar sesión'}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8">
            <div className="border-t-2 border-black/30"></div>
          </div>

          {/* Register Section */}
          <div className="text-center space-y-4">
            <p className="text-black text-base">
              ¿No tienes cuenta ?
            </p>
            <Button
              type="button"
              onClick={() => router.push('/register')}
              unstyled={true}
              className="w-auto px-8 bg-[#53b099] hover:bg-[#5aba9f] cursor-pointer text-black font-semibold py-2 rounded-full transition-colors"
            >
              Registrarse
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
