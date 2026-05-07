import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Gem } from 'lucide-react';
import ImageLightbox from '@/components/ImageLightbox';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    api.getProducts().then(setProducts);
  }, []);

  const deleteItem = async (e, id) => {
    e.stopPropagation();
    if (!confirm('确定删除？')) return;
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">成品管理</h1>
        <Button onClick={() => navigate('/products/new')}>
          <Plus size={16} className="mr-1" />添加产品
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">暂无产品</p>
          <Button onClick={() => navigate('/products/new')} variant="outline">添加产品</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const isLow = p.stock <= p.stockAlertThreshold;
            const coverImage = p.images?.[0] || p.image;
            return (
              <div
                key={p._id}
                onClick={() => navigate(`/products/${p._id}/edit`)}
                className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="h-32 bg-muted relative group/img">
                  {coverImage ? (
                    <>
                      <img src={coverImage} alt={p.name} className="w-full h-full object-cover" />
                      <div
                        className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightbox({ open: true, images: p.images?.length ? p.images : [coverImage], index: 0 });
                        }}
                      >
                        <span className="text-white text-xs opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">查看大图</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Gem size={24} /></div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isLow ? 'text-[var(--color-loss)]' : 'text-muted-foreground'}`}>库存: {p.stock}</span>
                  </div>
                  <h3 className="font-medium text-foreground text-sm">{p.name}</h3>
                  {p.styles?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.styles.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                    <span className="text-muted-foreground">¥{p.price}</span>
                    <span className="text-[var(--color-profit)]">净利 ¥{p.netProfit?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => deleteItem(e, p._id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImageLightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        open={lightbox.open}
        onClose={() => setLightbox({ open: false, images: [], index: 0 })}
      />
    </div>
  );
}
