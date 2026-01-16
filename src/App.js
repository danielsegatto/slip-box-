import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import ImpulseCapture from './components/ImpulseCapture';
import NoteItem from './components/NoteItem';

const App = () => {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null); 
  
  const textareaRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('slip-box-atoms');
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('slip-box-atoms', JSON.stringify(notes));
  }, [notes]);

  const extractTags = (text) => {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(m => m.slice(1)) : [];
  };

  const addNote = () => {
    if (!input.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      content: input.trim(),
      timestamp: new Date().toISOString(),
      tags: extractTags(input),
      links: { anterior: [], posterior: [] }
    };
    setNotes([newNote, ...notes]);
    setInput('');
    textareaRef.current?.focus();
  };

  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id));

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // // NEW: Logic to find the specific note for Focus Mode
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-black selection:text-white">
      
      {/* // We now use conditional rendering to switch between the 
          // Global Index (Lobby) and the Narrative Thread (Focus View). */}
      {!selectedNoteId ? (
        <>
          {/* // VIEW 1: THE GLOBAL INDEX (Lobby) */}
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <main className="max-w-2xl mx-auto px-6 pb-24">
            <ImpulseCapture 
              input={input} 
              setInput={setInput} 
              addNote={addNote} 
              textareaRef={textareaRef} 
            />
            <div className="space-y-16">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-20 text-gray-300 italic">
                  The slip-box is quiet.
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <NoteItem 
                    key={note.id} 
                    note={note} 
                    deleteNote={deleteNote} 
                    // // NEW: Triggering the focus state when a note is clicked
                    onSelect={() => setSelectedNoteId(note.id)} 
                  />
                ))
              )}
            </div>
          </main>
        </>
      ) : (
        /* // VIEW 2: THE NARRATIVE THREAD (Focus Mode) */
        <main className="max-w-2xl mx-auto px-6 py-24 animate-in fade-in duration-700">
          <button 
            // // Returning to the Global Index
            onClick={() => setSelectedNoteId(null)}
            className="mb-12 text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
          >
            ← Back to Index
          </button>
          
          <article className="max-w-prose">
             <p className="text-2xl md:text-4xl border-l-2 border-black pl-8 leading-relaxed text-[#1a1a1a] font-light">
               {selectedNote.content}
             </p>
             {/* // FUTURE: This is where the linear sequence links will appear */}
          </article>
        </main>
      )}
    </div>
  );
};

export default App;
