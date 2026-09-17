import React from 'react';
import { Bell, User, Menu } from 'lucide-react';

function Header({ toggleSidebar }) {
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-transparent border-b border-white/5 backdrop-blur-xl z-40 sticky top-0">

      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2.5 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-white tracking-tight">{adminUser?.name || 'Admin User'}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{adminUser?.role || 'Super Admin'}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl grad-sky flex items-center justify-center text-white border border-white/10 shadow-lg shadow-sky-500/20">
            <User size={20} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
