import React, { useState } from 'react';
import { ArrowLeft, Plus, Map } from 'lucide-react';
import ConnectionStack from './ConnectionStack';
import LinkSelector from './LinkSelector';

const FocusView = ({ selectedNote, allNotes, getLinkedNotes, onBack, onSelectNote, onAddLink, onOpenMap }) => {
  const [linkingType, setLinkingType] = useState(null); // 'anterior' | 'posterior' | null

  // SMART FILTERING LOGIC:
  // 1. Remove the note itself.
  // 2. Remove notes that are ALREADY connected in the current direction.
  const linkableNotes = allNotes.filter(n => {
    const isSelf = n.id === selectedNote.id;
    const isAlreadyConnected = linkingType && selectedNote.links[linkingType].includes(n.id);
    return !isSelf && !isAlreadyConnected;
  });

  const handleLinkSelection = (targetId) => {
    onAddLink(targetId, linkingType);
    setLinkingType(null);
  };

  return (
    <>
      {linkingType && (
        <LinkSelector 
          notes={linkableNotes} 
          onClose={() => setLinkingType(null)} 
          onSelect={handleLinkSelection} 
        />
      )}

      <main className="max-w-2xl mx-auto px-2 py-2">
        <div className="flex justify-between items-center mb-2">
            <button 
            onClick={onBack}
            className="left-auto relative top-auto mb-2 p-2 rounded-full"
            >
            <ArrowLeft size={20} className="text-gray-600" />
            </button>
            
            {/* NEW: Zoom Out / Map Button */}
            <button
                onClick={onOpenMap}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="View in Map"
            >
                <Map size={20} className="text-gray-400 hover:text-black transition-colors" />
            </button>
        </div>
        
        {/* ... Rest of the component (ConnectionStacks and Article) remains the same ... */}
        <div className="flex flex-col gap-2 relative">
          
          {/* ANTERIOR SECTION (Source) */}
          <div className="flex flex-col">
            <ConnectionStack 
              title="Anterior" 
              linkedNotes={getLinkedNotes('anterior')} 
              onSelectNote={onSelectNote}
            />
            <button 
              onClick={() => setLinkingType('anterior')}
              className="p-2 text-gray-200"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* CURRENT NOTE (The Anchor) */}
          <article className="max-w-prose py-4 border-y border-transparent">
             <p className="text-xl md:text-2xl leading-relaxed text-[#1a1a1a] font-light">
               {selectedNote.content}
             </p>
          </article>

          {/* POSTERIOR SECTION (Extension) */}
          <div className="flex flex-col">
            <button 
              onClick={() => setLinkingType('posterior')}
              className="p-2 text-gray-200"
            >
              <Plus size={24} />
            </button>
            <ConnectionStack 
              title="Posterior" 
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