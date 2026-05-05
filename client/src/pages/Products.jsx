import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';
import { Plus } from 'lucide-react';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    const [prods, series, sets] = await Promise.all([
      api.getProducts(),
      api.getSeries(),
      api.getSettings(),
    ]);
    setProducts(prods);
    setSeriesList(series);
    setSettings(sets);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditItem({
      code: '', name: '', series: '', styles: [],
      pieceCount: 1, price: 0, commissionRate: settings?.defaultCommissionRate || 0.057,
      stockAlertThreshold: 5, image: '', stock: 0,
      components: [], sharedMaterials: [],
    });
    setShowForm(true);
  };

  const saveItem = async () => {
    if (editItem._id) {
      await api.updateProduct(editItem._id, editItem);
    } else {
      await api.createProduct(editItem);
    }
    setShowForm(false);
    setEditItem(null);
    load();
  };

  const toggleStyle = (style) => {
    if (!editItem) return;
    const styles = editItem.styles.includes(style)
      ? editItem.styles.filter((s) => s !== style)
      : [...editItem.styles, style];
    setEditItem({ ...editItem, styles });
  };

  // Group products by series
  const grouped = {};
  products.forEach((p) => {
    const key = p.series?._id || 'uncategorized';
    if (!grouped[key]) grouped[key] = { series: p.series, products: [] };
    grouped[key].products.push(p);
  });

  const productStyles = settings?.productStyles || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">产品管理</h1>
        <Button onClick={openNew}><Plus size={16} className="mr-1" />添加产品</Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">暂无产品，先创建产品系列，再添加产品</p>
          <Button onClick={openNew} variant="outline">添加产品</Button>
        </div>
      ) : (
        Object.entries(grouped).map(([key, { series, products: prods }]) => (
          <div key={key} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold">{series?.name || '未分类'}</h2>
              {series?.beadCategory && <Badge variant="outline" className="text-xs">{series.beadCategory}</Badge>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {prods.map((p) => {
                const isLow = p.stock <= p.stockAlertThreshold;
                return (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/products/${p._id}`)}
                    className="bg-card rounded-lg border border-border overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all group"
                  >
                    <div className="h-32 bg-muted">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">🧶</div>}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{p.code}</span>
                        <span className={`text-xs ${isLow ? 'text-red-400' : 'text-muted-foreground'}`}>库存: {p.stock}</span>
                      </div>
                      <h3 className="font-medium text-foreground text-sm">{p.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        {p.styles.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                        <span className="text-muted-foreground">¥{p.price}</span>
                        <span className="text-green-400">净利 ¥{p.netProfit?.toFixed(2) || '0.00'} ({((p.profitMargin || 0) * 100).toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Create Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>添加产品</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <ImageUpload value={editItem.image} onChange={(url) => setEditItem({ ...editItem, image: url })} />
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">产品编号</Label><Input value={editItem.code} onChange={(e) => setEditItem({ ...editItem, code: e.target.value })} placeholder="如 C1, P1" /></div>
                <div><Label className="text-xs text-muted-foreground">产品名称</Label><Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} /></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">所属系列</Label>
                <Select value={editItem.series} onValueChange={(v) => setEditItem({ ...editItem, series: v })}>
                  <SelectTrigger><SelectValue placeholder="选择系列" /></SelectTrigger>
                  <SelectContent>{seriesList.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">款式</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {productStyles.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStyle(s)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        editItem.styles.includes(s)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-muted border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs text-muted-foreground">几个装</Label><Input type="number" value={editItem.pieceCount} onChange={(e) => setEditItem({ ...editItem, pieceCount: parseInt(e.target.value) || 1 })} /></div>
                <div><Label className="text-xs text-muted-foreground">定价 (¥)</Label><Input type="number" step="0.1" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label className="text-xs text-muted-foreground">佣金率 (%)</Label><Input type="number" step="0.1" value={(editItem.commissionRate * 100).toFixed(1)} onChange={(e) => setEditItem({ ...editItem, commissionRate: parseFloat(e.target.value) / 100 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">初始库存</Label><Input type="number" value={editItem.stock} onChange={(e) => setEditItem({ ...editItem, stock: parseInt(e.target.value) || 0 })} /></div>
                <div><Label className="text-xs text-muted-foreground">库存报警阈值</Label><Input type="number" value={editItem.stockAlertThreshold} onChange={(e) => setEditItem({ ...editItem, stockAlertThreshold: parseInt(e.target.value) || 0 })} /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={saveItem}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
