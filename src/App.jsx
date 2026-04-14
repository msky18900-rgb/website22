import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, FolderPlus, Eye, Settings, ChevronRight, Search,
  Image as ImageIcon, X, CheckCircle2, Play, FileText, 
  Trash2, MoveRight, MoreVertical, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient('YOUR_URL', 'YOUR_KEY');

export default function App() {
  const [view, setView] = useState('manager');
  const [lectures, setLectures] = useState([]);
  const [sections, setSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null); // Point #4: Theater Mode

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: l } = await supabase.from('lectures').select('*');
    const { data: s } = await supabase.from('sections').select('*');
    if (l) setLectures(l);
    if (s) setSections(s);
  }

  // Point #3: Global Search Logic
  const filteredLectures = useMemo(() => {
    return lectures.filter(l => 
      l.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lectures, searchTerm]);

  // Point #7: Bulk Actions
  const bulkMove = async (targetSec) => {
    const { error } = await supabase.from('lectures').update({ section_id: targetSec }).in('id', selectedIds);
    if (!error) {
      setLectures(prev => prev.map(l => selectedIds.includes(l.id) ? {...l, section_id: targetSec} : l));
      setSelectedIds([]);
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    const { error } = await supabase.from('lectures').update({ is_completed: !currentStatus }).eq('id', id);
    if (!error) setLectures(prev => prev.map(l => l.id === id ? {...l, is_completed: !currentStatus} : l));
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 font-sans">
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-[#161b22] border-r border-slate-800 flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold">SV</div>
        <button onClick={() => setView('viewer')} className={`p-3 rounded-xl transition-all ${view === 'viewer' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}><Eye size={24} /></button>
        <button onClick={() => setView('manager')} className={`p-3 rounded-xl transition-all ${view === 'manager' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}><Settings size={24} /></button>
      </nav>

      <main className="pl-24 pr-8 py-8">
        {/* Point #3: Search & Header */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 w-full max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search across all sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161b22] border border-slate-700 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-3">
            <button className="bg-slate-800 p-3 rounded-xl hover:bg-slate-700 transition-colors"><Plus size={20}/></button>
          </div>
        </header>

        {/* Horizontal Board */}
        <div className="flex gap-8 overflow-x-auto pb-10">
          {sections.filter(s => !s.parent_id).map(section => (
            <div key={section.id} className="min-w-[340px] flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">{section.title}</h3>
                {/* Point #2: Progress calculation */}
                <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded">
                   {Math.round((lectures.filter(l => l.section_id === section.id && l.is_completed).length / (lectures.filter(l => l.section_id === section.id).length || 1)) * 100)}%
                </span>
              </div>
              
              <div className="flex flex-col gap-4">
                {filteredLectures.filter(l => l.section_id === section.id).map(lecture => (
                  <LectureCard 
                    key={lecture.id}
                    lecture={lecture}
                    view={view}
                    isSelected={selectedIds.includes(lecture.id)}
                    onSelect={() => setSelectedIds(prev => prev.includes(lecture.id) ? prev.filter(i => i !== lecture.id) : [...prev, lecture.id])}
                    onPlay={() => setActiveVideo(lecture)}
                    onToggleComplete={() => toggleComplete(lecture.id, lecture.is_completed)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Point #7: Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1c2128] border border-slate-700 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 z-[100]"
          >
            <span className="text-sm font-bold text-blue-400">{selectedIds.length} Selected</span>
            <div className="h-6 w-[1px] bg-slate-700" />
            <div className="flex gap-4">
              <button onClick={() => bulkMove('completed')} className="text-sm font-bold flex items-center gap-2 hover:text-white transition-colors"><CheckCircle size={16}/> Mark Done</button>
              <button className="text-sm font-bold text-red-400 flex items-center gap-2 hover:text-red-300 transition-colors"><Trash2 size={16}/> Delete</button>
            </div>
            <button onClick={() => setSelectedIds([])} className="ml-4 text-slate-500 hover:text-white"><X size={18}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Point #4: Theater Mode Player */}
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/95 backdrop-blur-md">
            <button onClick={() => setActiveVideo(null)} className="absolute top-8 right-8 text-white/50 hover:text-white"><X size={32}/></button>
            <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <iframe 
                width="100%" height="100%" 
                src={`https://www.youtube.com/embed/${activeVideo.link.split('v=')[1]}`} 
                title="YouTube video player" frameBorder="0" allowFullScreen 
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LectureCard({ lecture, view, isSelected, onSelect, onPlay, onToggleComplete }) {
  return (
    <motion.div 
      layout
      className={`group relative rounded-2xl border transition-all duration-300 ${
        lecture.is_completed ? 'opacity-60 grayscale-[0.5]' : ''
      } ${
        isSelected ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-[#161b22] hover:border-slate-600'
      }`}
    >
      <div className="p-4 flex gap-4">
        {/* Thumbnail or Placeholder */}
        <div className="w-24 h-16 rounded-xl bg-slate-900 flex-shrink-0 relative overflow-hidden group">
          <Play onClick={onPlay} className="absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100 z-10 cursor-pointer transition-opacity" size={24}/>
          <div className="w-full h-full bg-blue-600/10 flex items-center justify-center text-blue-500"><Play size={20}/></div>
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-bold leading-tight mb-2 line-clamp-1">{lecture.title}</h4>
          
          <div className="flex items-center gap-3">
            {/* Point #2 & #5: Status & Notes */}
            <button onClick={onToggleComplete} className={`text-[10px] font-black px-2 py-0.5 rounded ${lecture.is_completed ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
              {lecture.is_completed ? 'FINISHED' : 'PENDING'}
            </button>
            {lecture.notes_url && <a href={lecture.notes_url} className="text-slate-500 hover:text-blue-400 transition-colors"><FileText size={14}/></a>}
          </div>
        </div>

        {view === 'manager' && (
          <button onClick={onSelect} className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-700 hover:border-slate-500'}`}>
            {isSelected && <Check size={12} className="text-white"/>}
          </button>
        )}
      </div>
    </motion.div>
  );
}
