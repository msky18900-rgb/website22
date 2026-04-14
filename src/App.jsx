import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, LayoutGrid, Settings, Trash2, 
  ChevronLeft, PlayCircle, Loader2, RefreshCcw, AlertTriangle 
} from 'lucide-react';

// --- CONFIG ---
const supabase = createClient('https://cuqwfuxasdnguslqwnql.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g');

export default function App() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => { fetchSections(); }, []);
  useEffect(() => { if (activeSection) fetchItems(activeSection.id); }, [activeSection]);

  const fetchSections = async () => {
    const { data } = await supabase.from('sections').select('*').order('created_at', { ascending: false });
    setSections(data || []);
  };

  const fetchItems = async (sectionId) => {
    const { data } = await supabase.from('vault_items').select('*').eq('section_id', sectionId).order('created_at', { ascending: false });
    setItems(data || []);
  };

  // --- BOT CONTROL LOGIC ---
  const handlePlayRequest = async (item) => {
    if (item.url && item.url !== 'pending_request') {
      window.open(item.url, '_blank');
      return;
    }

    setLoadingId(item.id);
    await supabase.from('vault_items').update({ request_status: 'pending' }).eq('id', item.id);

    // Poll for changes
    const interval = setInterval(async () => {
      const { data } = await supabase.from('vault_items').select('url, request_status').eq('id', item.id).single();
      if (data?.request_status === 'completed') {
        clearInterval(interval);
        setLoadingId(null);
        window.open(data.url, '_blank');
        fetchItems(activeSection.id);
      }
    }, 3000);
  };

  const handleAbort = async (itemId) => {
    setLoadingId(null);
    await supabase.from('vault_items').update({ request_status: 'idle' }).eq('id', itemId);
    fetchItems(activeSection.id);
  };

  const handleHardReset = async () => {
    if (!window.confirm("Hard Reset will stop all active bot tasks. Continue?")) return;
    
    setLoadingId(null);
    const { error } = await supabase
      .from('vault_items')
      .update({ request_status: 'idle' })
      .or('request_status.eq.pending,request_status.eq.processing');

    if (!error) {
      alert("System Cleared. Bot is now idle.");
      if (activeSection) fetchItems(activeSection.id);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('sections').insert([{ title, description: desc }]).select();
    if (data) setSections([data[0], ...sections]);
    setIsModalOpen(false); setTitle(''); setDesc('');
  };

  // --- SUB-PAGES ---
  if (activeSection) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-8">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => setActiveSection(null)} className="flex items-center text-slate-500 hover:text-white mb-8 transition-all">
            <ChevronLeft size={20} className="mr-2" /> Back to Vault
          </button>
          
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">{activeSection.title}</h1>
              <p className="text-slate-400">{activeSection.description}</p>
            </div>
            <div className="text-slate-600 text-sm font-mono bg-white/5 px-4 py-2 rounded-xl">
              {items.length} Videos Indexed
            </div>
          </div>

          <div className="grid gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-[#161b2c]/50 border border-white/5 p-4 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center space-x-5">
                  <div className="w-28 h-16 bg-black rounded-2xl overflow-hidden border border-white/5 relative">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="thumb" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-800"><PlayCircle /></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base line-clamp-1">{item.title}</h4>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-widest ${
                        item.request_status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                        item.request_status === 'pending' || item.request_status === 'processing' ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {item.request_status === 'pending' ? 'Waiting for Bot...' : item.request_status === 'processing' ? 'Grabbing Link...' : item.request_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {loadingId === item.id && (
                    <button onClick={() => handleAbort(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => handlePlayRequest(item)}
                    disabled={loadingId === item.id && item.request_status !== 'completed'}
                    className={`p-5 rounded-2xl transition-all ${
                      loadingId === item.id 
                        ? 'bg-amber-500/20 text-amber-500' 
                        : 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white shadow-lg hover:shadow-indigo-500/20'
                    }`}
                  >
                    {loadingId === item.id ? <Loader2 className="animate-spin" size={22} /> : <PlayCircle size={22} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200">
      <nav className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0f1c]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20"><LayoutGrid size={22} /></div>
          <span className="text-2xl font-black tracking-tighter text-white">STUDY VAULT</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleHardReset}
            className="flex items-center space-x-2 px-4 py-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-bold border border-red-500/20"
          >
            <RefreshCcw size={14} />
            <span>Hard Reset Bot</span>
          </button>
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white cursor-pointer transition-colors">
            <Settings size={20} />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-black text-white">My Collections</h2>
            <p className="text-slate-500 mt-1">Select a section to manage your media links.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-indigo-600 hover:text-white transition-all shadow-xl shadow-white/5 hover:scale-105 active:scale-95">
            + Create Section
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map(sec => (
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              key={sec.id} onClick={() => setActiveSection(sec)}
              className="bg-[#161b2c] border border-white/5 p-8 rounded-[2.5rem] cursor-pointer hover:border-indigo-500/50 transition-all relative group shadow-2xl"
            >
              <div className="w-16 h-16 bg-indigo-600/10 text-indigo-500 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <FolderPlus size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{sec.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{sec.description || 'No description provided.'}</p>
              <div className="mt-8 flex items-center text-indigo-400 text-xs font-bold tracking-widest uppercase">
                Open Section <ChevronLeft size={14} className="ml-1 rotate-180" />
              </div>
            </motion.div>
          ))}
          
          {sections.length === 0 && (
            <div className="col-span-full py-32 border-2 border-dashed border-white/5 rounded-[3rem] text-center">
              <AlertTriangle className="mx-auto text-slate-700 mb-4" size={48} />
              <p className="text-slate-600 font-bold">No sections found. Start by creating your first collection!</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.form 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreateSection}
              className="bg-[#161b2c] p-10 rounded-[3.5rem] w-full max-w-md border border-white/10 shadow-2xl shadow-indigo-500/10"
            >
              <h2 className="text-3xl font-black mb-8 text-white tracking-tight text-center">New Section</h2>
              <div className="space-y-4">
                <input 
                  placeholder="Section Title (e.g. Physics Lectures)" required value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl outline-none focus:border-indigo-500 text-white transition-all"
                />
                <textarea 
                  placeholder="Short description..." value={desc} onChange={e => setDesc(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl outline-none focus:border-indigo-500 h-32 text-white resize-none transition-all"
                />
              </div>
              <div className="flex gap-4 mt-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-5 rounded-2xl font-bold text-slate-400 hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" className="flex-1 p-5 rounded-2xl bg-white text-black font-black hover:bg-indigo-600 hover:text-white transition-all">Create</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
