import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { ArrowLeft, X, GripVertical } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Draggable product card in left panel ── */
function DraggableProduct({ product }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `source-${product._id}`,
    data: { type: 'product', product },
  });
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };
  const cover = product.images?.[0];
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
    >
      <div className="w-8 h-8 bg-background rounded overflow-hidden flex-shrink-0">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
        <div className="text-xs text-muted-foreground">{product.code}</div>
      </div>
    </div>
  );
}

/* ── Sortable pool item in right panel ── */
function PoolItem({ product, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `pool-${product._id}`,
    data: { type: 'pool-item' },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const cover = product.images?.[0];
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
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
        <div className="text-xs text-muted-foreground">{product.code}</div>
      </div>
      <button
        onClick={() => onRemove(product._id)}
        className="text-muted-foreground hover:text-destructive transition-colors"
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
      className={`flex-1 rounded-lg border-2 border-dashed p-4 transition-colors min-h-[300px] ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {children}
    </div>
  );
}

/* ── Main page ── */
export default function SeriesEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState({ name: '', description: '', image: '' });
  const [pool, setPool] = useState([]); // [product, product, ...]
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    api.getProducts().then(setAllProducts);
    if (!isNew) {
      api.getSeries().then((list) => {
        const s = list.find((x) => x._id === id);
        if (s) {
          setForm({ name: s.name, description: s.description || '', image: s.image || '' });
          setPool((s.products || []).filter(Boolean));
        }
      });
    }
  }, [id, isNew]);

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const addToPool = (product) => {
    setPool((prev) => {
      if (prev.find((p) => p._id === product._id)) return prev; // dedupe
      return [...prev, product];
    });
    setDirty(true);
  };

  const removeFromPool = (productId) => {
    setPool((prev) => prev.filter((p) => p._id !== productId));
    setDirty(true);
  };

  const handleDragStart = ({ active }) => { setActiveDragId(active.id); };

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('source-') && (overId === 'pool-drop-zone' || overId.startsWith('pool-'))) {
      const productId = activeId.replace('source-', '');
      const product = allProducts.find((p) => p._id === productId);
      if (product) addToPool(product);
      return;
    }

    if (activeId.startsWith('pool-') && overId.startsWith('pool-')) {
      const oldIdx = pool.findIndex((p) => `pool-${p._id}` === activeId);
      const newIdx = pool.findIndex((p) => `pool-${p._id}` === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setPool((prev) => arrayMove(prev, oldIdx, newIdx));
        setDirty(true);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      products: pool.map((p) => p._id),
    };
    try {
      if (isNew) {
        await api.createSeries(payload);
      } else {
        await api.updateSeries(id, payload);
      }
      navigate('/series');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty && !confirm('有未保存的更改，确定离开？')) return;
    navigate('/series');
  };

  const activeProduct = activeDragId?.startsWith('source-')
    ? allProducts.find((p) => p._id === activeDragId.replace('source-', ''))
    : null;

  const activePoolProduct = activeDragId?.startsWith('pool-')
    ? pool.find((p) => `pool-${p._id}` === activeDragId)
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{isNew ? '添加系列' : '编辑系列'}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* Basic info */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="grid grid-cols-[200px_1fr] gap-4">
          <ImageUpload value={form.image} onChange={(url) => updateForm('image', url)} />
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">系列名称</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="如 春日花朵"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">描述</Label>
              <Input
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="简单描述"
              />
            </div>
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
          {/* Left: Product library */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">产品库</h2>
            <Input
              placeholder="搜索产品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredProducts.map((p) => (
                <DraggableProduct key={p._id} product={p} />
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">无匹配产品</p>
              )}
            </div>
          </div>

          {/* Right: Series product pool */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              系列产品池
              {pool.length > 0 && (
                <span className="text-muted-foreground font-normal ml-2">({pool.length}个产品)</span>
              )}
            </h2>
            <DropZone id="pool-drop-zone">
              {pool.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  从左侧拖入产品
                </div>
              ) : (
                <SortableContext
                  items={pool.map((p) => `pool-${p._id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {pool.map((product) => (
                      <PoolItem
                        key={product._id}
                        product={product}
                        onRemove={removeFromPool}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </DropZone>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeProduct && (
            <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-8 h-8 bg-muted rounded overflow-hidden flex-shrink-0">
                {activeProduct.images?.[0] ? (
                  <img src={activeProduct.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activeProduct.name}</span>
            </div>
          )}
          {activePoolProduct && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                {activePoolProduct.images?.[0] ? (
                  <img src={activePoolProduct.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activePoolProduct.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
