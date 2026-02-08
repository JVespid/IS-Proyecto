/**
 * Iconos SVG para estados de asistencia
 * Separados para fácil modificación visual
 */

'use client';

/**
 * Icono para asistencia (attended = true)
 * Muestra un punto
 */
export function AttendedIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="8" cy="8" r="4" fill="currentColor" />
    </svg>
  );
}

/**
 * Icono para ausencia (absent = true)
 * Muestra una diagonal (/)
 */
export function AbsentIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <line
        x1="3"
        y1="13"
        x2="13"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Icono para retardo (delayed = true)
 * Muestra una diagonal con punto en el centro
 */
export function DelayedIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Diagonal */}
      <line
        x1="3"
        y1="13"
        x2="13"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Punto en el centro */}
      <circle cx="8" cy="8" r="2.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Componente que renderiza el icono apropiado según el estado
 */
export function AttendanceIcon({ attendance, size = 16, className = '' }) {
  if (attendance.attended) {
    return <AttendedIcon size={size} className={className} />;
  }
  if (attendance.delayed) {
    return <DelayedIcon size={size} className={className} />;
  }
  if (attendance.absent) {
    return <AbsentIcon size={size} className={className} />;
  }
  // Si no hay estado definido, no mostrar nada
  return null;
}
