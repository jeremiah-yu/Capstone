import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Bell, GraduationCap, Shield, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface LayoutProps {
  user: any;
  onLogout: () => void;
}

export function Layout({ user, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  const getNavItems = () => {
    const baseItems = [{ path: '/', icon: LayoutDashboard, label: 'Dashboard' }];
    
    switch (user.role) {
      case 'super_admin':
        return [
          ...baseItems,
          { path: '/students', icon: Users, label: 'All Students' },
          { path: '/staff', icon: Shield, label: 'Staff Management' },
          { path: '/curriculum', icon: BookOpen, label: 'Global Curriculum' },
        ];
      case 'dept_head':
        return [
          ...baseItems,
          { path: '/students', icon: Users, label: 'Dept Students' },
          { path: '/curriculum', icon: BookOpen, label: 'Dept Programs' },
        ];
      case 'instructor':
        return [
          ...baseItems,
          { path: '/students', icon: Users, label: 'My Students' },
        ];
      case 'student':
        return [
          ...baseItems,
          { path: '/curriculum', icon: BookOpen, label: 'My Curriculum' },
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-grass-green rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-800">AcademiaAI</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                location.pathname === item.path
                  ? 'bg-grass-green/10 text-grass-green font-semibold'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-gray-800">
            {navItems.find(i => i.path === location.pathname)?.label || 'Student Details'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-soft-yellow rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
