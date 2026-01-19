import React from 'react';
import { Trash2 } from 'lucide-react';

// 'onSelect' to the props to handle clicking a note
const NoteItem = ({ note, deleteNote, onSelect }) => (
  <article 
    // cursor-pointer and the onClick trigger to enter Focus Mode
    className="group relative cursor-pointer" 
    onClick={onSelect}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] text-gray-300 font-mono">
        {new Date(note.timestamp).toLocaleDateString()}
      </span>
      <button 
        onClick={(e) => {
          // // e.stopPropagation(). 
          // // It prevents the note from "opening" when you only want to delete it.
          e.stopPropagation(); 
          deleteNote(note.id);
        }}
        className="p-1 text-red-500"
      >
        <Trash2 size={14} />
      </button>
    </div>
    
    <p className="text-lg leading-relaxed text-[#333] whitespace-pre-wrap">
      {note.content}
    </p>

    {note.tags.length > 0 && (
      <div className="flex gap-2 mt-4">
        {note.tags.map(tag => (
          <span key={tag} className="text-[10px] font-medium py-0.5 text-gray-500 rounded-full">
            #{tag}
          </span>
        ))}
      </div>
    )}
  </article>
);

export default NoteItem;
