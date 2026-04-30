import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  ShoppingBag, Truck, Users, Mail, 
  Phone, MapPin, X, Plus, Printer, 
  CheckCircle2, FileText, Download, 
  Package, IndianRupee, History, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const PurchaseManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  // Flow State
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  
  const [poSpecs, setPoSpecs] = useState({
    quantity: '',
    unitPrice: '',
    reference: ''
  });

  // Vendor Management state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: '', phone: '', address: '', email: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [vRes, iRes, pRes] = await Promise.all([
        axiosInstance.get('/purchase/vendors'),
        axiosInstance.get('/inventory'),
        axiosInstance.get('/purchase/orders')
      ]);
      setVendors(Array.isArray(vRes.data) ? vRes.data : []);
      setInventory(Array.isArray(iRes.data) ? iRes.data : []);
      setPurchaseOrders(Array.isArray(pRes.data) ? pRes.data : []);
    } catch (error) {
      toast.error('Procurement sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!selectedVendorId || !selectedMaterialId) return toast.error('Identify Vendor & Material');
    
    setLoading(true);
    try {
      const selectedMat = inventory.find(i => i._id === selectedMaterialId);
      const selectedVen = vendors.find(v => v._id === selectedVendorId);

      const poPayload = {
        vendor: selectedVendorId,
        items: [{
          material: selectedMaterialId,
          materialName: selectedMat.name,
          quantity: Number(poSpecs.quantity),
          unit: selectedMat.unit,
          unitPrice: Number(poSpecs.unitPrice)
        }],
        totalAmount: Number(poSpecs.quantity) * Number(poSpecs.unitPrice)
      };

      const res = await axiosInstance.post('/purchase/orders', poPayload);
      const newPo = res.data;

      setGeneratedDoc({
        ...newPo,
        vendorData: selectedVen,
        materialData: selectedMat
      });

      toast.success('Purchase Order Issued');
      fetchInitialData();
      
    } catch (error) {
      toast.error('Failed to issue PO');
    } finally {
      setLoading(false);
    }
  };

  const handleGRN = async (poId) => {
    try {
      await axiosInstance.put(`/purchase/orders/${poId}/status`, { status: 'Received' });
      toast.success('GRN Verified: Stock Updated');
      fetchInitialData();
      if (generatedDoc && generatedDoc._id === poId) {
        setGeneratedDoc(prev => ({ ...prev, status: 'Received' }));
      }
    } catch (error) {
      toast.error('GRN Processing Failed');
    }
  };

  const handleVendorOnboarding = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/purchase/vendors', vendorForm);
      toast.success('Vendor Registered Successfully');
      setShowVendorModal(false);
      setVendorForm({ name: '', phone: '', address: '', email: '' });
      fetchInitialData();
    } catch (error) {
      toast.error('Registration failed');
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('po-document-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PO_${generatedDoc._id.substring(18).toUpperCase()}.pdf`);
      toast.success("PO Exported Successfully");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-24 h-full">
      <div className="mb-10 flex justify-between items-end">
        <div>
           <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Purchase Management</h1>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vendor Sourcing & Goods Receipt (GRN)</p>
        </div>
        <button onClick={() => setShowVendorModal(true)} className="px-6 py-3 bg-white dark:bg-gray-900 border-2 border-black dark:border-white/20 text-black dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
           Onboard Vendor
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 items-start">
        
        {/* LEFT COLUMN: THE FLOW */}
        <div className="w-full xl:w-[45%] space-y-12 bg-white dark:bg-gray-950 p-10 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5">
          <form onSubmit={handleCreatePO} className="space-y-12">
            
            {/* Phase 1: Source Identification */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">1</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Identify Source</h3>
               </div>
               <div className="pl-12 grid grid-cols-1 gap-4">
                  <select required className="input-field w-full text-sm" value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)}>
                     <option value="">Select Vendor Partner...</option>
                     {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                  <select required className="input-field w-full text-sm" value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)}>
                     <option value="">Select Material Needed...</option>
                     {inventory.filter(i => i.type === 'Raw Material').map(i => (
                        <option key={i._id} value={i._id}>{i.name} (Cur: {i.quantity} {i.unit})</option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Phase 2: Order Specs */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">2</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Order Specifications</h3>
               </div>
               <div className="pl-12 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Quantity</label>
                     <input type="number" required className="input-field text-sm" value={poSpecs.quantity} onChange={e => setPoSpecs({...poSpecs, quantity: e.target.value})} placeholder="e.g. 5000" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rate (Per Unit)</label>
                     <input type="number" required className="input-field text-sm" value={poSpecs.unitPrice} onChange={e => setPoSpecs({...poSpecs, unitPrice: e.target.value})} placeholder="e.g. 110" />
                  </div>
                  <div className="col-span-2 space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Special Instructions / Terms</label>
                     <input className="input-field text-sm" value={poSpecs.reference} onChange={e => setPoSpecs({...poSpecs, reference: e.target.value})} placeholder="e.g. Credit terms 30 days" />
                  </div>
               </div>
            </div>

            {/* Phase 3: Issue PO */}
            <div className="pt-6 pl-12">
               <button type="submit" disabled={loading || !selectedVendorId} className="w-full btn-primary bg-black text-white py-4 shadow-xl disabled:opacity-50 text-[10px]">
                  {loading ? 'Issuing...' : 'Generate Purchase Order'}
               </button>
            </div>

          </form>
          
          {/* Active PO List (Mini Registry) */}
          <div className="border-t border-gray-100 pt-10">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Pending Deliveries</h4>
             <div className="space-y-3">
                {purchaseOrders.filter(po => po.status === 'Pending').slice(0, 3).map(po => (
                   <div key={po._id} onClick={() => setGeneratedDoc({...po, vendorData: po.vendor})} className="p-5 bg-gray-50 rounded-3xl flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-all border border-gray-100">
                      <div>
                         <p className="text-xs font-black text-gray-900 leading-none mb-1">PO-{po._id.substring(18).toUpperCase()}</p>
                         <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{po.vendor?.name}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">₹{po.totalAmount?.toLocaleString()}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THE REALISTIC OUTPUT */}
        <div className="w-full xl:w-[55%]">
           <AnimatePresence mode="wait">
              {generatedDoc ? (
                 <motion.div 
                   key="doc"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-6"
                 >
                    {/* Action Bar */}
                    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3 px-4">
                            {generatedDoc.status === 'Received' ? <ShieldCheck size={20} className="text-emerald-500" /> : <Truck size={20} className="text-amber-500" />}
                            <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">
                                {generatedDoc.status === 'Received' ? 'GRN Verified' : 'Purchase Requisition'}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            {generatedDoc.status === 'Pending' && (
                                <button onClick={() => handleGRN(generatedDoc._id)} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-emerald-700 transition-colors">
                                    <CheckCircle2 size={16} className="mr-3" /> Verify & Receive (GRN)
                                </button>
                            )}
                            <button onClick={handleDownloadPDF} className="px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:opacity-80 transition-opacity">
                                <Printer size={16} className="mr-3" /> Print PO
                            </button>
                            <button onClick={() => setGeneratedDoc(null)} className="p-3 bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900"><X size={20}/></button>
                        </div>
                    </div>

                    {/* Realistic PO/GRN Template */}
                    <div className="bg-white p-12 md:p-16 rounded-[40px] shadow-2xl overflow-x-auto text-black mx-auto w-full max-w-[800px]">
                        <div id="po-document-content" className="min-w-[600px] bg-white text-black p-10 font-sans border border-gray-100 shadow-sm relative overflow-hidden">
                            {/* Watermark for GRN */}
                            {generatedDoc.status === 'Received' && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[30deg] opacity-[0.05] pointer-events-none">
                                    <h1 className="text-9xl font-black border-[10px] border-emerald-600 p-10 text-emerald-600">RECEIVED</h1>
                                </div>
                            )}

                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">PURCHASE ORDER</h1>
                                    <p className="text-[9px] font-black text-gray-400 tracking-[0.4em] uppercase">Eagle Plastic Industries Sourcing</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-black mb-1 tracking-widest">ID: PO-{generatedDoc._id.substring(18).toUpperCase()}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{new Date(generatedDoc.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-10 mb-10">
                                <div>
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Vendor Partner</h3>
                                    <p className="text-lg font-black leading-tight uppercase">{generatedDoc.vendorData?.name}</p>
                                    <p className="text-[10px] font-bold text-gray-500 mt-2">{generatedDoc.vendorData?.address}</p>
                                    <p className="text-[10px] font-bold text-gray-500">{generatedDoc.vendorData?.phone}</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Delivery Address</h3>
                                    <p className="text-[10px] font-black uppercase">Eagle Plastic Industries</p>
                                    <p className="text-[10px] font-bold text-gray-500">GIDC Makarpura, Vadodara,</p>
                                    <p className="text-[10px] font-bold text-gray-500">Gujarat - 390010</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full text-left mb-10 border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-y border-gray-200">
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest">Material Identification</th>
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-center">Volume</th>
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-right">Unit Rate</th>
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="p-6">
                                            <p className="font-black text-sm uppercase">{generatedDoc.items?.[0]?.materialName}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Raw Material Sourcing</p>
                                        </td>
                                        <td className="p-6 text-center text-sm font-black">{generatedDoc.items?.[0]?.quantity} {generatedDoc.items?.[0]?.unit}</td>
                                        <td className="p-6 text-right text-sm font-bold text-gray-500">₹{generatedDoc.items?.[0]?.unitPrice?.toFixed(2)}</td>
                                        <td className="p-6 text-right text-sm font-black text-black">₹{generatedDoc.totalAmount?.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Grand Total */}
                            <div className="flex justify-end mb-12">
                                <div className="w-64 bg-black text-white p-6 rounded-2xl">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">PO Valuation</span>
                                        <span className="text-xl font-black">₹{generatedDoc.totalAmount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-20 pt-10 border-t border-gray-100">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">Terms & Conditions</p>
                                    <p className="text-[8px] font-bold text-gray-500 leading-relaxed italic">
                                        Goods must be delivered in industrial grade packaging. Subject to QC inspection at factory premises. Payments processed via bank transfer after GRN verification.
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="w-full border-b border-black mb-2 pt-8"></div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-black">Purchasing Authority</p>
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
                    <ShoppingBag size={64} className="text-gray-200 dark:text-gray-800 mb-6" />
                    <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Procurement Ledger</h3>
                    <p className="text-xs font-bold text-gray-400 mt-4 max-w-[250px] leading-relaxed">Select a Vendor and Material to issue a professional Purchase Order and track Goods Received (GRN).</p>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

      </div>

      {/* Vendor Onboarding Modal */}
      <AnimatePresence>
         {showVendorModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVendorModal(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white dark:bg-gray-950 rounded-[48px] p-12 max-w-lg w-full shadow-2xl">
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6"><Users size={32} /></div>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Vendor Onboarding</h3>
                    </div>
                    <form onSubmit={handleVendorOnboarding} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Company Name</label>
                            <input required className="input-field" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} placeholder="e.g. Maruti Polychem" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                                <input required className="input-field" value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} placeholder="+91..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                <input required type="email" className="input-field" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} placeholder="contact@..." />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Registered Address</label>
                            <textarea required className="input-field min-h-[100px]" value={vendorForm.address} onChange={e => setVendorForm({...vendorForm, address: e.target.value})} />
                        </div>
                        <div className="pt-6 flex gap-4">
                            <button type="button" onClick={() => setShowVendorModal(false)} className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                            <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">Register Partner</button>
                        </div>
                    </form>
                </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default PurchaseManagement;
