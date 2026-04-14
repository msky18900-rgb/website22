import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, Trash2, FolderPlus, GripVertical, 
  CheckCircle2, Circle, ArrowRight, Palette 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- INSERT YOUR SUPABASE CREDENTIALS HERE ---
const supabase = createClient('YOUR_URL', 'YOUR_KEY');

const SECTION_COLORS = [
  { id: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
  { id: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
  { id: 'green', bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400' },
  { id: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
  { id: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-400' },
];

export default function App() {
  const [lectures, setLectures] = useState([]);
  const [sections, setSections] = useState([
    { id: 'inbox', title: 'New Arrivals', color: 'blue' }
  ]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: lects } = await supabase.from('lectures').select('*');
    // In a real app, you'd fetch sections from a 'sections' table too.
    // For now, let's derive them or use local state.
    if (lects) setLectures(lects);
  }

  const addSection = () => {
    if (!newSectionTitle) return;
    const newSec = {
      id: newSectionTitle.toLowerCase().replace(/\s+/g, '-'),
      title: newSectionTitle,
      color: SECTION_COLORS[sections.length % SECTION_COLORS.length].id
    };
    setSections([...sections, newSec]);
    setNewSectionTitle('');
    setIsAddingSection(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkMove = async (targetSectionId) => {
    if (selectedIds.length === 0) return;
    
    const { error } = await supabase
      .from('lectures')
      .update({ section_id: targetSectionId })
      .in('id', selectedIds);

    if (!error) {
      setLectures(prev => prev.map(l => 
        selectedIds.includes(l.id) ? { ...l, section_id: targetSectionId } : l
      ));
      setSelectedIds([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Study Vault
          </h1>
          <p className="text-slate-500 text-sm">Organize your learning path</p>
        </div>
        
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 animate-in fade-in zoom-in">
              <span className="text-sm font-medium text-blue-400">{selectedIds.length} selected</span>
              <div className="h-4 w-[1px] bg-slate-700 mx-2" />
              <select 
                className="bg-transparent text-sm outline-none cursor-pointer"
                onChange={(e) => bulkMove(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Move to...</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          )}
          
          <button 
            onClick={() => setIsAddingSection(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded-lg font-medium"
          >
            <FolderPlus size={18} /> Add Section
          </button>
        </div>
      </div>

      {/* Board Layout */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {sections.map((section) => {
          const color = SECTION_COLORS.find(c => c.id === section.color);
          const sectionLectures = lectures.filter(l => l.section_id === section.id);

          return (
            <div key={section.id} className="min-w-[320px] w-[320px] flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color.border} bg-current`} />
                  <h3 className="font-semibold text-slate-300">{section.title}</h3>
                  <span className="bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                    {sectionLectures.length}
                  </span>
                </div>
              </div>

              <div className={`flex-1 min-h-[500px] rounded-xl border-2 border-dashed border-transparent hover:border-slate-800 transition-all p-2 bg-slate-900/30`}>
                <AnimatePresence>
                  {sectionLectures.map((lecture) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={lecture.id}
                      onClick={() => toggleSelect(lecture.id)}
                      className={`group relative mb-3 p-4 rounded-xl border cursor-pointer transition-all active:scale-95 ${
                        selectedIds.includes(lecture.id) 
                          ? 'bg-blue-600/20 border-blue-500' 
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {selectedIds.includes(lecture.id) 
                            ? <CheckCircle2 size={18} className="text-blue-400" />
                            : <Circle size={18} className="text-slate-600 group-hover:text-slate-400" />
                          }
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight mb-1">{lecture.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {new URL(lecture.link).hostname.replace('www.', '')}
                          </p>
                        </div>
                        <GripVertical size={16} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* New Section Modal Trigger */}
        {isAddingSection && (
          <div className="min-w-[320px] p-4 rounded-xl bg-slate-900/50 border border-slate-800 h-fit">
            <input 
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm mb-3 focus:border-blue-500 outline-none"
              placeholder="Section Name (e.g. Mathematics)"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSection()}
            />
            <div className="flex gap-2">
              <button onClick={addSection} className="flex-1 bg-blue-600 text-xs py-2 rounded-lg">Create</button>
              <button onClick={() => setIsAddingSection(false)} className="flex-1 bg-slate-700 text-xs py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
