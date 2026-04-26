import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, Users, ArrowRight, Wallet, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: "https://plus.unsplash.com/premium_photo-1681487769650-a0c3fbaed81a?q=80&w=2070&auto=format&fit=crop",
      title: "Global Investment",
      desc: "Secure your future with 20% daily returns."
    },
    {
      image: "https://plus.unsplash.com/premium_photo-1670249421217-063996775f05?q=80&w=2070&auto=format&fit=crop",
      title: "Smart Analytics",
      desc: "Track your earnings with professional tools."
    },
    {
      image: "https://plus.unsplash.com/premium_photo-1661775751760-1db05b1ed93f?q=80&w=2070&auto=format&fit=crop",
      title: "Fast Withdrawals",
      desc: "Automated payouts via Telebirr and CBE."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/investments/plans`);
        setPlans(response.data);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        toast.error('Failed to load investment plans');
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const handleBuyPlan = async (plan) => {
    if (!user) {
      toast.info('Please login to buy a plan');
      navigate('/login');
      return;
    }

    if (user.wallet_balance < plan.amount) {
      toast.error('Insufficient balance! Please recharge your wallet.');
      navigate('/recharge');
      return;
    }

    if (window.confirm(`Buy ${plan.id.toUpperCase()} for ${plan.amount} ETB?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${import.meta.env.VITE_API_URL}/investments/buy-plan`, 
          { planId: plan.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        toast.success(`Plan ${plan.id.toUpperCase()} activated! Rewards distributed.`);
        navigate('/dashboard');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Purchase failed');
      }
    }
  };

  return (
    <div className="bg-secondary overflow-hidden">
      {/* Slider Section (Only seen after login or as top banner) */}
      <section className="relative h-[300px] md:h-[500px] w-full overflow-hidden mt-20">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img 
              src={slides[currentSlide].image} 
              alt={slides[currentSlide].title}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center px-8 md:px-24">
              <div className="max-w-xl">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter"
                >
                  {slides[currentSlide].title}
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-sm md:text-lg text-gray-300 font-medium"
                >
                  {slides[currentSlide].desc}
                </motion.p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Controls */}
        <div className="absolute bottom-6 right-8 md:right-24 flex gap-4 z-20">
          <button 
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 transition-all duration-500 rounded-full ${currentSlide === i ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`}
            />
          ))}
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center py-20">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://plus.unsplash.com/premium_photo-1670249421217-063996775f05?q=80&w=2070&auto=format&fit=crop"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-10"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary to-secondary"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-6"
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">SYC Capital Network</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-8xl font-black mb-8 leading-tight tracking-tighter"
            >
              INVEST IN THE <br />
              <span className="gold-text">FUTURE OF WEALTH</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Experience a premium investment ecosystem. Earn <span className="text-primary font-bold">20% Daily Profit</span> with secure, bank-verified transactions.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              {user ? (
                <>
                  <Link to="/dashboard" className="btn-primary text-lg px-10 py-5 w-full sm:w-auto flex items-center justify-center gap-3">
                    MY ACCOUNT <ArrowRight size={20} />
                  </Link>
                  <Link to="/recharge" className="btn-outline text-lg px-10 py-5 w-full sm:w-auto">
                    RECHARGE WALLET
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-10 py-5 w-full sm:w-auto flex items-center justify-center gap-3">
                    START INVESTING <ArrowRight size={20} />
                  </Link>
                  <Link to="/login" className="btn-outline text-lg px-10 py-5 w-full sm:w-auto">
                    MEMBER LOGIN
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-10 left-0 w-full hidden lg:block">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-4 gap-8 glass-morphism p-8 rounded-3xl">
              {[
                { label: 'Active Users', value: '12.5K+', icon: <Users className="text-primary" /> },
                { label: 'Total Invested', value: '50M+ ETB', icon: <Wallet className="text-primary" /> },
                { label: 'Daily Payouts', value: '2M+ ETB', icon: <TrendingUp className="text-primary" /> },
                { label: 'Platform Security', value: '99.9%', icon: <Shield className="text-primary" /> },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4 border-r last:border-0 border-white/10">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">{stat.icon}</div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{stat.label}</p>
                    <p className="text-xl font-black text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-32 relative bg-secondary-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Investment Tiers</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter">SELECT YOUR <span className="gold-text">PACKAGE</span></h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loadingPlans ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="card h-[500px] animate-pulse bg-secondary-light/50"></div>
              ))
            ) : plans.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-500 font-black uppercase tracking-widest">No investment plans available at the moment.</p>
              </div>
            ) : (
              plans.map((plan, index) => {
                const dailyReturn = plan.amount * (plan.daily_profit_percent / 100);
                const totalProfit = dailyReturn * (plan.duration_days || 65);
                
                return (
                  <motion.div 
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="card p-0 overflow-hidden group hover:-translate-y-2 transition-all duration-500"
                  >
                    <div className="h-48 bg-secondary-dark relative overflow-hidden">
                      {plan.image_url ? (
                        <img src={plan.image_url} alt={plan.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gold-gradient/10 group-hover:bg-gold-gradient/20 transition-colors">
                          <TrendingUp className="text-primary/40 group-hover:scale-125 transition-transform duration-700" size={64} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 glass-morphism px-4 py-1.5 rounded-full">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{plan.name}</span>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="mb-6">
                        <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Investment Amount</p>
                        <h4 className="text-4xl font-black text-white">{plan.amount.toLocaleString()} <span className="text-sm font-bold text-primary">ETB</span></h4>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                          <span className="text-sm text-gray-400">Daily Return</span>
                          <span className="text-lg font-black text-accent">+{dailyReturn.toLocaleString()} ETB</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                          <span className="text-sm text-gray-400">ROI Percent</span>
                          <span className="text-lg font-black text-white">{plan.daily_profit_percent}%</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                          <span className="text-sm text-gray-400">Contract Term</span>
                          <span className="text-lg font-black text-white">{plan.duration_days || 65} Days</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-sm text-gray-400">Total Profit</span>
                          <span className="text-xl font-black gold-text">{totalProfit.toLocaleString()} ETB</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleBuyPlan(plan)}
                        className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3"
                      >
                        <ShoppingCart size={18} /> BUY NOW
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
