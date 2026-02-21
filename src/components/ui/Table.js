/**
 * Componente Table - Tabla reutilizable
 * Muestra datos en formato tabular con soporte para scroll personalizado
 */

"use client";

export default function Table({
  columns = [],
  data = [],
  onRowClick,
  className = "",
  containerClassName = "",
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
              <tr key={row.id || index} onClick={() => onRowClick?.(row)}>
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

  // Estilos predeterminados
  // Lógica: Si pasamos 'overflow-visible', quitamos 'overflow-x-auto' para que los dropdowns se vean
  const baseContainerStyles = "custom-scrollbar pr-2"; // Padding right para evitar solapamiento con scrollbar
  const defaultOverflow = containerClassName.includes("overflow-visible")
    ? ""
    : "overflow-x-auto";

  const tableStyles = "w-full border-collapse border border-black";
  const headerStyles = "bg-[##e6ffea] border-b border-black";
  const headerCellStyles =
    "px-4 py-3 text-center text-base font-normal text-black border-r border-black last:border-r-0 ";
  const rowStyles =
    "bg-[##e6ffea] hover:bg-[#cbf7d8] transition-colors border-b border-black last:border-b-0";
  const cellStyles =
    "px-4 py-3 text-center text-[#2f4f4f] border-r border-black last:border-r-0 relative";

  return (
    <div
      className={`${baseContainerStyles} ${defaultOverflow} ${containerClassName} ${className}`}
    >
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: white;
          border-radius: 6px;
          border: 1px solid #ddd;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 9999px; /* Pill shape */
          border: 2px solid white; /* Padding visual */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #bbb;
        }
      `}</style>

      <table className={tableStyles}>
        <thead className={headerStyles}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`${headerCellStyles}`}>
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
                className="px-6 py-8 text-center text-gray-500 border border-black"
              >
                No hay datos para mostrar
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row.id || index}
                className={`${rowStyles} ${onRowClick ? "active:bg-[#b0ebdcb3]" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cellStyles}>
                    {col.render ? col.render(row) : row[col.key]}
                    {col.BTN && col.BTN(row)}
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
