import React, { useState, useEffect } from 'react';
import { 
  Check, X, Eye, User, Calendar, CreditCard, 
  Settings, Users, Package, History, TrendingUp, 
  Plus, Edit2, Trash2, Search, ArrowLeft, Save, AlertCircle, Building2, LogOut, Bell
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recharges');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [adminStats, setAdminStats] = useState({ totalNotifications: 0 });
  const [needsMigration, setNeedsMigration] = useState(false);
  const [missingTables, setMissingTables] = useState([]);
  const [dismissMigration, setDismissMigration] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    withdrawal_fee_percent: 2,
    min_withdrawal_amount: 400,
    daily_profit_percent: 3,
    is_recharge_enabled: true,
    is_withdrawal_enabled: true,
    depositMethods: []
  });
  
  // SYC Admin Data States
  const [recharges, setRecharges] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [authError, setAuthError] = useState(false);

  // Modal States
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [editingDepositMethod, setEditingDepositMethod] = useState(null);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState(null);
  const [rejectionItem, setRejectionItem] = useState(null);
  const [rejectionType, setRejectionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to Home instead of Login for a smoother professional flow
    window.location.href = '/';
  };

  useEffect(() => {
    const checkAdmin = () => {
      const storedToken = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!storedToken) {
        console.error('DEBUG: No token found');
        setAuthError(true);
        setServerError('No login session found. Please log in.');
        navigate('/login');
        return false;
      }
      
      if (!user.is_admin) {
        console.error('DEBUG: User is not an admin');
        setAuthError(true);
        setServerError('Access Denied. Administrator privileges required.');
        navigate('/dashboard');
        return false;
      }
      
      return true;
    };
    
    if (checkAdmin()) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;

    setLoading(true);
    setServerError(null);
    setAuthError(false);
    
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });

    try {
      const [rechargesRes, withdrawalsRes, usersRes, plansRes, settingsRes, statsRes] = await Promise.all([
        apiInstance.get('/admin/recharges'),
        apiInstance.get('/admin/withdrawals'),
        apiInstance.get('/admin/users'),
        apiInstance.get('/admin/plans'),
        apiInstance.get('/admin/settings'),
        apiInstance.get('/admin/stats')
      ]);
      setRecharges(rechargesRes.data || []);
      setWithdrawals(withdrawalsRes.data || []);
      setUsers(usersRes.data || []);
      setPlans(plansRes.data || []);
      setSystemSettings(settingsRes.data || {
        withdrawal_fee_percent: 2,
        min_withdrawal_amount: 400,
        daily_profit_percent: 3,
        is_recharge_enabled: true,
        is_withdrawal_enabled: true,
        recharge_amounts: [500, 1000, 2500, 5000, 10000, 20000, 50000, 100000],
        depositMethods: []
      });
      const migrationNeeded = settingsRes.data?.needsMigration || false;
      setNeedsMigration(migrationNeeded);
      setMissingTables(settingsRes.data?.missingTables || []);
      if (!migrationNeeded) {
        setDismissMigration(false); // Reset if fixed
      }
      setAdminStats(statsRes.data || { totalNotifications: 0, pendingRecharges: 0, pendingWithdrawals: 0 });
    } catch (error) {
      console.error('Dashboard Fetch Error:', error);
      if (error.response?.status === 500) {
        setServerError(`Server Error: ${error.response?.data?.message || 'The database might not be fully migrated. Please check backend logs.'}`);
      } else if (error.response?.status === 403) {
        setAuthError(true);
        setServerError('Access Denied. You are logged in but do not have Administrator rights.');
      } else if (error.code === 'ERR_NETWORK') {
        setServerError('Network Error: The backend server is unreachable. Please ensure it is running on port 5000.');
      } else {
        setServerError(error.response?.data?.message || 'Server returned an error while fetching data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRecharge = async (id, status) => {
    if (status === 'rejected') {
      setRejectionItem({ id, type: 'recharge' });
      setRejectionType('recharge');
      setShowRejectionModal(true);
      return;
    }
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      await apiInstance.post(`/admin/recharges/${id}/review`, { status });
      toast.success(`Recharge ${status === 'approved' ? 'approved' : 'rejected'}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Review failed');
    }
  };

  const handleReviewWithdrawal = async (id, status) => {
    if (status === 'rejected') {
      setRejectionItem({ id, type: 'withdrawal' });
      setRejectionType('withdrawal');
      setShowRejectionModal(true);
      return;
    }
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      await apiInstance.post(`/admin/withdrawals/${id}/review`, { status });
      toast.success(`Withdrawal ${status === 'approved' ? 'approved' : 'rejected'}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Review failed');
    }
  };

  const confirmRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      if (rejectionType === 'recharge') {
        await apiInstance.post(`/admin/recharges/${rejectionItem.id}/review`, { status: 'rejected', rejectionReason });
      } else {
        await apiInstance.post(`/admin/withdrawals/${rejectionItem.id}/review`, { status: 'rejected', rejectionReason });
      }
      toast.success(`${rejectionType === 'recharge' ? 'Recharge' : 'Withdrawal'} rejected`);
      setShowRejectionModal(false);
      setRejectionReason('');
      setRejectionItem(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    }
  };

  const RejectionModal = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="card w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Rejection Reason</h3>
        <p className="text-gray-400 text-sm mb-4">Please provide a reason for rejecting this {rejectionType}:</p>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter rejection reason..."
          className="w-full bg-secondary border border-gray-700 rounded p-3 text-white resize-none h-32 mb-4"
        />
        <div className="flex gap-4">
          <button
            onClick={() => { setShowRejectionModal(false); setRejectionReason(''); setRejectionItem(null); }}
            className="flex-1 py-2 border border-gray-700 rounded hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmRejection}
            className="flex-1 btn-primary py-2 bg-red-600 hover:bg-red-700"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );

  const ScreenshotModal = () => (
    <div 
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] p-4 md:p-10"
      onClick={() => setShowScreenshotModal(false)}
    >
      <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
        <button 
          onClick={() => setShowScreenshotModal(false)}
          className="absolute top-0 right-0 m-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white z-50 transition-colors"
        >
          <X size={24} />
        </button>
        <img 
          src={activeScreenshot} 
          alt="Payment Proof" 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );

  const fetchUserActivity = async (user) => {
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    setLoading(true);
    setSelectedUser(user);
    try {
      const response = await apiInstance.get(`/admin/users/${user.id}/activity`);
      setUserActivity(response.data);
    } catch (error) {
      toast.error('Failed to load user activity');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId, currentStatus) => {
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      await apiInstance.put(`/admin/users/${userId}/toggle-admin`, { is_admin: !currentStatus });
      toast.success(`User updated successfully`);
      fetchData(); // Refresh user list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleAutoMigration = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;

    setLoading(true);
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });

    try {
      const response = await apiInstance.post('/admin/run-migrations');
      toast.success(response.data.message || 'Migrations completed successfully!');
      fetchData(); // Refresh data and check status
    } catch (error) {
      console.error('Migration Error:', error);
      toast.error(error.response?.data?.message || 'Automatic migration failed. Please try the manual script.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInvestment = async (invId, data) => {
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      await apiInstance.put(`/admin/investments/${invId}`, data);
      setUserActivity({
        ...userActivity,
        investments: userActivity.investments.map(inv => inv.id === invId ? { ...inv, ...data } : inv)
      });
      setEditingInvestment(null);
      toast.success('Investment updated successfully');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      await apiInstance.delete(`/admin/plans/${id}`);
      setPlans(plans.filter(p => p.id !== id));
      toast.success('Plan deleted');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      // Create a clean payload with only valid settings fields
      const payload = {
        withdrawal_fee_percent: parseFloat(systemSettings.withdrawal_fee_percent),
        min_withdrawal_amount: parseFloat(systemSettings.min_withdrawal_amount),
        daily_profit_percent: parseFloat(systemSettings.daily_profit_percent),
        is_recharge_enabled: systemSettings.is_recharge_enabled,
        is_withdrawal_enabled: systemSettings.is_withdrawal_enabled,
        referral_reward_percent_l1: parseFloat(systemSettings.referral_reward_percent_l1),
        referral_reward_percent_l2: parseFloat(systemSettings.referral_reward_percent_l2),
        referral_reward_percent_l3: parseFloat(systemSettings.referral_reward_percent_l3),
        recharge_amounts: Array.isArray(systemSettings.recharge_amounts) 
          ? systemSettings.recharge_amounts 
          : systemSettings.recharge_amounts.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n))
      };
      await apiInstance.put('/admin/settings', payload);
      toast.success('System settings updated successfully');
      fetchData();
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  };

  const handleUpdateBank = async (bankId, bankData) => {
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      await apiInstance.put(`/admin/bank-accounts/${bankId}`, bankData);
      toast.success('Bank account updated');
      if (selectedUser) fetchUserActivity(selectedUser);
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleUpdateDepositMethod = async (id, data) => {
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      await apiInstance.put(`/admin/deposit-methods/${id}`, data);
      toast.success('Deposit account updated');
      setShowDepositModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update deposit account');
    }
  };

  const handleAddDepositMethod = async (formData) => {
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      await apiInstance.post('/admin/deposit-methods', formData);
      toast.success('Deposit method added');
      setShowDepositModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add method');
    }
  };

  const openDepositModal = (method = null) => {
    setEditingDepositMethod(method);
    setShowDepositModal(true);
  };

  const DepositModal = () => {
    const [formData, setFormData] = useState(editingDepositMethod || {
      slug: '', name: '', account_number: '', account_owner: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (editingDepositMethod) {
        handleUpdateDepositMethod(editingDepositMethod.id, formData);
      } else {
        handleAddDepositMethod(formData);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
        <div className="card w-full max-w-md">
          <h3 className="text-xl font-bold mb-6">{editingDepositMethod ? 'Edit Deposit Method' : 'Add New Deposit Method'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingDepositMethod && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Slug (e.g., telebirr, cbe)</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full bg-secondary border border-gray-700 rounded p-2" 
                  required 
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bank Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-secondary border border-gray-700 rounded p-2" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Account Number</label>
              <input 
                type="text" 
                value={formData.account_number}
                onChange={e => setFormData({...formData, account_number: e.target.value})}
                className="w-full bg-secondary border border-gray-700 rounded p-2" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Account Owner</label>
              <input 
                type="text" 
                value={formData.account_owner}
                onChange={e => setFormData({...formData, account_owner: e.target.value})}
                className="w-full bg-secondary border border-gray-700 rounded p-2" 
                required 
              />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowDepositModal(false)} className="flex-1 py-2 border border-gray-700 rounded hover:bg-gray-800 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 btn-primary py-2">Save Method</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleDeleteDepositMethod = async (id) => {
    if (!window.confirm('Delete this deposit method?')) return;
    const currentToken = localStorage.getItem('token');
    const apiInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    try {
      await apiInstance.delete(`/admin/deposit-methods/${id}`);
      toast.success('Deposit method deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete method');
    }
  };

  const menuItems = [
    { id: 'recharges', label: 'Recharges', icon: <CreditCard size={20} />, badge: recharges.filter(s => s.status === 'pending').length },
    { id: 'withdrawals', label: 'Withdrawals', icon: <TrendingUp size={20} />, badge: withdrawals.filter(w => w.status === 'pending').length },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'plans', label: 'Plans', icon: <Package size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const PlanModal = () => {
    const [formData, setFormData] = useState(editingPlan || {
      id: '', name: '', amount: '', daily_profit_percent: 20, duration_days: 65
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(editingPlan?.image_url || null);

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const currentToken = localStorage.getItem('token');
      const apiInstance = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (imageFile) data.append('image', imageFile);

      try {
        if (editingPlan) {
          await apiInstance.put(`/admin/plans/${editingPlan.id}`, data);
          toast.success('Plan updated');
        } else {
          await apiInstance.post('/admin/plans', data);
          toast.success('Plan added');
        }
        setShowPlanModal(false);
        fetchData();
      } catch (error) {
        toast.error('Failed to save plan');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
        <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-6">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <div className="w-full h-40 bg-secondary-light border-2 border-dashed border-gray-700 rounded-lg overflow-hidden relative group">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Plus size={32} />
                    <p className="text-xs mt-2">Product Image</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Plan ID (e.g., v11)</label>
              <input 
                type="text" 
                value={formData.id}
                onChange={e => setFormData({...formData, id: e.target.value})}
                className="w-full bg-secondary border border-gray-700 rounded p-2" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Plan Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-secondary border border-gray-700 rounded p-2" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Investment Amount (ETB)</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-secondary border border-gray-700 rounded p-2" 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Daily Profit %</label>
                <input 
                  type="number" 
                  value={formData.daily_profit_percent}
                  onChange={e => setFormData({...formData, daily_profit_percent: e.target.value})}
                  className="w-full bg-secondary border border-gray-700 rounded p-2" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Duration (Days)</label>
                <input 
                  type="number" 
                  value={formData.duration_days}
                  onChange={e => setFormData({...formData, duration_days: e.target.value})}
                  className="w-full bg-secondary border border-gray-700 rounded p-2" 
                  required 
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowPlanModal(false)} className="flex-1 py-2 border border-gray-700 rounded hover:bg-gray-800 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 btn-primary py-2">Save Plan</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <h2 className="text-xs font-black text-primary uppercase tracking-[0.4em]">SYC Control Center</h2>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Admin Dashboard</h1>
            {needsMigration && (
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Database Issues Detected</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => {
                  if (adminStats.pendingRecharges > 0) setActiveTab('recharges');
                  else if (adminStats.pendingWithdrawals > 0) setActiveTab('withdrawals');
                  else setActiveTab('recharges');
                  setSelectedUser(null);
                }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-primary transition-all"
              >
                <Bell size={20} />
                {adminStats.totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-secondary">
                    {adminStats.totalNotifications}
                  </span>
                )}
              </button>
            </div>
            <button 
              onClick={fetchData}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
              title="Refresh Data"
            >
              <History size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="bg-secondary-light px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">Administrator</p>
                <p className="text-sm font-black text-white uppercase leading-none">Main Office</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-all border border-red-500/10 hover:border-red-500/30"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {(serverError || (needsMigration && !dismissMigration)) && (
          <div className={`mb-8 p-6 rounded-[32px] flex flex-col gap-6 border ${authError ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${authError ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">
                    {authError ? 'Authentication Issue' : (needsMigration ? 'Database Migration Required' : 'System Configuration Required')}
                  </p>
                  <p className="text-xs text-gray-400 font-medium">
                    {needsMigration 
                      ? `The following tables are missing: ${missingTables.join(', ') || 'system_settings, deposit_methods'}. Please run the SQL migrations below.` 
                      : serverError}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {needsMigration && !authError && (
                  <button 
                    onClick={() => setDismissMigration(true)}
                    className="px-6 py-3 bg-white/5 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                  >
                    View Anyway
                  </button>
                )}
                {authError ? (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => navigate('/login')}
                      className="px-8 py-3 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-2"
                    >
                      <User size={16} /> Login as Admin
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="px-8 py-3 bg-amber-500/10 text-amber-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all border border-amber-500/20"
                    >
                      Logout & Re-login
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {needsMigration && (
                      <button 
                        onClick={handleAutoMigration}
                        disabled={loading}
                        className="px-8 py-3 bg-accent text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 active:scale-95 flex items-center gap-2"
                      >
                        {loading ? 'Running...' : 'Fix Automatically'}
                      </button>
                    )}
                    <button 
                      onClick={fetchData}
                      className="px-8 py-3 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                    >
                      {needsMigration ? 'Check Again' : 'Retry Connection'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!authError && needsMigration && !dismissMigration && (
              <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-primary uppercase tracking-widest">Database Setup Guide</h3>
                  <button 
                    onClick={async () => {
                      const sql = `-- SmartYield Capital Complete Database Schema

-- 1. Profiles (User Data)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referrer_id UUID REFERENCES auth.users(id),
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    total_earnings DECIMAL(12, 2) DEFAULT 0.00,
    withdraw_password TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Investment Plans
CREATE TABLE IF NOT EXISTS investment_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    daily_profit_percent DECIMAL(5, 2) DEFAULT 20.00,
    duration_days INTEGER DEFAULT 65,
    image_url TEXT
);

INSERT INTO investment_plans (id, name, amount) VALUES
('v1', 'Plan V1', 500),
('v2', 'Plan V2', 1000),
('v3', 'Plan V3', 1500),
('v4', 'Plan V4', 2500),
('v5', 'Plan V5', 4000),
('v6', 'Plan V6', 8000),
('v7', 'Plan V7', 15000),
('v8', 'Plan V8', 50000),
('v9', 'Plan V9', 100000),
('v10', 'Plan V10', 200000)
ON CONFLICT (id) DO NOTHING;

-- 3. Recharge (Deposit) Requests
CREATE TABLE IF NOT EXISTS recharges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    ft_id TEXT NOT NULL,
    screenshot_url TEXT,
    payment_gateway TEXT DEFAULT 'manual',
    is_auto_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id)
);

-- 4. Active Investments
CREATE TABLE IF NOT EXISTS investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES investment_plans(id),
    amount DECIMAL(12, 2) NOT NULL,
    daily_profit DECIMAL(12, 2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    days_paid INTEGER DEFAULT 0,
    last_payout_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Referrals and Commissions
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES profiles(id),
    referred_id UUID REFERENCES profiles(id),
    level INTEGER,
    commission_amount DECIMAL(12, 2) NOT NULL,
    source_investment_id UUID REFERENCES investments(id),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Profit Logs (ROI History)
CREATE TABLE IF NOT EXISTS profit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT DEFAULT 'roi',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. Withdrawal Requests
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    fee DECIMAL(12, 2) DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL,
    bank_account_id UUID REFERENCES bank_accounts(id),
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id)
);

-- 9. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    withdrawal_fee_percent DECIMAL DEFAULT 2.0,
    min_withdrawal_amount DECIMAL DEFAULT 400,
    daily_profit_percent DECIMAL DEFAULT 3.0,
    is_recharge_enabled BOOLEAN DEFAULT TRUE,
    is_withdrawal_enabled BOOLEAN DEFAULT TRUE,
    recharge_amounts JSONB DEFAULT '[500, 1000, 2500, 5000, 10000, 20000, 50000, 100000]'::jsonb,
    referral_reward_percent_l1 DECIMAL DEFAULT 10.0,
    referral_reward_percent_l2 DECIMAL DEFAULT 5.0,
    referral_reward_percent_l3 DECIMAL DEFAULT 2.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO system_settings (id, withdrawal_fee_percent, min_withdrawal_amount, daily_profit_percent, referral_reward_percent_l1, referral_reward_percent_l2, referral_reward_percent_l3)
VALUES ('global', 2.0, 400, 3.0, 10.0, 5.0, 2.0) ON CONFLICT (id) DO NOTHING;

-- 10. Deposit Methods
CREATE TABLE IF NOT EXISTS deposit_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_owner TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO deposit_methods (slug, name, account_number, account_owner) 
VALUES 
('telebirr', 'Telebirr', '0911223344', 'SYC Capital'),
('cbe', 'CBE Birr', '1000123456789', 'SYC Capital'),
('abyssinia', 'Abyssinia', '88776655', 'SYC Capital'),
('manual', 'Other Bank', '1000998877', 'SYC Finance')
ON CONFLICT (slug) DO NOTHING;

-- 11. Enable RLS and Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view settings" ON system_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admins have full access settings" ON system_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Anyone view active deposit" ON deposit_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Admins full access deposit" ON deposit_methods FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Users can view own logs" ON profit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);`;

                      try {
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(sql);
                          toast.success('SQL Copied!');
                        } else {
                          const textArea = document.createElement("textarea");
                          textArea.value = sql;
                          textArea.style.position = "fixed";
                          textArea.style.left = "-9999px";
                          textArea.style.top = "0";
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          toast.success('SQL Copied!');
                        }
                      } catch (err) {
                        toast.error('Failed to copy SQL');
                      }
                    }}
                    className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-all"
                  >
                    Copy SQL Script
                  </button>
                </div>
                <p className="text-xs text-gray-400">Run this script in your <strong className="text-white">Supabase SQL Editor</strong> (usually at <a href="http://127.0.0.1:54323" target="_blank" rel="noopener noreferrer" className="text-primary underline">http://127.0.0.1:54323</a>) to fix missing table errors:</p>
                <pre className="bg-black/60 p-4 rounded-xl text-[10px] text-gray-500 font-mono overflow-x-auto max-h-40 border border-white/5">
{`-- 1. Profiles (User Data)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referrer_id UUID REFERENCES auth.users(id),
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    total_earnings DECIMAL(12, 2) DEFAULT 0.00,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Investment Plans
CREATE TABLE IF NOT EXISTS investment_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    daily_profit_percent DECIMAL(5, 2) DEFAULT 20.00,
    duration_days INTEGER DEFAULT 65,
    image_url TEXT
);

-- 3. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    withdrawal_fee_percent DECIMAL DEFAULT 2.0,
    min_withdrawal_amount DECIMAL DEFAULT 400,
    daily_profit_percent DECIMAL DEFAULT 3.0,
    is_recharge_enabled BOOLEAN DEFAULT TRUE,
    is_withdrawal_enabled BOOLEAN DEFAULT TRUE,
    recharge_amounts JSONB DEFAULT '[500, 1000, 2500, 5000, 10000, 20000, 50000, 100000]'::jsonb,
    referral_reward_percent_l1 DECIMAL DEFAULT 10.0,
    referral_reward_percent_l2 DECIMAL DEFAULT 5.0,
    referral_reward_percent_l3 DECIMAL DEFAULT 2.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Deposit Methods
CREATE TABLE IF NOT EXISTS deposit_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_owner TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Other Required Tables (Referrals, Profit Logs, etc.)
CREATE TABLE IF NOT EXISTS profit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    type TEXT DEFAULT 'roi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES profiles(id),
    referred_id UUID REFERENCES profiles(id),
    level INTEGER,
    commission_amount DECIMAL NOT NULL,
    source_investment_id UUID,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                </pre>
              </div>
            )}
          </div>
        )}

      {selectedUser ? (
        // User Detail View
        <div className="space-y-6">
          <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card md:col-span-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <User size={32} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.full_name}</h2>
                  <p className="text-gray-400 text-sm">{selectedUser.phone}</p>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Phone</span>
                  <span>{selectedUser.phone}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Email</span>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Wallet Balance</span>
                  <span className="text-primary font-bold">{selectedUser.wallet_balance} ETB</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Total Earnings</span>
                  <span className="text-accent font-bold">{selectedUser.total_earnings} ETB</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Joined Date</span>
                  <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              {/* Linked Bank Accounts */}
              <div className="card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Building2 size={18} className="text-amber-500" /> Linked Bank Accounts
                </h3>
                {userActivity?.bankAccounts?.length > 0 ? (
                <div className="space-y-3">
                  {userActivity.bankAccounts.map(acc => (
                    <div key={acc.id} className="bg-secondary p-4 rounded border border-gray-800 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-primary uppercase text-xs tracking-widest">{acc.bank_name}</p>
                          <p className="text-sm font-medium">{acc.account_name}</p>
                          <p className="text-xs font-mono text-gray-500">{acc.account_number}</p>
                        </div>
                        {acc.is_default && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded uppercase">Default</span>
                        )}
                      </div>
                      
                      {/* Admin Edit Bank Account */}
                      <div className="pt-4 border-t border-gray-800 grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="Account Name"
                          defaultValue={acc.account_name}
                          className="bg-black/20 border border-gray-700 rounded p-2 text-xs"
                          onBlur={(e) => handleUpdateBank(acc.id, { ...acc, account_name: e.target.value })}
                        />
                        <input 
                          type="text" 
                          placeholder="Number"
                          defaultValue={acc.account_number}
                          className="bg-black/20 border border-gray-700 rounded p-2 text-xs"
                          onBlur={(e) => handleUpdateBank(acc.id, { ...acc, account_number: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                  <p className="text-gray-500 text-sm italic">No bank accounts linked.</p>
                )}
              </div>

              {/* Active Investments */}
              <div className="card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" /> Active Investments
                </h3>
                {userActivity?.investments?.length > 0 ? (
                  <div className="space-y-4">
                    {userActivity.investments.map(inv => (
                      <div key={inv.id} className="bg-secondary p-4 rounded border border-gray-800">
                        {editingInvestment?.id === inv.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] text-gray-400 uppercase">Daily Profit (ETB)</label>
                                <input 
                                  type="number" 
                                  defaultValue={inv.daily_profit} 
                                  className="w-full bg-secondary-light border border-gray-700 rounded p-1 text-sm"
                                  onBlur={(e) => handleUpdateInvestment(inv.id, { daily_profit: parseFloat(e.target.value) })}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 uppercase">Status</label>
                                <select 
                                  defaultValue={inv.is_active ? 'active' : 'inactive'}
                                  className="w-full bg-secondary-light border border-gray-700 rounded p-1 text-sm"
                                  onChange={(e) => handleUpdateInvestment(inv.id, { is_active: e.target.value === 'active' })}
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </div>
                            </div>
                            <button onClick={() => setEditingInvestment(null)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-primary">{inv.plan_id.toUpperCase()}</p>
                              <p className="text-xs text-gray-400">{inv.amount} ETB invested</p>
                            </div>
                            <div className="text-right">
                              <p className="text-accent font-bold">{inv.daily_profit} ETB / day</p>
                              <p className="text-[10px] text-gray-500">{inv.days_paid} / 65 days paid</p>
                            </div>
                            <button onClick={() => setEditingInvestment(inv)} className="p-2 hover:bg-gray-700 rounded">
                              <Edit2 size={14} className="text-gray-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No active investments.</p>
                )}
              </div>

              {/* Recent Recharges */}
              <div className="card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-500" /> Recent Recharges
                </h3>
                <div className="space-y-2">
                  {userActivity?.recharges?.map(r => (
                    <div key={r.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-gray-400">{new Date(r.submitted_at).toLocaleDateString()}</span>
                        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">{r.ft_id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase ${r.status === 'approved' ? 'text-accent' : 'text-red-500'}`}>{r.status}</span>
                        <span className="text-white font-bold">{r.amount} ETB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Profit Logs */}
              <div className="card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <History size={18} className="text-accent" /> Recent ROI Payouts
                </h3>
                <div className="space-y-2">
                  {userActivity?.profitLogs?.map(log => (
                    <div key={log.id} className="flex justify-between text-sm py-2 border-b border-gray-800">
                      <span className="text-gray-400">{new Date(log.created_at).toLocaleDateString()}</span>
                      <span className="text-accent font-bold">+{log.amount} ETB</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referrals */}
              <div className="card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users size={18} className="text-primary" /> Referrals Given
                </h3>
                <div className="space-y-2">
                  {userActivity?.referrals?.map(ref => (
                    <div key={ref.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-800">
                      <div>
                        <p className="font-bold">{ref.referred_user?.full_name || 'User'}</p>
                        <p className="text-[10px] text-gray-500">{ref.referred_user?.phone || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-accent font-bold">+{ref.commission_amount} ETB</p>
                        <p className="text-[10px] text-gray-500">Level {ref.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Main Dashboard View
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Admin <span className="text-primary">Panel</span></h1>
            <div className="flex gap-2 bg-secondary-light p-1 rounded-xl border border-white/5">
              {['recharges', 'withdrawals', 'users', 'plans', 'settings'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Pending Recharges</p>
              <h2 className="text-3xl font-black text-primary">{recharges.filter(s => s.status === 'pending').length}</h2>
            </div>
            <div className="card">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Pending Withdrawals</p>
              <h2 className="text-3xl font-black text-amber-500">{withdrawals.filter(w => w.status === 'pending').length}</h2>
            </div>
            <div className="card">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Users</p>
              <h2 className="text-3xl font-black text-white">{users.length}</h2>
            </div>
            <div className="card">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Balance</p>
              <h2 className="text-3xl font-black text-accent">{users.reduce((acc, curr) => acc + (parseFloat(curr.wallet_balance) || 0), 0).toLocaleString()} <span className="text-xs">ETB</span></h2>
            </div>
          </div>

          {activeTab === 'recharges' && (
            <div className="card overflow-hidden">
              <h3 className="text-xl font-bold mb-6">Recharge Requests</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="pb-4 font-medium">User</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Gateway</th>
                      <th className="pb-4 font-medium">FT ID</th>
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Screenshot</th>
                      <th className="pb-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {recharges.map((sub) => (
                      <tr key={sub.id} className="group">
                        <td className="py-4">
                          <button 
                            onClick={() => sub.profiles && fetchUserActivity({ ...sub.profiles, id: sub.user_id })}
                            className="flex items-center gap-3 hover:text-primary transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                              <User size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{sub.profiles?.full_name || 'Unknown'}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500">{sub.profiles?.phone || 'N/A'}</p>
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-bold">
                                  {sub.profiles?.wallet_balance || 0} ETB
                                </span>
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="py-4">
                          <span className="text-primary font-bold text-sm">{sub.amount} ETB</span>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/5">
                            {sub.payment_gateway || 'Manual'}
                          </span>
                        </td>
                        <td className="py-4 text-sm font-mono text-gray-300">{sub.ft_id}</td>
                        <td className="py-4 text-xs text-gray-500">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          {sub.screenshot_url ? (
                            <button 
                              onClick={() => { setActiveScreenshot(sub.screenshot_url); setShowScreenshotModal(true); }}
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                            >
                              <Eye size={14} /> View
                            </button>
                          ) : <span className="text-gray-600 text-xs">None</span>}
                        </td>
                        <td className="py-4">
                          {sub.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleReviewRecharge(sub.id, 'approved')}
                                className="p-1 bg-accent/20 text-accent hover:bg-accent hover:text-white rounded transition-colors"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => handleReviewRecharge(sub.id, 'rejected')}
                                className="p-1 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className={`text-xs font-bold uppercase ${sub.status === 'approved' ? 'text-accent' : 'text-red-500'}`}>
                              {sub.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-8">
              <div className="card">
                <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                  <Settings size={20} className="text-primary" /> Global System Settings
                </h3>
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Withdrawal Fee (%)</label>
                      <input
                        type="number"
                        value={systemSettings.withdrawal_fee_percent}
                        onChange={(e) => setSystemSettings({...systemSettings, withdrawal_fee_percent: e.target.value})}
                        className="w-full bg-secondary border border-gray-700 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Min Withdrawal (ETB)</label>
                      <input
                        type="number"
                        value={systemSettings.min_withdrawal_amount}
                        onChange={(e) => setSystemSettings({...systemSettings, min_withdrawal_amount: e.target.value})}
                        className="w-full bg-secondary border border-gray-700 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Daily Profit (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={systemSettings.daily_profit_percent}
                        onChange={(e) => setSystemSettings({...systemSettings, daily_profit_percent: e.target.value})}
                        className="w-full bg-secondary border border-gray-700 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Referral Reward L1 (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={systemSettings.referral_reward_percent_l1}
                        onChange={(e) => setSystemSettings({...systemSettings, referral_reward_percent_l1: e.target.value})}
                        className="w-full bg-secondary border border-gray-700 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Referral Reward L2 (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={systemSettings.referral_reward_percent_l2}
                        onChange={(e) => setSystemSettings({...systemSettings, referral_reward_percent_l2: e.target.value})}
                        className="w-full bg-secondary border border-gray-700 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Referral Reward L3 (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={systemSettings.referral_reward_percent_l3}
                        onChange={(e) => setSystemSettings({...systemSettings, referral_reward_percent_l3: e.target.value})}
                        className="w-full bg-secondary border border-gray-700 rounded p-2"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Quick Recharge Amounts (comma separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(systemSettings.recharge_amounts) ? systemSettings.recharge_amounts.join(', ') : systemSettings.recharge_amounts}
                        onChange={(e) => setSystemSettings({...systemSettings, recharge_amounts: e.target.value})}
                        placeholder="500, 1000, 2500..."
                        className="w-full bg-secondary border border-gray-700 rounded p-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between p-4 bg-secondary-dark rounded-2xl">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest">Enable Recharges</p>
                        <p className="text-[10px] text-gray-500">Allow users to fund their accounts</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSystemSettings({...systemSettings, is_recharge_enabled: !systemSettings.is_recharge_enabled})}
                        className={`w-12 h-6 rounded-full transition-all relative ${systemSettings.is_recharge_enabled ? 'bg-primary' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemSettings.is_recharge_enabled ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary-dark rounded-2xl">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest">Enable Withdrawals</p>
                        <p className="text-[10px] text-gray-500">Allow users to request payouts</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSystemSettings({...systemSettings, is_withdrawal_enabled: !systemSettings.is_withdrawal_enabled})}
                        className={`w-12 h-6 rounded-full transition-all relative ${systemSettings.is_withdrawal_enabled ? 'bg-primary' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemSettings.is_withdrawal_enabled ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="w-full btn-primary py-4 text-xs font-black uppercase tracking-widest">
                    Save Global Settings
                  </button>
                </form>
              </div>

              {/* Deposit Account Details Management */}
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                    <Building2 size={20} className="text-primary" /> Deposit Account Details
                  </h3>
                  <button 
                    onClick={() => openDepositModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                  >
                    <Plus size={14} /> Add Method
                  </button>
                </div>
                <div className="space-y-6">
                  {systemSettings.depositMethods?.map((method) => (
                    <div key={method.id} className="p-6 bg-secondary-dark rounded-3xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">
                          {method.name} ({method.slug})
                        </span>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => openDepositModal(method)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase font-black">Active</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateDepositMethod(method.id, { ...method, is_active: !method.is_active })}
                              className={`w-10 h-5 rounded-full transition-all relative ${method.is_active ? 'bg-accent' : 'bg-gray-700'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${method.is_active ? 'left-6' : 'left-1'}`}></div>
                            </button>
                          </div>
                          <button 
                            onClick={() => handleDeleteDepositMethod(method.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-black/20 border border-white/5 rounded-xl">
                          <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 ml-1">Account Number</label>
                          <div className="p-3 text-sm font-black tracking-wider text-white">
                            {method.account_number}
                          </div>
                        </div>
                        <div className="p-3 bg-black/20 border border-white/5 rounded-xl">
                          <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 ml-1">Account Owner</label>
                          <div className="p-3 text-sm font-bold uppercase text-white">
                            {method.account_owner}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="card overflow-hidden">
              <h3 className="text-xl font-bold mb-6">Withdrawal Requests</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="pb-4 font-medium">User</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Net Amount</th>
                      <th className="pb-4 font-medium">Bank Details</th>
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="group">
                        <td className="py-4">
                          <button 
                            onClick={() => w.profiles && fetchUserActivity({ ...w.profiles, id: w.user_id })}
                            className="text-left hover:text-primary transition-colors"
                          >
                            <p className="font-bold text-sm">{w.profiles?.full_name || 'Unknown'}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-500">{w.profiles?.phone || 'N/A'}</p>
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-bold">
                                {w.profiles?.wallet_balance || 0} ETB
                              </span>
                            </div>
                          </button>
                        </td>
                        <td className="py-4 text-sm font-bold">{w.amount} ETB</td>
                        <td className="py-4 text-sm text-accent font-bold">{w.net_amount} ETB</td>
                        <td className="py-4 text-xs">
                          <p className="font-bold text-primary">{w.bank_accounts?.bank_name}</p>
                          <p>{w.bank_accounts?.account_name}</p>
                          <p className="font-mono text-gray-500">{w.bank_accounts?.account_number}</p>
                        </td>
                        <td className="py-4 text-xs text-gray-500">
                          {new Date(w.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          {w.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleReviewWithdrawal(w.id, 'approved')}
                                className="p-1 bg-accent/20 text-accent hover:bg-accent hover:text-white rounded transition-colors"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => handleReviewWithdrawal(w.id, 'rejected')}
                                className="p-1 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className={`text-xs font-bold uppercase ${w.status === 'approved' ? 'text-accent' : 'text-red-500'}`}>
                              {w.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">User Management</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input type="text" placeholder="Search users..." className="bg-secondary border border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:border-primary outline-none" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="pb-4 font-medium">User</th>
                      <th className="pb-4 font-medium">Wallet</th>
                      <th className="pb-4 font-medium">Total Earned</th>
                      <th className="pb-4 font-medium">Joined</th>
                      <th className="pb-4 font-medium">Role</th>
                      <th className="pb-4 font-medium">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-4">
                          <p className="font-bold text-sm">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                        </td>
                        <td className="py-4 text-sm text-primary font-bold">{user.wallet_balance} ETB</td>
                        <td className="py-4 text-sm text-accent font-bold">{user.total_earnings} ETB</td>
                        <td className="py-4 text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="py-4">
                          <button 
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                              user.is_admin 
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' 
                                : 'bg-gray-500/10 text-gray-500 border border-gray-500/10 hover:bg-gray-500/20'
                            }`}
                          >
                            {user.is_admin ? 'Admin' : 'User'}
                          </button>
                        </td>
                        <td className="py-4">
                          <button 
                            onClick={() => fetchUserActivity(user)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <History size={14} /> Detail Activity
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="card overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Investment Products</h3>
                <button 
                  onClick={() => { setEditingPlan(null); setShowPlanModal(true); }}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                >
                  <Plus size={16} /> Add Product
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div key={plan.id} className="bg-secondary rounded-xl border border-gray-800 relative group overflow-hidden">
                    <div className="h-40 bg-gray-700 relative">
                      {plan.image_url ? (
                        <img src={plan.image_url} alt={plan.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Package size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={() => { setEditingPlan(plan); setShowPlanModal(true); }}
                          className="p-3 bg-primary text-black rounded-full hover:scale-110 transition-transform"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <span className="text-primary font-bold text-xs uppercase tracking-wider">{plan.id}</span>
                      <h4 className="text-2xl font-bold my-2">{plan.name}</h4>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>Investment: <span className="text-white font-bold">{plan.amount} ETB</span></p>
                        <p>Daily Profit: <span className="text-accent font-bold">{plan.daily_profit_percent}%</span></p>
                        <p>Duration: <span className="text-white font-bold">{plan.duration_days} Days</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showPlanModal && <PlanModal />}
      {showDepositModal && <DepositModal />}
      {showRejectionModal && <RejectionModal />}
      {showScreenshotModal && <ScreenshotModal />}
    </div>
  </div>
  );
};

export default AdminDashboard;