import React from 'react';
import { Trash2 } from 'lucide-react';
import TagList from './TagList';

const NoteItem = ({ note, deleteNote, onSelect, onTagClick }) => (
  <article 
    className="relative cursor-pointer" 
    onClick={onSelect}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] text-gray-300 font-mono">
        {new Date(note.timestamp).toLocaleDateString()}
      </span>
      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          deleteNote(note.id);
        }}
        className="p-1 text-red-500"
      >
        <Trash2 size={14} />
      </button>
    </div>
    
    <p className="text-lg leading-relaxed text-[#333] whitespace-pre-wrap line-clamp-4">
      {note.content}
    </p>

    <TagList tags={note.tags} onTagClick={onTagClick} />
  </article>
);

export default NoteItem;