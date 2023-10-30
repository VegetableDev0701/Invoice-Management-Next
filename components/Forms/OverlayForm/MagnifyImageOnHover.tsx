import { useAppSelector } from '@/store/hooks';
import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  pageIdx: number;
  className?: string;
}

export default function MagnifyImageOnHover(props: Props) {
  const { src, alt, pageIdx } = props;

  const imageRef = useRef<HTMLImageElement>(null);
  const magnifierRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const boundingBox = useAppSelector(
    (state) => state.overlay['process-invoices'].currentBoundingBox
  );
  useEffect(() => {
    if (!imageLoaded) return;

    const image = imageRef.current;
    const magnifier = magnifierRef.current;

    if (!image || !magnifier) return;

    const magnifierCtx = magnifier.getContext('2d');

    if (!magnifierCtx) return;

    const drawMagnifier = (
      box:
        | {
            x: number;
            y: number;
            width: number;
            height: number;
            page: number;
          }
        | null
        | undefined,
      magnification: number
    ) => {
      if (!box || box.page !== pageIdx + 1) {
        magnifier.classList.add('hidden');
        return;
      }

      const sectionX = box.x * image.naturalWidth;
      const sectionY = box.y * image.naturalHeight;
      const sectionWidth = box.width * image.naturalWidth;
      const sectionHeight = box.height * image.naturalHeight;

      const sectionXRect = box.x * image.width;
      const sectionYRect = box.y * image.height;
      const sectionWidthRect = box.width * image.width;
      const sectionHeightRect = box.height * image.height;

      const magnifiedWidth = sectionWidthRect * Math.sqrt(magnification);
      const magnifiedHeight = sectionHeightRect * Math.sqrt(magnification);

      let magnifiedX = sectionXRect - (magnifiedWidth - sectionWidthRect) / 2;
      let magnifiedY = sectionYRect - (magnifiedHeight - sectionHeightRect) / 2;

      // Calculate the potential overflow
      const overflowXRight = magnifiedX + magnifiedWidth - image.width;
      const overflowYBottom = magnifiedY + magnifiedHeight - image.height;
      const overflowXLeft = magnifiedX;
      const overflowYTop = magnifiedY;

      // Adjust magnifiedX and magnifiedY if there is overflow
      // if the magnified section is overflowing both sides
      if (overflowXRight > 0 && overflowXLeft < 0) {
        magnifiedX -= overflowXLeft;
      }
      // if overflow to the right but not left
      if (overflowXRight > 0 && overflowXLeft > 0) {
        magnifiedX -= overflowXRight;
      }
      // if overflow left but not right
      if (overflowXLeft < 0 && overflowXRight < 0) {
        magnifiedX -= overflowXLeft;
      }
      // we shouldn't have the left/right overflow complexities for top/bottom
      if (overflowYBottom > 0) {
        magnifiedY -= overflowYBottom + 10;
      }
      if (overflowYTop < 0) {
        magnifiedY -= overflowYTop + 10;
      }

      magnifier.style.width = `${magnifiedWidth}px`;
      magnifier.style.maxWidth = `${image.width}px`;
      magnifier.style.height = `${magnifiedHeight}px`;
      magnifier.style.left = `${magnifiedX}px`;
      magnifier.style.top = `${magnifiedY}px`;
      magnifier.style.border = '2px solid rgba(223, 153, 32, 1)'; // Adjust the border color and width as necessary
      magnifier.style.boxShadow = `0 6px 18px rgba(0, 0, 0, 0.2)`;

      magnifier.width = magnifiedWidth;
      magnifier.height = magnifiedHeight;

      // magnifier.classList.add('hidden');
      magnifier.classList.remove('hidden');

      magnifierCtx.drawImage(
        image,
        sectionX,
        sectionY,
        sectionWidth,
        sectionHeight,
        0,
        0,
        magnifiedWidth,
        magnifiedHeight
      );
    };

    const drawMagnifierAtCursor = (e: MouseEvent, magnification: number) => {
      const magnifierBoxWidth = image.width;
      const magnifierBoxHeight = image.height / 1.75; // This controls the size of the magnifier box

      const magnifiedWidth = image.width / magnification;
      const magnifiedHeight = image.height / magnification;
      const potentialSectionX =
        (e.offsetX / image.width) * image.naturalWidth - magnifiedWidth / 2;
      const sectionX = Math.max(
        0,
        Math.min(potentialSectionX, image.naturalWidth - magnifiedWidth)
      );
      const potentialSectionY =
        (e.offsetY / image.height) * image.naturalHeight - magnifiedHeight / 2;
      const sectionY = Math.max(
        0,
        Math.min(potentialSectionY, image.naturalHeight - magnifiedHeight)
      );

      const sectionWidth = magnifiedWidth;
      const sectionHeight = magnifiedHeight;

      // Ensure the magnified section doesn't go out of the image bounds
      const actualSectionX = Math.max(
        0,
        Math.min(sectionX, image.naturalWidth - magnifiedWidth)
      );

      magnifier.style.width = `${magnifierBoxWidth}px`;
      magnifier.style.height = `${magnifierBoxHeight}px`;
      magnifier.style.left = `${Math.max(
        0,
        Math.min(
          e.offsetX - magnifierBoxWidth / 2,
          image.width - magnifierBoxWidth
        )
      )}px`;
      magnifier.style.top = `${Math.max(
        0,
        Math.min(
          e.offsetY - magnifierBoxHeight / 2,
          image.height - magnifierBoxHeight
        )
      )}px`;

      magnifier.width = magnifierBoxWidth;
      magnifier.height = magnifierBoxHeight;

      // wtf is going on here???
      // magnifier.classList.add('hidden');
      magnifier.classList.remove('hidden');

      magnifierCtx.drawImage(
        image,
        actualSectionX,
        sectionY,
        sectionWidth,
        sectionHeight,
        0,
        0,
        magnifierBoxWidth,
        magnifierBoxHeight
      );
    };

    image.addEventListener('mousemove', (e) => drawMagnifierAtCursor(e, 0.7));
    image.addEventListener('mouseleave', () => {
      magnifier.classList.add('hidden');
    });

    drawMagnifier(boundingBox, 12);

    return () => {
      // Clean up event listener when component is unmounted or dependencies change
      image.removeEventListener('mousemove', (e) =>
        drawMagnifierAtCursor(e, 2.0)
      );
    };
  }, [imageLoaded, boundingBox]);

  return (
    <div className="relative h-full w-full">
      <img
        src={src}
        alt={alt}
        ref={imageRef}
        className="w-full h-full object-fill"
        onLoad={() => setImageLoaded(true)}
      />
      <canvas
        ref={magnifierRef}
        className="absolute pointer-events-none border-2 border-stak-dark-gray"
      />
    </div>
  );
}
