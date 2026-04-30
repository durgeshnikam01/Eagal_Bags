import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  Package, ArrowUpRight, ArrowDownLeft, 
  Search, Plus, X, Layers, Database, 
  ClipboardList, TrendingDown, Trash2, Edit3, 
  AlertCircle, History, FileText, Printer, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const InventoryMaster = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  // Flow State
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [selectedSkuData, setSelectedSkuData] = useState(null);
  
  const [transaction, setTransaction] = useState({
    quantity: '',
    type: 'Stock In', // Stock In, Stock Out, Damaged
    reference: ''
  });

  // UI state for adding new master record
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [newSku, setNewSku] = useState({
    name: '',
    type: 'Raw Material',
    quantity: 0,
    unit: 'kg',
    minimumStock: 100
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await axiosInstance.get('/inventory');
      setInventory(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load Inventory Master');
      setLoading(false);
    }
  };

  const handleSelectSku = (id) => {
    setSelectedSkuId(id);
    const item = inventory.find(i => i._id === id);
    setSelectedSkuData(item);
  };

  const handleProcessTransaction = async (e) => {
    e.preventDefault();
    if (!selectedSkuId) return toast.error('Identify SKU first');
    if (!transaction.quantity || transaction.quantity <= 0) return toast.error('Enter valid quantity');

    setLoading(true);
    try {
      const action = transaction.type === 'Stock In' ? 'add' : 'subtract';
      
      const res = await axiosInstance.put(`/inventory/${selectedSkuId}/stock`, {
        quantity: transaction.quantity,
        action: action
      });
      
      const updatedItem = res.data;

      setGeneratedDoc({
        sku: updatedItem,
        transaction: {
           ...transaction,
           timestamp: new Date().toISOString(),
           id: Math.random().toString(36).substr(2, 9).toUpperCase()
        }
      });

      toast.success(`${transaction.type} logged successfully`);
      fetchInventory();
      setTransaction({ quantity: '', type: 'Stock In', reference: '' });
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMasterRecord = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/inventory', newSku);
      toast.success('Master SKU Record Created');
      setShowAddMaster(false);
      setNewSku({ name: '', type: 'Raw Material', quantity: 0, unit: 'kg', minimumStock: 100 });
      fetchInventory();
    } catch (error) {
      toast.error('Failed to create master SKU');
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('inventory-card-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`StockEntry_${generatedDoc.transaction.id}.pdf`);
      toast.success("Stock Record Exported");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const lowStockItems = inventory.filter(item => item.quantity <= item.minimumStock);

  return (
    <div className="max-w-[1600px] mx-auto pb-24 h-full">
      <div className="mb-10 flex justify-between items-end">
        <div>
           <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Inventory Master</h1>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-emerald-500">{inventory.length} SKUs Monitored | {lowStockItems.length} Low Stock Alerts</p>
        </div>
        <button onClick={() => setShowAddMaster(true)} className="px-6 py-3 bg-white dark:bg-gray-900 border-2 border-black dark:border-white/20 text-black dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
           Create Master SKU
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 items-start">
        
        {/* LEFT COLUMN: THE FLOW */}
        <div className="w-full xl:w-[45%] space-y-12 bg-white dark:bg-gray-950 p-10 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5">
          <form onSubmit={handleProcessTransaction} className="space-y-12">
            
            {/* Phase 1: SKU Identification */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">1</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Identify SKU</h3>
               </div>
               <div className="pl-12 space-y-4">
                  <select required className="input-field w-full text-sm" value={selectedSkuId} onChange={e => handleSelectSku(e.target.value)}>
                     <option value="">Select an active SKU...</option>
                     {inventory.map(i => (
                       <option key={i._id} value={i._id}>
                         {i.name} ({i.quantity} {i.unit}) - {i.type}
                       </option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Phase 2: Transaction Logging */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">2</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Log Transaction</h3>
               </div>
               <div className="pl-12 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Transaction Type</label>
                     <select className="input-field text-sm" value={transaction.type} onChange={e => setTransaction({...transaction, type: e.target.value})}>
                        <option>Stock In</option>
                        <option>Stock Out</option>
                        <option>Damaged / Return</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Volume ({selectedSkuData?.unit || '...' })</label>
                     <input type="number" required className="input-field text-sm" value={transaction.quantity} onChange={e => setTransaction({...transaction, quantity: e.target.value})} placeholder="e.g. 500" />
                  </div>
                  <div className="col-span-2 space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Internal Reference / Note</label>
                     <input className="input-field text-sm" value={transaction.reference} onChange={e => setTransaction({...transaction, reference: e.target.value})} placeholder="e.g. Supplier Invoice #8812" />
                  </div>
               </div>
            </div>

            {/* Phase 3: Finalize */}
            <div className="pt-6 pl-12">
               <button type="submit" disabled={loading || !selectedSkuId} className="w-full btn-primary bg-black text-white py-4 shadow-xl disabled:opacity-50 text-[10px]">
                  {loading ? 'Synchronizing...' : 'Finalize Stock Adjustment'}
               </button>
            </div>

          </form>
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
                            <History size={20} className="text-emerald-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Transaction Logged</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setGeneratedDoc(null)} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                                Close
                            </button>
                            <button onClick={handleDownloadPDF} className="px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:opacity-80 transition-opacity">
                                <Printer size={16} className="mr-3" /> Print Voucher
                            </button>
                        </div>
                    </div>

                    {/* Realistic Stock Record Template */}
                    <div className="bg-white p-12 md:p-16 rounded-[40px] shadow-2xl overflow-x-auto text-black mx-auto w-full max-w-[800px]">
                        <div id="inventory-card-content" className="min-w-[600px] bg-white text-black p-8 font-sans border border-gray-200">
                            {/* Header */}
                            <div className="flex justify-between items-center border-b-[4px] border-black pb-8 mb-8">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-black leading-none mb-1">STOCK MOVEMENT VOUCHER</h2>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Eagle ERP Inventory Intelligence</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-black">VOUCHER ID: {generatedDoc.transaction.id}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{new Date(generatedDoc.transaction.timestamp).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-10 mb-10">
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">SKU Identification</h3>
                                    <p className="text-xl font-black text-black leading-tight uppercase">{generatedDoc.sku.name}</p>
                                    <p className="text-xs font-bold text-gray-400 mt-1 tracking-widest">TYPE: {generatedDoc.sku.type}</p>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Transaction Details</h3>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className={`text-lg font-black uppercase ${generatedDoc.transaction.type === 'Stock In' ? 'text-emerald-600' : 'text-rose-600'}`}>{generatedDoc.transaction.type}</p>
                                            <p className="text-xs font-bold text-gray-400 italic">Ref: {generatedDoc.transaction.reference || 'Internal Adjustment'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-black">{generatedDoc.transaction.quantity} <span className="text-xs">{generatedDoc.sku.unit}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Balance Card */}
                            <div className="bg-black text-white p-10 rounded-[32px] mb-10 flex justify-between items-center shadow-2xl">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">New System Balance</h4>
                                    <p className="text-5xl font-black tracking-tighter">{generatedDoc.sku.quantity.toLocaleString()} <span className="text-sm font-bold uppercase tracking-widest text-gray-500">{generatedDoc.sku.unit}</span></p>
                                </div>
                                <div className="text-right">
                                    <ShieldCheck size={48} className="text-emerald-500 mb-4 ml-auto" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-tight">Master Ledger<br/>Verified & Synced</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-20 pt-10 border-t border-gray-100">
                                <div className="text-center">
                                    <div className="h-px bg-black mb-2"></div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-black">Store Keeper</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-px bg-black mb-2"></div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-black">Authorized Signatory</p>
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
                    <Database size={64} className="text-gray-200 dark:text-gray-800 mb-6" />
                    <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Global Ledger Registry</h3>
                    <p className="text-xs font-bold text-gray-400 mt-4 max-w-[250px] leading-relaxed">Select an SKU and log a stock transaction to generate a verified Material Movement Voucher.</p>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

      </div>

      {/* Add Master Modal (Pipeline styled) */}
      <AnimatePresence>
         {showAddMaster && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddMaster(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white dark:bg-gray-950 rounded-[48px] p-12 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-white/5">
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><Plus size={32} /></div>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">New Master SKU</h3>
                    </div>
                    <form onSubmit={handleAddMasterRecord} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nomenclature</label>
                            <input required className="input-field" value={newSku.name} onChange={e => setNewSku({...newSku, name: e.target.value})} placeholder="e.g. HDPE Granules Grade A" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type</label>
                                <select className="input-field" value={newSku.type} onChange={e => setNewSku({...newSku, type: e.target.value})}>
                                    <option>Raw Material</option><option>Work In Progress</option><option>Finished Goods</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">UOM</label>
                                <input required className="input-field" value={newSku.unit} onChange={e => setNewSku({...newSku, unit: e.target.value})} placeholder="kg" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Opening Qty</label>
                                <input type="number" required className="input-field" value={newSku.quantity} onChange={e => setNewSku({...newSku, quantity: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Min Level</label>
                                <input type="number" required className="input-field" value={newSku.minimumStock} onChange={e => setNewSku({...newSku, minimumStock: e.target.value})} />
                            </div>
                        </div>
                        <div className="pt-6 flex gap-4">
                            <button type="button" onClick={() => setShowAddMaster(false)} className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">Discard</button>
                            <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">Create Record</button>
                        </div>
                    </form>
                </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryMaster;
