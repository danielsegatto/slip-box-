import React, { useState } from 'react';
import useSlipBox from './hooks/useSlipBox';
import GlobalIndexView from './components/views/GlobalIndexView';
import FocusView from './components/views/FocusView';
import MapView from './components/views/MapView';

const App = () => {
  const { notes, addNote, updateNote, deleteNote, addLink, removeLink } = useSlipBox();
  const [view, setView] = useState('index'); 
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [impulse, setImpulse] = useState('');

  // --- IMPULSE HANDLER ---
  const handleImpulseAdd = () => {
     if (!impulse.trim()) return;
     addNote(impulse);
     setImpulse('');
  };

  // --- LINK HELPER ---
  const getLinkedNotes = (type) => {
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (!activeNote || !activeNote.links[type]) return [];
    return activeNote.links[type].map(linkId => notes.find(n => n.id === linkId)).filter(Boolean);
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#1a1a1a]">
      
      {/* MAP VIEW OVERLAY */}
      {view === 'map' && (
        <MapView 
            notes={notes} 
            activeNoteId={activeNoteId}
            onSelectNote={(id) => setActiveNoteId(id)}
            onClose={() => setView('focus')}
        />
      )}

      {/* INDEX VIEW */}
      {view === 'index' && (
        <GlobalIndexView 
            notes={notes}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            impulse={impulse}
            setImpulse={setImpulse}
            onAddImpulse={handleImpulseAdd}
            onSelectNote={(id) => { setActiveNoteId(id); setView('focus'); }}
            deleteNote={deleteNote}
        />
      )}

      {/* FOCUS VIEW */}
      {view === 'focus' && activeNote && (
        <FocusView 
          selectedNote={activeNote}
          allNotes={notes}
          getLinkedNotes={getLinkedNotes}
          onBack={() => setView('index')}
          onSelectNote={setActiveNoteId}
          onUpdateNote={updateNote}
          onAddLink={addLink}
          onRemoveLink={removeLink}
          onOpenMap={() => setView('map')}
          onAddNote={addNote} 
        />
      )}
    </div>
  );
};

export default App;