/**
 * Componente Table - Tabla reutilizable
 * Muestra datos en formato tabular con soporte para scroll personalizado
 */

'use client';

export default function Table({
  columns = [],
  data = [],
  onRowClick,
  className = '',
  unstyled = false,
}) {
  if (unstyled) {
    return (
      <div className={className}>
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Estilos predeterminados según diseño
  const containerStyles = 'overflow-x-auto custom-scrollbar';
  const tableStyles = 'w-full border-collapse';
  const headerStyles = 'bg-green-50 border border-green-200';
  const headerCellStyles = 'px-6 py-4 text-left text-base font-semibold text-gray-800';
  const rowStyles = 'border border-green-200 bg-white hover:bg-green-50 transition-colors';
  const cellStyles = 'px-6 py-4 text-gray-700';

  return (
    <div className={`${containerStyles} ${className}`}>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #d1fae5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6ee7b7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4ade80;
        }
      `}</style>
      
      <table className={tableStyles}>
        <thead className={headerStyles}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={headerCellStyles}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-gray-500"
              >
                No hay datos para mostrar
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row.id || index}
                className={`${rowStyles} ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cellStyles}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
