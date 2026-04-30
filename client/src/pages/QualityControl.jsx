import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, 
  X, Scale, Zap, Ruler, 
  BarChart3, History, FileText, ClipboardCheck,
  TrendingDown, Search, Microscope, FlaskConical,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const QualityControl = () => {
  const [productionOrders, setProductionOrders] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Flow State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [testResults, setTestResults] = useState({
    weight: '',
    strength: '',
    sizeAccuracy: '100%',
    status: 'Passed',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, qcRes] = await Promise.all([
        axiosInstance.get('/production'),
        axiosInstance.get('/qc')
      ]);
      // Show production orders that are either in progress or completed but not yet QC'd
      const active = (Array.isArray(prodRes.data) ? prodRes.data : []).filter(o => o.status !== 'Pending');
      setProductionOrders(active);
      setInspections(Array.isArray(qcRes.data) ? qcRes.data : []);
    } catch (error) {
      toast.error('Laboratory sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeQC = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) return toast.error('Identify Batch for Testing');
    
    setLoading(true);
    try {
      const prod = productionOrders.find(o => o._id === selectedOrderId);
      const payload = {
        productionOrderId: selectedOrderId,
        batchNumber: `BATCH-${selectedOrderId.substring(18).toUpperCase()}`,
        sampleSize: 10, // Standard industrial sample
        defectsFound: testResults.status === 'Failed' ? 1 : 0,
        defectType: testResults.status === 'Failed' ? 'Physical Variance' : 'None',
        status: testResults.status,
        remarks: `Weight: ${testResults.weight}, Strength: ${testResults.strength}, Accuracy: ${testResults.sizeAccuracy}. ${testResults.remarks}`
      };

      await axiosInstance.post('/qc', payload);
      toast.success(testResults.status === 'Passed' ? 'Batch Certified & Released' : 'Batch Rejected & Quarantined');
      
      setSelectedOrderId('');
      setTestResults({ weight: '', strength: '', sizeAccuracy: '100%', status: 'Passed', remarks: '' });
      fetchData();
    } catch (error) {
      toast.error('Certification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto pb-24 h-full">
      <div className="mb-10 flex justify-between items-end">
        <div>
           <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">7. Quality Control</h1>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Microscope size={14} className="text-emerald-500" /> Laboratory Compliance | Zero-Defect Policy
           </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* LEFT COLUMN: THE QC PIPELINE */}
        <div className="w-full lg:w-[40%] space-y-12 bg-white dark:bg-gray-950 p-10 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5">
          <form onSubmit={handleFinalizeQC} className="space-y-12">
            
            {/* Phase 1: Batch Identification */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">1</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Identify Batch</h3>
               </div>
               <div className="pl-12">
                  <select required className="input-field w-full text-sm font-bold" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                     <option value="">Select completed production batch...</option>
                     {productionOrders.map(o => (
                       <option key={o._id} value={o._id}>
                         BATCH #{o._id.substring(18).toUpperCase()} - {o.salesOrder?.customer?.name}
                       </option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Phase 2: Physical Testing */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">2</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Testing Metrics</h3>
               </div>
               <div className="pl-12 grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Scale size={12}/> Weight Check</label>
                     <input required className="input-field text-sm" value={testResults.weight} onChange={e => setTestResults({...testResults, weight: e.target.value})} placeholder="e.g. 74.5g" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> Strength (PSI)</label>
                     <input required className="input-field text-sm" value={testResults.strength} onChange={e => setTestResults({...testResults, strength: e.target.value})} placeholder="e.g. 45 PSI" />
                  </div>
                  <div className="col-span-2 space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Ruler size={12}/> Size Accuracy</label>
                     <input required className="input-field text-sm" value={testResults.sizeAccuracy} onChange={e => setTestResults({...testResults, sizeAccuracy: e.target.value})} placeholder="e.g. 99.8%" />
                  </div>
               </div>
            </div>

            {/* Phase 3: Final Certification */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">3</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Final Decision</h3>
               </div>
               <div className="pl-12 space-y-4">
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setTestResults({...testResults, status: 'Passed'})} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all ${testResults.status === 'Passed' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg' : 'border-gray-100 text-gray-400 opacity-60'}`}>
                        <CheckCircle2 size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Approve</span>
                     </button>
                     <button type="button" onClick={() => setTestResults({...testResults, status: 'Failed'})} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all ${testResults.status === 'Failed' ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-lg' : 'border-gray-100 text-gray-400 opacity-60'}`}>
                        <AlertTriangle size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                     </button>
                  </div>
                  <textarea className="input-field w-full text-[10px] min-h-[80px] p-4" placeholder="Additional Laboratory Remarks..." value={testResults.remarks} onChange={e => setTestResults({...testResults, remarks: e.target.value})} />
                  <button type="submit" disabled={loading || !selectedOrderId} className="w-full btn-primary bg-black text-white py-5 shadow-2xl disabled:opacity-50 text-[10px] font-black uppercase tracking-widest">
                     {loading ? 'Certifying...' : 'Submit Final Certification'}
                  </button>
               </div>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: LABORATORY INTELLIGENCE */}
        <div className="w-full lg:w-[60%] space-y-8">
           
           {/* Section A: QC Metrics Dashboard */}
           <div className="grid grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-950 p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Award size={20} /></div>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">UP 2.4%</span>
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pass Compliance</p>
                 <h4 className="text-4xl font-black text-gray-900 dark:text-white">99.2%</h4>
              </div>
              <div className="bg-white dark:bg-gray-950 p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><FlaskConical size={20} /></div>
                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">Target: &lt;1%</span>
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rejection Rate</p>
                 <h4 className="text-4xl font-black text-gray-900 dark:text-white">0.8%</h4>
              </div>
           </div>

           {/* Section B: Audit History Ledger */}
           <div className="bg-white dark:bg-gray-950 p-10 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl">
              <div className="flex justify-between items-end mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Audit Ledger</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Laboratory Certifications</p>
                 </div>
                 <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <History size={24} className="text-primary" />
                 </div>
              </div>

              <div className="space-y-4">
                 {inspections.slice(0, 4).map((ins, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group hover:shadow-xl transition-all cursor-pointer">
                       <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${ins.status === 'Passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {ins.status === 'Passed' ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-gray-900 uppercase">{ins.batchNumber}</h4>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(ins.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-8 text-right">
                          <div className="hidden md:block">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Metrics</p>
                             <p className="text-[10px] font-bold text-gray-700">{ins.sampleSize} Bags Inspected</p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${ins.status === 'Passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {ins.status}
                          </div>
                          <FileText size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                       </div>
                    </div>
                 ))}
                 {inspections.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px]">
                       <ClipboardCheck size={48} className="mx-auto text-gray-200 mb-4" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active audits found</p>
                    </div>
                 )}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};

export default QualityControl;
