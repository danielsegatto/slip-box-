import React from 'react';
import { Trash2, ArrowUpRight } from 'lucide-react';

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
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
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
          <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
            #{tag}
          </span>
        ))}
      </div>
    )}
    
    <div className="mt-6 pt-4 border-t border-transparent group-hover:border-gray-50 flex justify-end">
       <button className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-300 hover:text-black transition-colors">
         Connect <ArrowUpRight size={12} />
       </button>
    </div>
  </article>
);

export default NoteItem;
