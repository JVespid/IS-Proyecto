'use client';

import { useState, useRef, useEffect } from 'react';

export function DropdownMenu({ trigger, children, align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={toggleOpen} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1 w-32 bg-[#e0e0e0] rounded-none shadow-lg z-50 ring-1 ring-black ring-opacity-5 focus:outline-none border border-black`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-0 flex flex-col" role="menu" aria-orientation="vertical">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, className = '' }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevenir navegación de fila si existe
        onClick?.(e);
      }}
      className={`flex w-full items-center text-left px-3 py-2 text-sm text-black hover:bg-gray-200 border-b border-black last:border-b-0 ${className}`}
      role="menuitem"
    >
      {children}
    </button>
  );
}
