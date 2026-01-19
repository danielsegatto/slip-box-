import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

const LinkSelector = ({ notes, onClose, onSelect }) => {
  const [query, setQuery] = useState('');

  const filtered = notes.filter(n => 
    n.content.toLowerCase().includes(query.toLowerCase()) || 
    n.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-[#fafafa]/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-4 mb-8 border-b-2 border-black pb-2">
          <Search size={24} className="text-black" />
          <input 
            autoFocus
            type="text"
            placeholder="..."
            className="w-full bg-transparent border-none focus:ring-0 text-2xl placeholder:text-gray-200 text-[#1a1a1a]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-gray-300">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {filtered.map(note => (
            <button
              key={note.id}
              onClick={() => onSelect(note.id)}
              className="w-full text-left p-4 border border-transparent rounded-lg"
            >
              <p className="text-lg text-gray-400 line-clamp-2">
                {note.content}
              </p>
              {note.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                   {note.tags.map(t => (
                     <span key={t} className="text-[10px] text-gray-200">#{t}</span>
                   ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LinkSelector;