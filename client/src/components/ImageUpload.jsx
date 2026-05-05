import { useRef } from 'react';
import { api } from '@/lib/api';
import { Upload } from 'lucide-react';

export default function ImageUpload({ value, onChange }) {
  const inputRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { url } = await api.uploadImage(file);
    onChange(url);
  };

  return (
    <div
      className="relative w-full h-32 bg-muted rounded-lg border border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary/40 transition-colors"
      onClick={() => inputRef.current.click()}
    >
      {value ? (
        <img src={value} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="text-muted-foreground text-center">
          <Upload size={24} className="mx-auto mb-1" />
          <span className="text-xs">点击上传</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
