import React, { useEffect, useState } from 'react';
import { 
  Wallet, TrendingUp, Users, Clock, ArrowUpRight, 
  ChevronRight, Activity, Calendar, CreditCard, 
  ShoppingBag, History, Settings, LogOut, ArrowRight,
  Gift, Send, Lock, LayoutGrid, UserCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Logo from '../components/Logo';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [stats, setStats] = useState({
    totalRecharge: 0,
    totalWithdraw: 0,
    teamIncome: 0,
    teamSize: 0,
    walletBalance: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch profile
        try {
          const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(profileRes.data);
          localStorage.setItem('user', JSON.stringify(profileRes.data));
        } catch (err) {
          console.error('Error fetching profile:', err);
        }

        // Fetch Stats
        try {
          const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/investments/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStats(statsRes.data);
        } catch (err) {
          console.error('Error fetching stats:', err);
        }
        
      } catch (error) {
        console.error('General Dashboard Error:', error);
      }
    };
    fetchDashboardData();
  }, []);

  const topStats = [
    { label: 'Recharge wallet', value: stats.totalRecharge.toLocaleString() },
    { label: 'Balance wallet', value: (stats.walletBalance || user.wallet_balance || 0).toLocaleString() },
    { label: 'Points', value: '0' },
  ];

  const gridStats = [
    { label: 'Total recharge', value: stats.totalRecharge.toLocaleString() },
    { label: 'Total withdraw', value: stats.totalWithdraw.toLocaleString() },
    { label: 'Total assets', value: (stats.totalEarnings || user.total_earnings || 0).toLocaleString() },
    { label: 'Team Size', value: stats.teamSize },
    { label: 'Team income', value: stats.teamIncome.toLocaleString() },
    { label: 'Total income', value: (stats.totalEarnings || user.total_earnings || 0).toLocaleString() },
  ];

  const actionButtons = [
    { name: 'Recharge', icon: <Wallet size={28} />, path: '/recharge', color: 'bg-orange-400' },
    { name: 'Withdraw', icon: <CreditCard size={28} />, path: '/withdraw', color: 'bg-indigo-400' },
    { name: 'Refer Friends', icon: <Users size={28} />, path: '/referrals', color: 'bg-sky-400' },
  ];

  const menuItems = [
    { name: 'My Order', icon: <ShoppingBag size={20} />, path: '/transactions' },
    { name: 'Transaction', icon: <Activity size={20} />, path: '/transactions' },
    { name: 'My bank account', icon: <CreditCard size={20} />, path: '/bank-account' },
    { name: 'My team', icon: <Users size={20} />, path: '/referrals' },
    { name: 'Online service', icon: <Send size={20} />, path: 'https://t.me/GechTec' },
    { name: 'Telegram Group', icon: <Users size={20} />, path: 'https://t.me/online_new122' },
  ];

  const securityItems = [
    { name: 'Withdraw password', icon: <Lock size={20} />, path: '/security/withdraw-password' },
    { name: 'Change Password', icon: <Lock size={20} />, path: '/security/change-password' },
  ];

  const copyToClipboard = async (text, message = 'Copied to clipboard!') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success(message);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success(message);
        } catch (err) {
          toast.error('Failed to copy');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const referralCode = user.referral_code || 'N/A';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900 pb-24 md:pb-12 pt-0">
      {/* Blue Header Section */}
      <div className="bg-[#0052CC] pt-6 pb-20 px-4 relative shadow-md">
        <div className="container mx-auto max-w-lg">
          <h1 className="text-center text-white text-lg font-bold mb-8">Account</h1>

          {/* User Info Bar */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-12 bg-white rounded flex items-center justify-center font-black text-blue-600 text-xl shadow-sm">
              SYC
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-blue-200 font-black uppercase tracking-widest opacity-70">SmartYield Capital</p>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{user.full_name || user.phone}</h2>
            </div>
          </div>

          {/* Top Row Stats */}
          <div className="grid grid-cols-3 gap-2">
            {topStats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-black text-white mb-1 tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-white/80 font-medium tracking-wider leading-tight">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto max-w-lg px-4 -mt-12 relative z-10">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 grid grid-cols-3 gap-y-8">
          {gridStats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-lg font-black text-blue-600 mb-1 tracking-tight">{stat.value}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                {stat.label.split(' ')[0]}<br/>{stat.label.split(' ')[1] || ''}
              </p>
            </div>
          ))}
        </div>

        {/* Circular Action Buttons */}
        <div className="flex justify-around items-center mb-8 px-2">
          {actionButtons.map((btn, i) => (
            <Link key={i} to={btn.path} className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 ${btn.color} text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform`}>
                {btn.icon}
              </div>
              <span className="text-sm font-bold text-gray-800">{btn.name}</span>
            </Link>
          ))}
        </div>

        {/* Menu List Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {menuItems.map((item, i) => {
            const isExternal = item.path.startsWith('http');
            const Content = (
              <>
                <div className="text-gray-700 group-hover:text-blue-600 transition-colors">
                  {item.icon}
                </div>
                <span className="flex-1 font-bold text-gray-800 text-base">{item.name}</span>
                <ChevronRight size={18} className="text-gray-300" />
              </>
            );

            return isExternal ? (
              <a 
                key={i} 
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group ${i !== menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                {Content}
              </a>
            ) : (
              <Link 
                key={i} 
                to={item.path} 
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group ${i !== menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                {Content}
              </Link>
            );
          })}
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {securityItems.map((item, i) => (
            <Link 
              key={i} 
              to={item.path} 
              className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group ${i !== securityItems.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="text-gray-700">
                {item.icon}
              </div>
              <span className="flex-1 font-bold text-gray-800 text-base">{item.name}</span>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button 
          onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}
          className="w-full py-4 mb-10 text-red-500 font-black rounded-xl border border-red-50"
        >
          SIGN OUT
        </button>
      </div>

      {/* Floating Chat Icon */}
      <a 
        href="https://t.me/GechTec" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-24 right-6 z-[90]"
      >
        <div className="w-14 h-14 bg-[#0052CC] rounded-full flex items-center justify-center text-white shadow-2xl animate-bounce cursor-pointer border-4 border-white">
          <Send size={24} />
        </div>
      </a>
    </div>
  );
};

export default Dashboard;
