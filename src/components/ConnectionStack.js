import React from 'react';

// Component to display vertical threads of related notes
const ConnectionStack = ({ title, linkedNotes, onSelectNote }) => {
  if (linkedNotes.length === 0) return null;

  return (
    <section className="space-y-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
      <h3 className="text-[10px] uppercase tracking-widest text-gray-300 font-medium">
        {title}
      </h3>
      <div className="flex flex-col gap-4">
        {linkedNotes.map(note => (
          <div 
            key={note.id} 
            onClick={() => onSelectNote(note.id)}
            className="cursor-pointer text-sm border-l border-gray-200 pl-4 py-2 hover:border-black transition-all"
          >
            {/* Display a preview of the content */}
            <p className="text-gray-500 hover:text-black line-clamp-2">
              {note.content}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ConnectionStack;
