import { RefObject, useEffect } from 'react';

export const useKeyPressActionOverlay = ({
  formOverlayOpen,
  ref,
  keyName,
  isMoveForward,
  isMoveBackward,
  isActive = true,
  backButton = 4,
  forwardButton = 5,
}: {
  formOverlayOpen: boolean;
  ref: RefObject<HTMLButtonElement> | RefObject<HTMLDivElement>;
  keyName: string;
  isActive?: boolean;
  isMoveForward?: boolean;
  isMoveBackward?: boolean;
  backButton?: number;
  forwardButton?: number;
}) => {
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (isMoveForward) {
        if (
          isActive &&
          e.key === keyName &&
          !e.shiftKey &&
          ref &&
          formOverlayOpen
        ) {
          ref.current?.click();
        }
      } else if (isMoveBackward) {
        if (
          isActive &&
          e.key === keyName &&
          e.shiftKey &&
          ref &&
          formOverlayOpen
        ) {
          ref.current?.click();
        }
      } else {
        if (isActive && e.key === keyName && ref && formOverlayOpen) {
          ref.current?.click();
        }
      }
    };

    const mouseDownHandler = (e: MouseEvent) => {
      e.stopPropagation();
      // Check if the forward button (mouse button 5) is clicked
      if (isActive && e.button === forwardButton && ref && formOverlayOpen) {
        ref.current?.click();
      }
      // Check if the back button (mouse button 4) is clicked
      else if (isActive && e.button === backButton && ref && formOverlayOpen) {
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
  }, [formOverlayOpen, keyName, ref, forwardButton, backButton, isActive]);
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
      e.stopPropagation();
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
