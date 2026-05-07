import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Upload, Expand, RefreshCw } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

export default function ImageUpload({ value, onChange }) {
  const inputRef = useRef();
  const [preview, setPreview] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { url } = await api.uploadImage(file);
    onChange(url);
  };

  return (
    <>
      <div
        className="relative w-full h-32 bg-muted rounded-lg border border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary/40 transition-colors group"
        onClick={() => value ? setPreview(true) : inputRef.current.click()}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <Expand size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Replace button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
              className="absolute bottom-1.5 right-1.5 p-1.5 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
              title="更换图片"
            >
              <RefreshCw size={14} />
            </button>
          </>
        ) : (
          <div className="text-muted-foreground text-center">
            <Upload size={24} className="mx-auto mb-1" />
            <span className="text-xs">点击上传</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      <ImageLightbox
        images={value ? [value] : []}
        open={preview}
        onClose={() => setPreview(false)}
      />
    </>
  );
}
