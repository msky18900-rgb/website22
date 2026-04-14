import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, Search, LayoutGrid, Settings, 
  MoreVertical, Clock, CheckCircle2, X, Trash2, ChevronLeft, FolderOpen 
} from 'lucide-react';

// ==========================================
// 1. SUPABASE SETUP 
// ==========================================
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';

const supabase = supabaseUrl !== 'YOUR_SUPABASE_URL' 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// ==========================================
// 2. MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [sections, setSections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // NEW STATES FOR OPTIONS & NAVIGATION
  const [activeMenuId, setActiveMenuId] = useState(null); // Tracks which dropdown is open
  const [activeSection, setActiveSection] = useState(null); // Tracks if we are inside a folder

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSections = async () => {
    setIsLoading(true);
    if (supabase) {
      try {
        const { data, error } = await supabase.from('sections').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setSections(data || []);
      } catch (error) {
        console.error('Error fetching:', error);
      }
    } else {
      setSections([
        { id: 1, title: 'Mathematics', description: 'Calculus and Statistics notes', created_at: new Date().toISOString() },
        { id: 2, title: 'Bot Projects', description: 'Python Telethon scripts', created_at: new Date().toISOString() }
      ]);
    }
    setIsLoading(false);
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newSectionData = { title: newTitle, description: newDesc };

    if (supabase) {
      const { data, error } = await supabase.from('sections').insert([newSectionData]).select();
      if (!error && data) {
        setSections([data[0], ...sections]);
        showNotification('Section created successfully!');
      }
    } else {
      setSections([{ id: Date.now(), ...newSectionData, created_at: new Date().toISOString() }, ...sections]);
      showNotification('Section created (Local mode)');
    }
    setNewTitle(''); setNewDesc(''); setIsModalOpen(false);
  };

  // NEW FEATURE: Delete Logic
  const handleDeleteSection = async (id, e) => {
    e.stopPropagation(); // Prevents the folder from opening when you click delete
    if (!window.confirm("Are you sure you want to delete this section?")) return;

    if (supabase) {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) showNotification('Error deleting section.');
      else {
        setSections(sections.filter(s => s.id !== id));
        showNotification('Section deleted.');
      }
    } else {
      setSections(sections.filter(s => s.id !== id));
      showNotification('Section deleted (Local mode).');
    }
    setActiveMenuId(null);
  };

  const filteredSections = sections.filter(sec => 
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sec.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==========================================
  // VIEW: INSIDE A SPECIFIC FOLDER
  // ==========================================
  if (activeSection) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans p-6">
        <button 
          onClick={() => setActiveSection(null)}
          className="flex items-center text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Vault
        </button>
        
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-10">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <FolderOpen className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{activeSection.title}</h1>
              <p className="text-slate-400">{activeSection.description || "No description."}</p>
            </div>
          </div>

          {/* Placeholder for future files/videos */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center border-dashed">
            <p className="text-slate-500">This folder is empty. Soon you will add items here!</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN HOME SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans selection:bg-indigo-500/30" onClick={() => setActiveMenuId(null)}>
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#0a0f1c]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <LayoutGrid className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white">Study Vault</h1>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><Settings className="w-5 h-5 text-slate-400" /></button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">My Sections</h2>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
            <FolderPlus className="w-5 h-5" /> <span>New Section</span>
          </button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSections.map((section) => (
              <motion.div
                layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                key={section.id}
                onClick={() => setActiveSection(section)} // Clicking opens the folder
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-1 cursor-pointer"
              >
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10"><FolderPlus className="w-6 h-6 text-indigo-400" /></div>
                  
                  {/* OPTIONS MENU */}
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Stops card click
                        setActiveMenuId(activeMenuId === section.id ? null : section.id);
                      }}
                      className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Dropdown Box */}
                    {activeMenuId === section.id && (
                      <div className="absolute right-0 mt-2 w-36 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                        <button 
                          onClick={(e) => handleDeleteSection(section.id, e)}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">{section.title}</h3>
                <p className="text-slate-400 text-sm mb-6 h-10">{section.description}</p>
                <div className="flex items-center text-xs text-slate-500 pt-4 border-t border-white/10">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{new Date(section.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Modal & Toast omitted for brevity but they are exactly the same as the last version! */}
      {/* ... keep the modal code from the previous block here ... */}
    </div>
  );
}
