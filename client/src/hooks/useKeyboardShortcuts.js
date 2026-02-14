import { useEffect } from 'react';

export function useKeyboardShortcuts({ onApprove, onReject, onFeedback, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger if focused on input
      if (event.target.matches('input, textarea')) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          event.preventDefault();
          onApprove?.();
          break;
        case 'r':
          event.preventDefault();
          onReject?.();
          break;
        case 'f':
          event.preventDefault();
          onFeedback?.();
          break;
        case 'escape':
          event.preventDefault();
          onClose?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onApprove, onReject, onFeedback, onClose]);
}
