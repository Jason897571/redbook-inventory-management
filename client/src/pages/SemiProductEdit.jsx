import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { ArrowLeft, Plus, Minus, X, GripVertical } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Draggable material card in left panel ── */
function DraggableMaterial({ material }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `source-${material._id}`,
    data: { type: 'material', material },
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
        {material.image ? (
          <img src={material.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">{material.name}</div>
        <div className="text-xs text-muted-foreground">{material.unit || '个'}</div>
      </div>
    </div>
  );
}

/* ── Sortable pool item in right panel ── */
function PoolItem({ entry, onQuantityChange, onRemove }) {
  const mat = entry.material;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `pool-${mat._id}`,
    data: { type: 'pool-item' },
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
        {mat.image ? (
          <img src={mat.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{mat.name}</div>
        <div className="text-xs text-muted-foreground">{mat.category} · {mat.unit || '个'}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQuantityChange(mat._id, entry.quantity - 1)}
          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          min="1"
          value={entry.quantity}
          onChange={(e) => onQuantityChange(mat._id, parseInt(e.target.value) || 1)}
          className="w-12 text-center text-sm bg-transparent border border-border rounded px-1 py-0.5"
        />
        <button
          onClick={() => onQuantityChange(mat._id, entry.quantity + 1)}
          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
      <button
        onClick={() => onRemove(mat._id)}
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
      className={`flex-1 rounded-lg border-2 border-dashed p-4 transition-colors min-h-[200px] ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {children}
    </div>
  );
}

/* ── Main page ── */
export default function SemiProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState({ name: '', image: '' });
  const [pool, setPool] = useState([]); // [{ material: {...}, quantity: number }]
  const [allMaterials, setAllMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    api.getMaterials().then(setAllMaterials);
    if (!isNew) {
      api.getSemiProduct(id).then((sp) => {
        setForm({ name: sp.name, image: sp.image || '' });
        setPool(
          (sp.materials || [])
            .filter((m) => m.material)
            .map((m) => ({ material: m.material, quantity: m.quantity }))
        );
      });
    }
  }, [id, isNew]);

  const filteredMaterials = allMaterials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const addToPool = (material) => {
    setPool((prev) => {
      const existing = prev.find((e) => e.material._id === material._id);
      if (existing) {
        return prev.map((e) =>
          e.material._id === material._id ? { ...e, quantity: e.quantity + 1 } : e
        );
      }
      return [...prev, { material, quantity: 1 }];
    });
    setDirty(true);
  };

  const changeQuantity = (materialId, newQty) => {
    if (newQty < 1) {
      removeFromPool(materialId);
      return;
    }
    setPool((prev) =>
      prev.map((e) => (e.material._id === materialId ? { ...e, quantity: newQty } : e))
    );
    setDirty(true);
  };

  const removeFromPool = (materialId) => {
    setPool((prev) => prev.filter((e) => e.material._id !== materialId));
    setDirty(true);
  };

  const handleDragStart = ({ active }) => {
    setActiveDragId(active.id);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Drag from source to pool drop zone
    if (activeId.startsWith('source-') && (overId === 'pool-drop-zone' || overId.startsWith('pool-'))) {
      const materialId = activeId.replace('source-', '');
      const material = allMaterials.find((m) => m._id === materialId);
      if (material) addToPool(material);
      return;
    }

    // Reorder within pool
    if (activeId.startsWith('pool-') && overId.startsWith('pool-')) {
      const oldIdx = pool.findIndex((e) => `pool-${e.material._id}` === activeId);
      const newIdx = pool.findIndex((e) => `pool-${e.material._id}` === overId);
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
      materials: pool.map((e) => ({ material: e.material._id, quantity: e.quantity })),
    };
    try {
      if (isNew) {
        await api.createSemiProduct(payload);
      } else {
        await api.updateSemiProduct(id, payload);
      }
      navigate('/semi-products');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty && !confirm('有未保存的更改，确定离开？')) return;
    navigate('/semi-products');
  };

  const activeMaterial = activeDragId?.startsWith('source-')
    ? allMaterials.find((m) => m._id === activeDragId.replace('source-', ''))
    : null;

  const activePoolEntry = activeDragId?.startsWith('pool-')
    ? pool.find((e) => `pool-${e.material._id}` === activeDragId)
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{isNew ? '添加半成品' : '编辑半成品'}</h1>
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
              <Label className="text-xs text-muted-foreground">名称</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="半成品名称"
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
          {/* Left: Material library */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">原料库</h2>
            <Input
              placeholder="搜索原料..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="flex-1 overflow-y-auto space-y-2">
                {filteredMaterials.map((m) => (
                  <DraggableMaterial key={m._id} material={m} />
                ))}
              {filteredMaterials.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">无匹配原料</p>
              )}
            </div>
          </div>

          {/* Right: Composition pool */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              组合池
              {pool.length > 0 && (
                <span className="text-muted-foreground font-normal ml-2">({pool.length}种原料)</span>
              )}
            </h2>
            <DropZone id="pool-drop-zone">
              {pool.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  从左侧拖入原料
                </div>
              ) : (
                <SortableContext
                  items={pool.map((e) => `pool-${e.material._id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {pool.map((entry) => (
                      <PoolItem
                        key={entry.material._id}
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
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeMaterial && (
            <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-8 h-8 bg-muted rounded overflow-hidden flex-shrink-0">
                {activeMaterial.image ? (
                  <img src={activeMaterial.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activeMaterial.name}</span>
            </div>
          )}
          {activePoolEntry && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                {activePoolEntry.material.image ? (
                  <img src={activePoolEntry.material.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activePoolEntry.material.name}</span>
              <span className="text-xs text-muted-foreground">x{activePoolEntry.quantity}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
