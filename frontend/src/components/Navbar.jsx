import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wallet, LogOut, Menu, X, Home, PieChart, Repeat, Users, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setIsOpen(false), [location]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navLinks = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: <PieChart size={18} /> },
    { name: 'Recharge', path: '/recharge', icon: <Repeat size={18} /> },
    { name: 'Plans', path: '/', icon: <Home size={18} /> },
  ] : [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
  ];

  const hideNavbarRoutes = ['/dashboard', '/login', '/register', '/admin'];
  if (hideNavbarRoutes.includes(location.pathname) || (user && user.is_admin)) {
    return null; // Hide navbar on dashboard, auth, and admin pages
  }

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
      scrolled ? 'bg-secondary/90 backdrop-blur-lg border-b border-white/10 shadow-xl' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size="sm" />
            <span className="text-2xl font-black gold-text uppercase tracking-tighter">SYC Capital</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-sm font-bold tracking-widest uppercase hover:text-primary transition-all relative group ${
                  location.pathname === link.path ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                  location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center gap-6 pl-6 border-l border-white/10">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Balance</span>
                  <span className="text-primary font-black">{user.wallet_balance || 0} ETB</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-white/5 hover:border-red-500/30"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" className="text-sm font-bold uppercase py-3 px-6 text-gray-400 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-primary" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-secondary-dark z-[101] flex flex-col p-8 md:hidden"
          >
            <div className="flex justify-between items-center mb-16">
              <span className="text-2xl font-black gold-text">MENU</span>
              <button onClick={() => setIsOpen(false)} className="p-2 text-primary">
                <X size={32} />
              </button>
            </div>

            <div className="flex flex-col gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className="flex items-center gap-4 text-3xl font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-tighter"
                >
                  <span className="text-primary opacity-50">{link.icon}</span>
                  {link.name}
                </Link>
              ))}
              
              {user ? (
                <div className="mt-12 pt-12 border-t border-white/10 flex flex-col gap-6">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <span className="text-sm text-gray-500 block mb-1">Available Balance</span>
                    <span className="text-3xl font-black text-primary">{user.wallet_balance || 0} ETB</span>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-4 text-2xl font-black text-red-500/70 hover:text-red-500 uppercase">
                    <LogOut size={24} /> Logout
                  </button>
                </div>
              ) : (
                <div className="mt-12 flex flex-col gap-4">
                  <Link to="/login" className="text-2xl font-black text-gray-400 uppercase">Login</Link>
                  <Link to="/register" className="btn-primary text-center text-xl py-4">Create Account</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
