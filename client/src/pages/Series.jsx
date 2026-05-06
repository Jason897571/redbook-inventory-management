import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Package } from 'lucide-react';

export default function Series() {
  const [seriesList, setSeriesList] = useState([]);
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
              <div className="h-36 bg-muted">
                {s.image ? (
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
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
    </div>
  );
}
