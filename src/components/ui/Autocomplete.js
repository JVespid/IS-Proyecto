/**
 * Componente Autocomplete
 * Input con sugerencias filtradas de una lista de opciones
 * Permite tanto selección de sugerencias como escritura libre
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

export default function Autocomplete({
  options = [],
  value,
  onChange,
  placeholder = '',
  error = '',
  className = '',
  unstyled = false,
  ...props
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Sincronizar inputValue con value inicial (buscar label del value)
  useEffect(() => {
    if (value) {
      const option = options.find((opt) => opt.value === value);
      if (option) {
        setInputValue(option.label);
      } else {
        // Si no se encuentra en options, usar el value directamente (escritura libre previa)
        setInputValue(value);
      }
    } else {
      setInputValue('');
    }
    // Solo ejecutar cuando value o options cambien externamente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Filtrar opciones usando useMemo para evitar re-renders innecesarios
  const filteredOptions = useMemo(() => {
    if (inputValue.trim() === '') {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, options]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Manejar cambios en el input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // Actualizar el value con el texto ingresado (puede ser UUID o texto libre)
    onChange(newValue);
  };

  // Manejar selección de una opción
  const handleSelectOption = (option) => {
    setInputValue(option.label);
    onChange(option.value);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Manejar pérdida de foco
  const handleBlur = () => {
    setIsOpen(false);
  };

  // Manejar navegación con teclado
  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (isOpen) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelectOption(filteredOptions[highlightedIndex]);
          } else {
            // Si no hay selección, cerrar el dropdown
            setIsOpen(false);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;

        default:
          break;
      }
    }
  };

  // Manejar focus en el input
  const handleFocus = () => {
    setIsOpen(true);
  };

  const baseInputClasses = unstyled
    ? className
    : `w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      } ${className}`;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={baseInputClasses}
        autoComplete="off"
        {...props}
      />

      {/* Dropdown de sugerencias */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevenir que el input pierda el foco
                handleSelectOption(option);
              }}
              className={`px-4 py-2 cursor-pointer ${
                index === highlightedIndex
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Mensaje de error */}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
