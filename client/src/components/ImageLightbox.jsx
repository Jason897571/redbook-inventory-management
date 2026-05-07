import { useEffect, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageLightbox({ images = [], initialIndex = 0, open, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setScale(1);
    }
  }, [open, initialIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const prev = useCallback(() => {
    setIndex(i => (i > 0 ? i - 1 : images.length - 1));
    setScale(1);
  }, [images.length]);

  const next = useCallback(() => {
    setIndex(i => (i < images.length - 1 ? i + 1 : 0));
    setScale(1);
  }, [images.length]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowLeft' && images.length > 1) prev();
    else if (e.key === 'ArrowRight' && images.length > 1) next();
  }, [onClose, images.length, prev, next]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open || images.length === 0) return null;

  const multi = images.length > 1;
  const src = images[index];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
      >
        <X size={24} />
      </button>

      {/* Zoom controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <button
          onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
        >
          <ZoomOut size={20} />
        </button>
        <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(s => Math.min(3, s + 0.25))}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
        >
          <ZoomIn size={20} />
        </button>
      </div>

      {/* Counter */}
      {multi && (
        <div className="absolute top-4 left-4 z-10 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
          {index + 1} / {images.length}
        </div>
      )}

      {/* Previous button */}
      {multi && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Main image */}
      <div
        className="relative z-[1] flex items-center justify-center max-w-[90vw] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt=""
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
          onDoubleClick={() => setScale(s => s === 1 ? 2 : 1)}
          draggable={false}
        />
      </div>

      {/* Next button */}
      {multi && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Thumbnail strip */}
      {multi && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/50 p-2 rounded-xl max-w-[90vw] overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setIndex(i); setScale(1); }}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                i === index ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
