import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  FileCheck, Calendar, CheckCircle2, 
  Printer, ArrowRight, Package, X, Factory
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const OrderManagement = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  // Flow State
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  
  const [specs, setSpecs] = useState({ 
    quantity: '', 
    deliveryDate: '',
    size: '', 
    weightCapacity: '', 
    lamination: false, 
    printing: 'None',
    unitPrice: 0
  });

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await axiosInstance.get('/sales/quotations');
      // Only show quotations that haven't been fully processed/rejected
      const activeQuotes = (Array.isArray(res.data) ? res.data : []).filter(q => q.status !== 'Rejected');
      setQuotations(activeQuotes);
    } catch (error) {
      toast.error('Failed to load quotations');
    }
  };

  const handleSelectQuotation = (id) => {
    setSelectedQuotationId(id);
    const quote = quotations.find(q => q._id === id);
    if (quote && quote.inquiry) {
       setSpecs({
          quantity: quote.inquiry.quantity || '',
          deliveryDate: '',
          size: quote.inquiry.specs?.size || '',
          weightCapacity: quote.inquiry.specs?.weightCapacity || '',
          lamination: quote.inquiry.specs?.lamination || false,
          printing: quote.inquiry.specs?.printing || 'None',
          unitPrice: quote.unitPrice || 0
       });
    }
  };

  const handleGenerateSalesOrder = async (e) => {
    e.preventDefault();
    if (!selectedQuotationId) return toast.error('Please select a base quotation first');
    if (!specs.deliveryDate) return toast.error('Delivery date is mandatory for production');
    
    setLoading(true);

    try {
      const quote = quotations.find(q => q._id === selectedQuotationId);
      if (!quote || !quote.customer) {
        return toast.error('Quotation data incomplete: No Customer Found');
      }

      const orderPayload = {
        customer: quote.customer._id,
        type: 'Sales Order',
        deliveryDate: specs.deliveryDate,
        totalAmount: Number(specs.quantity) * Number(specs.unitPrice),
        orderItems: [
          {
            productSpec: {
              size: specs.size,
              weight: typeof specs.weightCapacity === 'string' 
                ? Number(specs.weightCapacity.replace(/[^0-9.]/g, '') || 50)
                : Number(specs.weightCapacity || 50),
              lamination: specs.lamination,
              printing: specs.printing
            },
            quantity: Number(specs.quantity),
            unitPrice: Number(specs.unitPrice)
          }
        ]
      };

      // 1. Create the Sales Order in the backend
      const orderRes = await axiosInstance.post('/orders', orderPayload);
      const newOrder = orderRes.data;

      // 2. Mark the original quotation as Accepted
      await axiosInstance.put(`/sales/quotations/${selectedQuotationId}/status`, { status: 'Accepted' });

      // Merge data for the Sales Order View
      setGeneratedDoc({
        ...newOrder,
        customer: quote.customer,
        baseQuotation: quote.quotationNumber,
        productType: quote.inquiry?.productType || 'HDPE Woven Bag',
        specs: orderPayload.orderItems[0].productSpec,
        quantity: orderPayload.orderItems[0].quantity,
        unitPrice: orderPayload.orderItems[0].unitPrice
      });

      toast.success('Sales Order Generated for Production');
      fetchQuotations(); // Refresh list to reflect accepted status
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate Sales Order');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('sales-order-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SalesOrder_${generatedDoc._id.substring(18).toUpperCase()}.pdf`);
      toast.success("Sales Order Downloaded");
    } catch (err) {
      toast.error("Failed to export Sales Order");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-24 h-full">
      <div className="mb-10">
        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Order Finalization</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Convert Quotations to Production Sales Orders</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 items-start">
        
        {/* LEFT COLUMN: THE FLOW */}
        <div className="w-full xl:w-[45%] space-y-12 bg-white dark:bg-gray-950 p-10 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5">
          <form onSubmit={handleGenerateSalesOrder} className="space-y-12">
            
            {/* Phase 1: Quotation Conversion */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">1</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Convert Quotation</h3>
               </div>
               <div className="pl-12 space-y-4">
                  <select required className="input-field w-full text-sm" value={selectedQuotationId} onChange={e => handleSelectQuotation(e.target.value)}>
                     <option value="">Select a pending quotation...</option>
                     {quotations.map(q => (
                       <option key={q._id} value={q._id}>
                         {q.quotationNumber} - {q.customer?.name} ({q.status})
                       </option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Phase 2: Logistics & Targets */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">2</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Logistics & Targets</h3>
               </div>
               <div className="pl-12 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Final Quantity (Pcs)</label>
                     <input type="number" required className="input-field text-sm" value={specs.quantity} onChange={e => setSpecs({...specs, quantity: e.target.value})} placeholder="e.g. 50000" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Delivery Target</label>
                     <input type="date" required className="input-field text-sm w-full" value={specs.deliveryDate} onChange={e => setSpecs({...specs, deliveryDate: e.target.value})} />
                  </div>
               </div>
            </div>

            {/* Phase 3: Finalize Custom Specs */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">3</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Finalize Specs</h3>
               </div>
               <div className="pl-12">
                  <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl grid grid-cols-2 gap-4 border border-gray-100 dark:border-white/5">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Size (Inch)</label>
                        <input required className="input-field bg-white text-xs" value={specs.size} onChange={e => setSpecs({...specs, size: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacity</label>
                        <input required className="input-field bg-white text-xs" value={specs.weightCapacity} onChange={e => setSpecs({...specs, weightCapacity: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Lamination</label>
                        <select className="input-field bg-white text-xs" value={specs.lamination ? 'Yes' : 'No'} onChange={e => setSpecs({...specs, lamination: e.target.value === 'Yes'})}>
                           <option>No</option>
                           <option>Yes</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Printing</label>
                        <select className="input-field bg-white text-xs" value={specs.printing} onChange={e => setSpecs({...specs, printing: e.target.value})}>
                           <option>None</option>
                           <option>Single Colour</option>
                           <option>Multi Colour</option>
                        </select>
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-6 pl-12">
               <button type="submit" disabled={loading || !selectedQuotationId} className="w-full btn-primary bg-black text-white py-4 shadow-xl disabled:opacity-50 text-[10px]">
                  {loading ? 'Processing...' : 'Confirm & Generate Sales Order'}
               </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: THE REALISTIC SALES ORDER OUTPUT */}
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
                            <Factory size={20} className="text-blue-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Order Confirmed</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setGeneratedDoc(null)} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                                Close
                            </button>
                            <button onClick={handleDownloadPDF} className="px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:opacity-80 transition-opacity">
                                <Printer size={16} className="mr-3" /> Print PDF
                            </button>
                        </div>
                    </div>

                    {/* Realistic Sales Order Template (A4 styled) */}
                    <div className="bg-white p-12 md:p-16 rounded-[40px] shadow-2xl overflow-x-auto text-black mx-auto w-full max-w-[800px]">
                        <div id="sales-order-content" className="min-w-[600px] bg-white text-black p-8 font-sans">
                            {/* Header */}
                            <div className="flex justify-between items-start border-b-[3px] border-black pb-8 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-black flex items-center justify-center text-white">
                                        <Package size={32} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black uppercase tracking-tighter text-black leading-none mb-1">EAGLE PLASTIC</h1>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600">Manufacturing Plant</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-black uppercase text-black tracking-tight mb-2">SALES ORDER</h2>
                                    <p className="text-xs font-bold text-gray-600">Order ID: SO-{generatedDoc._id.substring(18).toUpperCase()}</p>
                                    <p className="text-xs font-bold text-gray-600">Ref Quote: {generatedDoc.baseQuotation}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-12 mb-10 bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Customer Details</h3>
                                    <p className="text-lg font-black text-black leading-tight">{generatedDoc.customer?.name}</p>
                                    {generatedDoc.customer?.companyName && <p className="text-sm font-bold text-gray-800">{generatedDoc.customer?.companyName}</p>}
                                    <p className="text-xs font-medium text-gray-600 mt-2">{generatedDoc.customer?.address}</p>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Production Schedule</h3>
                                    <div className="grid grid-cols-2 gap-y-3 text-sm mt-3">
                                        <div className="text-xs font-bold text-gray-500">Order Date:</div>
                                        <div className="font-black text-right text-black">{new Date(generatedDoc.createdAt).toLocaleDateString()}</div>
                                        
                                        <div className="text-xs font-bold text-blue-600">Delivery Target:</div>
                                        <div className="font-black text-right text-blue-600">{new Date(generatedDoc.deliveryDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Specs Table */}
                            <div className="mb-12">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Confirmed Specifications</h3>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black text-white">
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest w-16 text-center">Item</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Product & Build Specs</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Qty Confirmed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b-2 border-gray-200 bg-gray-50/50">
                                            <td className="p-6 text-sm font-black text-center align-top">01</td>
                                            <td className="p-6">
                                                <p className="font-black text-lg mb-2 uppercase tracking-tight text-black">{generatedDoc.productType}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="font-medium text-gray-600">Size: <span className="font-black text-black">{generatedDoc.specs?.size} Inch</span></div>
                                                    <div className="font-medium text-gray-600">Capacity: <span className="font-black text-black">{generatedDoc.specs?.weight}g/kg</span></div>
                                                    <div className="font-medium text-gray-600">Lamination: <span className="font-black text-black">{generatedDoc.specs?.lamination ? 'Yes' : 'No'}</span></div>
                                                    <div className="font-medium text-gray-600">Printing: <span className="font-black text-black">{generatedDoc.specs?.printing}</span></div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-xl font-black text-center align-middle text-blue-600">
                                                {generatedDoc.quantity?.toLocaleString()} <span className="text-xs font-bold text-gray-500">Pcs</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Financial Summary */}
                            <div className="flex justify-between items-start border-t-2 border-black pt-8 mt-12">
                                <div className="max-w-[350px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Production Notes</p>
                                    <p className="text-xs font-medium text-gray-600 leading-relaxed bg-gray-50 p-4 border border-gray-200">
                                        Order cleared for production. Ensure lamination and printing exactly match approved client artwork. Dispatch via standard freight to registered address on or before target delivery date.
                                    </p>
                                </div>
                                <div className="w-64">
                                    <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                                        <span>Unit Rate</span>
                                        <span>₹{generatedDoc.unitPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-black text-black bg-gray-100 p-4 rounded-lg">
                                        <span>Order Value</span>
                                        <span>₹{generatedDoc.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                    <div className="mt-8 text-center">
                                       <div className="w-40 border-b border-black mb-2 mx-auto"></div>
                                       <p className="text-[10px] font-black uppercase tracking-widest text-black">Factory Manager</p>
                                    </div>
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
                    <FileCheck size={64} className="text-gray-200 dark:text-gray-800 mb-6" />
                    <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Order Processing</h3>
                    <p className="text-xs font-bold text-gray-400 mt-4 max-w-[250px] leading-relaxed">Select a quotation and finalize the logistics to instantly release a Sales Order for production.</p>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default OrderManagement;
