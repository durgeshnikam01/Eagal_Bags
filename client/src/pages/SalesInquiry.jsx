import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  Phone, Globe, CheckCircle2, 
  Printer, ArrowRight, X, FileText, Download, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const SalesInquiry = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  // Flow State
  const [source, setSource] = useState('Phone');
  const [sourceDetails, setSourceDetails] = useState('');
  
  const [customerMode, setCustomerMode] = useState('existing');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', companyName: '' });
  
  const [productType, setProductType] = useState('HDPE Woven Bag');
  const [specs, setSpecs] = useState({ size: '', weightCapacity: '', lamination: false, printing: 'None', quantity: '' });
  
  const [pricing, setPricing] = useState({ unitPrice: '', validDays: 7 });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axiosInstance.get('/customers');
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const handleGenerateOutputs = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalCustomerId = selectedCustomer;
      let customerData = customers.find(c => c._id === selectedCustomer);

      if (customerMode === 'new') {
        if (!newCustomer.name || !newCustomer.phone || !newCustomer.address) {
          toast.error('Name, Phone, and Address are required for new customer');
          setLoading(false);
          return;
        }
        const custRes = await axiosInstance.post('/customers', newCustomer);
        finalCustomerId = custRes.data._id;
        customerData = custRes.data;
        fetchCustomers();
      }

      if (!finalCustomerId) {
        toast.error('Please select or add a customer');
        setLoading(false);
        return;
      }

      if (!sourceDetails || !specs.size || !specs.weightCapacity || !specs.quantity || !pricing.unitPrice) {
        toast.error('Please fill all required specification fields');
        setLoading(false);
        return;
      }

      const inquiryPayload = {
        customer: finalCustomerId,
        productType,
        quantity: Number(specs.quantity),
        specs: {
          size: specs.size,
          weightCapacity: specs.weightCapacity,
          lamination: specs.lamination,
          printing: specs.printing
        },
        source,
        notes: `Source Details: ${sourceDetails}`
      };

      const inqRes = await axiosInstance.post('/sales/inquiries', inquiryPayload);
      const inquiryData = inqRes.data;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + Number(pricing.validDays));

      const quotePayload = {
        inquiryId: inquiryData._id,
        unitPrice: Number(pricing.unitPrice),
        validUntil: validUntil.toISOString().split('T')[0],
        terms: 'Payment: 50% Advance. GST Extra.'
      };

      const quoRes = await axiosInstance.post('/sales/quotations', quotePayload);
      
      setGeneratedDoc({
        ...quoRes.data,
        customer: customerData,
        inquiry: inquiryData
      });

      toast.success('Inquiry Logged & Proforma Generated');
      
      setSourceDetails('');
      setSpecs({ size: '', weightCapacity: '', lamination: false, printing: 'None', quantity: '' });
      setPricing({ unitPrice: '', validDays: 7 });
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Process failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('proforma-invoice-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Proforma_${generatedDoc.quotationNumber}.pdf`);
      toast.success("PDF Downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate PDF");
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-24 h-full">
      <div className="mb-10">
        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Sales Pipeline</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">End-to-End Industrial Workflow</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 items-start">
        
        {/* LEFT COLUMN: THE FLOW */}
        <div className="w-full xl:w-[45%] space-y-12 bg-white dark:bg-gray-950 p-10 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5">
          <form onSubmit={handleGenerateOutputs} className="space-y-12">
            
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">1</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Inquiry Received</h3>
               </div>
               <div className="pl-12 space-y-4">
                  <div className="flex gap-4">
                     {['Phone', 'Website'].map(s => (
                       <button key={s} type="button" onClick={() => { setSource(s); setSourceDetails(''); }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${source === s ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 border-transparent hover:border-gray-200'}`}>
                          {s === 'Phone' ? <Phone size={14} className="inline mr-2" /> : <Globe size={14} className="inline mr-2" />} {s}
                       </button>
                     ))}
                  </div>
                  <input required className="input-field w-full text-sm" value={sourceDetails} onChange={e => setSourceDetails(e.target.value)} placeholder={source === 'Phone' ? 'Enter Phone Number' : 'Enter Website URL'} />
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">2</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Add Customer</h3>
               </div>
               <div className="pl-12 space-y-4">
                  <div className="flex bg-gray-50 dark:bg-gray-900 p-1.5 rounded-[16px] w-full">
                     <button type="button" onClick={() => setCustomerMode('existing')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${customerMode === 'existing' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' : 'text-gray-400'}`}>Select Existing</button>
                     <button type="button" onClick={() => setCustomerMode('new')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${customerMode === 'new' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' : 'text-gray-400'}`}>New Customer</button>
                  </div>

                  {customerMode === 'existing' ? (
                     <select required className="input-field w-full text-sm" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                        <option value="">Choose an account...</option>
                        {customers.map(c => <option key={c._id} value={c._id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>)}
                     </select>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-white/5">
                        <input required className="input-field bg-white text-xs" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Contact Name" />
                        <input className="input-field bg-white text-xs" value={newCustomer.companyName} onChange={e => setNewCustomer({...newCustomer, companyName: e.target.value})} placeholder="Company Name" />
                        <input required className="input-field bg-white text-xs" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="Phone Number" />
                        <textarea required rows="1" className="input-field bg-white text-xs" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="Physical Address" />
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">3</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Product Specs</h3>
               </div>
               <div className="pl-12 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <select className="input-field text-sm" value={productType} onChange={e => setProductType(e.target.value)}>
                        <option>HDPE Woven Bag</option>
                        <option>PP Woven Bag</option>
                     </select>
                     <input type="number" required className="input-field text-sm" value={specs.quantity} onChange={e => setSpecs({...specs, quantity: e.target.value})} placeholder="Order Quantity" />
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl grid grid-cols-2 gap-4 border border-gray-100 dark:border-white/5">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Size (Inch)</label>
                        <input required className="input-field bg-white text-xs" value={specs.size} onChange={e => setSpecs({...specs, size: e.target.value})} placeholder="e.g. 24x36" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacity</label>
                        <input required className="input-field bg-white text-xs" value={specs.weightCapacity} onChange={e => setSpecs({...specs, weightCapacity: e.target.value})} placeholder="e.g. 50kg" />
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

            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">4</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Finalize Output</h3>
               </div>
               <div className="pl-12">
                  <div className="flex gap-4 items-end">
                     <div className="w-full space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Unit Price (₹)</label>
                        <input type="number" step="0.01" required className="input-field text-lg font-black" value={pricing.unitPrice} onChange={e => setPricing({...pricing, unitPrice: e.target.value})} placeholder="0.00" />
                     </div>
                     <button type="submit" disabled={loading} className="w-full btn-primary bg-black text-white py-4 shadow-xl disabled:opacity-50 text-[10px]">
                        {loading ? 'Processing...' : 'Generate Outputs'}
                     </button>
                  </div>
               </div>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: THE REALISTIC INVOICE OUTPUT */}
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
                            <CheckCircle2 size={20} className="text-emerald-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Document Ready</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setGeneratedDoc(null)} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                                Close
                            </button>
                            <button onClick={handleDownloadPDF} className="px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:opacity-80 transition-opacity">
                                <Download size={16} className="mr-3" /> Download PDF
                            </button>
                        </div>
                    </div>

                    {/* Realistic Proforma Invoice Template (A4 styled) */}
                    <div className="bg-white p-12 md:p-16 rounded-[40px] shadow-2xl overflow-x-auto text-black mx-auto w-full max-w-[800px]">
                        <div id="proforma-invoice-content" className="min-w-[600px] bg-white text-black p-8 font-sans">
                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center text-white">
                                        <Building2 size={32} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black uppercase tracking-tighter text-black leading-none mb-1">EAGLE PLASTIC</h1>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600">Industries</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-2xl font-black uppercase text-black tracking-tight mb-2">Proforma Invoice</h2>
                                    <p className="text-xs font-bold text-gray-600">GIDC Makarpura, Vadodara</p>
                                    <p className="text-xs font-bold text-gray-600">Gujarat, India 390010</p>
                                    <p className="text-xs font-bold text-gray-600 mt-2">GSTIN: 24AAACE1234A1Z5</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-12 mb-10">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Billed To</h3>
                                    <p className="text-lg font-black text-black leading-tight mb-1">{generatedDoc.customer?.name}</p>
                                    {generatedDoc.customer?.companyName && <p className="text-sm font-bold text-gray-700">{generatedDoc.customer?.companyName}</p>}
                                    <p className="text-xs font-medium text-gray-600 mt-2 max-w-[250px]">{generatedDoc.customer?.address}</p>
                                    <p className="text-xs font-medium text-gray-600 mt-1">Phone: {generatedDoc.customer?.phone}</p>
                                </div>
                                <div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Invoice No</div>
                                        <div className="font-bold text-right text-black">PI-{generatedDoc.quotationNumber.split('-')[2] || generatedDoc.quotationNumber}</div>
                                        
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Issue Date</div>
                                        <div className="font-bold text-right text-black">{new Date(generatedDoc.createdAt).toLocaleDateString()}</div>
                                        
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Valid Until</div>
                                        <div className="font-bold text-right text-black">{new Date(generatedDoc.validUntil).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Item Table */}
                            <div className="mb-10">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-black">
                                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 w-12 text-center">No.</th>
                                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Item Description & Specs</th>
                                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-right">Quantity</th>
                                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-right">Unit Price</th>
                                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-200">
                                            <td className="py-6 text-sm font-bold text-center align-top">01</td>
                                            <td className="py-6">
                                                <p className="font-black text-sm mb-1 uppercase tracking-tight">{generatedDoc.inquiry?.productType}</p>
                                                <p className="text-xs font-medium text-gray-600">Size: {generatedDoc.inquiry?.specs?.size} Inch</p>
                                                <p className="text-xs font-medium text-gray-600">Capacity: {generatedDoc.inquiry?.specs?.weightCapacity}</p>
                                                <p className="text-xs font-medium text-gray-600">Lamination: {generatedDoc.inquiry?.specs?.lamination ? 'Yes' : 'No'} | Print: {generatedDoc.inquiry?.specs?.printing}</p>
                                            </td>
                                            <td className="py-6 text-sm font-bold text-right align-top">{generatedDoc.inquiry?.quantity?.toLocaleString()} Pcs</td>
                                            <td className="py-6 text-sm font-bold text-right align-top">₹{generatedDoc.unitPrice.toFixed(2)}</td>
                                            <td className="py-6 text-sm font-black text-right align-top">₹{generatedDoc.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals Calculation */}
                            <div className="flex justify-end mb-12">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-sm font-bold text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{generatedDoc.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-gray-600">
                                        <span>IGST (18%)</span>
                                        <span>₹{(generatedDoc.totalAmount * 0.18).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-black text-black border-t-2 border-black pt-3">
                                        <span>Grand Total</span>
                                        <span>₹{(generatedDoc.totalAmount * 1.18).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Terms & Signatures */}
                            <div className="flex justify-between items-end border-t border-gray-200 pt-8 mt-16">
                                <div className="max-w-[400px]">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-black mb-2">Terms & Conditions</h4>
                                    <p className="text-[10px] font-medium text-gray-600 leading-relaxed">
                                        1. Payment Terms: 50% Advance along with PO, 50% prior to dispatch.<br/>
                                        2. Validity: This proforma is valid for {pricing.validDays} days from issue.<br/>
                                        3. Taxes: GST @ 18% applied. Freight extra at actuals.<br/>
                                        4. Subject to Vadodara jurisdiction.
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="w-40 border-b border-black mb-2"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-black">Authorized Signatory</p>
                                    <p className="text-[8px] font-bold text-gray-500 mt-1">For Eagle Plastic Industries</p>
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
                    <FileText size={64} className="text-gray-200 dark:text-gray-800 mb-6" />
                    <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Awaiting Input</h3>
                    <p className="text-xs font-bold text-gray-400 mt-4 max-w-[250px] leading-relaxed">Complete the pipeline on the left to instantly generate the Quotation and Proforma Invoice.</p>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default SalesInquiry;
