import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, LayoutGrid, Settings, Trash2, 
  ChevronLeft, PlayCircle, ExternalLink, Loader2, Clock
} from 'lucide-react';

// --- CONFIG ---
const supabase = createClient('https://cuqwfuxasdnguslqwnql.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g');

export default function App() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  
  // Form States
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

  // --- THE MAGIC: REQUESTING THE LINK ---
  const handlePlayRequest = async (item) => {
    // If we already have a link, just open it
    if (item.url && item.url !== 'pending_request') {
      window.open(item.url, '_blank');
      return;
    }

    setLoadingId(item.id);

    // 1. Tell the Bot to start work by setting status to 'pending'
    await supabase
      .from('vault_items')
      .update({ request_status: 'pending' })
      .eq('id', item.id);

    // 2. Poll the database every 3 seconds to see if the Bot updated the URL
    const checkLink = setInterval(async () => {
      const { data } = await supabase
        .from('vault_items')
        .select('url, request_status')
        .eq('id', item.id)
        .single();

      if (data?.request_status === 'completed') {
        clearInterval(checkLink);
        setLoadingId(null);
        window.open(data.url, '_blank');
        fetchItems(activeSection.id); // Refresh UI to show the real link
      }
    }, 3000);
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('sections').insert([{ title, description: desc }]).select();
    if (data) setSections([data[0], ...sections]);
    setIsModalOpen(false); setTitle(''); setDesc('');
  };

  // --- UI COMPONENTS ---
  if (activeSection) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-8 font-sans">
        <button onClick={() => setActiveSection(null)} className="flex items-center text-slate-500 hover:text-white mb-8 transition-colors">
          <ChevronLeft className="mr-2" /> Back to Vault
        </button>
        <h1 className="text-4xl font-bold text-white mb-2">{activeSection.title}</h1>
        <p className="text-slate-400 mb-10">{activeSection.description}</p>
        
        <div className="grid gap-4 max-w-4xl">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-[1.5rem] flex justify-between items-center group hover:bg-white/10 transition-all">
              <div className="flex items-center space-x-5">
                {/* Thumbnail Container */}
                <div className="w-24 h-16 bg-black/40 rounded-xl overflow-hidden flex-shrink-0 relative border border-white/10">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} className="w-full h-full object-cover" alt="thumb" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <PlayCircle size={24} />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-white line-clamp-1">{item.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      item.request_status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                      item.request_status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {item.request_status === 'pending' ? 'Fetching Link...' : item.request_status}
                    </span>
                    <span className="text-[10px] text-slate-600">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => handlePlayRequest(item)}
                disabled={loadingId === item.id}
                className={`p-4 rounded-2xl transition-all flex items-center justify-center ${
                  loadingId === item.id 
                    ? 'bg-amber-500/20 text-amber-500 cursor-wait' 
                    : 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white'
                }`}
              >
                {loadingId === item.id ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <PlayCircle size={20} />
                )}
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="text-slate-600 text-center py-20 border-2 border-dashed border-white/5 rounded-[2rem]">Empty Section</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200">
      <nav className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0f1c]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><LayoutGrid size={20} /></div>
          <span className="text-xl font-black tracking-tighter">STUDY VAULT</span>
        </div>
        <Settings className="text-slate-500 cursor-pointer hover:rotate-90 transition-transform" />
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-bold">My Collections</h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-white/5">
            + New Section
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map(sec => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={sec.id} onClick={() => setActiveSection(sec)}
              className="bg-[#161b2c] border border-white/5 p-8 rounded-[2.5rem] cursor-pointer hover:border-indigo-500/50 transition-all relative group shadow-lg"
            >
              <div className="w-14 h-14 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <FolderPlus size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{sec.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2">{sec.description}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* New Section Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.form 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onSubmit={handleCreateSection}
              className="bg-[#161b2c] p-8 rounded-[3rem] w-full max-w-md border border-white/10 shadow-2xl"
            >
              <h2 className="text-3xl font-black mb-6 text-white">Create Section</h2>
              <input 
                placeholder="Course or Project Name" required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl mb-4 outline-none focus:border-indigo-500 text-white"
              />
              <textarea 
                placeholder="What is this collection for?" value={desc} onChange={e => setDesc(e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl mb-8 outline-none focus:border-indigo-500 h-28 text-white resize-none"
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-5 rounded-2xl font-bold text-slate-400 bg-white/5">Cancel</button>
                <button type="submit" className="flex-1 p-5 rounded-2xl bg-white text-black font-bold hover:bg-indigo-500 hover:text-white transition-colors">Create</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
