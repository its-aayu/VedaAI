import { useState } from 'react';
import {
  Menu,
  Sparkles,
  LayoutGrid,
  MonitorPlay,
  FileText,
  ClipboardList,
  Library,
  Settings,
} from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore.js';

const navItems = [
  { label: 'Home', icon: LayoutGrid },
  { label: 'My Classroom', icon: MonitorPlay },
  { label: 'Assignments', icon: FileText },
  { label: 'Exams', icon: ClipboardList },
  { label: 'My Library', icon: Library },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const activeNav = useSessionStore((s) => s.activeNav);
  const setActiveNav = useSessionStore((s) => s.setActiveNav);

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white py-4 transition-[width] duration-200 ${
        collapsed ? 'w-16 px-2' : 'w-60 px-3'
      }`}
    >
      <div className={`mb-4 flex items-center px-1 ${collapsed ? 'flex-col gap-3' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
              V
            </span>
            <span className="text-base font-semibold text-ink">
              Veda<span className="text-accent">AI</span>
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          {collapsed ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
              V
            </span>
          ) : (
            <Menu size={16} />
          )}
        </button>
      </div>

      <button
        type="button"
        title="AI Teacher's Toolkit"
        className={`mb-5 flex items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-ink font-medium text-white ${
          collapsed ? 'h-9 w-9 self-center' : 'px-3 py-2 text-xs'
        }`}
      >
        <Sparkles size={13} className="shrink-0 text-accent" />
        {!collapsed && "AI Teacher's Toolkit"}
      </button>

      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ label, icon: Icon }) => {
          const active = activeNav === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveNav(label)}
              title={label}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                collapsed ? 'justify-center' : ''
              } ${active ? 'bg-gray-100 font-medium text-ink' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-gray-100 pt-3">
        <button
          type="button"
          title="Settings"
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-500 hover:bg-gray-50 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && 'Settings'}
        </button>
        <div
          className={`flex items-center gap-2.5 rounded-lg bg-gray-50 p-2.5 ${collapsed ? 'justify-center' : ''}`}
          title="Delhi Public School - Bokaro Steel City"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs">
            🏫
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink">Delhi Public School</p>
              <p className="truncate text-[11px] text-gray-400">Bokaro Steel City</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
