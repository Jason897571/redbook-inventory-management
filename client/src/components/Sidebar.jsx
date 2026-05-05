import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, Gift, ShoppingCart, ClipboardList, Settings, ChevronDown, Layers, GripVertical
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const defaultProductSubItems = [
  { to: '/materials', icon: Package, label: '原材料管理' },
  { to: '/semi-products', icon: Layers, label: '半成品管理' },
  { to: '/products', icon: Gift, label: '成品管理' },
  { to: '/series', icon: Tags, label: '产品系列' },
];

const productPaths = defaultProductSubItems.map((i) => i.to);
const STORAGE_KEY = 'sidebar-product-order';

const topItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
];

const bottomItems = [
  { to: '/sales', icon: ShoppingCart, label: '销售记录' },
  { to: '/stock-logs', icon: ClipboardList, label: '库存日志' },
  { to: '/settings', icon: Settings, label: '设置' },
];

function loadOrderedItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(stored)) return defaultProductSubItems;
    const byPath = Object.fromEntries(defaultProductSubItems.map((i) => [i.to, i]));
    const ordered = stored.map((p) => byPath[p]).filter(Boolean);
    const missing = defaultProductSubItems.filter((i) => !stored.includes(i.to));
    return [...ordered, ...missing];
  } catch {
    return defaultProductSubItems;
  }
}

function NavItem({ to, icon: Icon, label, nested }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 ${nested ? 'pl-10 pr-5' : 'px-5'} py-3 text-sm transition-colors duration-150 ${
          isActive
            ? 'bg-accent text-accent-foreground border-l-[3px] border-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`
      }
    >
      <Icon size={nested ? 16 : 18} />
      {label}
    </NavLink>
  );
}

function SortableNavItem({ item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.to });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        aria-label="拖拽排序"
      >
        <GripVertical size={14} />
      </button>
      <NavItem {...item} nested />
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const isProductSection = productPaths.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );
  const [productOpen, setProductOpen] = useState(isProductSection);
  const [items, setItems] = useState(loadOrderedItems);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map((i) => i.to)));
  }, [items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.to === active.id);
      const newIndex = prev.findIndex((i) => i.to === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  return (
    <aside className="w-56 bg-card border-r border-border flex flex-col min-h-screen">
      <div className="p-4 text-primary font-bold text-lg tracking-tight">🧶 LittleBeads</div>
      <nav className="flex-1">
        {topItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Product management group */}
        <button
          onClick={() => setProductOpen(!productOpen)}
          className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors duration-150 ${
            isProductSection
              ? 'text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Gift size={18} />
          <span className="flex-1 text-left">产品管理</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${productOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {productOpen && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.to)} strategy={verticalListSortingStrategy}>
              <div>
                {items.map((item) => (
                  <SortableNavItem key={item.to} item={item} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {bottomItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
}
