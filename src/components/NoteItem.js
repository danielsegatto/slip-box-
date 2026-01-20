import React from 'react';
import { Trash2 } from 'lucide-react';
import TagList from './TagList';

const NoteItem = ({ note, deleteNote, onSelect, onTagClick }) => (
  <article 
    className={STYLES.card} 
    onClick={onSelect}
  >
    <div className={STYLES.header}>
      <span className={STYLES.date}>
        {new Date(note.timestamp).toLocaleDateString()}
      </span>
      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          deleteNote(note.id);
        }}
        className={STYLES.deleteButton}
      >
        <Trash2 size={18} />
      </button>
    </div>
    
    <p className={STYLES.content}>
      {note.content}
    </p>

    <div className="mt-4">
      <TagList tags={note.tags} onTagClick={onTagClick} />
    </div>
  </article>
);

const STYLES = {
  card: "relative cursor-pointer bg-white p-5 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors rounded-lg mb-4",
  header: "flex justify-between items-start mb-3",
  date: "text-xs text-gray-400 font-mono tracking-wide",
  deleteButton: "p-3 -mr-3 -mt-3 text-gray-300 hover:text-red-500 transition-colors",
  content: "text-xl leading-relaxed text-[#1a1a1a] whitespace-pre-wrap line-clamp-4"
};

export default NoteItem;