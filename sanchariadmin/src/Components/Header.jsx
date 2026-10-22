import React, { useState, useEffect } from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

function Header({ toggleSidebar }) {
  const [adminUser, setAdminUser] = useState(() => JSON.parse(localStorage.getItem('adminUser') || '{}'));

  useEffect(() => {
    const handleUpdate = () => {
      setAdminUser(JSON.parse(localStorage.getItem('adminUser') || '{}'));
    };
    window.addEventListener('adminUserUpdated', handleUpdate);
    return () => window.removeEventListener('adminUserUpdated', handleUpdate);
  }, []);

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-transparent border-b border-white/5 backdrop-blur-xl z-40 sticky top-0">

      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2.5 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <Link
          to="/profile"
          className="flex items-center gap-4 pl-6 border-l border-white/10 hover:opacity-90 transition-all group cursor-pointer"
          title="Account Profile & Settings"
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">{adminUser?.name || 'Admin User'}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{adminUser?.role || 'Super Admin'}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl grad-sky flex items-center justify-center text-white border border-white/10 shadow-lg shadow-sky-500/20 group-hover:scale-105 group-hover:border-emerald-500/50 transition-all">
            <User size={20} strokeWidth={2.5} />
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header;
