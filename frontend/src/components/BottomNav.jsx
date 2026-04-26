import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, MessageSquare, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const hideBottomNavRoutes = ['/login', '/register', '/admin'];
  if (hideBottomNavRoutes.includes(location.pathname) || user.is_admin) {
    return null;
  }

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={24} /> },
    { name: 'Product', path: '/', icon: <Layers size={24} /> },
    { name: 'My Order', path: '/transactions', icon: <MessageSquare size={24} /> },
    { name: 'My', path: '/dashboard', icon: <User size={24} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-[100] px-2 py-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path && (item.name !== 'Product' || location.hash === '#products');
          return (
            <Link 
              key={index} 
              to={item.path} 
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-[#0052CC]' : 'text-gray-400'
              }`}
            >
              <div className="transition-transform active:scale-90">
                {item.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
