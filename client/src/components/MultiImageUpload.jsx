import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Upload, X, Star, Expand } from 'lucide-react';
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ImageLightbox from './ImageLightbox';

function SortableImage({ url, index, onRemove, onPreview }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative w-24 h-24 rounded-lg border border-border overflow-hidden cursor-grab active:cursor-grabbing group"
    >
      <img src={url} alt="" className="w-full h-full object-cover" />
      {index === 0 && (
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded px-1 py-0.5 text-[10px] flex items-center gap-0.5">
          <Star size={8} /> 封面
        </div>
      )}
      {/* Preview button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPreview(index); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-1 left-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80"
        title="查看大图"
      >
        <Expand size={12} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(url); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <X size={10} />
      </button>
    </div>
  );
}

export default function MultiImageUpload({ value = [], onChange }) {
  const inputRef = useRef();
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { url } = await api.uploadImage(file);
    onChange([...value, url]);
    e.target.value = '';
  };

  const handleRemove = (url) => {
    onChange(value.filter((v) => v !== url));
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = value.indexOf(String(active.id));
    const newIndex = value.indexOf(String(over.id));
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={value} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-2">
            {value.map((url, i) => (
              <SortableImage
                key={url}
                url={url}
                index={i}
                onRemove={handleRemove}
                onPreview={(idx) => setLightbox({ open: true, index: idx })}
              />
            ))}
            <div
              onClick={() => inputRef.current.click()}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors text-muted-foreground"
            >
              <Upload size={20} className="mb-1" />
              <span className="text-[10px]">添加图片</span>
            </div>
          </div>
        </SortableContext>
      </DndContext>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      <ImageLightbox
        images={value}
        initialIndex={lightbox.index}
        open={lightbox.open}
        onClose={() => setLightbox({ open: false, index: 0 })}
      />
    </div>
  );
}
