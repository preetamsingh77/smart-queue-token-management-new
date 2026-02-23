
import React, { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const root = rootRef.current;
    if (!root) return;

    // Find all focusable elements within the component
    const focusableElements = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab: Wrap from first to last
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab: Wrap from last to first
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    // Store the previous active element to restore focus later if needed
    const previousActiveElement = document.activeElement as HTMLElement;

    // Set initial focus
    firstElement.focus();

    window.addEventListener('keydown', handleTab);
    return () => {
      window.removeEventListener('keydown', handleTab);
      // Restore focus to what was active before the trap
      previousActiveElement?.focus();
    };
  }, [active]);

  return <div ref={rootRef}>{children}</div>;
};
