import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';
import { Plus } from 'lucide-react';

export default function SemiProducts() {
  const [products, setProducts] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    const [prods, series, sets] = await Promise.all([
      api.getSemiProducts(),
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
      code: '', name: '', series: '',
      price: 0, stock: 0, stockAlertThreshold: 5, image: '',
      components: [], sharedMaterials: [],
    });
    setShowForm(true);
  };

  const saveItem = async () => {
    if (editItem._id) {
      await api.updateSemiProduct(editItem._id, editItem);
    } else {
      await api.createSemiProduct(editItem);
    }
    setShowForm(false);
    setEditItem(null);
    load();
  };

  // Group by series
  const grouped = {};
  products.forEach((p) => {
    const key = p.series?._id || 'uncategorized';
    if (!grouped[key]) grouped[key] = { series: p.series, products: [] };
    grouped[key].products.push(p);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">半成品管理</h1>
        <Button onClick={openNew}><Plus size={16} className="mr-1" />添加半成品</Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">暂无半成品</p>
          <Button onClick={openNew} variant="outline">添加半成品</Button>
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
                    className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all group"
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
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                        <span className="text-muted-foreground">¥{p.price}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem?._id ? '编辑半成品' : '添加半成品'}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <ImageUpload value={editItem.image} onChange={(url) => setEditItem({ ...editItem, image: url })} />
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">编号</Label><Input value={editItem.code} onChange={(e) => setEditItem({ ...editItem, code: e.target.value })} placeholder="如 S1, SP1" /></div>
                <div><Label className="text-xs text-muted-foreground">名称</Label><Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} /></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">所属系列</Label>
                <Select value={editItem.series} onValueChange={(v) => setEditItem({ ...editItem, series: v })}>
                  <SelectTrigger><SelectValue placeholder="选择系列" /></SelectTrigger>
                  <SelectContent>{seriesList.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs text-muted-foreground">定价 (¥)</Label><Input type="number" step="0.1" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: parseFloat(e.target.value) || 0 })} /></div>
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
