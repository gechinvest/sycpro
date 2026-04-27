import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Logo from '../components/Logo';

const Register = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
    }
  }, [location]);

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
      // Generate dummy email and name for backend compatibility
      const submissionData = {
        ...formData,
        phone: normalizedPhone,
        email: `${normalizedPhone}@smartyield.net`,
        fullName: `User ${normalizedPhone.slice(-4)}`
      };
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, submissionData);
      toast.success(response.data.message || 'Registration successful! Please log in.');
      navigate('/login', { state: { phone: normalizedPhone } });
    } catch (error) {
      console.error('Registration error details:', error);
      const errorData = error.response?.data;
      const errorMsg = errorData?.message || error.message || 'Registration failed';
      const errorDetails = errorData?.details ? `\nDetails: ${errorData.details}` : '';
      
      toast.error(`${errorMsg}${errorDetails}`, {
        autoClose: 10000 // Keep visible longer
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-secondary relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block transform hover:scale-105 transition-transform duration-500">
            <Logo size="lg" />
          </div>
          <h2 className="text-xs font-black text-primary uppercase tracking-[0.4em] mt-8 mb-2">SmartYield Capital</h2>
          <h3 className="text-5xl font-black tracking-tighter uppercase text-white">Register</h3>
        </div>

        <div className="bg-secondary-light/30 backdrop-blur-2xl p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3 ml-1">Phone Number</label>
              <div className="relative group">
                <input
                  type="tel"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-700"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3 ml-1">Secure Password</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-700"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3 ml-1">Confirm Password</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-700"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full bg-primary hover:bg-primary-light text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center space-y-4">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
              Already have an account? <Link to="/login" className="text-primary hover:text-white transition-colors underline underline-offset-4">Sign In</Link>
            </p>
          </div>
      </div>
    </div>
  );
};

export default Register;
