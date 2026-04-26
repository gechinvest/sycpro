import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ArrowUpRight, ArrowDownLeft, 
  Filter, Calendar, Wallet, TrendingUp, Users, History 
} from 'lucide-react';
import { Link } from 'react-router-dom';

import axios from 'axios';

const TransactionHistory = () => {
  const [filter, setFilter] = useState('all'); 
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/investments/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTxns = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const getIcon = (type) => {
    switch (type) {
      case 'recharge': return <ArrowDownLeft className="text-accent" />;
      case 'withdraw': return <ArrowUpRight className="text-amber-500" />;
      case 'purchase': return <ArrowUpRight className="text-red-500" />;
      case 'roi': return <TrendingUp className="text-primary" />;
      case 'referral_commission': return <Users className="text-sky-400" />;
      case 'registration_bonus': return <Wallet className="text-orange-400" />;
      default: return <Calendar />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pt-6 pb-24">
      <div className="container mx-auto max-w-lg px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 bg-white rounded-xl shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Transaction Detail</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {['all', 'recharge', 'withdraw', 'purchase', 'roi', 'referral_commission', 'registration_bonus'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === f
                ? 'bg-[#0052CC] text-white shadow-lg' 
                : 'bg-white text-gray-400 border border-gray-100'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTxns.length > 0 ? (
            filteredTxns.sort((a, b) => new Date(b.date) - new Date(a.date)).map((txn) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={txn.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50`}>
                  {getIcon(txn.type)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{txn.title}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{new Date(txn.date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black text-base ${txn.amount > 0 ? 'text-accent' : 'text-red-500'}`}>
                    {txn.amount > 0 ? '+' : ''}{txn.amount} ETB
                  </p>
                  <p className="text-[10px] text-gray-300 uppercase font-bold tracking-tighter">{txn.status}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                <History size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
