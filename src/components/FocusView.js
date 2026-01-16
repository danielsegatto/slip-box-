import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ConnectionStack from './ConnectionStack';
import LinkSelector from './LinkSelector'; // // NEW IMPORT

const FocusView = ({ selectedNote, allNotes, getLinkedNotes, onBack, onSelectNote, onAddLink }) => {
  // State to manage which type of link we are currently creating
  const [linkingType, setLinkingType] = useState(null); // 'anterior' | 'posterior' | null

  // Filter out the current note so you don't link to yourself
  const linkableNotes = allNotes.filter(n => n.id !== selectedNote.id);

  const handleLinkSelection = (targetId) => {
    onAddLink(targetId, linkingType);
    setLinkingType(null); // Close the selector
  };

  return (
    <>
      {/* The Link Selector Modal (Only visible when linking) */}
      {linkingType && (
        <LinkSelector 
          notes={linkableNotes} 
          onClose={() => setLinkingType(null)} 
          onSelect={handleLinkSelection} 
        />
      )}

      <main className="max-w-2xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <button 
          onClick={onBack}
          className="mb-16 text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
        >
          ←
        </button>
        
        <div className="flex flex-col gap-16">
          
          {/* ANTERIOR SECTION */}
          <div className="space-y-4">
             <ConnectionStack 
              title="" 
              linkedNotes={getLinkedNotes('anterior')} 
              onSelectNote={onSelectNote}
            />
            {/* The "Add Anterior" Button */}
            <button 
              onClick={() => setLinkingType('anterior')}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-300 hover:text-black transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* CURRENT NOTE */}
          <article className="max-w-prose py-8 border-y border-transparent">
             <p className="text-2xl md:text-4xl border-l-2 border-black pl-8 leading-relaxed text-[#1a1a1a] font-light">
               {selectedNote.content}
             </p>
          </article>

          {/* POSTERIOR SECTION */}
          <div className="space-y-4">
            <button 
              onClick={() => setLinkingType('posterior')}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-300 hover:text-black transition-colors"
            >
              <Plus size={12} /> 
            </button>
            <ConnectionStack 
              title="" 
              linkedNotes={getLinkedNotes('posterior')} 
              onSelectNote={onSelectNote}
            />
          </div>

        </div>
      </main>
    </>
  );
};

export default FocusView;
