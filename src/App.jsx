import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, FolderPlus, Eye, Settings, ChevronRight, Search,
  Image as ImageIcon, X, CheckCircle2, Play, FileText, 
  Trash2, MoveRight, CheckCircle, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- YOUR SUPABASE CONFIG ---
const supabase = createClient('https://cuqwfuxasdnguslqwnql.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g');

const COLORS = {
  blue: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', hex: '#3b82f6' },
  purple: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', hex: '#a855f7' },
  green: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', hex: '#10b981' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', hex: '#f97316' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', hex: '#ef4444' },
};

export default function App() {
  const [view, setView] = useState('manager');
  const [lectures, setLectures] = useState([]);
  const [sections, setSections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  
  // Modal State
  const [newSec, setNewSec] = useState({ title: '', color: 'blue', parent_id: null });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: l } = await supabase.from('lectures').select('*');
    const { data: s } = await supabase.from('sections').select('*');
    if (l) setLectures(l);
    if (s) setSections(s);
  }

  const handleCreateSection = async () => {
    if (!newSec.title) return;
    const cleanId = newSec.title.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 4);
    
    const { error } = await supabase.from('sections').insert([{ ...newSec, id: cleanId }]);
    if (!error) {
      setSections([...sections, { ...newSec, id: cleanId }]);
      setIsModalOpen(false);
      setNewSec({ title: '', color: 'blue', parent_id: null });
    }
  };

  const filteredLectures = useMemo(() => {
    return lectures.filter(l => l.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [lectures, searchTerm]);

  const getThumbnail = (link) => {
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
      const id = link.split('v=')[1]?.split('&')[0] || link.split('/').pop();
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 font-sans">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-[#161b22] border-r border-slate-800 flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold">SV</div>
        <button onClick={() => setView('viewer')} className={`p-3 rounded-xl transition-all ${view === 'viewer' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}><Eye size={24} /></button>
        <button onClick={() => setView('manager')} className={`p-3 rounded-xl transition-all ${view === 'manager' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}><Settings size={24} /></button>
      </nav>

      <main className="pl-24 pr-8 py-8">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg text-white"
          >
            <Plus size={20} /> Create Section
          </button>
        </header>

        <div className="flex gap-8 overflow-x-auto pb-10 items-start">
          {sections.filter(s => !s.parent_id).map(section => (
            <div key={section.id} className="min-w-[350px] w-[350px] flex flex-col gap-6">
              <div className={`p-4 rounded-2xl ${COLORS[section.color]?.bg || 'bg-slate-800'} border ${COLORS[section.color]?.border || 'border-slate-700'}`}>
                <h3 className={`font-black text-lg ${COLORS[section.color]?.text || 'text-white'}`}>{section.title}</h3>
              </div>

              {/* Sub-sections Logic */}
              {sections.filter(s => s.parent_id === section.id).map(sub => (
                <div key={sub.id} className="ml-4 border-l-2 border-slate-800 pl-4">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-3"><ChevronRight size={14}/> {sub.title}</div>
                  <LectureGrid 
                    lectures={filteredLectures.filter(l => l.section_id === sub.id)} 
                    view={view} onPlay={setActiveVideo} getThumbnail={getThumbnail}
                    selectedIds={selectedIds} setSelectedIds={setSelectedIds}
                  />
                </div>
              ))}

              <LectureGrid 
                lectures={filteredLectures.filter(l => l.section_id === section.id)} 
                view={view} onPlay={setActiveVideo} getThumbnail={getThumbnail}
                selectedIds={selectedIds} setSelectedIds={setSelectedIds}
              />
            </div>
          ))}
        </div>
      </main>

      {/* MODAL - Fixed z-index and colors */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#1c2128] border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-black mb-6">New Section</h2>
              <div className="space-y-6">
                <input value={newSec.title} onChange={e => setNewSec({...newSec, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500" placeholder="Section Name" />
                
                <div className="flex gap-3">
                  {Object.keys(COLORS).map(c => (
                    <button key={c} onClick={() => setNewSec({...newSec, color: c})} className={`w-8 h-8 rounded-full border-2 ${newSec.color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: COLORS[c].hex }} />
                  ))}
                </div>

                <select value={newSec.parent_id || ''} onChange={e => setNewSec({...newSec, parent_id: e.target.value || null})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none">
                  <option value="">Main Section</option>
                  {sections.filter(s => !s.parent_id).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>

                <button onClick={handleCreateSection} className="w-full bg-blue-600 py-4 rounded-xl font-bold">Create Section</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
            <button onClick={() => setActiveVideo(null)} className="absolute top-8 right-8 text-white"><X size={32}/></button>
            <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${activeVideo.link.split('v=')[1]?.split('&')[0] || activeVideo.link.split('/').pop()}`} frameBorder="0" allowFullScreen />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LectureGrid({ lectures, view, onPlay, getThumbnail, selectedIds, setSelectedIds }) {
  return (
    <div className="flex flex-col gap-4">
      {lectures.map(lecture => (
        <div key={lecture.id} className={`group rounded-2xl overflow-hidden border bg-[#161b22] ${selectedIds.includes(lecture.id) ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-slate-800'}`}>
          <div className="aspect-video bg-slate-900 relative">
            {getThumbnail(lecture.link) && <img src={getThumbnail(lecture.link)} className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => onPlay(lecture)} className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform"><Play size={20} fill="currentColor"/></button>
            </div>
          </div>
          <div className="p-4 flex justify-between items-start gap-2">
            <h4 className="font-bold text-sm leading-tight">{lecture.title}</h4>
            {view === 'manager' && (
              <button 
                onClick={() => setSelectedIds(prev => prev.includes(lecture.id) ? prev.filter(i => i !== lecture.id) : [...prev, lecture.id])}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedIds.includes(lecture.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-700'}`}
              >
                {selectedIds.includes(lecture.id) && <Check size={12} className="text-white"/>}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
