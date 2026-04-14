import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, LayoutGrid, Settings, 
  MoreVertical, Clock, X, Trash2, ChevronLeft, 
  PlayCircle, Plus, ExternalLink 
} from 'lucide-react';

// --- CONFIG ---
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';
const supabase = supabaseUrl !== 'YOUR_SUPABASE_URL' ? createClient(supabaseUrl, supabaseKey) : null;

export default function App() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => { fetchSections(); }, []);
  useEffect(() => { if (activeSection) fetchItems(activeSection.id); }, [activeSection]);

  const fetchSections = async () => {
    setIsLoading(true);
    if (supabase) {
      const { data } = await supabase.from('sections').select('*').order('created_at', { ascending: false });
      setSections(data || []);
    }
    setIsLoading(false);
  };

  const fetchItems = async (sectionId) => {
    if (supabase) {
      const { data } = await supabase.from('vault_items').select('*').eq('section_id', sectionId).order('created_at', { ascending: false });
      setItems(data || []);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (supabase) {
      const { data } = await supabase.from('sections').insert([{ title, description: desc }]).select();
      if (data) setSections([data[0], ...sections]);
    }
    setIsModalOpen(false); setTitle(''); setDesc('');
  };

  if (activeSection) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-6">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setActiveSection(null)} className="flex items-center text-slate-500 hover:text-white mb-8 transition-all font-bold uppercase tracking-widest text-xs">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Vault
          </button>
          
          <h1 className="text-4xl font-black text-white mb-2">{activeSection.title}</h1>
          <p className="text-slate-400 mb-10">{activeSection.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <a 
                key={item.id} 
                href={item.url} 
                target="_blank" 
                rel="noreferrer"
                className="group bg-[#161b2c] rounded-[2rem] overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all shadow-2xl"
              >
                <div className="relative aspect-video">
                  <img src={item.thumbnail_url || 'https://via.placeholder.com/400x225'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="thumbnail" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-12 h-12 text-white fill-white" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg line-clamp-2">{item.title}</h3>
                  <div className="mt-4 flex items-center text-indigo-400 text-[10px] font-black tracking-widest uppercase">
                    Open in Telegram <ExternalLink className="w-3 h-3 ml-2" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200">
      <nav className="p-6 border-b border-white/5 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="text-2xl font-black tracking-tighter text-white">VAULT.</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30">
          + New Section
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map(sec => (
            <motion.div 
              key={sec.id} whileHover={{ y: -10 }}
              onClick={() => setActiveSection(sec)}
              className="bg-[#161b2c] border border-white/5 p-8 rounded-[2.5rem] cursor-pointer group hover:bg-indigo-600/5 transition-all"
            >
              <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <LayoutGrid className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{sec.title}</h2>
              <p className="text-slate-500 text-sm line-clamp-2">{sec.description}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.form initial={{ scale: 0.9 }} animate={{ scale: 1 }} onSubmit={handleCreateSection} className="bg-[#161b2c] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg">
              <h2 className="text-2xl font-bold text-white mb-6">New Section</h2>
              <input placeholder="Title" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl mb-4 text-white outline-none" />
              <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl mb-6 text-white outline-none h-32" />
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 rounded-2xl border border-white/10 text-white font-bold">Cancel</button>
                <button type="submit" className="flex-1 p-4 rounded-2xl bg-indigo-600 text-white font-bold">Create</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
