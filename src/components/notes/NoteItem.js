import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import TagList from './TagList'; 

const NoteItem = ({ note, deleteNote, onSelect, onTagClick }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // --- COUNTER LOGIC ---
  const antCount = note.links?.anterior?.length || 0;
  const postCount = note.links?.posterior?.length || 0;
  const showCounter = antCount > 0 || postCount > 0;

  return (
    <article 
      className={STYLES.card} 
      onClick={onSelect}
    >
      {/* DELETE CONFIRMATION OVERLAY */}
      {isDeleting && (
        <div 
            className={STYLES.deleteOverlay} 
            onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking overlay
        >
           <button 
             onClick={(e) => {
               e.stopPropagation();
               deleteNote(note.id);
             }}
             className={STYLES.confirmButton}
             title="Delete"
           >
             <Trash2 size={24} />
           </button>
           
           <button 
             onClick={(e) => {
               e.stopPropagation();
               setIsDeleting(false);
             }}
             className={STYLES.cancelButton}
             title="Cancel"
           >
             <X size={24} />
           </button>
        </div>
      )}

      <div className={STYLES.header}>
        <span className={STYLES.date}>
          {new Date(note.timestamp).toLocaleDateString()}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            setIsDeleting(true); // Trigger confirmation
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

      {/* CONNECTION COUNTER */}
      {showCounter && (
        <div className={STYLES.counter}>
          {antCount > 0 && <span>{antCount} [</span>}
          {antCount > 0 && postCount > 0 && <span>&nbsp;</span>}
          {postCount > 0 && <span>] {postCount}</span>}
        </div>
      )}
    </article>
  );
};

const STYLES = {
  // Added overflow-hidden to ensure the overlay corners match the card
  card: "relative cursor-pointer bg-white p-5 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors rounded-lg mb-4 overflow-hidden",
  header: "flex justify-between items-start mb-3",
  date: "text-xs text-gray-400 font-mono tracking-wide",
  deleteButton: "p-3 -mr-3 -mt-3 text-gray-300 hover:text-red-500 transition-colors",
  content: "text-xl leading-relaxed text-[#1a1a1a] whitespace-pre-wrap",
  counter: "absolute bottom-3 right-4 text-xs font-mono text-gray-300 tracking-widest pointer-events-none",
  
  // NEW STYLES for Confirmation
  deleteOverlay: "absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex items-center justify-center gap-8 animate-in fade-in duration-200",
  confirmButton: "p-4 bg-red-500 text-white rounded-full shadow-lg active:scale-95 transition-transform hover:bg-red-600",
  cancelButton: "p-4 bg-gray-100 text-gray-500 rounded-full shadow-md active:scale-95 transition-transform hover:bg-gray-200"
};

export default NoteItem;