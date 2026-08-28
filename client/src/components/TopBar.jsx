import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  CircleHelp,
  Bell,
  Sparkles,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <ArrowLeft size={16} />
        <ClipboardList size={14} />
        <span>Exams</span>
      </div>

      <div className="flex items-center gap-4 text-gray-400">
        <CircleHelp size={17} />
        <div className="relative">
          <Bell size={17} />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </div>
        <Sparkles size={17} className="text-accent" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full text-sm text-ink hover:bg-gray-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs">🧑‍🏫</span>
            <span className="font-medium">Madhur Rastogi</span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-1.5 text-sm shadow-lg">
              <div className="flex items-center gap-2.5 px-2.5 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-base">
                  🧑‍🏫
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">Madhur Rastogi</p>
                  <p className="truncate text-xs text-gray-400">madhur.rastogi@dpsbokaro.edu</p>
                </div>
              </div>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-gray-600 hover:bg-gray-50"
              >
                <User size={15} /> My Profile
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-gray-600 hover:bg-gray-50"
              >
                <Settings size={15} /> Account Settings
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-red-500 hover:bg-red-50"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
