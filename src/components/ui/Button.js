/**
 * Componente Button básico
 * Botón reutilizable con estados de carga
 */

'use client';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
}) {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
}
