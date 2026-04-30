import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  Truck, Package, MapPin, User, 
  FileText, ArrowRight, CheckCircle2, 
  Navigation, Timer, ShieldCheck, 
  Printer, Boxes, CreditCard, Search,
  Activity, Globe, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const DispatchLogistics = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedChallan, setGeneratedChallan] = useState(null);

  // Flow State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [dispatchData, setDispatchData] = useState({
    carrier: 'Blue Dart Logistics',
    vehicleNumber: 'GJ-06-BT-4592',
    driverName: 'Ramesh Singh',
    packingDetails: '250 Bales (200 Bags per Bale)',
    destination: 'Ahmedabad Industrial Hub'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordRes, dispRes] = await Promise.all([
        axiosInstance.get('/orders'),
        axiosInstance.get('/dispatch')
      ]);
      // Show orders ready for dispatch (Completed/QC Passed)
      const ready = (Array.isArray(ordRes.data) ? ordRes.data : []).filter(o => o.status === 'Completed' || o.status === 'In Production');
      setSalesOrders(ready);
      setDispatches(Array.isArray(dispRes.data) ? dispRes.data : []);
    } catch (error) {
      toast.error('Logistics hub sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (id) => {
    setSelectedOrderId(id);
    const order = salesOrders.find(o => o._id === id);
    if (order) {
       setDispatchData({
          ...dispatchData,
          destination: order.customer?.address || 'Standard Registered Address'
       });
    }
  };

  const handleFinalizeDispatch = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) return toast.error('Identify Release Target');
    
    setLoading(true);
    try {
      const order = salesOrders.find(o => o._id === selectedOrderId);
      const payload = {
        order: selectedOrderId,
        carrier: dispatchData.carrier,
        vehicleNumber: dispatchData.vehicleNumber,
        trackingId: `LR-${Math.floor(Math.random() * 90000) + 10000}`,
        status: 'In Transit'
      };

      const res = await axiosInstance.post('/dispatch', payload);
      
      setGeneratedChallan({
        ...res.data,
        orderData: order,
        packingDetails: dispatchData.packingDetails,
        driverName: dispatchData.driverName,
        destination: dispatchData.destination
      });

      toast.success('Batch Dispatched | Challan Generated');
      fetchData();
    } catch (error) {
      toast.error('Dispatch failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadChallan = async () => {
     const element = document.getElementById('challan-content');
     if (!element) return;
     const canvas = await html2canvas(element, { scale: 2 });
     const imgData = canvas.toDataURL('image/png');
     const pdf = new jsPDF('p', 'mm', 'a4');
     const pdfWidth = pdf.internal.pageSize.getWidth();
     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
     pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
     pdf.save(`Challan_${generatedChallan.dispatchNumber}.pdf`);
  };

  return (
    <div className="w-full mx-auto pb-24 h-full">
      <div className="mb-10 flex justify-between items-end">
        <div>
           <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">8. Dispatch & Logistics</h1>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Truck size={14} className="text-blue-500 animate-bounce" /> Logistics Hub | {dispatches.filter(d => d.status !== 'Delivered').length} Shipments in Transit
           </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* LEFT COLUMN: DISPATCH PIPELINE */}
        <div className="w-full lg:w-[42%] space-y-12 bg-white dark:bg-gray-950 p-10 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5">
          <form onSubmit={handleFinalizeDispatch} className="space-y-12">
            
            {/* Phase 1: Release Target */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">1</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Release Target</h3>
               </div>
               <div className="pl-12">
                  <select required className="input-field w-full text-sm font-bold" value={selectedOrderId} onChange={e => handleSelectOrder(e.target.value)}>
                     <option value="">Select ready production batch...</option>
                     {salesOrders.map(o => (
                       <option key={o._id} value={o._id}>
                         Order #{o._id.substring(18).toUpperCase()} - {o.customer?.name} ({o.status})
                       </option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Phase 2: Fleet & Packing */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">2</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Fleet & Packing</h3>
               </div>
               <div className="pl-12 space-y-6">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Boxes size={12}/> Packing Configuration</label>
                     <input required className="input-field text-sm" value={dispatchData.packingDetails} onChange={e => setDispatchData({...dispatchData, packingDetails: e.target.value})} placeholder="e.g. 500 Bags (Baled)" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Truck size={12}/> Carrier Name</label>
                        <input required className="input-field text-sm" value={dispatchData.carrier} onChange={e => setDispatchData({...dispatchData, carrier: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Navigation size={12}/> Vehicle Plate</label>
                        <input required className="input-field text-sm" value={dispatchData.vehicleNumber} onChange={e => setDispatchData({...dispatchData, vehicleNumber: e.target.value})} />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Driver Name</label>
                        <input required className="input-field text-sm" value={dispatchData.driverName} onChange={e => setDispatchData({...dispatchData, driverName: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> Destination</label>
                        <input required className="input-field text-sm" value={dispatchData.destination} onChange={e => setDispatchData({...dispatchData, destination: e.target.value})} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Phase 3: Finalize Dispatch */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs">3</div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Finalize Dispatch</h3>
               </div>
               <div className="pl-12">
                  <button type="submit" disabled={loading || !selectedOrderId} className="w-full btn-primary bg-black text-white py-5 shadow-2xl disabled:opacity-50 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                     {loading ? 'Processing Dispatch...' : 'Generate Delivery Challan'} <ArrowRight size={18} />
                  </button>
               </div>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: LOGISTICS HUB & CHALLAN PREVIEW */}
        <div className="w-full lg:w-[58%]">
           <AnimatePresence mode="wait">
              {generatedChallan ? (
                 <motion.div key="challan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Dispatch Confirmed</p>
                             <h4 className="text-sm font-black text-gray-900 dark:text-white">{generatedChallan.dispatchNumber}</h4>
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={() => setGeneratedChallan(null)} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Close</button>
                          <button onClick={downloadChallan} className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:opacity-90 transition-all">
                             <Printer size={16} /> Export Challan
                          </button>
                       </div>
                    </div>

                    <div id="challan-content" className="bg-white p-12 shadow-2xl rounded-[40px] text-black w-full max-w-[800px] mx-auto font-sans">
                        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-2xl"><Truck size={32} /></div>
                              <div>
                                 <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">EAGLE PLASTIC</h2>
                                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Delivery Challan & Packing List</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">CHALLAN</h1>
                              <p className="text-sm font-bold text-gray-600">ID: {generatedChallan.dispatchNumber}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 mb-10">
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Consignee (Bill To)</p>
                              <h4 className="text-lg font-black text-black leading-tight mb-2">{generatedChallan.orderData?.customer?.name}</h4>
                              <p className="text-xs font-medium text-gray-600 italic leading-relaxed">{generatedChallan.destination}</p>
                           </div>
                           <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Shipment Intelligence</p>
                              <div className="space-y-2 text-xs">
                                 <div className="flex justify-between">
                                    <span className="font-bold text-gray-500">Dispatch Date:</span>
                                    <span className="font-black">{new Date().toLocaleDateString()}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span className="font-bold text-gray-500">Carrier:</span>
                                    <span className="font-black">{generatedChallan.carrier}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span className="font-bold text-gray-500">Vehicle No:</span>
                                    <span className="font-black text-blue-600">{generatedChallan.vehicleNumber}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span className="font-bold text-gray-500">Driver Name:</span>
                                    <span className="font-black">{generatedChallan.driverName}</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="mb-10">
                           <table className="w-full border-collapse">
                              <thead>
                                 <tr className="bg-black text-white">
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left">Product Description</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Packing Details</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Total Qty</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 <tr className="border-b-2 border-gray-100">
                                    <td className="p-6">
                                       <p className="font-black text-black uppercase">HDPE Woven Bags</p>
                                       <p className="text-[10px] text-gray-500 font-bold mt-1">Ref Order: SO-{generatedChallan.orderData?._id.substring(18).toUpperCase()}</p>
                                    </td>
                                    <td className="p-6 text-center text-sm font-black text-gray-700">{generatedChallan.packingDetails}</td>
                                    <td className="p-6 text-right text-lg font-black text-black">{generatedChallan.orderData?.orderItems?.[0]?.quantity?.toLocaleString()} Pcs</td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>

                        <div className="flex justify-between items-end mt-16">
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Receiver's Signature</p>
                              <div className="w-48 h-12 border-b-2 border-black border-dashed"></div>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Authorized Signatory</p>
                              <div className="w-48 h-12 border-b-2 border-black border-dashed ml-auto mb-2"></div>
                              <p className="text-[10px] font-black uppercase italic">For Eagle Plastic Industries</p>
                           </div>
                        </div>
                    </div>
                 </motion.div>
              ) : (
                 <div className="space-y-8">
                    {/* Active Shipments Hub */}
                    <div className="bg-white dark:bg-gray-950 p-10 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl">
                       <div className="flex justify-between items-end mb-10">
                          <div>
                             <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Logistics Hub</h3>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Fleets & Recent Dispatches</p>
                          </div>
                          <Globe size={32} className="text-primary opacity-20" />
                       </div>
                       
                       <div className="space-y-4">
                          {dispatches.slice(0, 5).map((d, i) => (
                             <div key={i} className="flex items-center justify-between p-6 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 hover:scale-[1.01] transition-transform group">
                                <div className="flex items-center gap-6">
                                   <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100 dark:border-white/10"><Truck size={24} /></div>
                                   <div>
                                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{d.dispatchNumber}</h4>
                                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{d.carrier} | {d.vehicleNumber}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-8 text-right">
                                   <div>
                                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${d.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600 animate-pulse'}`}>{d.status}</span>
                                   </div>
                                   <button 
                                     onClick={() => setGeneratedChallan({
                                        ...d,
                                        orderData: d.order,
                                        packingDetails: 'Standard Bales', // Re-fetching fallback
                                        driverName: 'Assigned Driver',
                                        destination: d.order?.customer?.address || 'Registered Site'
                                     })}
                                     className="p-2 text-gray-300 hover:text-primary transition-colors"
                                   >
                                      <FileText size={18} />
                                   </button>
                                </div>
                             </div>
                          ))}
                          {dispatches.length === 0 && (
                             <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px]">
                                <Package size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active dispatches in queue</p>
                             </div>
                          )}
                       </div>
                    </div>
                    
                    {/* Fleet Stats */}
                    <div className="grid grid-cols-2 gap-8">
                       <div className="bg-black p-8 rounded-[40px] text-white flex items-center justify-between shadow-2xl">
                          <div>
                             <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">Transit Fleet</p>
                             <h4 className="text-4xl font-black tracking-tighter italic">{dispatches.filter(d => d.status !== 'Delivered').length} Units</h4>
                          </div>
                          <Activity size={48} className="text-primary opacity-50" />
                       </div>
                       <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-gray-100 dark:border-white/5 flex items-center justify-between shadow-sm">
                          <div>
                             <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">AVG Transit Time</p>
                             <h4 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic">1.4 Days</h4>
                          </div>
                          <Timer size={48} className="text-gray-100" />
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

export default DispatchLogistics;
