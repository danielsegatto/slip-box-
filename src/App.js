import React, { useState, useEffect, useRef } from 'react';
import { useSlipBox } from './hooks/useSlipBox';

// Views
import GlobalIndexView from './components/views/GlobalIndexView'; // The new component
import FocusView from './components/views/FocusView'; // Assumes you moved this
import MapView from './components/views/MapView';     // Assumes you moved this

const App = () => {
  // --- 1. THE NERVOUS SYSTEM (Logic Hook) ---
  const { notes, addNote, deleteNote, addLink } = useSlipBox();

  // --- 2. UI STATE (The "Router") ---
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null); 
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'focus' | 'map'
  
  const textareaRef = useRef(null);

  // --- 3. VIEW ROUTING LOGIC ---
  useEffect(() => {
    if (selectedNoteId) {
        setViewMode('focus');
    } else {
        setViewMode('list');
    }
  }, [selectedNoteId]);

  // Derived State (The Filter)
  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // Helper: Get Linked Notes for Focus View
  const getLinkedNotes = (type) => {
    if (!selectedNote) return [];
    return selectedNote.links[type]
      .map(id => notes.find(n => n.id === id))
      .filter(Boolean);
  };

  // Handlers
  const handleAddNote = () => {
      addNote(input);
      setInput('');
      textareaRef.current?.focus();
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-black selection:text-white relative">
      
      {/* VIEW: MAP (The Topography) */}
      {viewMode === 'map' && (
          <MapView 
            notes={notes} 
            activeNoteId={selectedNoteId}
            onSelectNote={(id) => setSelectedNoteId(id)}
            onClose={() => setViewMode(selectedNoteId ? 'focus' : 'list')}
          />
      )}

      {/* VIEW: GLOBAL INDEX (The Lobby) */}
      {viewMode === 'list' && !selectedNoteId && (
          <GlobalIndexView 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            input={input}
            setInput={setInput}
            onAddNote={handleAddNote}
            textareaRef={textareaRef}
            filteredNotes={filteredNotes}
            onDeleteNote={deleteNote}
            onSelectNote={setSelectedNoteId}
            onTagClick={handleTagClick}
          />
      )}

      {/* VIEW: FOCUS (The Thread) */}
      {viewMode === 'focus' && selectedNoteId && selectedNote && (
            <FocusView 
              selectedNote={selectedNote}
              allNotes={notes}
              getLinkedNotes={getLinkedNotes}
              onBack={() => setSelectedNoteId(null)}
              onSelectNote={(id) => setSelectedNoteId(id)}
              onAddLink={addLink}
              onOpenMap={() => setViewMode('map')}
            />
      )}
    </div>
  );
};

export default App;
