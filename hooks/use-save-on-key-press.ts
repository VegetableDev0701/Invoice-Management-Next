import { RefObject, useEffect } from 'react';

export const useKeyPressActionOverlay = ({
  formOverlayOpen,
  ref,
  keyName,
  isMoveForward,
  isMoveBackward,
  backButton = 4,
  forwardButton = 5,
}: {
  formOverlayOpen: boolean;
  ref: RefObject<HTMLButtonElement> | RefObject<HTMLDivElement>;
  keyName: string;
  isMoveForward?: boolean;
  isMoveBackward?: boolean;
  backButton?: number;
  forwardButton?: number;
}) => {
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (isMoveForward) {
        if (e.key === keyName && !e.shiftKey && ref && formOverlayOpen) {
          ref.current?.click();
        }
      } else if (isMoveBackward) {
        if (e.key === keyName && e.shiftKey && ref && formOverlayOpen) {
          ref.current?.click();
        }
      } else {
        if (e.key === keyName && ref && formOverlayOpen) {
          ref.current?.click();
        }
      }
    };

    const mouseDownHandler = (e: MouseEvent) => {
      // Check if the forward button (mouse button 5) is clicked
      if (e.button === forwardButton && ref && formOverlayOpen) {
        ref.current?.click();
      }
      // Check if the back button (mouse button 4) is clicked
      else if (e.button === backButton && ref && formOverlayOpen) {
        ref.current?.click();
      }
    };

    // Now we can add and remove the event listener in a symmetrical way
    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('keydown', keyDownHandler);
    return () => {
      window.addEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('keydown', keyDownHandler);
    };
  }, [formOverlayOpen, keyName, ref, forwardButton, backButton]);
};

export const useKeyPressAction = ({
  ref,
  keyName,
}: {
  ref: RefObject<HTMLButtonElement> | RefObject<HTMLDivElement>;
  keyName: string;
}) => {
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      // Make sure ref and ref.current are not null
      if (ref && ref.current && e.key === keyName) {
        ref.current.click();
      }
    };

    window.addEventListener('keydown', keyDownHandler);
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
    };
  }, [ref, keyName]); // Update dependencies here
};
