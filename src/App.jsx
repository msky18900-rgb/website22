import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, LayoutGrid, Settings, Trash2, 
  ChevronLeft, PlayCircle, Loader2, Clock 
} from 'lucide-react';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY');

export default function App() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

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

  const handlePlayRequest = async (item) => {
    if (item.url && item.url !== 'pending_request') {
      window.open(item.url, '_blank');
      return;
    }

    setLoadingId(item.id);
    await supabase.from('vault_items').update({ request_status: 'pending' }).eq('id', item.id);

    const checkLink = setInterval(async () => {
      const { data } = await supabase.from('vault_items').select('url, request_status').eq('id', item.id).single();
      if (data?.request_status === 'completed') {
        clearInterval(checkLink);
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

  if (activeSection) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-8">
        <button onClick={() => setActiveSection(null)} className="flex items-center text-slate-500 mb-8"><ChevronLeft className="mr-2" /> Back</button>
        <h1 className="text-3xl font-bold mb-10">{activeSection.title}</h1>
        <div className="grid gap-4 max-w-4xl">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-3xl flex justify-between items-center group">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-14 bg-black/40 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                  {item.thumbnail_url ? <img src={item.thumbnail_url} className="w-full h-full object-cover" /> : <PlayCircle className="m-auto text-slate-700" />}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{item.title}</h4>
                  <span className={`text-[10px] uppercase font-bold ${item.request_status === 'pending' ? 'text-amber-400' : 'text-slate-500'}`}>
                    {item.request_status === 'pending' ? 'Fetching Link...' : item.request_status}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                {loadingId === item.id && (
                  <button onClick={() => handleAbort(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                )}
                <button onClick={() => handlePlayRequest(item)} className="p-4 bg-indigo-600/10 text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white">
                  {loadingId === item.id ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-8">
      <h2 className="text-2xl font-bold mb-8">My Collections</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map(sec => (
          <div key={sec.id} onClick={() => setActiveSection(sec)} className="bg-[#161b2c] p-8 rounded-[2rem] cursor-pointer hover:border-indigo-500 border border-transparent transition-all">
            <FolderPlus className="text-indigo-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-white">{sec.title}</h3>
          </div>
        ))}
        <button onClick={() => setIsModalOpen(true)} className="border-2 border-dashed border-white/10 p-8 rounded-[2rem] text-slate-500 hover:text-white">+ New Section</button>
      </div>
    </div>
  );
}
