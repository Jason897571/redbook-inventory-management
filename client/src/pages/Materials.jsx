import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ImageUpload from '@/components/ImageUpload';
import { Plus, ExternalLink } from 'lucide-react';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [settings, setSettings] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [stockInItem, setStockInItem] = useState(null);
  const [stockQty, setStockQty] = useState('');
  const [stockNote, setStockNote] = useState('');

  const load = async () => {
    const params = {};
    if (filter) params.category = filter;
    if (search) params.search = search;
    const [mats, sets] = await Promise.all([api.getMaterials(params), api.getSettings()]);
    setMaterials(mats);
    setSettings(sets);
  };

  useEffect(() => { load(); }, [filter, search]);

  const openNew = () => {
    setEditItem({
      name: '', category: '', unitPrice: '', unit: '个',
      stock: '', stockAlertThreshold: '', purchaseLink: '', image: '', notes: '',
    });
    setShowForm(true);
  };

  const openEdit = (m) => { setEditItem({ ...m }); setShowForm(true); };

  const saveItem = async () => {
    const payload = {
      ...editItem,
      unitPrice: parseFloat(editItem.unitPrice) || 0,
      stock: parseInt(editItem.stock) || 0,
      stockAlertThreshold: parseInt(editItem.stockAlertThreshold) || 0,
    };
    if (editItem._id) {
      await api.updateMaterial(editItem._id, payload);
    } else {
      await api.createMaterial(payload);
    }
    setShowForm(false);
    setEditItem(null);
    load();
  };

  const deleteItem = async (id) => {
    if (!confirm('确定删除？')) return;
    await api.deleteMaterial(id);
    load();
  };

  const doStockIn = async () => {
    await api.stockInMaterial(stockInItem._id, { quantity: Number(stockQty), note: stockNote });
    setStockInItem(null);
    setStockQty('');
    setStockNote('');
    load();
  };

  const categories = settings?.materialCategories || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">原材料管理</h1>
        <Button onClick={openNew}><Plus size={16} className="mr-1" />添加材料</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('')}>全部</Button>
        {categories.map((c) => (
          <Button key={c} variant={filter === c ? 'default' : 'outline'} size="sm" onClick={() => setFilter(c)}>{c}</Button>
        ))}
        <Input placeholder="搜索材料名称..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 text-sm ml-auto" />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs">
              <th className="p-3 text-left">图片</th>
              <th className="p-3 text-left">名称</th>
              <th className="p-3 text-left">分类</th>
              <th className="p-3 text-right">单价</th>
              <th className="p-3 text-right">库存</th>
              <th className="p-3 text-center">状态</th>
              <th className="p-3 text-left">购买链接</th>
              <th className="p-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const isLow = m.stock <= m.stockAlertThreshold;
              return (
                <tr key={m._id} className={`border-t border-border transition-colors hover:bg-muted/30 ${isLow ? 'bg-[var(--color-warning-bg)]' : ''}`}>
                  <td className="p-3">
                    <div className="w-9 h-9 bg-muted rounded overflow-hidden">
                      {m.image ? <img src={m.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>}
                    </div>
                  </td>
                  <td className="p-3 text-foreground">{m.name}</td>
                  <td className="p-3"><Badge variant="secondary">{m.category}</Badge></td>
                  <td className="p-3 text-right">¥{m.unitPrice.toFixed(4)}</td>
                  <td className={`p-3 text-right font-medium ${isLow ? 'text-[var(--color-loss)]' : ''}`}>{m.stock}</td>
                  <td className="p-3 text-center">
                    {isLow ? <span className="text-[var(--color-loss)] text-xs">⚠ 进货！</span> : <span className="text-[var(--color-profit)] text-xs">✓ 充足</span>}
                  </td>
                  <td className="p-3">
                    {m.purchaseLink && (
                      <a href={m.purchaseLink} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                        链接 <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                  <td className="p-3 text-center space-x-2 text-xs">
                    <button onClick={() => openEdit(m)} className="text-primary hover:underline">编辑</button>
                    <button onClick={() => setStockInItem(m)} className={isLow ? 'text-[var(--color-warning)] hover:underline' : 'text-muted-foreground hover:underline'}>进货</button>
                    <button onClick={() => deleteItem(m._id)} className="text-destructive hover:underline">删除</button>
                  </td>
                </tr>
              );
            })}
            {materials.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">暂无材料，点击「添加材料」开始</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem?._id ? '编辑材料' : '添加材料'}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <ImageUpload value={editItem.image} onChange={(url) => setEditItem({ ...editItem, image: url })} />
              <div><Label className="text-xs text-muted-foreground">名称</Label><Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">分类</Label>
                  <Select value={editItem.category} onValueChange={(v) => setEditItem({ ...editItem, category: v })}>
                    <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">单位</Label>
                  <Select value={editItem.unit} onValueChange={(v) => setEditItem({ ...editItem, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(settings?.materialUnits || []).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">单价</Label><Input type="number" step="0.0001" value={editItem.unitPrice ?? ''} onChange={(e) => setEditItem({ ...editItem, unitPrice: e.target.value })} /></div>
                <div><Label className="text-xs text-muted-foreground">购买链接</Label><Input value={editItem.purchaseLink} onChange={(e) => setEditItem({ ...editItem, purchaseLink: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">库存</Label><Input type="number" value={editItem.stock ?? ''} onChange={(e) => setEditItem({ ...editItem, stock: e.target.value })} /></div>
                <div><Label className="text-xs text-muted-foreground">报警阈值</Label><Input type="number" value={editItem.stockAlertThreshold ?? ''} onChange={(e) => setEditItem({ ...editItem, stockAlertThreshold: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">备注</Label><Input value={editItem.notes} onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveItem}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock In Dialog */}
      <Dialog open={!!stockInItem} onOpenChange={() => setStockInItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>进货 — {stockInItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">进货数量</Label><Input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground">备注</Label><Input value={stockNote} onChange={(e) => setStockNote(e.target.value)} placeholder="如 1688进货" /></div>
          </div>
          <DialogFooter><Button onClick={doStockIn} disabled={!stockQty}>确认进货</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
