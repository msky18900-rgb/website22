import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FolderPlus, LayoutGrid, Trash2, ChevronLeft, PlayCircle, Loader2, ChevronRight } from 'lucide-react';

// Use your verified credentials
const supabase = createClient(
  "https://cuqwfuxasdnguslqwnql.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g"
);

export default function App() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  // 1. Fetch Data whenever activeSection changes
  useEffect(() => {
    const fetchData = async () => {
      // Get sub-folders
      const { data: sData } = await supabase.from('sections').select('*').eq('parent_section_id', activeSection?.id || null);
      setSections(sData || []);

      // Get videos for this folder
      if (activeSection) {
        const { data: iData } = await supabase.from('vault_items').select('*').eq('section_id', activeSection.id);
        setItems(iData || []);
      }
    };
    fetchData();
  }, [activeSection]);

  // 2. Play / Request Link Logic
  const handlePlay = async (item) => {
    // If we already have a link, open it immediately
    if (item.url && item.url !== 'pending_request') {
      window.open(item.url, '_blank');
      return;
    }

    // Otherwise, tell the bot to fetch it
    setLoadingId(item.id);
    await supabase.from('vault_items').update({ request_status: 'pending' }).eq('id', item.id);

    // Poll for the result
    const check = setInterval(async () => {
      const { data } = await supabase.from('vault_items').select('url, request_status').eq('id', item.id).single();
      if (data?.request_status === 'completed') {
        clearInterval(check);
        setLoadingId(null);
        window.open(data.url, '_blank');
        setActiveSection({...activeSection}); // Trigger re-render
      }
    }, 3000);
  };

  // 3. Move Logic
  const handleMove = async (itemId, targetId) => {
    if (!targetId) return;
    const { error } = await supabase.from('vault_items').update({ section_id: targetId }).eq('id', itemId);
    if (!error) setActiveSection({...activeSection});
  };

  // 4. Delete Logic
  const handleDelete = async (itemId) => {
    if (confirm("Delete this?")) {
      await supabase.from('vault_items').delete().eq('id', itemId);
      setActiveSection({...activeSection});
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6 font-sans">
      {/* Header / Breadcrumb */}
      <div className="flex items-center space-x-2 mb-8 text-slate-500 text-sm font-bold">
        <span className="cursor-pointer hover:text-white" onClick={() => setActiveSection(null)}>HOME</span>
        {activeSection && <><ChevronRight size={16}/> <span>{activeSection.title}</span></>}
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {sections.map(s => (
          <div key={s.id} onClick={() => setActiveSection(s)} className="bg-white/5 p-6 rounded-3xl border border-white/10 cursor-pointer hover:bg-indigo-600 transition-all">
            <FolderPlus className="mb-2" />
            <div className="font-bold">{s.title}</div>
          </div>
        ))}
        <button onClick={async () => {
          const t = prompt("Section Name:");
          if(t) await supabase.from('sections').insert([{ title: t, parent_section_id: activeSection?.id || null }]);
          setActiveSection(activeSection ? {...activeSection} : null);
        }} className="border-2 border-dashed border-white/10 rounded-3xl p-6 text-slate-500 hover:text-white">+ New Folder</button>
      </div>

      {/* Lectures List */}
      {activeSection && (
        <div className="space-y-3">
          <h2 className="text-xl font-black mb-4 underline decoration-indigo-500">Lectures</h2>
          {items.map(item => (
            <div key={item.id} className="bg-[#161b2c] p-4 rounded-2xl flex items-center justify-between border border-white/5">
              <div className="flex-1">
                <div className="font-bold text-sm">{item.title}</div>
                <div className="flex space-x-4 mt-2">
                  {/* MOVE SELECT */}
                  <select 
                    onChange={(e) => handleMove(item.id, e.target.value)}
                    className="bg-transparent text-[10px] text-indigo-400 outline-none cursor-pointer"
                  >
                    <option value="">Move To...</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                  {/* DELETE BUTTON */}
                  <button onClick={() => handleDelete(item.id)} className="text-[10px] text-red-500/50 hover:text-red-500">DELETE</button>
                </div>
              </div>

              {/* PLAY BUTTON */}
              <button 
                onClick={() => handlePlay(item)}
                className={`p-4 rounded-xl ${loadingId === item.id ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'}`}
              >
                {loadingId === item.id ? <Loader2 className="animate-spin" size={20}/> : <PlayCircle size={20}/>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
