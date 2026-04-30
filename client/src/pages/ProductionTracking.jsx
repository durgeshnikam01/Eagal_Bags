import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import {
  Activity, Search, CheckCircle2, Zap, TrendingUp, User, History,
  ArrowRight, Clock, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

// Stage definitions in the correct pipeline order
const PIPELINE_STAGES = ['Extrusion', 'Weaving', 'Lamination', 'Cutting', 'Printing'];

const STAGE_COLORS = {
  Pending:     'bg-gray-100 text-gray-400 border-gray-200',
  'In Progress': 'bg-amber-100 text-amber-600 border-amber-300 animate-pulse',
  Completed:   'bg-emerald-100 text-emerald-600 border-emerald-300',
};

const ProductionTracking = () => {
  const [productionOrders, setProductionOrders] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [logForm, setLogForm] = useState({ machineId: 'EX-01', operatorName: 'Amit Kumar' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProductionOrders();
  }, []);

  const fetchProductionOrders = async () => {
    try {
      const res = await axiosInstance.get('/production');
      const orders = Array.isArray(res.data) ? res.data : [];
      setProductionOrders(orders);
      // Keep activeJob in sync
      if (activeJob) {
        const updated = orders.find(o => o._id === activeJob._id);
        setActiveJob(updated || null);
      }
    } catch (error) {
      toast.error('Failed to load production orders');
    }
  };

  const handleUpdateProgress = async (orderId, stageName, status) => {
    setUpdating(true);
    try {
      const assignedTo = `${logForm.machineId} (${logForm.operatorName})`;
      await axiosInstance.put(`/production/${orderId}/stage`, { stage: stageName, status, assignedTo });
      toast.success(`${stageName} marked as ${status}`);
      await fetchProductionOrders();
    } catch (error) {
      toast.error('Progress update failed');
    } finally {
      setUpdating(false);
    }
  };

  // ─── Dynamic Analytics ───────────────────────────────────────────────────────
  const getDynamicAnalytics = () => {
    const workerMap = {};
    const machineMap = {
      'EX-01': { id: 'EX-01', type: 'Extrusion',  load: 0, status: 'Idle', job: '—' },
      'EX-02': { id: 'EX-02', type: 'Extrusion',  load: 0, status: 'Idle', job: '—' },
      'WV-04': { id: 'WV-04', type: 'Weaving',    load: 0, status: 'Idle', job: '—' },
      'LM-02': { id: 'LM-02', type: 'Lamination', load: 0, status: 'Idle', job: '—' },
      'CT-01': { id: 'CT-01', type: 'Cutting',    load: 0, status: 'Idle', job: '—' },
      'PR-01': { id: 'PR-01', type: 'Printing',   load: 0, status: 'Idle', job: '—' },
    };

    productionOrders.forEach(order => {
      const jobRef = `SO-${order.salesOrder?._id?.substring(18).toUpperCase() || '???'}`;
      const qty    = order.salesOrder?.orderItems?.[0]?.quantity || 1000;

      order.stages.forEach(stage => {
        if (!stage.assignedTo) return;
        const mId   = stage.assignedTo.includes(' (') ? stage.assignedTo.split(' (')[0] : stage.assignedTo;
        const wName = stage.assignedTo.includes(' (') ? stage.assignedTo.split(' (')[1].replace(')', '') : 'Operator';

        // Ensure machine exists in map
        if (!machineMap[mId]) {
          machineMap[mId] = { id: mId, type: 'Auxiliary', load: 0, status: 'Idle', job: '—' };
        }

        if (stage.status === 'In Progress') {
          machineMap[mId].status = 'Active';
          machineMap[mId].load   = 88;
          machineMap[mId].job    = jobRef;
        }

        if (stage.status === 'Completed') {
          if (!workerMap[wName]) {
            workerMap[wName] = { name: wName, shift: 'General', units: 0, stage: stage.stage };
          }
          workerMap[wName].units += qty;
          if (machineMap[mId].status !== 'Active') {
            machineMap[mId].job  = `Last: ${jobRef}`;
            machineMap[mId].load = 0;
          }
        }
      });
    });

    // Efficiency computed after accumulation
    Object.values(workerMap).forEach(w => {
      w.efficiency = `${Math.min(99, Math.round(88 + w.units / 10000))}%`;
    });

    const activeCount = Object.values(machineMap).filter(m => m.status === 'Active').length;
    const totalMachines = Object.keys(machineMap).length;
    const nowLoad = activeCount > 0 ? Math.round((activeCount / totalMachines) * 100) : 15;

    const trendData = [
      { time: '08:00', load: 45 },
      { time: '10:00', load: 62 },
      { time: '12:00', load: 88 },
      { time: '14:00', load: 75 },
      { time: 'Now',   load: nowLoad },
    ];

    return {
      machines: Object.values(machineMap),
      workers:  Object.values(workerMap).sort((a, b) => b.units - a.units),
      trend:    trendData,
    };
  };

  const analytics         = getDynamicAnalytics();
  const machineTelemetry  = analytics.machines;
  const utilizationTrend  = analytics.trend;
  // If no real workers yet, show demo data
  const workerEfficiency  = analytics.workers.length > 0 ? analytics.workers : [
    { name: 'Amit Kumar',  shift: 'Morning', efficiency: '96%', units: 12400, stage: 'Extrusion' },
    { name: 'Rajesh Shah', shift: 'Morning', efficiency: '89%', units: 9800,  stage: 'Weaving'   },
  ];

  // ─── Filter ───────────────────────────────────────────────────────────────────
  const filteredOrders = productionOrders.filter(o => {
    const term = searchTerm.toLowerCase();
    return (
      o.salesOrder?._id?.toLowerCase().includes(term) ||
      o.salesOrder?.customer?.name?.toLowerCase().includes(term) ||
      o.currentStage?.toLowerCase().includes(term)
    );
  });

  // ─── Stage bar helpers ────────────────────────────────────────────────────────
  const getStageStatus = (order, stageName) => {
    const s = order.stages.find(s => s.stage === stageName);
    return s?.status || 'Pending';
  };

  const completedCount = (order) =>
    order.stages.filter(s => s.status === 'Completed').length;

  return (
    <div className="w-full mx-auto pb-24 h-full">
      {/* Header */}
      <div className="mb-10 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">
            Production Tracking
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            Live Factory Floor — {productionOrders.length} Active Batches
          </p>
        </div>
        <button
          onClick={fetchProductionOrders}
          className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:shadow-md transition-all"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">

        {/* ── LEFT COLUMN ────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[46%] space-y-8">

          {/* ── Panel 01: Active Production Batches ───────────────── */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-5 mb-7">
              <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center font-black text-sm">01</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Production Batches</h3>
            </div>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                placeholder="Filter by order / customer..."
                className="w-full pl-14 pr-5 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-[28px] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Order List */}
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {filteredOrders.map(order => {
                const isActive = activeJob?._id === order._id;
                const done     = completedCount(order);
                const total    = order.stages.length;

                return (
                  <motion.div
                    key={order._id}
                    layout
                    onClick={() => setActiveJob(isActive ? null : order)}
                    className={`p-5 rounded-[28px] border-2 cursor-pointer transition-all select-none
                      ${isActive
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/10 shadow-lg'
                        : 'border-gray-100 hover:border-gray-300 bg-white dark:bg-gray-900 hover:shadow-md'}`}
                  >
                    {/* Title Row */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Job Ref</p>
                        <h4 className="font-black text-gray-900 dark:text-white text-base">
                          SO-{order.salesOrder?._id?.substring(18).toUpperCase() || '???'}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Client</p>
                        <p className="text-xs font-black text-gray-700 dark:text-gray-300 truncate max-w-[130px]">
                          {order.salesOrder?.customer?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    {/* Stage pipeline mini-bar */}
                    <div className="flex items-center gap-1 mb-2">
                      {PIPELINE_STAGES.map((sName, idx) => {
                        const st = getStageStatus(order, sName);
                        return (
                          <div key={idx} className={`flex-1 h-2 rounded-full overflow-hidden ${
                            st === 'Completed'   ? 'bg-emerald-400' :
                            st === 'In Progress' ? 'bg-amber-400'   : 'bg-gray-200'
                          }`} />
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">
                        Current: <span className="text-gray-600 dark:text-gray-300">{order.currentStage || 'Extrusion'}</span>
                      </p>
                      <p className="text-[9px] font-black text-emerald-600 uppercase">
                        {done}/{total} stages done
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {filteredOrders.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[28px]">
                  <History size={30} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {productionOrders.length === 0
                      ? 'No jobs on floor yet. Release a Sales Order from Production Planning.'
                      : 'No results match your search.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Panel 02: Stage Control (shown when a job is selected) ─ */}
          <AnimatePresence>
            {activeJob && (
              <motion.div
                key={activeJob._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white dark:bg-gray-950 p-8 rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/5"
              >
                <div className="flex items-center gap-5 mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center font-black text-sm">02</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Stage Control</h3>
                </div>

                {/* Machine & Operator */}
                <div className="grid grid-cols-2 gap-4 mb-7">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assigned Machine</label>
                    <select
                      className="input-field w-full text-xs"
                      value={logForm.machineId}
                      onChange={e => setLogForm({ ...logForm, machineId: e.target.value })}
                    >
                      {['EX-01','EX-02','WV-04','LM-02','CT-01','PR-01'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Floor Operator</label>
                    <input
                      className="input-field w-full text-xs"
                      value={logForm.operatorName}
                      onChange={e => setLogForm({ ...logForm, operatorName: e.target.value })}
                    />
                  </div>
                </div>

                {/* ── Stage Pipeline ──────────────────────────────── */}
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pipeline Stages</p>
                  {PIPELINE_STAGES.map((stageName, idx) => {
                    const stageObj = activeJob.stages.find(s => s.stage === stageName);
                    if (!stageObj) return null;
                    const status = stageObj.status;

                    return (
                      <div key={stageName}
                        className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all
                          ${status === 'Completed'   ? 'border-emerald-200 bg-emerald-50/50' :
                            status === 'In Progress' ? 'border-amber-200 bg-amber-50/50'     :
                                                      'border-gray-100 bg-gray-50/50'}`}
                      >
                        {/* Stage Info */}
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black
                            ${status === 'Completed'   ? 'bg-emerald-500 text-white' :
                              status === 'In Progress' ? 'bg-amber-400 text-white'   : 'bg-gray-200 text-gray-500'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase">{stageName}</h4>
                            <p className={`text-[9px] font-bold uppercase tracking-wide
                              ${status === 'Completed' ? 'text-emerald-600' : status === 'In Progress' ? 'text-amber-600' : 'text-gray-400'}`}>
                              {status}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {status === 'Pending' && (
                            <button
                              disabled={updating}
                              onClick={() => handleUpdateProgress(activeJob._id, stageName, 'In Progress')}
                              className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
                            >
                              Start
                            </button>
                          )}
                          {status === 'In Progress' && (
                            <button
                              disabled={updating}
                              onClick={() => handleUpdateProgress(activeJob._id, stageName, 'Completed')}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:opacity-80 transition-opacity disabled:opacity-50"
                            >
                              Done <CheckCircle2 size={11} />
                            </button>
                          )}
                          {status === 'Completed' && (
                            <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase">
                              <CheckCircle2 size={14} /> Done
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT COLUMN: FLOOR INTELLIGENCE ──────────────────────────────── */}
        <div className="w-full lg:w-[54%] space-y-8">

          {/* Section A: Utilization Chart */}
          <div className="bg-white dark:bg-gray-950 p-10 rounded-[40px] border border-gray-100 shadow-2xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Factory Load</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift utilization over time</p>
              </div>
              <TrendingUp size={28} className="text-emerald-500 opacity-30" />
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilizationTrend}>
                  <defs>
                    <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Load']}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: '11px', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="load" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#loadGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section B: Machine-wise Production */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Machine Production</h3>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {machineTelemetry.filter(m => m.status === 'Active').length} / {machineTelemetry.length} Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {machineTelemetry.map((m, i) => (
                <div key={i} className="bg-white dark:bg-gray-950 p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group">
                  <div className="flex justify-between items-start mb-5">
                    <div className={`p-3 rounded-2xl ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                      <Zap size={20} className={m.status === 'Active' ? 'animate-pulse' : ''} />
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-900 dark:text-white">{m.id}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase">{m.type}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-bold text-gray-400 italic truncate w-28">{m.job}</span>
                      <span className="text-xl font-black text-gray-900 dark:text-white">{m.load}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.load}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${m.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      />
                    </div>
                    <div className={`inline-block px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wide
                      ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                      {m.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section C: Worker Productivity */}
          <div className="bg-white dark:bg-gray-950 p-10 rounded-[40px] border border-gray-100 shadow-2xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Worker Productivity</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift output leaderboard</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <User size={22} className="text-emerald-600" />
              </div>
            </div>
            <div className="space-y-3">
              {workerEfficiency.map((w, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-gray-50/60 dark:bg-gray-900/50 rounded-[24px] border border-gray-100 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-white shadow-sm rounded-2xl flex items-center justify-center font-black text-xs text-gray-700">
                      #{i + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase">{w.name}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{w.shift} Shift · {w.stage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-right">
                    <div className="hidden md:block">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Output</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{w.units?.toLocaleString()} Bags</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Efficiency</p>
                      <p className="text-sm font-black text-emerald-600">{w.efficiency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductionTracking;
