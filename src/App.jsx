import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, FolderPlus, Eye, Settings, ChevronRight, Search,
  Image as ImageIcon, X, CheckCircle2, Play, FileText, 
  Trash2, MoveRight, MoreVertical, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient('https://cuqwfuxasdnguslqwnql.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g');

export default function App() {
  const [view, setView] = useState('manager');
  const [lectures, setLectures] = useState([]);
  const [sections, setSections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  
  // Form state for new sections
  const [newSec, setNewSec] = useState({ title: '', color: 'blue', parent_id: null });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: l } = await supabase.from('lectures').select('*');
    const { data: s } = await supabase.from('sections').select('*');
    if (l) setLectures(l);
    if (s) setSections(s);
  }

  // --- FIX: The function that actually saves the section ---
  const handleCreateSection = async () => {
    if (!newSec.title) return;
    
    // Generate a clean ID
    const cleanId = newSec.title.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 4);
    
    const { data, error } = await supabase
      .from('sections')
      .insert([{ ...newSec, id: cleanId }]);

    if (!error) {
      setSections([...sections, { ...newSec, id: cleanId }]);
      setIsModalOpen(false); // Close modal
      setNewSec({ title: '', color: 'blue', parent_id: null }); // Reset form
    } else {
      console.error("Error creating section:", error.message);
    }
  };

  // ... (Keep the filteredLectures and getThumbnail logic)

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 font-sans">
      <nav className="fixed left-0 top-0 h-full w-20 bg-[#161b22] border-r border-slate-800 flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold">SV</div>
        <button onClick={() => setView('viewer')} className={`p-3 rounded-xl transition-all ${view === 'viewer' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}><Eye size={24} /></button>
        <button onClick={() => setView('manager')} className={`p-3 rounded-xl transition-all ${view === 'manager' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}><Settings size={24} /></button>
      </nav>

      <main className="pl-24 pr-8 py-8">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 w-full max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search lectures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161b22] border border-slate-700 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 transition-all"
            />
          </div>
          
          {/* --- FIX: The Plus Button now opens the Modal --- */}
          <div className="flex gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 text-white"
            >
              <Plus size={24}/>
            </button>
          </div>
        </header>

        {/* Board View */}
        <div className="flex gap-8 overflow-x-auto pb-10 items-start">
          {sections.filter(s => !s.parent_id).map(section => (
            <SectionStack 
              key={section.id} 
              section={section} 
              allSections={sections} 
              lectures={lectures} 
              view={view}
              // ... other props
            />
          ))}
        </div>
      </main>

      {/* --- THE MODAL (Make sure this is inside the return) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="relative bg-[#1c2128] border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white">New Section</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Section Name</label>
                  <input 
                    value={newSec.title} 
                    onChange={e => setNewSec({...newSec, title: e.target.value})} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500" 
                    placeholder="e.g. Physics" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nest Under (Optional)</label>
                  <select 
                    value={newSec.parent_id || ''} 
                    onChange={e => setNewSec({...newSec, parent_id: e.target.value || null})} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="">Main Category</option>
                    {sections.filter(s => !s.parent_id).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>

                <button 
                  onClick={handleCreateSection} 
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-white transition-all shadow-lg"
                >
                  Create Section
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
