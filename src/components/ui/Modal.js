/**
 * Componente Modal - Diálogo modal reutilizable
 * Overlay oscuro con contenido centrado
 */

'use client';

import { useEffect } from 'react';

export default function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  className = '',
  unstyled = false,
}) {
  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevenir scroll del body cuando modal está abierto
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (unstyled) {
    return (
      <div className={className} onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>
          {title && <div>{title}</div>}
          <div>{children}</div>
          {footer && <div>{footer}</div>}
        </div>
      </div>
    );
  }

  // Estilos predeterminados con diseño neobrutalist
  const overlayStyles = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
  const modalStyles = 'bg-white rounded-[15px] border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-lg w-full max-h-[90vh] overflow-y-auto';
  const headerStyles = 'px-6 py-4 border-b-4 border-black bg-[#CCFED9]';
  const titleStyles = 'text-2xl font-bold text-black';
  const bodyStyles = 'px-6 py-6';
  const footerStyles = 'px-6 py-4 border-t-4 border-black bg-gray-50 flex justify-end gap-3';

  return (
    <div className={overlayStyles} onClick={onClose}>
      <div
        className={`${modalStyles} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={headerStyles}>
            <h2 className={titleStyles}>{title}</h2>
          </div>
        )}
        
        <div className={bodyStyles}>
          {children}
        </div>
        
        {footer && (
          <div className={footerStyles}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
