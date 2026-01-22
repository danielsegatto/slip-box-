import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from './utils/firebase'; 
import useSlipBox from './hooks/useSlipBox';
import GlobalIndexView from './components/views/GlobalIndexView';
import FocusView from './components/views/FocusView';
import MapView from './components/views/MapView';
import LoginView from './components/views/LoginView'; 

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { notes, addNote, updateNote, deleteNote, addLink, removeLink } = useSlipBox(user?.uid);
  
  const [view, setView] = useState('index'); 
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [impulse, setImpulse] = useState('');

  const handleImpulseAdd = () => {
     if (!impulse.trim()) return;
     addNote(impulse);
     setImpulse('');
  };

  const getLinkedNotes = (type) => {
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (!activeNote || !activeNote.links[type]) return [];
    return activeNote.links[type].map(linkId => notes.find(n => n.id === linkId)).filter(Boolean);
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  if (loading) return <div className="min-h-screen bg-[#fafafa]" />; 
  if (!user) return <LoginView />;

  // DYNAMIC CLASS: 'overflow-hidden' for Map, 'overflow-auto' for others
  const containerClass = view === 'map' 
    ? "h-screen w-screen overflow-hidden bg-[#fafafa] font-sans text-[#1a1a1a]" 
    : "min-h-screen bg-[#fafafa] font-sans text-[#1a1a1a] overflow-auto";

  return (
    <div className={containerClass}>
      
      {view === 'map' && (
        <MapView 
            notes={notes} 
            activeNoteId={activeNoteId}
            onSelectNote={(id) => setActiveNoteId(id)}
            onClose={() => setView('focus')}
        />
      )}

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