import React from 'react';
import { X } from 'lucide-react';

// Component to display vertical threads of related notes
const ConnectionStack = ({ title, linkedNotes, onSelectNote, onRemove }) => {
  if (linkedNotes.length === 0) return null;

  return (
    <section className="">
      <div className="flex flex-col gap-4">
        {linkedNotes.map(note => (
          <div 
            key={note.id} 
            className="group relative flex items-start gap-2"
          >
            {/* The Note Link */}
            <div 
              onClick={() => onSelectNote(note.id)}
              className="flex-1 cursor-pointer text-sm border-l border-gray-200 pl-4 py-2 hover:border-gray-400 transition-colors"
            >
              <p className="text-gray-500 line-clamp-2">
                {note.content}
              </p>
            </div>

            {/* The Disconnect Button (Visible on Hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(note.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
              title="Disconnect"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ConnectionStack;