import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, Search, LayoutGrid, Settings, 
  MoreVertical, Clock, X, Trash2, ChevronLeft, 
  PlayCircle, FileText, Link as LinkIcon, Plus, ExternalLink
} from 'lucide-react';

// --- SUPABASE CONFIG ---
const supabaseUrl = 'https://cuqwfuxasdnguslqwnql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g';
const supabase = supabaseUrl !== 'YOUR_SUPABASE_URL' ? createClient(supabaseUrl, supabaseKey) : null;

export default function App() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]); // Content inside a section
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('section'); // 'section' or 'item'
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Form States
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (activeSection) fetchItems(activeSection.id);
  }, [activeSection]);

  const fetchSections = async () => {
    setIsLoading(true);
    if (supabase) {
      const { data } = await supabase.from('sections').select('*').order('created_at', { ascending: false });
      setSections(data || []);
    } else {
      setSections([{ id: 1, title: 'Data Science Course', description: 'IIT Madras Lectures', created_at: new Date().toISOString() }]);
    }
    setIsLoading(false);
  };

  const fetchItems = async (sectionId) => {
    if (supabase) {
      const { data } = await supabase.from('vault_items').select('*').eq('section_id', sectionId).order('created_at', { ascending: false });
      setItems(data || []);
    } else {
      setItems([{ id: 101, title: 'Probability Lecture 1', url: '#', type: 'video' }]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (modalType === 'section') {
      const newSec = { title, description: desc };
      if (supabase) {
        const { data } = await supabase.from('sections').insert([newSec]).select();
        if (data) setSections([data[0], ...sections]);
      } else {
        setSections([{ id: Date.now(), ...newSec, created_at: new Date().toISOString() }, ...sections]);
      }
    } else {
      const newItem = { section_id: activeSection.id, title, url: mediaUrl, type: 'video' };
      if (supabase) {
        const { data } = await supabase.from('vault_items').insert([newItem]).select();
        if (data) setItems([data[0], ...items]);
      } else {
        setItems([{ id: Date.now(), ...newItem }, ...items]);
      }
    }
    closeModal();
  };

  const handleDeleteSection = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this entire section?")) return;
    if (supabase) await supabase.from('sections').delete().eq('id', id);
    setSections(sections.filter(s => s.id !== id));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle(''); setDesc(''); setMediaUrl('');
  };

  // --- UI: INTERNAL FOLDER VIEW ---
  if (activeSection) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => setActiveSection(null)} className="flex items-center text-slate-500 hover:text-white mb-6 transition-all">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back to Library
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">{activeSection.title}</h1>
              <p className="text-slate-400 mt-2">{activeSection.description}</p>
            </div>
            <button onClick={() => { setModalType('item'); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-lg shadow-indigo-600/20">
              <Plus className="w-5 h-5 mr-2" /> Add Media
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <PlayCircle className="text-indigo-400 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-500 truncate max-w-[200px] md:max-w-md">{item.url}</p>
                  </div>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-indigo-500/20 hover:text-indigo-400 transition-all">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        </div>
        {/* Reuse the Modal code here for 'item' type */}
      </div>
    );
  }

  // --- UI: HOME GRID ---
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200" onClick={() => setActiveMenuId(null)}>
      <nav className="border-b border-white/5 p-6 backdrop-blur-md sticky top-0 z-50 bg-[#0a0f1c]/50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg"><LayoutGrid className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-black tracking-tighter text-white">VAULT.</span>
          </div>
          <Settings className="text-slate-500 cursor-pointer hover:text-white" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-white">Your Collections</h2>
          <button onClick={() => { setModalType('section'); setIsModalOpen(true); }} className="bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all">
            + New Section
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map(sec => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={sec.id} 
              onClick={() => setActiveSection(sec)}
              className="bg-[#161b2c] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden cursor-pointer group"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(sec.id); }} className="text-slate-600 hover:text-white">
                  <MoreVertical className="w-6 h-6" />
                </button>
                {activeMenuId === sec.id && (
                  <div className="absolute right-4 top-12 bg-slate-900 border border-white/10 rounded-xl py-2 shadow-2xl z-50">
                    <button onClick={(e) => handleDeleteSection(sec.id, e)} className="flex items-center px-4 py-2 text-red-400 hover:bg-white/5 w-full">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mb-6 w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all text-indigo-500">
                <FolderPlus className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">{sec.title}</h3>
              <p className="text-slate-400 text-sm mb-6">{sec.description || 'No description'}</p>
              
              <div className="pt-6 border-t border-white/5 flex items-center text-slate-500 text-xs uppercase tracking-widest font-bold">
                <Clock className="w-4 h-4 mr-2" /> {new Date(sec.created_at).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* MODAL SYSTEM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onSubmit={handleCreate}
              className="bg-[#161b2c] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {modalType === 'section' ? 'Create Section' : 'Add Media Link'}
              </h2>
              <input 
                placeholder="Title" required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl mb-4 focus:border-indigo-500 outline-none"
              />
              {modalType === 'section' ? (
                <textarea 
                  placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl mb-6 focus:border-indigo-500 outline-none h-32"
                />
              ) : (
                <input 
                  placeholder="Paste Media/Bot URL" required value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl mb-6 focus:border-indigo-500 outline-none"
                />
              )}
              <div className="flex gap-4">
                <button type="button" onClick={closeModal} className="flex-1 p-4 rounded-2xl border border-white/10 font-bold">Cancel</button>
                <button type="submit" className="flex-1 p-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20">Confirm</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
