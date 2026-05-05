import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, Gift, ShoppingCart, ClipboardList, Settings
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/materials', icon: Package, label: '原材料管理' },
  { to: '/series', icon: Tags, label: '产品系列' },
  { to: '/products', icon: Gift, label: '产品管理' },
  { to: '/sales', icon: ShoppingCart, label: '销售记录' },
  { to: '/stock-logs', icon: ClipboardList, label: '库存日志' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-card border-r border-border flex flex-col min-h-screen">
      <div className="p-4 text-primary font-bold text-lg tracking-tight">🧶 LittleBeads</div>
      <nav className="flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-accent text-accent-foreground border-l-[3px] border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
