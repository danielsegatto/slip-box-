import React from 'react';
import NoteItem from './NoteItem';

const NoteList = ({ notes, onDelete, onSelect, onTagClick }) => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-20 text-gray-300 italic">
        The slip-box is quiet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteItem 
          key={note.id} 
          note={note} 
          deleteNote={onDelete} 
          onSelect={() => onSelect(note.id)}
          onTagClick={onTagClick} // Pass it down to the item
        />
      ))}
    </div>
  );
};

export default NoteList;