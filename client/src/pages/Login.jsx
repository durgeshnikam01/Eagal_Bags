import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { Package, ArrowRight, Lock, Mail, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../services/api/axiosInstance';

const Login = () => {
  console.log('Current API Base URL:', axiosInstance.defaults.baseURL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const { isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      toast.success('Welcome back, Eagle Industries!');
      navigate('/dashboard');
    } else {
      toast.error('Authentication failed. Check credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-5xl flex bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 z-10 mx-4">
        {/* Left Side - Visual */}
        <div className="hidden lg:flex flex-1 bg-gray-900 relative p-16 flex-col justify-between">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40">
                <Package className="text-white" size={28} />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight italic">EAGLE ERP</h1>
            </div>
            <h2 className="text-5xl font-black text-white leading-[1.1] mb-6">
              Precision Manufacturing <br />
              <span className="text-primary italic">Cloud Management.</span>
            </h2>
            <p className="text-gray-400 text-lg font-medium max-w-sm">
              The all-in-one industrial ERP solution for HDPE woven bag manufacturing.
            </p>
          </div>

          <div className="relative z-10 flex items-center space-x-8">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">500+</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Orders</span>
            </div>
            <div className="w-px h-8 bg-gray-700"></div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">99.9%</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Uptime Record</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-12 md:p-20 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="mb-10 text-center lg:text-left">
              <h3 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h3>
              <p className="text-gray-500 font-medium">Enter your credentials to access the floor.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="name@eagle.com"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-1">
                <input type="checkbox" className="w-4 h-4 rounded-md border-gray-300 text-primary focus:ring-primary/20" />
                <span className="text-xs font-bold text-gray-500">Keep me logged in for 30 days</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group btn-primary py-4 text-sm"
              >
                {isLoading ? 'Establishing Link...' : 'Authorize & Enter'}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-center space-x-6 grayscale opacity-30">
              <Activity size={24} />
              <Package size={24} />
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Enterprise Secure</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
