import { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

type ImageCropperProps = {
  file: File;
  onCancel: () => void;
  onComplete: (file: File) => void;
};

const PREVIEW_SIZE = 288;

const ImageCropper = ({ file, onCancel, onComplete }: ImageCropperProps) => {
  const [source, setSource] = useState({ width: 0, height: 0, url: '' });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setSource({ width: image.naturalWidth, height: image.naturalHeight, url });
    image.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = source.width && source.height
    ? Math.max(PREVIEW_SIZE / source.width, PREVIEW_SIZE / source.height)
    : 1;
  const scale = baseScale * zoom;
  const displayedWidth = source.width * scale;
  const displayedHeight = source.height * scale;
  const maxOffsetX = Math.max(0, (displayedWidth - PREVIEW_SIZE) / 2);
  const maxOffsetY = Math.max(0, (displayedHeight - PREVIEW_SIZE) / 2);
  const constrainedOffset = {
    x: Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x)),
    y: Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y)),
  };

  const resetCrop = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    setOffset({
      x: dragStart.current.offsetX + event.clientX - dragStart.current.x,
      y: dragStart.current.offsetY + event.clientY - dragStart.current.y,
    });
  };

  const completeCrop = () => {
    if (!source.width || !source.height) return;

    const image = new Image();
    image.onload = () => {
      const cropSize = PREVIEW_SIZE / scale;
      const sourceX = (source.width - cropSize) / 2 - constrainedOffset.x / scale;
      const sourceY = (source.height - cropSize) / 2 - constrainedOffset.y / scale;
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const name = file.name.replace(/\.[^.]+$/, '') || 'hero-photo';
        onComplete(new File([blob], `${name}.webp`, { type: 'image/webp' }));
      }, 'image/webp', 0.9);
    };
    image.src = source.url;
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Crop Hero image</h3>
          <p className="text-sm text-gray-400">Drag to position the image. The uploaded version is a 1:1 WebP square.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Cancel crop">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="relative mx-auto h-72 w-72 touch-none overflow-hidden rounded-2xl border border-white/20 bg-gray-950 shadow-2xl"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragStart.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => { dragStart.current = null; setOffset(constrainedOffset); }}
        onPointerCancel={() => { dragStart.current = null; setOffset(constrainedOffset); }}
      >
        {source.url && (
          <img
            src={source.url}
            alt="Crop preview"
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: displayedWidth,
              height: displayedHeight,
              left: (PREVIEW_SIZE - displayedWidth) / 2 + constrainedOffset.x,
              top: (PREVIEW_SIZE - displayedHeight) / 2 + constrainedOffset.y,
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 border-[3px] border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.45)]" />
      </div>

      <label className="mt-5 block text-sm font-medium text-gray-300" htmlFor="hero-crop-zoom">Zoom</label>
      <input
        id="hero-crop-zoom"
        type="range"
        min="1"
        max="3"
        step="0.01"
        value={zoom}
        onChange={(event) => setZoom(Number(event.target.value))}
        className="mt-2 w-full accent-primary"
      />
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={resetCrop} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
        <button type="button" onClick={completeCrop} disabled={!source.url} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
          <Check className="h-4 w-4" /> Use cropped image
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
