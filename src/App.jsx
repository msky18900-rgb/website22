import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, LayoutGrid, Settings, Trash2, ChevronLeft, 
  PlayCircle, Loader2, RefreshCcw, MoreVertical, ChevronRight
} from 'lucide-react';

const supabase = createClient(
  "https://cuqwfuxasdnguslqwnql.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g"
);

export default function App() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => { fetchData(); }, [activeSection]);

  const fetchData = async () => {
    // Fetch Sub-sections
    const { data: secData } = await supabase
      .from('sections')
      .select('*')
      .eq('parent_section_id', activeSection?.id || null)
      .order('created_at', { ascending: false });
    setSections(secData || []);

    // Fetch Lectures
    if (activeSection) {
      const { data: itemData } = await supabase
        .from('vault_items')
        .select('*')
        .eq('section_id', activeSection.id)
        .order('created_at', { ascending: false });
      setItems(itemData || []);
    }
  };

  const handlePlayRequest = async (item) => {
    if (item.url && item.url !== 'pending_request') {
      window.open(item.url, '_blank');
      return;
    }
    setLoadingId(item.id);
    await supabase.from('vault_items').update({ request_status: 'pending' }).eq('id', item.id);
    
    const interval = setInterval(async () => {
      const { data } = await supabase.from('vault_items').select('url, request_status').eq('id', item.id).single();
      if (data?.request_status === 'completed') {
        clearInterval(interval);
        setLoadingId(null);
        window.open(data.url, '_blank');
        fetchData();
      }
    }, 3000);
  };

  const moveLecture = async (itemId, targetSectionId) => {
    await supabase.from('vault_items').update({ section_id: targetSectionId }).eq('id', itemId);
    fetchData();
  };

  const deleteLecture = async (id) => {
    if (window.confirm("Delete this lecture?")) {
      await supabase.from('vault_items').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200">
      {/* Navbar */}
      <nav className="p-6 border-b border-white/5 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveSection(null)}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><LayoutGrid size={20} /></div>
          <span className="text-xl font-black tracking-tighter">STUDY VAULT</span>
        </div>
        <button onClick={() => fetchData()} className="p-2 text-slate-500 hover:text-white transition-all">
          <RefreshCcw size={18} />
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 mb-8 text-sm text-slate-500 font-bold uppercase tracking-widest">
          <span className="hover:text-white cursor-pointer" onClick={() => setActiveSection(null)}>Root</span>
          {activeSection && (
            <>
              <ChevronRight size={14} />
              <span className="text-indigo-400">{activeSection.title}</span>
            </>
          )}
        </div>

        {/* Action Header */}
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-4xl font-black text-white">{activeSection ? activeSection.title : "Collections"}</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black px-6 py-3 rounded-2xl font-black hover:bg-indigo-600 hover:text-white transition-all"
          >
            + New Section
          </button>
        </div>

        {/* Grid for Sections (Folders) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {sections.map(sec => (
            <div 
              key={sec.id} 
              onClick={() => setActiveSection(sec)}
              className="bg-[#161b2c] p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500 transition-all cursor-pointer group"
            >
              <FolderPlus className="text-indigo-500 mb-4 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="text-lg font-bold text-white">{sec.title}</h3>
            </div>
          ))}
        </div>

        {/* List for Lectures (Videos) */}
        {activeSection && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Lectures in this section</h3>
            {items.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.07] transition-all">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-20 h-12 bg-black rounded-xl overflow-hidden flex-shrink-0">
                    {item.thumbnail_url && <img src={item.thumbnail_url} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    <div className="flex items-center space-x-3 mt-1">
                      <select 
                        onChange={(e) => moveLecture(item.id, e.target.value)}
                        className="bg-transparent text-[10px] text-slate-500 hover:text-indigo-400 outline-none border-none cursor-pointer"
                      >
                        <option>Move to...</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                      <button onClick={() => deleteLecture(item.id)} className="text-[10px] text-red-500/40 hover:text-red-500 font-bold uppercase">Delete</button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handlePlayRequest(item)}
                  className={`p-4 rounded-2xl transition-all ${loadingId === item.id ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
                >
                  {loadingId === item.id ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Section Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className="bg-[#161b2c] p-8 rounded-[3rem] w-full max-w-sm border border-white/10">
              <h2 className="text-2xl font-black mb-6 text-white text-center">New Section</h2>
              <input 
                placeholder="Title" 
                className="w-full bg-black/50 p-4 rounded-xl border border-white/10 mb-6 text-white outline-none"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
              <div className="flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 font-bold text-slate-500">Cancel</button>
                <button 
                  onClick={async () => {
                    await supabase.from('sections').insert([{ title: newTitle, parent_section_id: activeSection?.id || null }]);
                    setIsModalOpen(false); setNewTitle(''); fetchData();
                  }}
                  className="flex-1 bg-white text-black p-4 rounded-2xl font-black"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
