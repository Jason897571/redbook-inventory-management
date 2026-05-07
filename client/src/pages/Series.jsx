import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Package } from 'lucide-react';
import ImageLightbox from '@/components/ImageLightbox';

export default function Series() {
  const [seriesList, setSeriesList] = useState([]);
  const [lightbox, setLightbox] = useState({ open: false, images: [] });
  const navigate = useNavigate();

  useEffect(() => {
    api.getSeries().then(setSeriesList);
  }, []);

  const deleteItem = async (e, id) => {
    e.stopPropagation();
    if (!confirm('确定删除此系列？')) return;
    await api.deleteSeries(id);
    setSeriesList((prev) => prev.filter((s) => s._id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">产品系列</h1>
        <Button onClick={() => navigate('/series/new')}>
          <Plus size={16} className="mr-1" />添加系列
        </Button>
      </div>

      {seriesList.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">暂无系列</p>
          <Button onClick={() => navigate('/series/new')} variant="outline">添加系列</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((s) => (
            <div
              key={s._id}
              onClick={() => navigate(`/series/${s._id}/edit`)}
              className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="h-36 bg-muted relative group/img">
                {s.image ? (
                  <>
                    <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightbox({ open: true, images: [s.image] });
                      }}
                    >
                      <span className="text-white text-xs opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">查看大图</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package size={24} /></div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{s.name}</h3>
                  <button
                    onClick={(e) => deleteItem(e, s._id)}
                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-2 inline-block">
                  {s.products?.length || 0} 个产品
                </span>
                {s.description && <p className="text-xs text-muted-foreground mt-2">{s.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageLightbox
        images={lightbox.images}
        open={lightbox.open}
        onClose={() => setLightbox({ open: false, images: [] })}
      />
    </div>
  );
}
