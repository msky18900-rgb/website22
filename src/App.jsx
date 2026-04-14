import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, Search, LayoutGrid, Settings, MoreVertical, Clock, X, Trash2, 
  ChevronLeft, PlayCircle, FileText, Link as LinkIcon, Plus, ExternalLink,
  CheckCircle, Zap
} from 'lucide-react';

const supabaseUrl = 'https://cuqwfuxasdnguslqwnql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]); // for Continue Watching
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('section');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  useEffect(() => {
    fetchSections();
    fetchAllItems();
  }, []);

  useEffect(() => {
    if (activeSection) fetchItems(activeSection.id);
  }, [activeSection]);

  const fetchSections = async () => {
    const { data } = await supabase.from('sections').select('*').order('created_at', { ascending: false });
    setSections(data || []);
  };

  const fetchItems = async (sectionId) => {
    const { data } = await supabase.from('vault_items').select('*').eq('section_id', sectionId).order('created_at', { ascending: false });
    setItems(data || []);
  };

  const fetchAllItems = async () => {
    const { data } = await supabase.from('vault_items').select('*, sections(title)');
    setAllItems(data || []);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (modalType === 'section') {
      const { data } = await supabase.from('sections').insert([{ title, description: desc }]).select();
      if (data) setSections([data[0], ...sections]);
    } else {
      const newItem = { 
        section_id: activeSection.id, 
        title, 
        url: mediaUrl, 
        thumbnail: thumbnail || 'https://picsum.photos/300/170?random=' + Date.now(),
        progress: 0 
      };
      const { data } = await supabase.from('vault_items').insert([newItem]).select();
      if (data) {
        setItems([data[0], ...items]);
        fetchAllItems();
      }
    }
    closeModal();
  };

  const updateProgress = async (itemId, newProgress) => {
    await supabase.from('vault_items').update({ progress: newProgress }).eq('id', itemId);
    setItems(items.map(i => i.id === itemId ? { ...i, progress: newProgress } : i));
    fetchAllItems();
  };

  const handleDeleteSection = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this section and all its lectures?")) return;
    await supabase.from('sections').delete().eq('id', id);
    setSections(sections.filter(s => s.id !== id));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle(''); setDesc(''); setMediaUrl(''); setThumbnail('');
  };

  const filteredSections = sections.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const continueWatching = allItems.filter(i => i.progress > 0 && i.progress < 100);

  // ==================== INSIDE SECTION VIEW ====================
  if (activeSection) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-6">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setActiveSection(null)} className="flex items-center text-slate-400 hover:text-white mb-6">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back to Library
          </button>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black text-white">{activeSection.title}</h1>
              <p className="text-slate-400">{activeSection.description}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setModalType('item'); setIsModalOpen(true); }} 
                className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-2xl font-bold flex items-center">
                <Plus className="w-5 h-5 mr-2" /> Add Lecture
              </button>
              <button onClick={() => alert('Telegram Sync coming in Phase 2 — I’ll give you the bot code next!')} 
                className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl font-bold flex items-center">
                <Zap className="w-5 h-5 mr-2" /> Sync Telegram
              </button>
            </div>
          </div>

          {/* Netflix-style cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map(item => (
              <motion.div 
                key={item.id}
                whileHover={{ scale: 1.05, y: -8 }}
                className="bg-[#161b2c] rounded-3xl overflow-hidden cursor-pointer group"
              >
                <div className="relative">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                    <PlayCircle className="w-12 h-12 text-white drop-shadow-md group-hover:text-indigo-400 transition-colors" />
                  </div>
                  {item.progress > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-white line-clamp-2">{item.title}</h4>
                  <div className="flex justify-between items-center mt-3 text-xs">
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateProgress(item.id, item.progress === 100 ? 0 : 100); }}
                      className="flex items-center gap-1 text-emerald-400 hover:text-white"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {item.progress === 100 ? 'Done' : 'Mark Complete'}
                    </button>
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Modal works here too */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
          modalType={modalType}
          title={title} setTitle={setTitle}
          desc={desc} setDesc={setDesc}
          mediaUrl={mediaUrl} setMediaUrl={setMediaUrl}
          thumbnail={thumbnail} setThumbnail={setThumbnail}
          onSubmit={handleCreate}
        />
      </div>
    );
  }

  // ==================== HOME VIEW ====================
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200">
      <nav className="border-b border-white/10 p-6 sticky top-0 z-50 bg-[#0a0f1c]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-2xl"><LayoutGrid className="w-7 h-7 text-white" /></div>
            <span className="text-3xl font-black tracking-tighter">VAULT</span>
          </div>
          <div className="flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search lectures or sections..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/10 focus:border-indigo-500 rounded-3xl py-3 pl-11 pr-4 outline-none text-white placeholder:text-slate-400"
            />
          </div>
          <Settings className="w-6 h-6 text-slate-400 cursor-pointer hover:text-white" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Zap className="text-amber-400" /> Continue Watching</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
              {continueWatching.map(item => (
                <motion.div key={item.id} whileHover={{ scale: 1.05 }} className="cursor-pointer" onClick={() => { /* open player later */ }}>
                  <img src={item.thumbnail} className="w-full aspect-video object-cover rounded-3xl" />
                  <div className="mt-3 text-sm font-medium text-white line-clamp-2">{item.title}</div>
                  <div className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${item.progress}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Your Collections</h2>
          <button 
            onClick={() => { setModalType('section'); setIsModalOpen(true); }}
            className="bg-white text-black px-6 py-3 rounded-3xl font-bold hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Section
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredSections.map(sec => (
            <motion.div 
              key={sec.id}
              whileHover={{ y: -6 }}
              onClick={() => setActiveSection(sec)}
              className="bg-[#161b2c] border border-white/10 rounded-3xl p-6 cursor-pointer group"
            >
              <div className="flex justify-between">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <FolderPlus className="w-7 h-7" />
                </div>
                <button onClick={(e) => handleDeleteSection(sec.id, e)} className="text-red-400 hover:text-red-500">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-1">{sec.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-3">{sec.description || 'No description'}</p>
              <div className="text-xs text-slate-500 mt-8 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {new Date(sec.created_at).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Global Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        modalType={modalType}
        title={title} setTitle={setTitle}
        desc={desc} setDesc={setDesc}
        mediaUrl={mediaUrl} setMediaUrl={setMediaUrl}
        thumbnail={thumbnail} setThumbnail={setThumbnail}
        onSubmit={handleCreate}
      />
    </div>
  );
}

// Reusable Modal Component
function Modal({ isOpen, onClose, modalType, title, setTitle, desc, setDesc, mediaUrl, setMediaUrl, thumbnail, setThumbnail, onSubmit }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <motion.form 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onSubmit={onSubmit}
          className="bg-[#161b2c] border border-white/10 p-8 rounded-3xl w-full max-w-lg"
        >
          <h2 className="text-2xl font-bold mb-6">
            {modalType === 'section' ? 'New Section' : 'Add New Lecture'}
          </h2>
          
          <input 
            placeholder="Title" required value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-3xl px-5 py-4 mb-4 outline-none focus:border-indigo-400"
          />
          
          {modalType === 'section' ? (
            <textarea 
              placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-3xl px-5 py-4 h-32 outline-none focus:border-indigo-400"
            />
          ) : (
            <>
              <input 
                placeholder="Lecture URL (Telegram / YouTube / etc)" required value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-5 py-4 mb-4 outline-none focus:border-indigo-400"
              />
              <input 
                placeholder="Thumbnail URL (optional — auto-generated if empty)" value={thumbnail} onChange={e => setThumbnail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-5 py-4 outline-none focus:border-indigo-400"
              />
            </>
          )}

          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-4 border border-white/10 rounded-3xl font-semibold">Cancel</button>
            <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-3xl font-bold">Create</button>
          </div>
        </motion.form>
      </div>
    </AnimatePresence>
  );
}
