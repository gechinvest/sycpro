import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Building2, Shield, AlertCircle, ChevronRight, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Withdraw = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/investments/bank-accounts');
      setAccounts(response.data);
      const defaultAcc = response.data.find(a => a.is_default);
      if (defaultAcc) setSelectedAccountId(defaultAcc.id);
      else if (response.data.length > 0) setSelectedAccountId(response.data[0].id);
    } catch (error) {
      toast.error('Failed to load bank accounts');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || amount < 400) {
      toast.error('Minimum withdrawal is 400 ETB');
      return;
    }
    if (amount > user.wallet_balance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Please link a bank account first');
      navigate('/bank-account');
      return;
    }

    setLoading(true);
    try {
      await api.post('/investments/withdraw', {
        amount: parseFloat(amount),
        bankAccountId: selectedAccountId,
        password
      });
      toast.success('Withdrawal request submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-12">
      <div className="bg-[#0052CC] pt-8 pb-20 px-4">
        <div className="container mx-auto max-w-lg flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-xl text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Withdraw Funds</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-lg px-4 -mt-12">
        <div className="bg-white rounded-[32px] p-8 shadow-lg mb-6 border border-gray-50">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Available Balance</p>
          <h2 className="text-4xl font-black text-blue-600 mb-6">{user.wallet_balance || 0} <span className="text-sm">ETB</span></h2>

          <form onSubmit={handleWithdraw} className="space-y-6">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3 ml-1">Select Bank Account</label>
              <div className="space-y-3">
                {accounts.length > 0 ? (
                  accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        selectedAccountId === acc.id 
                          ? 'border-blue-600 bg-blue-50/50' 
                          : 'border-gray-100 bg-gray-50/30 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedAccountId === acc.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                        <Building2 size={20} />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`text-xs font-black uppercase ${selectedAccountId === acc.id ? 'text-blue-600' : 'text-gray-900'}`}>{acc.bank_name}</p>
                        <p className="text-[10px] text-gray-500 font-bold tracking-widest">{acc.account_number}</p>
                      </div>
                      {selectedAccountId === acc.id && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                          <CheckCircle size={12} />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <button 
                    type="button"
                    onClick={() => navigate('/bank-account')}
                    className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase tracking-widest flex flex-col items-center gap-2 hover:border-blue-600 hover:text-blue-600 transition-all"
                  >
                    <Plus size={24} />
                    <span className="text-[10px]">Link Bank Account</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Amount to Withdraw</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min 400 ETB"
                  className="w-full bg-gray-50 border-none rounded-2xl p-5 font-black text-xl outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                <button 
                  type="button"
                  onClick={() => setAmount(user.wallet_balance)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-black text-xs uppercase"
                >
                  Max
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Withdrawal Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-gray-50 border-none rounded-2xl p-5 font-black text-xl outline-none focus:ring-2 focus:ring-blue-600/20 tracking-widest"
              />
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={18} />
              <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase tracking-tight">
                Withdrawals are processed within 24 hours. Fee: 2% platform commission applies.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-[32px] p-6 border border-gray-50">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield size={16} className="text-blue-600" /> Security Note
          </h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Ensure your bank account details are correctly linked before submitting. For security, withdrawals can only be made to verified accounts in your name.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
