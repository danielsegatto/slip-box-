import React from 'react';
import SearchBar from '../SearchBar';
import ImpulseCapture from '../ImpulseCapture';
import NoteList from '../NoteList';

const GlobalIndexView = ({ 
  notes, 
  searchQuery, 
  setSearchQuery, 
  impulse, 
  setImpulse, 
  onAddImpulse, 
  onSelectNote, 
  deleteNote 
}) => {
  return (
    <>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="max-w-2xl mx-auto px-4">
         <ImpulseCapture 
            input={impulse} 
            setInput={setImpulse} 
            addNote={onAddImpulse} 
         />
         <NoteList 
            notes={notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()))} 
            onSelect={onSelectNote}
            deleteNote={deleteNote}
            onTagClick={setSearchQuery}
         />
      </main>
    </>
  );
};

export default GlobalIndexView;