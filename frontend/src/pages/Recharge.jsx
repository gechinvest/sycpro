import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Info, Wallet, TrendingUp, Shield, Users, Copy, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Recharge = () => {
  const navigate = useNavigate();
  const [paymentGateway, setPaymentGateway] = useState('telebirr');
  const [gateways, setGateways] = useState([]);
  const [quickAmounts, setQuickAmounts] = useState([500, 1000, 2500, 5000, 10000, 20000, 50000, 100000]);
  const [amount, setAmount] = useState('');
  const [ftId, setFtId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const [loadingGateways, setLoadingGateways] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingGateways(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [methodsRes, settingsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/investments/deposit-methods`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/investments/settings`, { headers })
        ]);
        
        const iconMap = {
          'telebirr': <TrendingUp size={16} />,
          'cbe': <CheckCircle size={16} />,
          'abyssinia': <Info size={16} />,
          'manual': <Upload size={16} />
        };

        const mappedGateways = (methodsRes.data || []).map(g => ({
          id: g.id,
          slug: g.slug,
          name: g.name,
          icon: iconMap[g.slug] || <Wallet size={16} />,
          account: g.account_number,
          owner: g.account_owner
        }));

        setGateways(mappedGateways);
        if (mappedGateways.length > 0) {
          setPaymentGateway(mappedGateways[0].slug);
        }

        if (settingsRes.data?.recharge_amounts) {
          setQuickAmounts(settingsRes.data.recharge_amounts);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError(error.response?.data?.message || 'Failed to load payment details');
        toast.error('Failed to load payment details');
      } finally {
        setLoadingGateways(false);
      }
    };

    fetchData();
  }, []);

  const handleCopy = async (text) => {
    const fallbackCopy = (content) => {
      const textArea = document.createElement("textarea");
      textArea.value = content;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          toast.success('Account number copied!');
        } else {
          toast.error('Failed to copy');
        }
      } catch (err) {
        console.error('Fallback copy failed:', err);
        toast.error('Failed to copy');
      }
      document.body.removeChild(textArea);
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success('Account number copied!');
        } catch (clipErr) {
          console.warn('Clipboard API failed, using fallback:', clipErr);
          fallbackCopy(text);
        }
      } else {
        fallbackCopy(text);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('General copy error:', err);
      toast.error('Failed to copy');
    }
  };

  const selectedGateway = gateways.find(g => g.slug === paymentGateway) || (gateways.length > 0 ? gateways[0] : null);

  if (loadingGateways) {
    return (
      <div className="min-h-screen bg-secondary pt-24 pb-12 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Loading Payment Methods...</p>
        </div>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.is_admin;

  const handleFileChange = (e) => {
      const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setScreenshot(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !ftId) {
      toast.error('Please enter amount and transaction ID');
      return;
    }

    // Manual payment requires screenshot
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('ftId', ftId);
    formData.append('gateway', paymentGateway);
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/investments/recharge`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success(response.data.message);
      
      // Reset form
      setAmount('');
      setFtId('');
      setScreenshot(null);
      setPreview(null);
      
      // Redirect to dashboard or transactions
      setTimeout(() => navigate('/transactions'), 2000);

    } catch (error) {
      console.error('Recharge Error:', error);
      toast.error(error.response?.data?.message || 'Recharge request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-12">
          <h1 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-2">Fund Your Account</h1>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">RECHARGE <span className="gold-text">WALLET</span></h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Select Amount */}
            <div className="card">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                <Wallet size={20} className="text-primary" /> 1. Select Amount
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className={`py-3 px-2 rounded-xl border font-black transition-all duration-300 ${
                      amount === amt.toString()
                        ? 'bg-primary text-black border-primary shadow-gold-glow'
                        : 'bg-secondary-dark text-gray-400 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {amt.toLocaleString()} ETB
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Or enter custom amount..."
                className="input-field text-center font-black text-xl py-4"
              />
            </div>

            {/* Step 2: Payment Method & Details */}
            <div className="card">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                <TrendingUp size={20} className="text-primary" /> 2. Payment Method
              </h3>
              
              {gateways.length === 0 ? (
                <div className="space-y-6">
                  <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center">
                    <Info size={40} className="text-red-500 mx-auto mb-4" />
                    <h4 className="text-white font-bold mb-2">No Payment Methods Available</h4>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">
                      {error || "We couldn't find any active payment methods. Please contact support or try again later."}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl">
                      <p className="text-yellow-500 text-xs font-black uppercase tracking-widest mb-3">Admin Setup Required</p>
                      <p className="text-gray-300 text-xs leading-relaxed mb-4">
                        The <strong>deposit_methods</strong> table is empty. You need to add at least one payment method (Telebirr, CBE, etc.) in the Admin Dashboard for users to recharge.
                      </p>
                      <button 
                        onClick={() => navigate('/admin')}
                        className="w-full btn-primary py-3 text-xs"
                      >
                        ADD PAYMENT METHOD
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {gateways.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setPaymentGateway(g.slug)}
                        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                          paymentGateway === g.slug 
                            ? 'border-primary bg-primary/10 text-primary shadow-gold-glow' 
                            : 'border-white/5 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        <div className={`${paymentGateway === g.slug ? 'text-primary' : 'text-gray-600'}`}>
                          {React.cloneElement(g.icon, { size: 24 })}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{g.name}</span>
                      </button>
                    ))}
                  </div>

                  {selectedGateway && (
                    <div className="bg-secondary-dark p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
                      
                      <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Deposit To</span>
                          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">{selectedGateway.name}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Account Number</p>
                            <p className="text-xl font-black text-white tracking-wider">{selectedGateway.account}</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleCopy(selectedGateway.account)}
                            className="p-3 bg-white/5 hover:bg-primary hover:text-black rounded-xl transition-all active:scale-90"
                          >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                        </div>

                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Account Name</span>
                          <span className="text-sm font-bold text-white uppercase">{selectedGateway.owner}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Step 3: Submission */}
            <form onSubmit={handleSubmit} className={`card space-y-6 transition-all duration-500 ${!selectedGateway ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                <Info size={20} className="text-primary" /> 3. Submit Transaction
              </h3>
              
              {!selectedGateway && (
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Please select a payment method above first</p>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Transaction FT ID / Reference</label>
                  <input
                    type="text"
                    value={ftId}
                    onChange={(e) => setFtId(e.target.value)}
                    placeholder="Enter FT... or Transaction ID"
                    className="input-field py-4"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Payment Screenshot (Required)</label>
                  <div className="relative h-56 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center hover:border-primary/40 transition-all group cursor-pointer overflow-hidden bg-black/20">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {preview ? (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
                          <Upload className="text-gray-600 group-hover:text-primary transition-colors" size={28} />
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Click to upload proof</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary py-6 text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-gold-glow"
              >
                {loading ? 'PROCESSING...' : 'CONFIRM DEPOSIT'} <CheckCircle size={20} />
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="card bg-gold-gradient/5 border-primary/20">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6">Security Info</h3>
              <div className="space-y-6">
                {[
                  { title: 'Encrypted', desc: 'All transactions are protected with 256-bit SSL encryption.', icon: <Shield size={18} /> },
                  { title: 'Verified', desc: 'Automatic verification uses official bank API nodes.', icon: <CheckCircle size={18} /> },
                  { title: 'Support', desc: 'Our finance team is available 24/7 for manual audits.', icon: <Users size={18} /> },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="text-primary">{item.icon}</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-widest mb-1">{item.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recharge;
