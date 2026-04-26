import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, ChevronRight, CheckCircle, Trash2, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const BankAccount = () => {
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const [formData, setFormData] = useState({
    bank: 'Telebirr',
    name: '',
    number: ''
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.number) {
      toast.error('Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/investments/bank-accounts', {
        bank_name: formData.bank,
        account_name: formData.name,
        account_number: formData.number
      });
      toast.success('Bank account linked successfully!');
      setShowAdd(false);
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to link account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await api.delete(`/investments/bank-accounts/${id}`);
      toast.success('Account deleted');
      fetchAccounts();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-12">
      <div className="bg-[#0052CC] pt-8 pb-20 px-4">
        <div className="container mx-auto max-w-lg flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-xl text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">My Bank Accounts</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-lg px-4 -mt-12">
        {!showAdd ? (
          <div className="space-y-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-white rounded-[32px] p-6 shadow-md border border-gray-50 flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Building2 size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-gray-900 text-sm uppercase">{acc.bank_name}</span>
                    {acc.is_default && <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full">DEFAULT</span>}
                  </div>
                  <p className="text-gray-500 text-xs font-bold mb-1">{acc.account_name}</p>
                  <p className="text-blue-600 font-black tracking-widest">{acc.account_number}</p>
                </div>
                <button 
                  onClick={() => handleDelete(acc.id)}
                  className="p-2 text-gray-300 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button 
              onClick={() => setShowAdd(true)}
              className="w-full py-6 rounded-[32px] border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              <Plus size={20} /> Link New Account
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-8 shadow-lg border border-gray-50">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-8">Link Bank Account</h2>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Select Bank</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl p-5 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none"
                  value={formData.bank}
                  onChange={(e) => setFormData({...formData, bank: e.target.value})}
                >
                  <option>Telebirr</option>
                  <option>CBE Birr</option>
                  <option>Abyssinia</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="w-full bg-gray-50 border-none rounded-2xl p-5 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600/20"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Account Number / Phone</label>
                <input
                  type="text"
                  placeholder="Enter account or phone"
                  className="w-full bg-gray-50 border-none rounded-2xl p-5 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600/20"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-gray-400 bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-white bg-blue-600 shadow-lg shadow-blue-600/20"
                >
                  Link Now
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankAccount;
