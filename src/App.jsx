import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, LayoutGrid, Settings, MoreVertical, 
  Clock, X, Trash2, ChevronLeft, PlayCircle, Plus, ExternalLink 
} from 'lucide-react';

const supabase = createClient('https://cuqwfuxasdnguslqwnql.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g');

export default function App() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => { fetchSections(); }, []);
  useEffect(() => { if (activeSection) fetchItems(activeSection.id); }, [activeSection]);

  const fetchSections = async () => {
    const { data } = await supabase.from('sections').select('*').order('created_at', { ascending: false });
    setSections(data || []);
  };

  const fetchItems = async (sectionId) => {
    const { data } = await supabase.from('vault_items').select('*').eq('section_id', sectionId);
    setItems(data || []);
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('sections').insert([{ title, description: desc }]).select();
    if (data) setSections([data[0], ...sections]);
    setIsModalOpen(false); setTitle(''); setDesc('');
  };

  const deleteSection = async (id, e) => {
    e.stopPropagation();
    await supabase.from('sections').delete().eq('id', id);
    setSections(sections.filter(s => s.id !== id));
  };

  if (activeSection) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-8">
        <button onClick={() => setActiveSection(null)} className="flex items-center text-slate-500 hover:text-white mb-8">
          <ChevronLeft className="mr-2" /> Back to Vault
        </button>
        <h1 className="text-4xl font-bold text-white mb-2">{activeSection.title}</h1>
        <p className="text-slate-400 mb-10">{activeSection.description}</p>
        
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center group hover:bg-white/10">
              <div className="flex items-center space-x-4">
                <PlayCircle className="text-indigo-400 w-8 h-8" />
                <div>
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              </div>
              <a href={item.url} target="_blank" className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                <ExternalLink size={18} />
              </a>
            </div>
          ))}
          {items.length === 0 && <p className="text-slate-600 text-center py-10">No media links found in this section.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200">
      <nav className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0a0f1c]/80 backdrop-blur-md z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-2 rounded-lg"><LayoutGrid size={20} /></div>
          <span className="text-xl font-black">STUDY VAULT</span>
        </div>
        <Settings className="text-slate-500" />
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-bold">My Collections</h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-400 hover:text-white transition-all">
            + Create Section
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map(sec => (
            <motion.div 
              key={sec.id} onClick={() => setActiveSection(sec)}
              className="bg-[#161b2c] border border-white/5 p-8 rounded-[2rem] cursor-pointer hover:border-indigo-500/50 transition-all relative group"
            >
              <button onClick={(e) => deleteSection(sec.id, e)} className="absolute top-6 right-6 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={20} />
              </button>
              <div className="w-12 h-12 bg-indigo-600/10 text-indigo-500 rounded-xl flex items-center justify-center mb-6"><FolderPlus /></div>
              <h3 className="text-xl font-bold text-white mb-2">{sec.title}</h3>
              <p className="text-slate-400 text-sm">{sec.description}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Modal for adding sections */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.form 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateSection}
              className="bg-[#161b2c] p-8 rounded-[2.5rem] w-full max-w-md border border-white/10"
            >
              <h2 className="text-2xl font-bold mb-6">New Section</h2>
              <input 
                placeholder="Section Title" required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-black/20 border border-white/10 p-4 rounded-xl mb-4 outline-none focus:border-indigo-500"
              />
              <textarea 
                placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)}
                className="w-full bg-black/20 border border-white/10 p-4 rounded-xl mb-6 outline-none focus:border-indigo-500 h-24"
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 rounded-xl border border-white/10">Cancel</button>
                <button type="submit" className="flex-1 p-4 rounded-xl bg-indigo-600 text-white font-bold">Create</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
