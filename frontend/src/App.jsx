import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Recharge from './pages/Recharge';
import Withdraw from './pages/Withdraw';
import BankAccount from './pages/BankAccount';
import Transactions from './pages/Transactions';
import ChangePassword from './pages/security/ChangePassword';
import WithdrawPassword from './pages/security/WithdrawPassword';
import Referrals from './pages/Referrals';
import RoiHistory from './pages/RoiHistory';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user && user.is_admin;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-grow ${isAdmin ? '' : 'pb-20 md:pb-0'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recharge" element={<Recharge />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/bank-account" element={<BankAccount />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/security/change-password" element={<ChangePassword />} />
          <Route path="/security/withdraw-password" element={<WithdrawPassword />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/roi-history" element={<RoiHistory />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          {import.meta.env.VITE_ALLOW_ADMIN_REGISTER === 'false' && (
            <Route path="/admin/register" element={<AdminRegister />} />
          )}
        </Routes>
      </main>
      <BottomNav />
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
