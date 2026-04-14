import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Folder, PlayCircle, Inbox, GraduationCap, LayoutGrid, ExternalLink } from 'lucide-react';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

export default function App() {
  const [lectures, setLectures] = useState([]);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetchLectures();
    // Real-time subscription: Updates site instantly when Telegram bot adds data
    const subscription = supabase
      .channel('lectures_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lectures' }, fetchLectures)
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, []);

  async function fetchLectures() {
    const { data } = await supabase.from('lectures').select('*').order('created_at', { ascending: false });
    if (data) setLectures(data);
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const lectureId = active.id;
    const overId = over.id;

    // Logic to update section_id in database when dropped into a folder
    if (overId !== 'inbox' && overId !== lectureId) {
      await supabase.from('lectures').update({ section_id: overId }).eq('id', lectureId);
      fetchLectures();
    }
  };

  const sections = [...new Set(lectures.filter(l => l.section_id !== 'inbox').map(l => l.section_id))];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-20">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><GraduationCap size={24} className="text-white"/></div>
            <h1 className="text-xl font-bold tracking-tight">Vault<span className="text-blue-500">Study</span></h1>
          </div>
          <div className="text-xs bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-slate-400">
            Auto-Sync Active
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          
          {/* LEFT: Common Area (Inbox) */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm sticky top-24">
              <div className="flex items-center gap-2 mb-6 text-blue-400">
                <Inbox size={20} />
                <h2 className="font-semibold uppercase tracking-wider text-sm">New Arrivals</h2>
              </div>
              <div className="space-y-3">
                {lectures.filter(l => l.section_id === 'inbox').map(lec => (
                   <div key={lec.id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-all cursor-grab active:cursor-grabbing">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-blue-400 font-mono">NEW</span>
                        <a href={lec.link} target="_blank" className="text-slate-500 hover:text-white"><ExternalLink size={14}/></a>
                      </div>
                      <p className="text-sm font-medium leading-snug">{lec.title}</p>
                   </div>
                ))}
                {lectures.filter(l => l.section_id === 'inbox').length === 0 && (
                  <p className="text-slate-500 text-center text-sm py-10">No new links. Post in Telegram!</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Organized Sections */}
          <div className="lg:col-span-8 space-y-6">
             <div className="flex items-center gap-2 mb-4 text-slate-400">
                <LayoutGrid size={20} />
                <h2 className="font-semibold uppercase tracking-wider text-sm">Your Library</h2>
             </div>
             
             {sections.length > 0 ? sections.map(sectionName => (
               <div key={sectionName} className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Folder className="text-amber-500" size={22} />
                    <h3 className="text-lg font-bold">{sectionName}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lectures.filter(l => l.section_id === sectionName).map(lec => (
                      <a key={lec.id} href={lec.link} target="_blank" className="group p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl flex items-center gap-4 hover:bg-slate-800 transition-all">
                        <div className="bg-blue-600/20 p-2 rounded-lg text-blue-500 group-hover:scale-110 transition-transform">
                          <PlayCircle size={24} />
                        </div>
                        <span className="text-sm font-medium line-clamp-1">{lec.title}</span>
                      </a>
                    ))}
                  </div>
               </div>
             )) : (
               <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
                 <p className="text-slate-500 italic">Drag lectures here to create your first folder</p>
               </div>
             )}
          </div>

        </DndContext>
      </main>
    </div>
  );
}
