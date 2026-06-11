import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, Users, FlaskConical, History } from 'lucide-react';

const navItems = [
  { to: '/', label: '报修登记', icon: ClipboardList },
  { to: '/queue', label: '当日队列', icon: Users },
  { to: '/compatibility', label: '配伍查询', icon: FlaskConical },
  { to: '/trace', label: '追溯时间线', icon: History },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-paper-100 border-r border-paper-300 flex flex-col shadow-lg">
        <div className="p-6 border-b border-paper-300">
          <h1 className="font-display text-2xl text-cinnabar-700 font-bold flex items-center gap-2">
            <span className="text-3xl">偶</span>
            <div>
              <div>开脸修复</div>
              <div className="text-xs text-ink-500 font-normal">龟裂报修系统</div>
            </div>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-paper-300">
          <div className="text-xs text-ink-500 text-center">
            <div>布袋戏偶头修复社</div>
            <div className="mt-1">传承匠心 · 修复经典</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
