/**
 * Componente Select básico
 */

'use client';

export default function Select({
  options = [],
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
