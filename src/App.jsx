import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Clock, UploadCloud } from 'lucide-react';

const supabase = createClient("https://cuqwfuxasdnguslqwnql.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXdmdXhhc2RuZ3VzbHF3bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA0MDcsImV4cCI6MjA5MTczNjQwN30.6UrnfqvQ3tWFe_TAqV309Kimo737K9nzWzNqbWH7c9g");
const BUNNY_LIB = "YOUR_ID";

export default function App() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('vault').on('postgres_changes', { event: '*', schema: 'public', table: 'vault_items' }, fetchData).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('vault_items').select('*').order('created_at', { ascending: false });
    setItems(data || []);
  };

  const startUpload = async (id) => {
    await supabase.from('vault_items').update({ transfer_status: 'pending_queue' }).eq('id', id);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-10 font-sans">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black tracking-tighter italic">STUDY <span className="text-indigo-500">VAULT</span></h1>
        <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-xs text-slate-400">
          Userbot Status: Online
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map(item => (
          <div key={item.id} className="group bg-[#0f121d] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all duration-300">
            {/* Thumbnail */}
            <div className="relative aspect-video">
              <img 
                src={item.bunny_id ? `https://vz-xxxx.b-cdn.net/${item.bunny_id}/thumbnail.jpg` : item.thumbnail_url} 
                className="w-full h-full object-cover" 
                alt=""
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {item.transfer_status === 'completed' && <Play fill="white" size={40}/>}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="font-bold text-lg leading-tight mb-2 truncate">{item.title}</h3>
              
              {/* Progress Tracker */}
              {item.progress_pct > 0 && item.progress_pct < 100 && (
                <div className="w-full bg-white/5 h-1 rounded-full mb-4">
                  <div className="bg-indigo-500 h-full transition-all duration-700" style={{width: `${item.progress_pct}%`}} />
                </div>
              )}

              <div className="flex items-center justify-between mt-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.transfer_status}</span>
                {item.transfer_status === 'idle' ? (
                  <button onClick={() => startUpload(item.id)} className="bg-white text-black p-3 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all">
                    <UploadCloud size={18}/>
                  </button>
                ) : (
                  <button 
                    disabled={item.transfer_status !== 'completed'}
                    onClick={() => window.open(item.url, '_blank')}
                    className={`p-3 rounded-2xl ${item.transfer_status === 'completed' ? 'bg-indigo-600' : 'bg-white/5 text-white/20'}`}
                  >
                    <Play size={18}/>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
