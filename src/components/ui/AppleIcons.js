/**
 * Componentes de Iconos de Manzana
 * SVGs de manzana completa (éxito) y manzana mordida (error)
 */

export function AppleComplete({ className = "w-64 h-64" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tallo */}
      <rect
        x="95"
        y="20"
        width="10"
        height="25"
        fill="#3d2817"
        rx="2"
      />
      
      {/* Corona */}
      <g transform="translate(100, 40)">
        {/* Corona base */}
        <path
          d="M-35,-15 L-25,-35 L-15,-20 L0,-40 L15,-20 L25,-35 L35,-15 L25,0 L-25,0 Z"
          fill="#FFB800"
          stroke="#000"
          strokeWidth="2"
        />
        {/* Puntas de la corona */}
        <circle cx="-25" cy="-35" r="5" fill="#FFD700" stroke="#000" strokeWidth="1.5" />
        <circle cx="0" cy="-40" r="5" fill="#FFD700" stroke="#000" strokeWidth="1.5" />
        <circle cx="25" cy="-35" r="5" fill="#FFD700" stroke="#000" strokeWidth="1.5" />
        {/* Detalles de la corona */}
        <line x1="-20" y1="-25" x2="-20" y2="-5" stroke="#000" strokeWidth="1" opacity="0.3" />
        <line x1="0" y1="-30" x2="0" y2="-5" stroke="#000" strokeWidth="1" opacity="0.3" />
        <line x1="20" y1="-25" x2="20" y2="-5" stroke="#000" strokeWidth="1" opacity="0.3" />
      </g>

      {/* Cuerpo de la manzana */}
      <ellipse
        cx="100"
        cy="120"
        rx="65"
        ry="70"
        fill="#E31E24"
        stroke="#000"
        strokeWidth="2"
      />

      {/* Sombra de la manzana */}
      <ellipse
        cx="120"
        cy="125"
        rx="25"
        ry="35"
        fill="#000"
        opacity="0.15"
      />

      {/* Brillo de la manzana */}
      <ellipse
        cx="75"
        cy="90"
        rx="20"
        ry="25"
        fill="#FFF"
        opacity="0.3"
      />

      {/* Ojos */}
      <g>
        {/* Ojo izquierdo */}
        <ellipse cx="80" cy="110" rx="8" ry="10" fill="#FFF" />
        <circle cx="82" cy="112" r="5" fill="#000" />
        <circle cx="84" cy="110" r="2" fill="#FFF" />
        
        {/* Ojo derecho */}
        <ellipse cx="120" cy="110" rx="8" ry="10" fill="#FFF" />
        <circle cx="122" cy="112" r="5" fill="#000" />
        <circle cx="124" cy="110" r="2" fill="#FFF" />
      </g>

      {/* Boca sonriente */}
      <path
        d="M 75 130 Q 100 145 125 130"
        stroke="#000"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Mejillas ruborizadas */}
      <ellipse cx="60" cy="125" rx="12" ry="8" fill="#FF6B6B" opacity="0.4" />
      <ellipse cx="140" cy="125" rx="12" ry="8" fill="#FF6B6B" opacity="0.4" />
    </svg>
  );
}

export function AppleBitten({ className = "w-64 h-64" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tallo */}
      <rect
        x="95"
        y="25"
        width="10"
        height="25"
        fill="#3d2817"
        rx="2"
      />

      {/* Cuerpo de la manzana con mordida */}
      <path
        d="M 100 50 
           C 140 55, 165 80, 165 120 
           C 165 160, 140 190, 100 190 
           C 60 190, 35 160, 35 120 
           C 35 105, 40 92, 48 82
           L 48 82
           C 42 78, 38 72, 38 65
           C 38 55, 46 47, 56 47
           C 63 47, 68 52, 70 58
           C 72 52, 77 47, 84 47
           C 94 47, 102 55, 102 65
           C 102 72, 98 78, 92 82
           C 85 75, 78 70, 70 68
           C 75 60, 82 55, 90 55
           L 90 55
           C 95 65, 100 55, 100 50
           Z"
        fill="#E31E24"
        stroke="#000"
        strokeWidth="2"
      />

      {/* Marca de mordida (más visible) */}
      <ellipse
        cx="70"
        cy="67"
        rx="18"
        ry="22"
        fill="#ccfed9"
        stroke="#000"
        strokeWidth="2"
      />

      {/* Interior de la mordida */}
      <ellipse
        cx="70"
        cy="67"
        rx="14"
        ry="18"
        fill="#F5E6D3"
      />

      {/* Semillas en la mordida */}
      <ellipse cx="68" cy="60" rx="2" ry="3" fill="#3d2817" />
      <ellipse cx="72" cy="72" rx="2" ry="3" fill="#3d2817" />

      {/* Sombra de la manzana */}
      <ellipse
        cx="120"
        cy="135"
        rx="25"
        ry="35"
        fill="#000"
        opacity="0.15"
      />

      {/* Brillo de la manzana */}
      <ellipse
        cx="80"
        cy="100"
        rx="18"
        ry="22"
        fill="#FFF"
        opacity="0.25"
      />

      {/* Ojos tristes */}
      <g>
        {/* Ojo izquierdo */}
        <ellipse cx="90" cy="115" rx="7" ry="9" fill="#FFF" />
        <circle cx="91" cy="117" r="4" fill="#000" />
        <circle cx="92" cy="115" r="1.5" fill="#FFF" />
        
        {/* Ojo derecho */}
        <ellipse cx="125" cy="115" rx="7" ry="9" fill="#FFF" />
        <circle cx="126" cy="117" r="4" fill="#000" />
        <circle cx="127" cy="115" r="1.5" fill="#FFF" />
      </g>

      {/* Boca triste */}
      <path
        d="M 85 145 Q 107 135 130 145"
        stroke="#000"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Lágrima */}
      <g>
        <path
          d="M 92 125 Q 90 132 92 138 Q 94 132 92 125"
          fill="#4FC3F7"
          stroke="#2196F3"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}
