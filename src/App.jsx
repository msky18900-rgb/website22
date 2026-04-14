import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, Search, LayoutGrid, Settings, 
  MoreVertical, Clock, CheckCircle2, X 
} from 'lucide-react';

// ==========================================
// 1. SUPABASE SETUP (Paste your keys here)
// ==========================================
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';

// Safe initialization (won't crash if keys are missing initially)
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

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Fetch data on load
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
        const { data, error } = await supabase
          .from('sections')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSections(data || []);
      } catch (error) {
        console.error('Error fetching:', error);
        showNotification('Failed to load data from Supabase.');
      }
    } else {
      // Fallback dummy data if Supabase isn't connected yet
      setSections([
        { id: 1, title: 'Mathematics', description: 'Calculus and Statistics notes', created_at: new Date().toISOString() },
        { id: 2, title: 'Bot Projects', description: 'Python Telethon scripts', created_at: new Date().toISOString() }
      ]);
    }
    setIsLoading(false);
  };

  // THE FIX: Robust Create Logic
  const handleCreateSection = async (e) => {
    e.preventDefault(); // Prevents page reload
    if (!newTitle.trim()) return;

    const newSectionData = {
      title: newTitle,
      description: newDesc,
      // created_at is usually handled by Supabase automatically
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('sections')
        .insert([newSectionData])
        .select();

      if (!error && data) {
        setSections([data[0], ...sections]); // Add to top of list
        showNotification('Section created successfully!');
      } else {
        showNotification('Error creating section.');
      }
    } else {
      // Fallback local update
      const mockSection = { 
        id: Date.now(), 
        ...newSectionData, 
        created_at: new Date().toISOString() 
      };
      setSections([mockSection, ...sections]);
      showNotification('Section created (Local mode)');
    }

    // Reset and close
    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  // Filter sections based on search
  const filteredSections = sections.filter(sec => 
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sec.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* --- TOP NAVBAR --- */}
      <nav className="sticky top-0 z-40 bg-[#0a0f1c]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <LayoutGrid className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Study Vault
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search vault..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all w-64 placeholder:text-slate-500"
              />
            </div>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">My Sections</h2>
            <p className="text-slate-400">Organize and access your study materials.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <FolderPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span>New Section</span>
          </button>
        </div>

        {/* Mobile Search */}
        <div className="relative md:hidden mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search vault..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Grid Layout */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <FolderPlus className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Vault is empty</h3>
            <p className="text-slate-500 max-w-sm mx-auto">You don't have any sections yet. Create one to start organizing your files.</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredSections.map((section) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={section.id}
                  className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 overflow-hidden cursor-pointer"
                >
                  {/* Decorative background glow */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 blur-[50px] rounded-full group-hover:bg-purple-500/20 transition-colors" />
                  
                  <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition-transform">
                      <FolderPlus className="w-6 h-6 text-indigo-400" />
                    </div>
                    <button className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h3 className="relative z-10 text-xl font-semibold text-white mb-2 line-clamp-1">{section.title}</h3>
                  <p className="relative z-10 text-slate-400 text-sm line-clamp-2 mb-6 h-10">
                    {section.description || "No description provided."}
                  </p>
                  
                  <div className="relative z-10 flex items-center text-xs text-slate-500 pt-4 border-t border-white/10">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{new Date(section.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* --- CREATE MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#131b2f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Create New Section</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateSection} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Section Name</label>
                    <input 
                      type="text" 
                      required
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Mathematics, Scripts..." 
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Description (Optional)</label>
                    <textarea 
                      rows="3"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What is this section for?" 
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-300 font-medium hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Create Section
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TOAST NOTIFICATIONS --- */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center space-x-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
