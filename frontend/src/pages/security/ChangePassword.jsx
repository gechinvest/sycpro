import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (formData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/auth/update-password`, 
        { newPassword: formData.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Login password updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
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
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Change Login Password</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-lg px-4 -mt-12">
        <div className="bg-white rounded-[32px] p-8 shadow-lg border border-gray-50">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-8">
            <Lock size={32} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  className="w-full bg-gray-50 border-none rounded-2xl p-5 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600/20"
                  placeholder="Minimum 6 characters"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Confirm New Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                className="w-full bg-gray-50 border-none rounded-2xl p-5 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600/20"
                placeholder="Repeat new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-transform disabled:opacity-50 mt-4"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
