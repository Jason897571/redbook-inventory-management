import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MultiImageUpload from '@/components/MultiImageUpload';
import { ArrowLeft, Plus, Minus, X, GripVertical } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Draggable semi-product card in left panel ── */
function DraggableSemiProduct({ sp }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `source-${sp._id}`,
    data: { type: 'semi-product', sp },
  });
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
    >
      <div className="w-8 h-8 bg-background rounded overflow-hidden flex-shrink-0">
        {sp.image ? (
          <img src={sp.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">{sp.name}</div>
        <div className="text-xs text-muted-foreground">{sp.code} · {sp.materials?.length || 0}种原料</div>
      </div>
    </div>
  );
}

/* ── Sortable pool item in right panel ── */
function PoolItem({ entry, onQuantityChange, onRemove }) {
  const sp = entry.semiProduct;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `pool-${sp._id}`,
    data: { type: 'pool-item' },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  // Calculate this semi-product's material cost
  const spCost = (sp.materials || []).reduce((s, m) => {
    return s + m.quantity * (m.material?.unitPrice || 0);
  }, 0);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border group"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={14} />
      </button>
      <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
        {sp.image ? (
          <img src={sp.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{sp.name}</div>
        <div className="text-xs text-muted-foreground">{sp.code} · 成本 ¥{spCost.toFixed(2)}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQuantityChange(sp._id, entry.quantity - 1)}
          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          min="1"
          value={entry.quantity}
          onChange={(e) => onQuantityChange(sp._id, parseInt(e.target.value) || 1)}
          className="w-12 text-center text-sm bg-transparent border border-border rounded px-1 py-0.5"
        />
        <button
          onClick={() => onQuantityChange(sp._id, entry.quantity + 1)}
          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
      <button
        onClick={() => onRemove(sp._id)}
        className="text-muted-foreground hover:text-red-400 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ── Drop zone wrapper ── */
function DropZone({ children, id }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 rounded-lg border-2 border-dashed p-4 transition-colors min-h-[200px] ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {children}
    </div>
  );
}

/* ── Profit calculation panel ── */
function ProfitPanel({ pool, price, commissionRate }) {
  const totalCost = pool.reduce((sum, entry) => {
    const sp = entry.semiProduct;
    const spCost = (sp.materials || []).reduce((s, m) => {
      return s + m.quantity * (m.material?.unitPrice || 0);
    }, 0);
    return sum + spCost * entry.quantity;
  }, 0);
  const profit = price - totalCost;
  const commission = profit * commissionRate;
  const netProfit = profit * (1 - commissionRate);
  const profitMargin = price > 0 ? (netProfit / price * 100) : 0;

  return (
    <div className="bg-card rounded-lg border border-border p-4 mt-4">
      <h3 className="font-semibold text-sm text-foreground mb-3">利润计算</h3>
      <div className="space-y-2 text-sm">
        {pool.map((entry) => {
          const sp = entry.semiProduct;
          const spCost = (sp.materials || []).reduce((s, m) => s + m.quantity * (m.material?.unitPrice || 0), 0);
          return (
            <div key={sp._id} className="flex justify-between text-muted-foreground">
              <span>{sp.name} ×{entry.quantity}</span>
              <span>¥{(spCost * entry.quantity).toFixed(2)}</span>
            </div>
          );
        })}
        {pool.length > 0 && (
          <>
            <div className="flex justify-between font-medium border-t border-border pt-2">
              <span className="text-foreground">总成本</span>
              <span className="text-red-400">-¥{totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">定价</span>
              <span>¥{price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">毛利润</span>
              <span>¥{profit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">佣金 ({(commissionRate * 100).toFixed(1)}%)</span>
              <span className="text-red-400">-¥{commission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span className="text-foreground">净利润</span>
              <span className={netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>¥{netProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">利润率</span>
              <span className={profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}>{profitMargin.toFixed(1)}%</span>
            </div>
          </>
        )}
        {pool.length === 0 && (
          <p className="text-muted-foreground text-xs text-center py-2">添加半成品后自动计算</p>
        )}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState({
    code: '', name: '', styles: [], price: 0, commissionRate: 0.057,
    stock: 0, stockAlertThreshold: 5, images: [],
  });
  const [pool, setPool] = useState([]); // [{ semiProduct: {...}, quantity }]
  const [allSemiProducts, setAllSemiProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState('');
  const [customStyle, setCustomStyle] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    Promise.all([api.getSemiProducts(), api.getSettings()]).then(([sps, sets]) => {
      setAllSemiProducts(sps);
      setSettings(sets);
      if (isNew && sets?.defaultCommissionRate) {
        setForm((prev) => ({ ...prev, commissionRate: sets.defaultCommissionRate }));
      }
    });
    if (!isNew) {
      api.getProduct(id).then((p) => {
        setForm({
          code: p.code, name: p.name, styles: p.styles || [],
          price: p.price, commissionRate: p.commissionRate,
          stock: p.stock, stockAlertThreshold: p.stockAlertThreshold,
          images: p.images || (p.image ? [p.image] : []),
        });
        setPool(
          (p.semiProducts || [])
            .filter((e) => e.semiProduct)
            .map((e) => ({ semiProduct: e.semiProduct, quantity: e.quantity }))
        );
      });
    }
  }, [id, isNew]);

  const filteredSemiProducts = allSemiProducts.filter((sp) =>
    sp.name.toLowerCase().includes(search.toLowerCase()) ||
    sp.code.toLowerCase().includes(search.toLowerCase())
  );

  const productStyles = settings?.productStyles || [];

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const toggleStyle = (style) => {
    const styles = form.styles.includes(style)
      ? form.styles.filter((s) => s !== style)
      : [...form.styles, style];
    updateForm('styles', styles);
  };

  const addCustomStyle = () => {
    const s = customStyle.trim();
    if (!s || form.styles.includes(s)) return;
    updateForm('styles', [...form.styles, s]);
    setCustomStyle('');
  };

  const removeStyle = (style) => {
    updateForm('styles', form.styles.filter((s) => s !== style));
  };

  const addToPool = (sp) => {
    setPool((prev) => {
      const existing = prev.find((e) => e.semiProduct._id === sp._id);
      if (existing) {
        return prev.map((e) =>
          e.semiProduct._id === sp._id ? { ...e, quantity: e.quantity + 1 } : e
        );
      }
      return [...prev, { semiProduct: sp, quantity: 1 }];
    });
    setDirty(true);
  };

  const changeQuantity = (spId, newQty) => {
    if (newQty < 1) { removeFromPool(spId); return; }
    setPool((prev) =>
      prev.map((e) => (e.semiProduct._id === spId ? { ...e, quantity: newQty } : e))
    );
    setDirty(true);
  };

  const removeFromPool = (spId) => {
    setPool((prev) => prev.filter((e) => e.semiProduct._id !== spId));
    setDirty(true);
  };

  const handleDragStart = ({ active }) => { setActiveDragId(active.id); };

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('source-') && (overId === 'pool-drop-zone' || overId.startsWith('pool-'))) {
      const spId = activeId.replace('source-', '');
      const sp = allSemiProducts.find((s) => s._id === spId);
      if (sp) addToPool(sp);
      return;
    }

    if (activeId.startsWith('pool-') && overId.startsWith('pool-')) {
      const oldIdx = pool.findIndex((e) => `pool-${e.semiProduct._id}` === activeId);
      const newIdx = pool.findIndex((e) => `pool-${e.semiProduct._id}` === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setPool((prev) => arrayMove(prev, oldIdx, newIdx));
        setDirty(true);
      }
    }
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      semiProducts: pool.map((e) => ({ semiProduct: e.semiProduct._id, quantity: e.quantity })),
    };
    try {
      if (isNew) {
        await api.createProduct(payload);
      } else {
        await api.updateProduct(id, payload);
      }
      navigate('/products');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty && !confirm('有未保存的更改，确定离开？')) return;
    navigate('/products');
  };

  const activeSp = activeDragId?.startsWith('source-')
    ? allSemiProducts.find((s) => s._id === activeDragId.replace('source-', ''))
    : null;

  const activePoolEntry = activeDragId?.startsWith('pool-')
    ? pool.find((e) => `pool-${e.semiProduct._id}` === activeDragId)
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{isNew ? '添加产品' : '编辑产品'}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving || !form.code.trim() || !form.name.trim()}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* Basic info */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6 space-y-4">
        <MultiImageUpload value={form.images} onChange={(imgs) => updateForm('images', imgs)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">产品编号</Label>
            <Input value={form.code} onChange={(e) => updateForm('code', e.target.value)} placeholder="如 P-001" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">产品名称</Label>
            <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="产品名称" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">款式</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {productStyles.map((s) => (
              <button
                key={s}
                onClick={() => toggleStyle(s)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  form.styles.includes(s)
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {s}
              </button>
            ))}
            {form.styles.filter((s) => !productStyles.includes(s)).map((s) => (
              <span key={s} className="px-3 py-1 rounded-full text-xs border bg-primary border-primary text-primary-foreground inline-flex items-center gap-1">
                {s}
                <button onClick={() => removeStyle(s)} className="hover:text-red-200"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomStyle()}
              placeholder="自定义款式，回车添加"
              className="w-48 text-xs"
            />
            <Button size="sm" variant="outline" onClick={addCustomStyle} className="text-xs h-8">添加</Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">定价 (¥)</Label>
            <Input type="number" step="0.1" value={form.price} onChange={(e) => updateForm('price', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">佣金率 (%)</Label>
            <Input type="number" step="0.1" value={(form.commissionRate * 100).toFixed(1)} onChange={(e) => updateForm('commissionRate', parseFloat(e.target.value) / 100)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">库存</Label>
            <Input type="number" value={form.stock} onChange={(e) => updateForm('stock', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">报警阈值</Label>
            <Input type="number" value={form.stockAlertThreshold} onChange={(e) => updateForm('stockAlertThreshold', parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      {/* Drag and drop area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-[1fr_1fr] gap-4" style={{ minHeight: '400px' }}>
          {/* Left: Semi-product library */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">半成品库</h2>
            <Input
              placeholder="搜索半成品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredSemiProducts.map((sp) => (
                <DraggableSemiProduct key={sp._id} sp={sp} />
              ))}
              {filteredSemiProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">无匹配半成品</p>
              )}
            </div>
          </div>

          {/* Right: Composition pool + profit */}
          <div className="flex flex-col">
            <div className="bg-card rounded-lg border border-border p-4 flex flex-col flex-1">
              <h2 className="text-sm font-semibold text-foreground mb-3">
                组合池
                {pool.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-2">({pool.length}种半成品)</span>
                )}
              </h2>
              <DropZone id="pool-drop-zone">
                {pool.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    从左侧拖入半成品
                  </div>
                ) : (
                  <SortableContext
                    items={pool.map((e) => `pool-${e.semiProduct._id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {pool.map((entry) => (
                        <PoolItem
                          key={entry.semiProduct._id}
                          entry={entry}
                          onQuantityChange={changeQuantity}
                          onRemove={removeFromPool}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </DropZone>
            </div>
            <ProfitPanel pool={pool} price={form.price} commissionRate={form.commissionRate} />
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeSp && (
            <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-8 h-8 bg-muted rounded overflow-hidden flex-shrink-0">
                {activeSp.image ? (
                  <img src={activeSp.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activeSp.name}</span>
            </div>
          )}
          {activePoolEntry && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                {activePoolEntry.semiProduct.image ? (
                  <img src={activePoolEntry.semiProduct.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activePoolEntry.semiProduct.name}</span>
              <span className="text-xs text-muted-foreground">x{activePoolEntry.quantity}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
