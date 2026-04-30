import { useState, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';
import { 
  Plus, Search, User, Phone, MapPin, 
  Building, Mail, Trash2, Edit3, X,
  Filter, Download, ChevronRight, Hash,
  CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [form, setForm] = useState({
    name: '', companyName: '', email: '', phone: '', address: '', gstNumber: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get('/customers');
      setCustomers(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to sync customer ledger');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      return toast.error('Name, Phone, and Address are required');
    }

    try {
      if (editingCustomer) {
        await axiosInstance.put(`/customers/${editingCustomer._id}`, form);
        toast.success('Customer profile updated');
      } else {
        await axiosInstance.post('/customers', form);
        toast.success('New customer onboarded');
      }
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save operation failed');
    }
  };

  const handleEdit = (cust) => {
    setEditingCustomer(cust);
    setForm({
      name: cust.name,
      companyName: cust.companyName || '',
      email: cust.email || '',
      phone: cust.phone,
      address: cust.address,
      gstNumber: cust.gstNumber || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ name: '', companyName: '', email: '', phone: '', address: '', gstNumber: '' });
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div>
          <h1 className="text-6xl font-extrabold tracking-tighter text-gray-900 dark:text-white uppercase leading-none mb-4">Customer <span className="text-gray-300">&</span> Accounts</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.4em] ml-1">Central Client Ledger</p>
        </div>
        <button onClick={() => { resetForm(); setEditingCustomer(null); setShowModal(true); }} className="btn-primary bg-black text-white px-10 py-5 flex items-center shadow-2xl">
          <Plus size={20} className="mr-3" /> Onboard New Client
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search account directory..." 
            className="w-full pl-16 pr-8 py-5 bg-white dark:bg-gray-900 border-none rounded-[24px] text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-8 py-5 bg-white dark:bg-gray-900 text-gray-400 rounded-[24px] font-bold text-[10px] uppercase tracking-widest flex items-center shadow-sm">
          <Filter size={18} className="mr-3" /> Advanced Filter
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        <AnimatePresence>
          {filteredCustomers.map((cust) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={cust._id} 
              className="bg-white dark:bg-gray-900 p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-[28px] flex items-center justify-center font-black text-gray-400 text-2xl shadow-inner">{cust.name.charAt(0)}</div>
                <div className="flex gap-2">
                   <button onClick={() => handleEdit(cust)} className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-xl hover:bg-black hover:text-white transition-all"><Edit3 size={16} /></button>
                </div>
              </div>
              
              <div className="space-y-1 mb-8">
                <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">{cust.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{cust.companyName || 'Private Lead'}</p>
              </div>

              <div className="space-y-4 mb-10 border-t border-gray-50 dark:border-gray-800 pt-8">
                 <div className="flex items-center text-xs font-bold text-gray-500">
                    <Phone size={14} className="mr-4 opacity-30 text-black dark:text-white" /> {cust.phone}
                 </div>
                 <div className="flex items-start text-xs font-bold text-gray-500 leading-relaxed min-h-[40px]">
                    <MapPin size={14} className="mr-4 mt-1 opacity-30 text-black dark:text-white" /> {cust.address}
                 </div>
              </div>

              <button className="w-full py-4 bg-gray-50 dark:bg-gray-800/50 text-gray-400 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all">View Account Profile</button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredCustomers.length === 0 && !loading && (
          <div className="col-span-full py-32 text-center">
             <User size={80} className="mx-auto text-gray-100 dark:text-white/5 mb-8" />
             <p className="text-gray-300 font-bold uppercase tracking-[0.3em] text-[10px]">No accounts found matching your query</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-3xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-xl bg-white dark:bg-black rounded-[48px] shadow-2xl p-16 border border-white/10">
              <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-12 tracking-tighter uppercase leading-none">{editingCustomer ? 'Update Profile' : 'Onboard Client'}</h3>
              <form onSubmit={handleSubmit} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Contact Person</label>
                    <input required className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full Name" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Organization</label>
                    <input className="input-field" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="Company Name" />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Direct Phone</label>
                       <input required className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email</label>
                       <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="office@firm.com" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Physical Address</label>
                    <textarea required rows="2" className="input-field" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Factory/Office Address" />
                 </div>
                 <div className="flex justify-end gap-6 pt-10 border-t border-gray-100 dark:border-white/5">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Abort</button>
                    <button type="submit" className="btn-primary bg-black text-white px-10">Save Account</button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
