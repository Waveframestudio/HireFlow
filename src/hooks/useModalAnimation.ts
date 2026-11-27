import { useEffect, useState } from 'react';

/**
 * Hook para manejar animaciones suaves de entrada y salida (aparición y desaparición) en modales y drawers.
 * Mantiene el elemento montado durante la animación de cierre antes de desmontarlo del DOM.
 *
 * @param isOpen - Estado booleano de visibilidad del modal
 * @param duration - Duración en milisegundos de la animación de salida (por defecto 200ms)
 */
export function useModalAnimation(isOpen: boolean, duration: number = 200) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    let timeoutId: any;
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      timeoutId = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, duration);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, duration, shouldRender]);

  return {
    shouldRender,
    isClosing,
    backdropClass: isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in',
    contentClass: isClosing ? 'animate-modal-content-out' : 'animate-modal-content-in',
    drawerClass: isClosing ? 'animate-drawer-out' : 'animate-drawer-in',
  };
}
