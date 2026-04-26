import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Logo from '../components/Logo';
import { ShieldCheck, Lock, Phone, User, Key } from 'lucide-react';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecret: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    let normalizedPhone = formData.phone.trim().replace(/\D/g, ''); // Remove all non-digits
    
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '251' + normalizedPhone.slice(1);
    } else if (normalizedPhone.startsWith('9') || normalizedPhone.startsWith('7')) {
      normalizedPhone = '251' + normalizedPhone;
    } else if (normalizedPhone.length === 9) {
      normalizedPhone = '251' + normalizedPhone;
    }

    // Ensure it doesn't have double 251 if entered like 251251...
    if (normalizedPhone.startsWith('251251')) {
      normalizedPhone = normalizedPhone.slice(3);
    }

    if (!/^251[179]\d{8}$/.test(normalizedPhone)) {
      return toast.error('Please enter a valid Ethiopian phone number (e.g., 0912345678 or 251912345678)');
    }

    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/admin-register`, {
        ...formData,
        phone: normalizedPhone,
        email: formData.email || `${normalizedPhone}@smartyield.net`
      });

      toast.success('Admin registered successfully! Please log in.');
      navigate('/admin/login');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a] relative overflow-hidden">
      {/* Admin Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-3xl mb-6 border border-primary/20">
            <ShieldCheck size={48} className="text-primary" />
          </div>
          <h2 className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-2">SYC Management</h2>
          <h3 className="text-4xl font-black tracking-tighter uppercase text-white">Admin Register</h3>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-14 text-white font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Admin Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 ml-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                  <Phone size={20} />
                </div>
                <input
                  type="tel"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-14 text-white font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="251..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 ml-1">Admin Secret Key</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors">
                  <Key size={20} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-14 text-white font-bold outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all"
                  placeholder="Enter Secret Key"
                  value={formData.adminSecret}
                  onChange={(e) => setFormData({ ...formData, adminSecret: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 ml-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary/50 transition-all"
                  placeholder="••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 ml-1">Confirm</label>
                <input
                  type="password"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary/50 transition-all"
                  placeholder="••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-secondary font-black py-5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-primary/20 mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>REGISTER ADMIN</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <Link to="/admin/login" className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
              Already have admin access? Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
