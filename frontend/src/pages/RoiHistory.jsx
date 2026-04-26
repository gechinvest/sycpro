import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, TrendingUp, Calendar, 
  ChevronRight, Wallet, ArrowUpRight, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

import axios from 'axios';

const RoiHistory = () => {
  const [roiLogs, setRoiLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoiLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/investments/roi-history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // No need to filter for ROI type logs, backend already returns all profit logs
        setRoiLogs(response.data);
      } catch (error) {
        console.error('Error fetching ROI logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoiLogs();
  }, []);

  const totalRoi = roiLogs.reduce((acc, log) => acc + parseFloat(log.amount), 0);

  return (
    <div className="min-h-screen bg-[#F7F8FA] pt-6 pb-24">
      <div className="container mx-auto max-w-lg px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 bg-white rounded-xl shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Earnings History</h1>
        </div>

        {/* Total ROI Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0052CC] rounded-[32px] p-8 shadow-xl shadow-blue-100 mb-8 text-white relative overflow-hidden"
        >
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Earnings</p>
            <h2 className="text-4xl font-black mb-1">{totalRoi.toLocaleString()} <span className="text-sm font-bold opacity-80 uppercase tracking-widest">ETB</span></h2>
            <div className="flex items-center gap-2 mt-4 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
              <TrendingUp size={14} className="text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest">Investment & Bonuses</span>
            </div>
          </div>
          
          {/* Abstract background shapes */}
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-accent/10 rounded-full blur-2xl"></div>
        </motion.div>

        {/* History List */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Daily Payout Logs</h3>
          
          {roiLogs.length > 0 ? (
            roiLogs.map((log, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={log.id}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    log.type === 'roi' ? 'bg-green-50' : 
                    log.type === 'referral_commission' ? 'bg-blue-50' : 'bg-orange-50'
                  }`}>
                    {log.type === 'roi' && <TrendingUp className="text-accent" size={24} />}
                    {log.type === 'referral_commission' && <Users className="text-primary" size={24} />}
                    {log.type === 'registration_bonus' && <Wallet className="text-orange-400" size={24} />}
                  </div>
                  <div>
                    <p className="font-black text-sm text-gray-800">
                      {log.type === 'roi' ? `${log.plan} ROI` : log.plan}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={12} className="text-gray-300" />
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                        {new Date(log.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-accent">
                    <p className="font-black text-base">+{log.amount}</p>
                    <p className="text-[10px] font-bold uppercase">ETB</p>
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Received</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                <TrendingUp size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No profit logs yet</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-orange-50 rounded-[24px] p-6 border border-orange-100/50">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Wallet className="text-orange-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-black text-sm text-gray-800 mb-1">Automatic Payouts</p>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                Daily returns are automatically added to your wallet balance every 24 hours from the time of investment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoiHistory;
