import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  ShoppingCart, Users, Package, Activity, 
  TrendingUp, ArrowUpRight, ArrowDownRight, 
  Calendar, ChevronRight, X, Download, Eye,
  BarChart3, PieChart, Layers, IndianRupee,
  Search, ShoppingBag, ShieldCheck, Truck, CreditCard
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
  ComposedChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    orders: 0,
    customers: 0,
    production: 0,
    inventory: 0,
    revenue: 0,
    activeQuotations: 0
  });
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [timeRange, setTimeRange] = useState('30'); // '7', '30', '90'
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, customersRes, productionRes, inventoryRes] = await Promise.all([
        axiosInstance.get('/orders'),
        axiosInstance.get('/customers'),
        axiosInstance.get('/production'),
        axiosInstance.get('/inventory'),
      ]);

      const orders = ordersRes.data;
      setAllOrders(orders);
      
      // Filter by time range
      const now = new Date();
      const filtered = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        return diffDays <= parseInt(timeRange);
      });
      setFilteredOrders(filtered);

      const totalRevenue = filtered.reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        orders: filtered.length,
        customers: customersRes.data.length,
        production: productionRes.data.filter(o => o.status === 'In Production').length,
        inventory: inventoryRes.data.length,
        revenue: totalRevenue,
        activeQuotations: filtered.filter(o => o.type === 'Quotation').length
      });
      setLoading(false);
    } catch (error) {
      toast.error('Failed to sync dashboard data');
      setLoading(false);
    }
  };

  // Generate real chart data from orders
  const chartData = filteredOrders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
    const existing = acc.find(d => d.name === date);
    if (existing) {
      existing.sales += order.totalAmount;
      existing.production += order.type === 'Sales Order' ? 1 : 0;
    } else {
      acc.push({ name: date, sales: order.totalAmount, production: order.type === 'Sales Order' ? 1 : 0 });
    }
    return acc;
  }, []).slice(-7); // Last 7 days of activity in the range

  if (chartData.length === 0) {
    // Fallback data if no orders in range
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(d => {
      chartData.push({ name: d, sales: 0, production: 0 });
    });
  }

  const statCards = [
    { title: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, change: '+12.5%', trend: 'up', icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-100/50' },
    { title: 'New Orders', value: stats.orders, change: '+5.4%', trend: 'up', icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
    { title: 'Live Production', value: stats.production, change: 'Active', trend: 'up', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
    { title: 'Quotations', value: stats.activeQuotations, change: 'Pending', trend: 'up', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-100/50' },
  ];

  const handleDownloadReport = () => {
    toast.success('Generating report...');
    // Logic for actual CSV download could go here
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Operational Insights</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Real-time performance metrics and enterprise overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm items-center">
            {['7', '30', '90'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${timeRange === range ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {range}D
              </button>
            ))}
          </div>
          <button onClick={() => setShowReportModal(true)} className="btn-primary py-3 px-6 shadow-xl shadow-primary/20 flex items-center">
            <BarChart3 size={18} className="mr-2" /> View Analytics
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <motion.div 
            key={index}
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-900 p-6 lg:p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4 lg:mb-6">
              <div className={`p-3 lg:p-4 rounded-2xl ${stat.bg} ${stat.color} transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:scale-110 shadow-sm`}>
                <stat.icon size={20} className="lg:w-6 lg:h-6" />
              </div>
              <div className={`flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                <span>{stat.change}</span>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">{loading ? '...' : stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Command Center - Quick Access Modules */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">System Command Center</h3>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-4 py-2 rounded-xl">All Modules Operational</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            { id: 1, name: 'Sales & Inquiry', href: '/sales-inquiry', icon: Search, color: 'text-blue-500' },
            { id: 2, name: 'Order Mgmt', href: '/order-management', icon: ShoppingCart, color: 'text-indigo-500' },
            { id: 3, name: 'Prod. Planning', href: '/production-planning', icon: Layers, color: 'text-purple-500' },
            { id: 4, name: 'Inventory Mgmt', href: '/inventory-management', icon: Package, color: 'text-rose-500' },
            { id: 5, name: 'Purchase Mgmt', href: '/purchase-management', icon: ShoppingBag, color: 'text-orange-500' },
            { id: 6, name: 'Prod. Tracking', href: '/production-tracking', icon: Activity, color: 'text-emerald-500' },
            { id: 7, name: 'Quality Control', href: '/quality-control', icon: ShieldCheck, color: 'text-teal-500' },
            { id: 8, name: 'Dispatch & Log', href: '/dispatch-logistics', icon: Truck, color: 'text-sky-500' },
            { id: 9, name: 'Accounts & Bill', href: '/accounts-billing', icon: CreditCard, color: 'text-emerald-600' },
            { id: 10, name: 'Executive Reports', href: '/executive-reports', icon: BarChart3, color: 'text-slate-700' },
          ].map((m) => (
            <Link
              key={m.id}
              to={m.href}
              className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center group transition-all hover:shadow-xl hover:border-primary/20"
            >
              <div className={`p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 ${m.color} mb-4 group-hover:bg-primary group-hover:text-white transition-all`}>
                <m.icon size={24} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Module {m.id}</p>
              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase">{m.name}</h4>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-10 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2 text-primary mb-1">
                <TrendingUp size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Performance</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Revenue Velocity</h3>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Period Total</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">₹{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="h-10 w-px bg-gray-100 dark:bg-gray-800" />
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg. Daily</p>
                <p className="text-xl font-black text-emerald-500">₹{(stats.revenue / parseInt(timeRange)).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="0" 
                  vertical={false} 
                  stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} 
                  strokeWidth={1}
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 900}} 
                  dy={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 900}}
                />
                <Tooltip 
                  cursor={{ stroke: isDarkMode ? '#374151' : '#f3f4f6', strokeWidth: 40, strokeOpacity: 0.4 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-800 ring-1 ring-black/5 animate-in fade-in zoom-in duration-300">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{label} Analysis</p>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-12">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</span>
                              </div>
                              <span className="text-lg font-black text-gray-900 dark:text-white">₹{payload[0].value.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-12 pt-3 border-t border-gray-50 dark:border-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Volume</span>
                              </div>
                              <span className="text-lg font-black text-emerald-500">{payload[1].value} Units</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Background Bars for Volume */}
                <Bar 
                  dataKey="production" 
                  fill="url(#barGradient)" 
                  radius={[8, 8, 0, 0]} 
                  barSize={32}
                />

                {/* Primary Revenue Area */}
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  fill="url(#revenueGradient)" 
                  stroke="none"
                />

                {/* Main Glowing Line */}
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: isDarkMode ? '#030712' : '#fff' }}
                  activeDot={{ r: 10, fill: '#6366f1', strokeWidth: 4, stroke: isDarkMode ? '#1f2937' : '#f3f4f6', shadow: '0 0 20px rgba(99,102,241,0.6)' }}
                  animationDuration={2500}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Volume</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Department Load */}
        <div className="bg-white dark:bg-gray-900 p-10 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="mb-10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Floor Efficiency</h3>
          </div>
          <div className="space-y-10">
            {[
              { label: 'Extrusion', val: 75, color: 'bg-blue-500', icon: BarChart3 },
              { label: 'Weaving', val: 45, color: 'bg-emerald-500', icon: PieChart },
              { label: 'Lamination', val: 90, color: 'bg-amber-500', icon: Layers },
            ].map((unit, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{unit.label}</span>
                  <span className="text-xs font-black text-gray-900 dark:text-white">{unit.val}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${unit.color}`} style={{ width: `${unit.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReportModal(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-6xl bg-white dark:bg-gray-950 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-10 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">Operational Performance Audit</h3>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-3 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"><X size={28} /></button>
              </div>
              <div className="flex-1 overflow-x-auto p-4 lg:p-10">
                <div className="min-w-[800px]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Order ID</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Client Account</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Type</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Value</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Operational Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.length === 0 ? (
                        <tr><td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold">No transactions found in this period.</td></tr>
                      ) : (
                        filteredOrders.map((o) => (
                          <tr key={o._id} className="text-sm font-bold text-gray-700 hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-6 font-mono text-xs text-primary">#{o._id.substring(18).toUpperCase()}</td>
                            <td className="px-8 py-6">{o.customer?.name}</td>
                            <td className="px-8 py-6 text-center">
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${o.type === 'Quotation' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{o.type}</span>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-gray-900">₹{o.totalAmount.toLocaleString()}</td>
                            <td className="px-8 py-6 text-right">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">{o.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-10 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Period Value: <span className="text-gray-900 ml-2">₹{stats.revenue.toLocaleString()}</span></div>
                <button className="btn-primary py-4 px-10 shadow-lg shadow-primary/20" onClick={handleDownloadReport}>
                  <Download size={20} className="mr-3" /> Export Audit Log (.CSV)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;
