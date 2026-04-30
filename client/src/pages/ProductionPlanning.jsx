import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  Factory, Package, CheckCircle2, 
  Printer, ArrowRight, Cog, HardHat, FileText, Download, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  'In Production': 'bg-blue-100 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Dispatched: 'bg-gray-100 text-gray-500 border-gray-200',
};

const ProductionPlanning = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  // Flow State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  
  // BOM Data
  const [bom, setBom] = useState({ hdpe: 0, lamination: 0, ink: 0, unitWeight: 0 });

  // Machine Allocation
  const [allocation, setAllocation] = useState({
    Extrusion: 'EX-01',
    Weaving: 'WV-04',
    Lamination: 'Not Required',
    Cutting: 'CT-01'
  });

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get('/orders');
      const orders = Array.isArray(res.data) ? res.data : [];
      // Show ALL Sales Orders so planner can always work
      const salesOrderList = orders.filter(o => o.type === 'Sales Order');
      setSalesOrders(salesOrderList);
    } catch (error) {
      console.error("Fetch Sales Orders Error:", error);
      toast.error('Failed to load Sales Orders');
    } finally {
      setFetching(false);
    }
  };

  const handleSelectOrder = (id) => {
    setSelectedOrderId(id);
    setGeneratedDoc(null);
    const order = salesOrders.find(o => o._id === id);
    setSelectedOrderData(order || null);

    if (order && order.orderItems && order.orderItems.length > 0) {
      const item = order.orderItems[0];
      const specs = item.productSpec || {};
      const qty = item.quantity || 0;
      const bagWeightGrams = Number(specs.weight) || 50;

      const totalHdpeKg = ((bagWeightGrams * qty) / 1000).toFixed(2);
      const laminationKg = specs.lamination ? (qty * 5 / 1000).toFixed(2) : 0;
      const inkKg = (specs.printing && specs.printing !== 'None') ? (qty * 2 / 1000).toFixed(2) : 0;

      setBom({ hdpe: totalHdpeKg, lamination: laminationKg, ink: inkKg, unitWeight: bagWeightGrams });
      setAllocation({
        Extrusion: 'EX-01',
        Weaving: 'WV-04',
        Lamination: specs.lamination ? 'LM-02' : 'Not Required',
        Cutting: 'CT-01'
      });
    } else {
      setBom({ hdpe: 0, lamination: 0, ink: 0, unitWeight: 0 });
    }
  };

  const handleReleaseToFloor = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) return toast.error('Select a Sales Order first');
    if (!selectedOrderData) return toast.error('Order data not found');
    
    setLoading(true);
    try {
      const orderItem = selectedOrderData?.orderItems?.[0];
      const printingSpec = orderItem?.productSpec?.printing || 'None';

      const stages = [
        { stage: 'Extrusion', status: 'Pending', assignedTo: allocation.Extrusion },
        { stage: 'Weaving',   status: 'Pending', assignedTo: allocation.Weaving },
        { stage: 'Lamination',status: allocation.Lamination === 'Not Required' ? 'Completed' : 'Pending', assignedTo: allocation.Lamination },
        { stage: 'Cutting',   status: 'Pending', assignedTo: allocation.Cutting },
        { stage: 'Printing',  status: printingSpec === 'None' ? 'Completed' : 'Pending', assignedTo: 'PR-01' },
      ];

      const res = await axiosInstance.post('/production', { salesOrder: selectedOrderId, stages });
      const newProdOrder = res.data;

      // Mark Sales Order as In Production
      await axiosInstance.put(`/orders/${selectedOrderId}/status`, { status: 'In Production' });

      setGeneratedDoc({ ...newProdOrder, orderData: selectedOrderData, bom, allocation });
      toast.success('✅ Job Released to Factory Floor!');
      fetchSalesOrders();
    } catch (error) {
      console.error(error);
      toast.error('Failed to release production order. Check server logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('job-card-content');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`JobCard_${generatedDoc._id.substring(18).toUpperCase()}.pdf`);
      toast.success("Job Card Downloaded");
    } catch (err) {
      toast.error("Failed to export Job Card");
    }
  };

  const selectedOrder = selectedOrderData;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 h-full">
      <div className="mb-10">
        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Production Planning</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">BOM Calculation &amp; Machine Allocation</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 items-start">
        
        {/* LEFT COLUMN: THE FLOW */}
        <div className="w-full xl:w-[45%] space-y-12 bg-white dark:bg-gray-950 p-10 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5">
          <form onSubmit={handleReleaseToFloor} className="space-y-12">
            
            {/* Step 1: Order Pull */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">1</div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Pull Sales Order</h3>
              </div>
              <div className="pl-12 space-y-3">
                {fetching ? (
                  <div className="input-field w-full flex items-center gap-2 text-gray-400 text-sm">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Loading orders...
                  </div>
                ) : (
                  <select
                    required
                    className="input-field w-full text-sm"
                    value={selectedOrderId}
                    onChange={e => handleSelectOrder(e.target.value)}
                  >
                    <option value="">
                      {salesOrders.length === 0 ? '⚠ No Sales Orders found' : 'Select a Sales Order...'}
                    </option>
                    {salesOrders.map(o => (
                      <option key={o._id} value={o._id}>
                        SO-{o._id.substring(18).toUpperCase()} — {o.customer?.name || 'Unknown'} | {o.orderItems?.[0]?.quantity?.toLocaleString() || 0} Pcs [{o.status}]
                      </option>
                    ))}
                  </select>
                )}

                {salesOrders.length === 0 && !fetching && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs font-bold">
                    <AlertCircle size={14} />
                    No Sales Orders exist. Create one in Sales Management first.
                  </div>
                )}

                {/* Order Summary Card */}
                {selectedOrder && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</span>
                      <span className="text-xs font-black text-gray-900">{selectedOrder.customer?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Quantity</span>
                      <span className="text-xs font-black text-gray-900">{selectedOrder.orderItems?.[0]?.quantity?.toLocaleString()} Pcs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                      <span className={`text-[9px] font-black border rounded-lg px-3 py-1 ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-100 text-gray-500'}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Step 2: BOM Generation */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">2</div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Bill of Materials (BOM)</h3>
              </div>
              <div className="pl-12">
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-white/5">
                  {selectedOrderData ? (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 mb-3">Material Requirements</p>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-600 uppercase">HDPE Granules</span>
                        <span className="text-sm font-black text-black">{bom.hdpe} KG</span>
                      </div>
                      {selectedOrderData.orderItems?.[0]?.productSpec?.lamination && (
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                          <span className="text-xs font-bold text-gray-600 uppercase">Lamination Roll</span>
                          <span className="text-sm font-black text-black">{bom.lamination} KG</span>
                        </div>
                      )}
                      {selectedOrderData.orderItems?.[0]?.productSpec?.printing && selectedOrderData.orderItems?.[0]?.productSpec?.printing !== 'None' && (
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                          <span className="text-xs font-bold text-gray-600 uppercase">Industrial Ink</span>
                          <span className="text-sm font-black text-black">{bom.ink} KG</span>
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 inline-block px-3 py-1.5 rounded-lg border border-emerald-100">
                          Formula: 1 Bag = {bom.unitWeight}g HDPE {bom.lamination > 0 ? '+ Lam' : ''} {bom.ink > 0 ? '+ Ink' : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <Package size={24} className="mx-auto mb-2 opacity-50"/>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Select an order to calculate BOM</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Machine Allocation */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">3</div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Machine Allocation</h3>
              </div>
              <div className="pl-12">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'Extrusion', label: 'Extrusion Plant', options: ['EX-01', 'EX-02'] },
                    { key: 'Weaving',   label: 'Weaving Looms',   options: ['WV-04', 'WV-05', 'WV-06'] },
                    { key: 'Lamination',label: 'Lamination Unit', options: ['Not Required', 'LM-01', 'LM-02'] },
                    { key: 'Cutting',   label: 'Cutting & Stitching', options: ['CT-01', 'CT-02'] },
                  ].map(({ key, label, options }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
                      <select
                        disabled={!selectedOrderData}
                        className="input-field bg-white text-xs w-full"
                        value={allocation[key]}
                        onChange={e => setAllocation({ ...allocation, [key]: e.target.value })}
                      >
                        {options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 pl-12">
              <button
                type="submit"
                disabled={loading || !selectedOrderId}
                className="w-full btn-primary bg-black text-white py-4 shadow-xl disabled:opacity-40 text-[10px] uppercase tracking-widest font-black"
              >
                {loading ? 'Processing...' : '🚀 Release to Factory Floor'}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: JOB CARD OUTPUT */}
        <div className="w-full xl:w-[55%]">
          <AnimatePresence mode="wait">
            {generatedDoc ? (
              <motion.div key="doc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Action Bar */}
                <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3 px-4">
                    <HardHat size={20} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Job Released to Floor ✅</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setGeneratedDoc(null)} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                      Plan Another
                    </button>
                    <button onClick={handleDownloadPDF} className="px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <Download size={14} /> Export Job Card
                    </button>
                  </div>
                </div>

                {/* Job Card */}
                <div className="bg-white p-12 rounded-[40px] shadow-2xl overflow-x-auto text-black">
                  <div id="job-card-content" className="min-w-[600px] bg-white text-black p-8 font-sans border-2 border-black rounded-xl">
                    {/* Header */}
                    <div className="text-center bg-black text-white p-5 -mt-8 -mx-8 rounded-t-lg mb-8">
                      <h1 className="text-2xl font-black uppercase tracking-[0.2em]">Production Job Card</h1>
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-1 text-gray-300">Eagle Plastic Industries · GIDC</p>
                    </div>

                    {/* Identifiers */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div className="space-y-2">
                        <div className="flex gap-3 items-center">
                          <span className="text-[9px] font-black text-gray-500 uppercase w-28">Prod. Order:</span>
                          <span className="font-black text-lg">PO-{generatedDoc._id.substring(18).toUpperCase()}</span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <span className="text-[9px] font-black text-gray-500 uppercase w-28">Sales Ref:</span>
                          <span className="font-bold text-sm">SO-{generatedDoc.orderData._id.substring(18).toUpperCase()}</span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <span className="text-[9px] font-black text-gray-500 uppercase w-28">Client:</span>
                          <span className="font-bold text-sm">{generatedDoc.orderData.customer?.name}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex justify-end gap-3 items-center">
                          <span className="text-[9px] font-black text-gray-500 uppercase">Release Date:</span>
                          <span className="font-bold text-sm">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-end gap-3 items-center">
                          <span className="text-[9px] font-black text-gray-500 uppercase">Target Qty:</span>
                          <span className="font-black text-lg">{generatedDoc.orderData.orderItems[0].quantity.toLocaleString()} Pcs</span>
                        </div>
                      </div>
                    </div>

                    {/* BOM */}
                    <div className="mb-8 border border-black rounded-lg overflow-hidden">
                      <div className="bg-gray-100 border-b border-black p-3">
                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Package size={14}/> Bill of Materials</h3>
                      </div>
                      <div className="p-5 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-[10px] font-black text-gray-500 mb-1">HDPE Granules</p>
                          <p className="text-2xl font-black">{generatedDoc.bom.hdpe} <span className="text-xs">KG</span></p>
                        </div>
                        <div className="border-l border-gray-200">
                          <p className="text-[10px] font-black text-gray-500 mb-1">Lamination Roll</p>
                          <p className="text-2xl font-black">{generatedDoc.bom.lamination} <span className="text-xs">KG</span></p>
                        </div>
                        <div className="border-l border-gray-200">
                          <p className="text-[10px] font-black text-gray-500 mb-1">Industrial Ink</p>
                          <p className="text-2xl font-black">{generatedDoc.bom.ink} <span className="text-xs">KG</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Stages Table */}
                    <div className="mb-8">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Machine Routing &amp; Stages</h3>
                      <table className="w-full text-left border-collapse border border-black">
                        <thead>
                          <tr className="bg-gray-100 border-b border-black">
                            <th className="p-3 text-[10px] font-black uppercase border-r border-black w-10 text-center">#</th>
                            <th className="p-3 text-[10px] font-black uppercase border-r border-black">Process Stage</th>
                            <th className="p-3 text-[10px] font-black uppercase border-r border-black">Assigned Machine</th>
                            <th className="p-3 text-[10px] font-black uppercase text-center w-24">Sign-off</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['Extrusion', 'Weaving', 'Lamination', 'Cutting', 'Printing'].map((stage, idx) => (
                            <tr key={stage} className="border-b border-black">
                              <td className="p-4 text-xs font-black text-center border-r border-black">0{idx + 1}</td>
                              <td className="p-4 text-sm font-bold uppercase border-r border-black">{stage}</td>
                              <td className="p-4 text-sm font-black border-r border-black">
                                {generatedDoc.allocation[stage] === 'Not Required' || !generatedDoc.allocation[stage]
                                  ? <span className="text-gray-400">N/A</span>
                                  : generatedDoc.allocation[stage]}
                              </td>
                              <td className="p-4 border-black" />
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end pt-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Target Specs</h4>
                        <p className="text-[10px] font-bold text-gray-600">
                          Size: {generatedDoc.orderData.orderItems[0].productSpec.size} | Wt: {generatedDoc.bom.unitWeight}g | Print: {generatedDoc.orderData.orderItems[0].productSpec.printing || 'None'}
                        </p>
                      </div>
                      <div className="text-center w-48">
                        <div className="w-full border-b border-black mb-2 pt-10" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Shift Supervisor Sign</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[48px] p-10 text-center"
              >
                <Cog size={64} className="text-gray-200 dark:text-gray-800 mb-6" />
                <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Factory Floor Empty</h3>
                <p className="text-xs font-bold text-gray-400 mt-4 max-w-[260px] leading-relaxed">
                  Pull a Sales Order, configure machine routing, and release a Production Job Card to the floor.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProductionPlanning;
