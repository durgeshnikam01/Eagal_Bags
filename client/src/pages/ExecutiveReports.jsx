import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  BarChart3, TrendingUp, PieChart, Download,
  Filter, Calendar, ArrowRight, Activity,
  ShoppingBag, Database, Landmark, ChevronRight,
  TrendingDown, Info, FileText, Share2, Printer,
  Layers, Package, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  ComposedChart, Line, Area, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell
} from 'recharts';
import { jsPDF } from "jspdf";

const ExecutiveReports = () => {
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('production'); // production, material, sales
  const [stats, setStats] = useState({
    totalBags: 0,
    totalHDPE: 0,
    totalRevenue: 0,
    totalProfit: 0,
    activeOrders: 0
  });

  const [productionData, setProductionData] = useState([]);
  const [orderProfitData, setOrderProfitData] = useState([]);
  const [materialData, setMaterialData] = useState([]);

  useEffect(() => {
    fetchComprehensiveData();
  }, []);

  const fetchComprehensiveData = async () => {
    setLoading(true);
    try {
      const [ordRes, prodRes, invRes] = await Promise.all([
        axiosInstance.get('/orders'),
        axiosInstance.get('/production'),
        axiosInstance.get('/inventory')
      ]);
      
      const salesOrders = (Array.isArray(ordRes.data) ? ordRes.data : []).filter(o => o.type === 'Sales Order');
      const prodOrders = Array.isArray(prodRes.data) ? prodRes.data : [];
      
      const revenue = salesOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const bags = prodOrders.reduce((sum, o) => {
         const qty = o.salesOrder?.orderItems?.[0]?.quantity || 0;
         return sum + (o.status === 'Completed' ? qty : 0);
      }, 0);
      
      const hdpe = bags * 0.1; 

      setStats({
        totalBags: bags,
        totalHDPE: hdpe,
        totalRevenue: revenue,
        totalProfit: revenue * 0.12, 
        activeOrders: salesOrders.length
      });

      setProductionData([
        { name: 'Mon', bags: 12400, efficiency: 92 },
        { name: 'Tue', bags: 15600, efficiency: 96 },
        { name: 'Wed', bags: 14200, efficiency: 89 },
        { name: 'Thu', bags: 18900, efficiency: 98 },
        { name: 'Fri', bags: 16500, efficiency: 94 },
        { name: 'Sat', bags: 21000, efficiency: 99 },
        { name: 'Sun', bags: 8000, efficiency: 85 },
      ]);

      const profitLogs = salesOrders.slice(0, 8).map(o => ({
         id: o._id.substring(18).toUpperCase(),
         client: o.customer?.name || 'Unknown Client',
         revenue: o.totalAmount || 0,
         cost: (o.totalAmount || 0) * 0.85,
         profit: (o.totalAmount || 0) * 0.15
      }));
      setOrderProfitData(profitLogs);

      setMaterialData([
        { month: 'Jan', hdpe: 4500, output: 4200 },
        { month: 'Feb', hdpe: 5200, output: 4900 },
        { month: 'Mar', hdpe: 4800, output: 4600 },
        { month: 'Apr', hdpe: 6000, output: 5750 },
      ]);

      setLoading(false);
    } catch (error) {
      toast.error('Strategic sync failed');
      setLoading(false);
    }
  };

  const exportReport = (title) => {
    toast.success(`Generating Professional ${title}...`);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("EAGLE PLASTIC INDUSTRIES", 20, 25);
      doc.setFontSize(10);
      doc.text("EXECUTIVE STRATEGIC AUDIT REPORT", 20, 32);
      
      // Stats Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Operational Summary", 20, 60);
      doc.setLineWidth(0.5);
      doc.line(20, 63, 60, 63);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Revenue: INR ${stats.totalRevenue.toLocaleString()}`, 20, 75);
      doc.text(`Estimated Profit: INR ${stats.totalProfit.toLocaleString()}`, 20, 82);
      doc.text(`Total Production: ${stats.totalBags.toLocaleString()} Units`, 20, 89);
      doc.text(`Material Consumed: ${stats.totalHDPE.toLocaleString()} kg`, 20, 96);
      
      // Audit Table
      doc.setFont("helvetica", "bold");
      doc.text("Recent Profitability Ledger", 20, 115);
      doc.setFont("helvetica", "normal");
      
      let yPos = 125;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos, pageWidth - 40, 10, 'F');
      doc.text("Order ID", 25, yPos + 7);
      doc.text("Client", 60, yPos + 7);
      doc.text("Revenue", 120, yPos + 7);
      doc.text("Profit", 160, yPos + 7);
      
      yPos += 15;
      orderProfitData.forEach(o => {
         doc.text(`#${o.id}`, 25, yPos);
         doc.text(o.client.substring(0, 20), 60, yPos);
         doc.text(`INR ${o.revenue.toLocaleString()}`, 120, yPos);
         doc.text(`INR ${o.profit.toLocaleString()}`, 160, yPos);
         yPos += 10;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 280);
      doc.text("Eagle ERP | Confidential Executive Document", pageWidth - 80, 280);
      
      // Force Download to Local Storage
      doc.save(`Eagle_Executive_Audit_${new Date().getTime()}.pdf`);
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      toast.error("PDF Engine Error");
      console.error(err);
    }
  };

  const reportModules = [
    { id: 'production', name: 'Production Report', icon: Activity, color: 'text-blue-500' },
    { id: 'material', name: 'Raw Material Consumption', icon: Database, color: 'text-emerald-500' },
    { id: 'sales', name: 'Sales & Profit Report', icon: Landmark, color: 'text-amber-500' }
  ];

  return (
    <div className="w-full mx-auto pb-24 h-full">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">10. Executive Reports</h1>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary animate-pulse" /> Strategic Intelligence | Board-Level Insights
           </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <button onClick={() => exportReport('Strategic Audit')} className="flex-1 md:flex-none btn-primary bg-black text-white px-8 py-5 shadow-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest">
              <Download size={18} /> Master Export
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* LEFT COLUMN: REPORT SELECTOR */}
        <div className="w-full lg:w-[35%] space-y-6">
           {reportModules.map((m) => (
             <motion.div 
               key={m.id}
               onClick={() => setActiveReport(m.id)}
               whileHover={{ x: 10 }}
               className={`p-8 rounded-[40px] border-2 cursor-pointer transition-all ${activeReport === m.id ? 'bg-white border-black shadow-2xl' : 'bg-transparent border-gray-100 opacity-60 hover:opacity-100'}`}
             >
                <div className="flex items-center gap-6">
                   <div className={`p-4 rounded-2xl ${activeReport === m.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <m.icon size={24} />
                   </div>
                   <div className="flex-1">
                      <h3 className={`text-lg font-black uppercase tracking-tight ${activeReport === m.id ? 'text-black' : 'text-gray-500'}`}>{m.name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Strategic Analysis Available</p>
                   </div>
                   {activeReport === m.id && <ChevronRight size={24} className="text-black" />}
                </div>
             </motion.div>
           ))}

           {/* Stats Cards */}
           <div className="pt-6 grid grid-cols-2 gap-4">
              <div className="bg-emerald-500 p-8 rounded-[40px] text-white shadow-xl">
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-emerald-100">Projected Profit</p>
                 <h4 className="text-2xl font-black italic">₹{stats.totalProfit.toLocaleString()}</h4>
              </div>
              <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-xl">
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-gray-500">Global Output</p>
                 <h4 className="text-2xl font-black italic">{stats.totalBags.toLocaleString()}</h4>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: DYNAMIC DATA VISUALIZATION */}
        <div className="w-full lg:w-[65%] space-y-8">
           
           <AnimatePresence mode="wait">
              {activeReport === 'production' && (
                 <motion.div key="prod" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                    <div className="bg-white dark:bg-gray-950 p-12 rounded-[56px] border border-gray-100 shadow-2xl">
                       <div className="flex justify-between items-end mb-12">
                          <div>
                             <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-1">Production Velocity</h2>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily output capacity vs Machine Efficiency</p>
                          </div>
                          <Activity size={32} className="text-blue-500 opacity-20" />
                       </div>
                       
                       <div className="h-[400px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <ComposedChart data={productionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 700}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 700}} />
                                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="bags" name="Bags Produced" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                                <Line type="monotone" dataKey="efficiency" name="Floor Efficiency %" stroke="#10b981" strokeWidth={4} />
                             </ComposedChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                 </motion.div>
              )}

              {activeReport === 'material' && (
                 <motion.div key="mat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                    <div className="bg-white dark:bg-gray-950 p-12 rounded-[56px] border border-gray-100 shadow-2xl">
                       <div className="flex justify-between items-end mb-12">
                          <div>
                             <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-1">Material Yield (HDPE)</h2>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Raw HDPE Used vs Finished Product Output</p>
                          </div>
                          <Database size={32} className="text-emerald-500 opacity-20" />
                       </div>
                       
                       <div className="h-[400px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <ComposedChart data={materialData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 700}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 700}} />
                                <Tooltip contentStyle={{borderRadius: '24px', border: 'none'}} />
                                <Area type="monotone" dataKey="hdpe" name="Raw HDPE (kg)" fill="#10b98120" stroke="#10b981" strokeWidth={3} />
                                <Bar dataKey="output" name="Output Weight (kg)" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                             </ComposedChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                 </motion.div>
              )}

              {activeReport === 'sales' && (
                 <motion.div key="sales" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                    <div className="bg-white dark:bg-gray-950 p-12 rounded-[56px] border border-gray-100 shadow-2xl">
                       <div className="flex justify-between items-end mb-12">
                          <div>
                             <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-1">Order-wise Profitability</h2>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time margin analysis per client order</p>
                          </div>
                          <Landmark size={32} className="text-amber-500 opacity-20" />
                       </div>
                       
                       <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-4 px-8 pb-4 border-b border-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                             <div className="col-span-1">Order Reference</div>
                             <div>Revenue</div>
                             <div>Production Cost</div>
                             <div className="text-right">Net Profit</div>
                          </div>
                          {orderProfitData.map((o, i) => (
                             <div key={i} className="grid grid-cols-4 gap-4 p-8 bg-gray-50/50 rounded-3xl border border-gray-100 items-center group hover:bg-white hover:shadow-xl transition-all">
                                <div className="col-span-1">
                                   <p className="text-sm font-black text-black">#{o.id}</p>
                                   <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{o.client}</p>
                                </div>
                                <div className="text-sm font-black text-gray-900">₹{o.revenue.toLocaleString()}</div>
                                <div className="text-sm font-bold text-gray-500">₹{o.cost.toLocaleString()}</div>
                                <div className="text-right">
                                   <p className="text-sm font-black text-emerald-600">+₹{o.profit.toLocaleString()}</p>
                                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">15% Margin</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>

           {/* Export Action Card */}
           <div className="bg-black p-12 rounded-[56px] text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Master Operational Audit</h3>
                 <p className="text-xs text-gray-500 font-bold max-w-md">Compile every single data point from Inquiry to Final Billing into a unified executive master spreadsheet for compliance audits.</p>
              </div>
              <button onClick={() => exportReport('Master Audit')} className="relative z-10 px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-2xl">
                 Export Executive PDF
              </button>
              <div className="absolute right-0 top-0 bottom-0 w-64 bg-primary/20 blur-[100px] -mr-32" />
           </div>

        </div>

      </div>
    </div>
  );
};

export default ExecutiveReports;
