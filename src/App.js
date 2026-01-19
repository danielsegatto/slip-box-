import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import ImpulseCapture from './components/ImpulseCapture';
import NoteList from './components/NoteList';
import FocusView from './components/FocusView';

const App = () => {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null); 
  const textareaRef = useRef(null);

  // Sync with LocalStorage
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

  // The Synapse: Manages bidirectional linking
  const addLink = (targetId, type) => {
    setNotes(prevNotes => prevNotes.map(note => {
      // 1. Link current -> target
      if (note.id === selectedNoteId) {
        return {
          ...note,
          links: {
            ...note.links,
            [type]: [...new Set([...note.links[type], targetId])]
          }
        };
      }
      // 2. Link target -> current (inverse)
      if (note.id === targetId) {
        const inverseType = type === 'anterior' ? 'posterior' : 'anterior';
        return {
          ...note,
          links: {
            ...note.links,
            [inverseType]: [...new Set([...note.links[inverseType], selectedNoteId])]
          }
        };
      }
      return note;
    }));
  };

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const getLinkedNotes = (type) => {
    if (!selectedNote) return [];
    return selectedNote.links[type]
      .map(id => notes.find(n => n.id === id))
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-black selection:text-white">
      {!selectedNoteId ? (
        <>
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <main className="max-w-2xl mx-auto px-6 pb-24">
            <ImpulseCapture 
              input={input} 
              setInput={setInput} 
              addNote={addNote} 
              textareaRef={textareaRef} 
            />
            {/* Using the decomposed NoteList component */}
            <NoteList 
              notes={filteredNotes} 
              onDelete={deleteNote} 
              onSelect={setSelectedNoteId} 
            />
          </main>
        </>
      ) : (
        <FocusView 
          selectedNote={selectedNote}
          allNotes={notes}
          getLinkedNotes={getLinkedNotes}
          onBack={() => setSelectedNoteId(null)}
          onSelectNote={(id) => setSelectedNoteId(id)}
          onAddLink={addLink}
        />
      )}
    </div>
  );
};

export default App;
