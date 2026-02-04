/**
 * Componente Input básico
 */

'use client';

export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  className = '',
  unstyled = false, // Nueva prop para desactivar estilos predeterminados
  ...props
}) {
  // Si unstyled es true, solo aplicar clases personalizadas
  if (unstyled) {
    return (
      <div className="w-full">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
          {...props}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
