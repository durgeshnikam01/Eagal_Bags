import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  LogOut, LayoutDashboard, Users, ShoppingCart, 
  Activity, Package, Settings, Bell, Search, Menu, X,
  Layers, ShoppingBag, CreditCard, Truck, ShieldCheck, BarChart3,
  Moon, Sun, CheckCircle2, AlertTriangle, MessageCircle, Box
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProtectedLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, type: 'alert', title: 'Critical Stock: HDPE Granules', time: '5m ago', icon: AlertTriangle, color: 'text-rose-500' },
    { id: 2, type: 'info', title: 'New Sales Inquiry: Maruti Poly', time: '1h ago', icon: MessageCircle, color: 'text-blue-500' },
    { id: 3, type: 'success', title: 'Batch #2814 Completed QC', time: '3h ago', icon: CheckCircle2, color: 'text-emerald-500' },
    { id: 4, type: 'process', title: 'Order #9012 Released to Floor', time: '5h ago', icon: Box, color: 'text-amber-500' },
  ];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const sections = [
    {
      title: 'Sales & Orders',
      items: [
        { name: '1. Sales & Inquiry', href: '/sales-inquiry', icon: Search },
        { name: '2. Order Management', href: '/order-management', icon: ShoppingCart },
      ]
    },
    {
      title: 'Planning & Supply',
      items: [
        { name: '3. Production Planning', href: '/production-planning', icon: Layers },
        { name: '4. Inventory Master', href: '/inventory-management', icon: Package },
        { name: '5. Purchase Flow', href: '/purchase-management', icon: ShoppingBag },
      ]
    },
    {
      title: 'Factory Floor',
      items: [
        { name: '6. Production Tracking', href: '/production-tracking', icon: Activity },
        { name: '7. Quality Control', href: '/quality-control', icon: ShieldCheck },
        { name: '8. Dispatch & Logistics', href: '/dispatch-logistics', icon: Truck },
      ]
    },
    {
      title: 'Administration',
      items: [
        { name: '9. Billing & Payments', href: '/accounts-billing', icon: CreditCard },
        { name: '10. Executive Reports', href: '/executive-reports', icon: BarChart3 },
      ]
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth <= 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:relative w-72 h-full flex-shrink-0 bg-gray-950 text-white flex flex-col z-50 shadow-2xl"
          >
            <div className="h-24 flex items-center justify-between px-8 bg-gray-900 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Package className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight uppercase">Eagle ERP</h1>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Industry v1.0</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-8 px-4 space-y-10">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="px-5 text-[9px] font-black text-gray-600 uppercase tracking-[0.25em] mb-5">{section.title}</p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => window.innerWidth <= 1024 && setIsSidebarOpen(false)}
                          className={`flex items-center px-5 py-3.5 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                          <item.icon size={18} className={`mr-4 transition-colors ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-primary'}`} />
                          <span className="text-xs font-black uppercase tracking-wider">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-900 border-t border-white/5">
              <div className="flex items-center space-x-4 mb-8 px-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-lg font-black shadow-xl border border-white/10">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="w-full flex items-center justify-center px-4 py-4 bg-white/5 hover:bg-rose-500/10 text-gray-500 hover:text-rose-500 rounded-[20px] transition-all text-[10px] font-black uppercase tracking-[0.2em] border border-white/5"
              >
                <LogOut size={16} className="mr-3" />
                Terminate Session
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-50 dark:bg-black">
        <header className="h-24 flex items-center justify-between px-6 lg:px-12 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-b border-gray-100 dark:border-white/5 z-20">
          <div className="flex items-center space-x-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-2xl transition-all">
              <Menu size={22} />
            </button>
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Query system intelligence..." 
                className="pl-12 pr-6 py-3.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest w-80 focus:ring-2 focus:ring-primary/20 transition-all dark:text-gray-200"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 lg:space-x-5">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={isDarkMode ? 'dark' : 'light'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.3 }}>
                  {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
                </motion.div>
              </AnimatePresence>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-3 rounded-2xl transition-all relative ${showNotifications ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:text-primary hover:bg-primary/5'}`}
              >
                <Bell size={22} />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-gray-950"></span>
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} className="fixed inset-0 z-30" />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-96 bg-white dark:bg-gray-950 rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/5 z-40 overflow-hidden"
                    >
                      <div className="p-8 border-b border-gray-50 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                         <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Active Alerts</h3>
                         <span className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg">4 New</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                         {notifications.map((n) => (
                           <div key={n.id} className="p-6 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                             <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm ${n.color}`}><n.icon size={18} /></div>
                                <div className="flex-1">
                                   <p className="text-xs font-black text-gray-800 dark:text-gray-200 leading-snug group-hover:text-primary transition-colors">{n.title}</p>
                                   <p className="text-[10px] text-gray-400 font-bold mt-2">{n.time}</p>
                                </div>
                             </div>
                           </div>
                         ))}
                      </div>
                      <button className="w-full py-5 text-[10px] font-black text-primary uppercase tracking-[0.25em] bg-gray-50 dark:bg-white/5 hover:bg-primary hover:text-white transition-all">Clear All History</button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-10 w-px bg-gray-100 dark:bg-white/5 mx-2 hidden sm:block"></div>
            <button className="p-3 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all">
              <Settings size={22} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black">
          <div className="w-full px-6 lg:px-12 py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
