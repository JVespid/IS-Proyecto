/**
 * Componente Badge - Etiqueta de estado
 * Muestra status con colores correspondientes
 */

'use client';

export default function Badge({
  variant = 'info',
  children,
  className = '',
  unstyled = false,
}) {
  if (unstyled) {
    return <span className={className}>{children}</span>;
  }

  // Estilos base
  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';

  // Variantes de color
  const variants = {
    success: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    danger: 'bg-red-100 text-red-800 border border-red-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300',
    active: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    inactive: 'bg-gray-100 text-gray-800 border border-gray-300',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
