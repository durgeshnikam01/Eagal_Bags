import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  FileText, IndianRupee, Printer, ArrowUpRight, 
  CreditCard, Calendar, CheckCircle2, 
  BarChart3, TrendingUp, History, 
  ShieldCheck, AlertCircle, Search,
  Download, PieChart, Activity, X, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const AccountsBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  // Flow State
  const [selectedDispatchId, setSelectedDispatchId] = useState('');
  const [billingData, setBillingData] = useState({
    dueDate: '',
    gstRate: 18,
    paymentTerms: 'Net 30',
    notes: 'Standard payment terms apply.'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, dispRes] = await Promise.all([
        axiosInstance.get('/billing'),
        axiosInstance.get('/dispatch')
      ]);
      setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      setDispatches(Array.isArray(dispRes.data) ? dispRes.data : []);
    } catch (error) {
      toast.error('Financial sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDispatch = (id) => {
    setSelectedDispatchId(id);
    const disp = dispatches.find(d => d._id === id);
    if (disp) {
       const date = new Date();
       date.setDate(date.getDate() + 30);
       setBillingData({ ...billingData, dueDate: date.toISOString().split('T')[0] });
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedDispatchId) return toast.error('Identify Dispatch Reference');
    
    setLoading(true);
    try {
      const disp = dispatches.find(d => d._id === selectedDispatchId);
      const subTotal = disp.order?.totalAmount || 50000;
      const gstAmount = subTotal * (billingData.gstRate / 100);
      
      const payload = {
        order: disp.order?._id,
        customer: disp.order?.customer?._id,
        subTotal,
        gstAmount,
        totalAmount: subTotal + gstAmount,
        dueDate: billingData.dueDate,
        notes: billingData.notes
      };

      const res = await axiosInstance.post('/billing', payload);
      
      setGeneratedInvoice({
        ...res.data,
        customerData: disp.order?.customer,
        orderData: disp.order,
        dispatchRef: disp.dispatchNumber,
        gstRate: billingData.gstRate
      });

      toast.success('Invoice Posted | PDF Generated');
      fetchData();
    } catch (error) {
      toast.error('Billing failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
      await axiosInstance.put(`/billing/${id}/status`, { status: newStatus });
      toast.success(`Invoice marked as ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Status update failed');
    }
  };

  const deleteInvoice = async (id) => {
     if (!window.confirm("Permanently delete this invoice?")) return;
     try {
        await axiosInstance.delete(`/billing/${id}`);
        toast.success("Record removed from ledger");
        fetchData();
     } catch (error) {
        toast.error("Deletion failed");
     }
  };

  const downloadInvoice = async () => {
     const element = document.getElementById('invoice-content');
     if (!element) return;
     const canvas = await html2canvas(element, { scale: 2 });
     const imgData = canvas.toDataURL('image/png');
     const pdf = new jsPDF('p', 'mm', 'a4');
     const pdfWidth = pdf.internal.pageSize.getWidth();
     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
     pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
     pdf.save(`Invoice_${generatedInvoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="w-full mx-auto pb-24 h-full">
      <div className="mb-10 flex justify-between items-end">
        <div>
           <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">9. Accounts & Billing</h1>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <IndianRupee size={14} className="text-emerald-500" /> Strategic Finance | Tax Compliant
           </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* LEFT COLUMN: BILLING PIPELINE */}
        <div className="w-full lg:w-[40%] space-y-12 bg-white dark:bg-gray-950 p-10 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5">
          <form onSubmit={handleGenerateInvoice} className="space-y-12">
            
            {/* Phase 1: Release Billing */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">1</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Billing Target</h3>
               </div>
               <div className="pl-12">
                  <select required className="input-field w-full text-sm font-bold" value={selectedDispatchId} onChange={e => handleSelectDispatch(e.target.value)}>
                     <option value="">Select dispatched shipment...</option>
                     {dispatches.map(d => (
                       <option key={d._id} value={d._id}>
                         {d.dispatchNumber} - {d.order?.customer?.name}
                       </option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Phase 2: Taxation & Terms */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">2</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Taxation & Terms</h3>
               </div>
               <div className="pl-12 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12}/> GST Rate (%)</label>
                        <select className="input-field text-sm" value={billingData.gstRate} onChange={e => setBillingData({...billingData, gstRate: Number(e.target.value)})}>
                           <option value={18}>Standard (18%)</option>
                           <option value={12}>Reduced (12%)</option>
                           <option value={5}>Minimal (5%)</option>
                           <option value={0}>Exempt (0%)</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Due Date</label>
                        <input type="date" required className="input-field text-sm" value={billingData.dueDate} onChange={e => setBillingData({...billingData, dueDate: e.target.value})} />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Payment Terms</label>
                     <input className="input-field text-sm" value={billingData.paymentTerms} onChange={e => setBillingData({...billingData, paymentTerms: e.target.value})} placeholder="e.g. Net 30" />
                  </div>
               </div>
            </div>

            {/* Phase 3: Finalize Invoice */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">3</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Finalize Billing</h3>
               </div>
               <div className="pl-12">
                  <button type="submit" disabled={loading || !selectedDispatchId} className="w-full btn-primary bg-black text-white py-5 shadow-2xl disabled:opacity-50 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                     {loading ? 'Posting Ledger...' : 'Finalize & Post Invoice'} <ArrowUpRight size={18} />
                  </button>
               </div>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: FINANCIAL CONSOLE & INVOICE PREVIEW */}
        <div className="w-full lg:w-[60%]">
           <AnimatePresence mode="wait">
              {generatedInvoice ? (
                 <motion.div key="invoice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><ShieldCheck size={24} /></div>
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Invoice Generated</p>
                             <h4 className="text-sm font-black text-gray-900 dark:text-white">{generatedInvoice.invoiceNumber}</h4>
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={() => setGeneratedInvoice(null)} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Close</button>
                          <button onClick={downloadInvoice} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-all">
                             <Download size={16} /> Save PDF
                          </button>
                       </div>
                    </div>

                    <div id="invoice-content" className="bg-white p-12 shadow-2xl rounded-[40px] text-black w-full max-w-[800px] mx-auto font-sans">
                        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-2xl"><IndianRupee size={32} /></div>
                              <div>
                                 <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">EAGLE PLASTIC</h2>
                                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left">Tax Invoice | GST Registered</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">INVOICE</h1>
                              <p className="text-sm font-bold text-gray-600">No: {generatedInvoice.invoiceNumber}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 mb-10">
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer Details</p>
                              <h4 className="text-lg font-black text-black leading-tight mb-2">{generatedInvoice.customerData?.name}</h4>
                              <p className="text-xs font-medium text-gray-600 italic leading-relaxed">{generatedInvoice.customerData?.address}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-4">GSTN: {generatedInvoice.customerData?.gstNumber || 'N/A'}</p>
                           </div>
                           <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Finance Intelligence</p>
                              <div className="space-y-2 text-xs">
                                 <div className="flex justify-between">
                                    <span className="font-bold text-gray-500">Invoice Date:</span>
                                    <span className="font-black">{new Date().toLocaleDateString()}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span className="font-bold text-gray-500">Due Date:</span>
                                    <span className="font-black text-rose-500">{new Date(generatedInvoice.dueDate).toLocaleDateString()}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span className="font-bold text-gray-500">Terms:</span>
                                    <span className="font-black">Net 30</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span className="font-bold text-gray-500">Dispatch Ref:</span>
                                    <span className="font-black text-blue-600">{generatedInvoice.dispatchRef}</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="mb-10">
                           <table className="w-full border-collapse">
                              <thead>
                                 <tr className="bg-black text-white">
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left">Description</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Base Amt</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">GST ({generatedInvoice.gstRate}%)</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Total</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 <tr className="border-b-2 border-gray-100 font-black">
                                    <td className="p-6">
                                       <p className="text-sm">Industrial HDPE Woven Bags</p>
                                       <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 italic">Manufacturing Services</p>
                                    </td>
                                    <td className="p-6 text-center text-sm">₹{generatedInvoice.subTotal.toLocaleString()}</td>
                                    <td className="p-6 text-right text-sm text-emerald-600">₹{generatedInvoice.gstAmount.toLocaleString()}</td>
                                    <td className="p-6 text-right text-sm">₹{generatedInvoice.totalAmount.toLocaleString()}</td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>

                        <div className="flex justify-end mt-12">
                           <div className="w-64 space-y-3">
                              <div className="flex justify-between text-xs font-bold text-gray-500">
                                 <span>Sub-Total:</span>
                                 <span>₹{generatedInvoice.subTotal.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold text-emerald-500">
                                 <span>GST ({generatedInvoice.gstRate}%):</span>
                                 <span>₹{generatedInvoice.gstAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xl font-black text-black pt-3 border-t-2 border-black">
                                 <span>Grand Total:</span>
                                 <span>₹{generatedInvoice.totalAmount.toLocaleString()}</span>
                              </div>
                           </div>
                        </div>

                        <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           <div>Bank: HDFC Corporate | A/C: 0987654321 | IFSC: HDFC0001234</div>
                           <div className="italic">Computer Generated Invoice</div>
                        </div>
                    </div>
                 </motion.div>
              ) : (
                 <div className="space-y-8">
                    {/* Financial Stats Console */}
                    <div className="grid grid-cols-2 gap-8">
                       <div className="bg-emerald-600 p-8 rounded-[40px] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                          <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/10 blur-3xl rounded-full" />
                          <div className="relative z-10">
                             <p className="text-[10px] font-black uppercase text-emerald-100 tracking-[0.2em] mb-2">Total Receivables</p>
                             <h4 className="text-4xl font-black tracking-tighter italic">₹{invoices.reduce((sum, inv) => inv.status !== 'Paid' ? sum + inv.totalAmount : sum, 0).toLocaleString()}</h4>
                          </div>
                          <TrendingUp size={48} className="text-white/20 relative z-10" />
                       </div>
                       <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-gray-100 dark:border-white/5 flex items-center justify-between shadow-sm">
                          <div>
                             <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">Tax Liability (GST)</p>
                             <h4 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic">₹{invoices.reduce((sum, inv) => sum + inv.gstAmount, 0).toLocaleString()}</h4>
                          </div>
                          <PieChart size={48} className="text-gray-100" />
                       </div>
                    </div>

                    {/* Invoice History Console */}
                    <div className="bg-white dark:bg-gray-950 p-10 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl">
                       <div className="flex justify-between items-end mb-10">
                          <div>
                             <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Finance Console</h3>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Ledgers & Payment Histories</p>
                          </div>
                          <Activity size={32} className="text-primary opacity-20" />
                       </div>
                       
                       <div className="space-y-4">
                          {invoices.slice(0, 8).map((inv, i) => (
                             <div key={i} className="flex items-center justify-between p-6 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 hover:scale-[1.01] transition-transform group">
                                <div className="flex items-center gap-6">
                                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                      <FileText size={20} />
                                   </div>
                                   <div>
                                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{inv.invoiceNumber}</h4>
                                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{inv.customer?.name}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-8 text-right">
                                   <div>
                                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount</p>
                                      <p className="text-xs font-black text-gray-900 dark:text-white">₹{inv.totalAmount.toLocaleString()}</p>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <button 
                                        onClick={() => togglePaymentStatus(inv._id, inv.status)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${inv.status === 'Paid' ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' : 'bg-white text-rose-500 border-rose-200 hover:bg-rose-50'}`}
                                        title={inv.status === 'Paid' ? "Mark as Unpaid" : "Mark as Paid"}
                                      >
                                         {inv.status === 'Paid' ? <CheckCircle2 size={16} /> : <X size={16} />}
                                      </button>
                                      <button 
                                        onClick={() => deleteInvoice(inv._id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-gray-300 hover:text-rose-500 border border-gray-100 hover:border-rose-100 transition-all shadow-sm"
                                        title="Delete Invoice"
                                      >
                                         <Trash2 size={16} />
                                      </button>
                                   </div>
                                   <button 
                                     onClick={() => setGeneratedInvoice({
                                        ...inv,
                                        customerData: inv.customer,
                                        orderData: inv.order,
                                        dispatchRef: `REF-${inv._id.substring(18).toUpperCase()}`,
                                        gstRate: 18
                                     })}
                                     className="p-2 text-gray-300 hover:text-primary transition-colors"
                                   >
                                      <Printer size={18} />
                                   </button>
                                </div>
                             </div>
                          ))}
                          {invoices.length === 0 && (
                             <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px]">
                                <Activity size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active ledgers found</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              )}
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default AccountsBilling;
