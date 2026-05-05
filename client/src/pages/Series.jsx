import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Series() {
  const [seriesList, setSeriesList] = useState([]);
  const [settings, setSettings] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const [series, sets] = await Promise.all([api.getSeries(), api.getSettings()]);
    setSeriesList(series);
    setSettings(sets);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditItem({ name: '', description: '', beadCategory: '', image: '' });
    setShowForm(true);
  };

  const openEdit = (s) => { setEditItem({ ...s }); setShowForm(true); };

  const saveItem = async () => {
    if (editItem._id) {
      await api.updateSeries(editItem._id, editItem);
    } else {
      await api.createSeries(editItem);
    }
    setShowForm(false);
    setEditItem(null);
    load();
  };

  const deleteItem = async (id) => {
    if (!confirm('确定删除此系列？')) return;
    await api.deleteSeries(id);
    load();
  };

  const beadCategories = settings?.beadCategories || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">产品系列</h1>
        <Button onClick={openNew}><Plus size={16} className="mr-1" />添加系列</Button>
      </div>

      {seriesList.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">暂无系列，创建第一个产品系列</p>
          <Button onClick={openNew} variant="outline">添加系列</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((s) => (
            <div key={s._id} className="bg-card rounded-lg border border-border overflow-hidden group hover:border-primary/40 transition-colors">
              <div className="h-36 bg-muted">
                {s.image ? <img src={s.image} alt={s.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">📦</div>}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{s.name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(s)} className="p-1 text-muted-foreground hover:text-primary"><Pencil size={14} /></button>
                    <button onClick={() => deleteItem(s._id)} className="p-1 text-muted-foreground hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                {s.beadCategory && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-2 inline-block">{s.beadCategory}</span>}
                {s.description && <p className="text-xs text-muted-foreground mt-2">{s.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem?._id ? '编辑系列' : '添加系列'}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <ImageUpload value={editItem.image} onChange={(url) => setEditItem({ ...editItem, image: url })} />
              <div><Label className="text-xs text-muted-foreground">系列名称</Label><Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} /></div>
              <div>
                <Label className="text-xs text-muted-foreground">珠子材质</Label>
                <Select value={editItem.beadCategory} onValueChange={(v) => setEditItem({ ...editItem, beadCategory: v })}>
                  <SelectTrigger><SelectValue placeholder="选择材质" /></SelectTrigger>
                  <SelectContent>{beadCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-muted-foreground">描述</Label><Input value={editItem.description} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveItem}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
