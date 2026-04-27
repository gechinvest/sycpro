import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, Share2, Copy, 
  ChevronRight, Award, Trophy, UserPlus,
  Calendar, Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Referrals = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [activeTab, setActiveTab] = useState('l1');
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState({
    level1: [], level2: [], level3: [],
    counts: { l1: 0, l2: 0, l3: 0, total: 0 }
  });

  const referralCode = user.referral_code || 'N/A';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) return;
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiUrl}/investments/referrals`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReferralData(response.data);
      } catch (error) {
        toast.error('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  const stats = [
    { label: 'Total Team', value: referralData.counts.total, icon: <Users size={20} className="text-primary" />, color: 'bg-blue-50' },
    { label: 'Level 1', value: referralData.counts.l1, icon: <Award size={20} className="text-accent" />, color: 'bg-green-50' },
    { label: 'Level 2', value: referralData.counts.l2, icon: <Trophy size={20} className="text-orange-400" />, color: 'bg-orange-50' },
    { label: 'Level 3', value: referralData.counts.l3, icon: <UserPlus size={20} className="text-purple-400" />, color: 'bg-purple-50' },
  ];

  const levels = [
    { id: 'l1', name: 'Level 1', commission: '10%', data: referralData.level1 },
    { id: 'l2', name: 'Level 2', commission: '5%', data: referralData.level2 },
    { id: 'l3', name: 'Level 3', commission: '2%', data: referralData.level3 },
  ];

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
      } else {
        // Fallback for non-secure contexts or when permission is denied
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
          toast.success('Copied to clipboard!');
        } catch (err) {
          toast.error('Failed to copy');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const currentLevelData = levels.find(l => l.id === activeTab).data;

  return (
    <div className="min-h-screen bg-[#F7F8FA] pt-6 pb-24">
      <div className="container mx-auto max-w-lg px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 bg-white rounded-xl shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Team Center</h1>
        </div>

        {/* Invite Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 mb-8 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Share2 size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Build Your Team</h2>
          <p className="text-gray-400 text-sm mb-8 px-4 font-medium">Earn commissions up to 3 levels deep by inviting new members.</p>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Your ID</p>
                <p className="font-black text-lg text-gray-800 tracking-tighter">{referralCode}</p>
              </div>
              <button 
                onClick={() => copyToClipboard(referralCode)}
                className="p-3 bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
              >
                <Copy size={18} className="text-primary" />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Referral Link</p>
                <button 
                  onClick={() => copyToClipboard(referralLink)}
                  className="text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-full"
                >
                  Copy Link
                </button>
              </div>
              <p className="text-xs font-medium text-gray-500 break-all bg-white p-3 rounded-xl border border-gray-50">
                {referralLink}
              </p>
            </div>

            <button 
              onClick={() => copyToClipboard(referralLink)}
              className="w-full bg-[#0052CC] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              Share Referral Link
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              key={index}
              className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-xl font-black text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Team Details Section */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 overflow-hidden">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Invitee Details</h3>
          
          {/* Custom Tabs */}
          <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8 border border-gray-100">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setActiveTab(lvl.id)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  activeTab === lvl.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {lvl.name} ({lvl.commission})
              </button>
            ))}
          </div>

          {/* List Content */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading team...</p>
              </div>
            ) : currentLevelData.length > 0 ? (
              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {currentLevelData.map((person, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-blue-600 shadow-sm text-xs">
                        {person.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-gray-800 uppercase tracking-tight">{person.full_name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <Phone size={10} /> {person.phone.slice(0, 6)}****
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <Calendar size={10} /> {new Date(person.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${
                          person.is_active 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {person.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                  <Users size={32} className="text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">No members at this level</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;

