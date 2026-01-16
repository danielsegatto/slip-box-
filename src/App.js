import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Trash2, ArrowUpRight } from 'lucide-react';

const App = () => {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef(null);

  // Carregar notas do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem('slip-box-atoms');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  // Salvar notas sempre que houver mudança
  useEffect(() => {
    localStorage.setItem('slip-box-atoms', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!input.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      content: input.trim(),
      timestamp: new Date().toISOString(),
      tags: extractTags(input),
      links: {
        anterior: [],
        posterior: []
      }
    };

    setNotes([newNote, ...notes]);
    setInput('');
    // Focar novamente no input para manter o "flow"
    textareaRef.current?.focus();
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const extractTags = (text) => {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(m => m.slice(1)) : [];
  };

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-black selection:text-white">
      {/* Search Bar - Minimalista e fixa no topo */}
      <header className="sticky top-0 bg-[#fafafa]/80 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text"
            placeholder="..."
            className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-24">
        
        {/* Impulse Phase - O campo de captura de zero atrito */}
        <section className="py-12 border-b border-gray-100 mb-12">
          <textarea
            ref={textareaRef}
            placeholder="..."
            className="w-full bg-transparent border-none focus:ring-0 text-xl md:text-2xl resize-none min-h-[120px] placeholder:text-gray-200 leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                addNote();
              }
            }}
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-[10px] uppercase tracking-widest text-gray-300 font-medium">
              Press CMD+Enter to commit
            </span>
            <button 
              onClick={addNote}
              disabled={!input.trim()}
              className="p-2 rounded-full hover:bg-black hover:text-white transition-colors disabled:text-gray-200 disabled:hover:bg-transparent"
            >
              <Plus size={24} />
            </button>
          </div>
        </section>

        {/* The Global Index (Lobby) */}
        <div className="space-y-16">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-20 text-gray-300 italic">
              The slip-box is quiet.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <article key={note.id} className="group relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-gray-300 font-mono">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => deleteNote(note.id)}
                      className="p-1 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <p className="text-lg leading-relaxed text-[#333] whitespace-pre-wrap">
                  {note.content}
                </p>

                {note.tags.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {note.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Futuro gatilho para a Trilha Narrativa */}
                <div className="mt-6 pt-4 border-t border-transparent group-hover:border-gray-50 flex justify-end">
                   <button className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-300 hover:text-black transition-colors">
                     Connect <ArrowUpRight size={12} />
                   </button>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
