import React, { useState } from 'react';
import { ArrowLeft, Plus, Map } from 'lucide-react'; 
import ConnectionStack from '../ConnectionStack';
import LinkSelector from '../LinkSelector';

const FocusView = ({ 
  selectedNote, 
  allNotes, 
  getLinkedNotes, 
  onBack, 
  onSelectNote, 
  onAddLink, 
  onRemoveLink, 
  onOpenMap 
}) => {
  const [linkingType, setLinkingType] = useState(null); // 'anterior' | 'posterior' | null

  // --- 1. SMART FILTERING LOGIC ---
  // Exclude the current note itself and any notes already connected in the chosen direction.
  const linkableNotes = allNotes.filter(n => {
    if (!selectedNote) return false;
    const isSelf = n.id === selectedNote.id;
    // Safety check: Ensure links object exists
    const currentLinks = selectedNote.links?.[linkingType] || []; 
    const isAlreadyConnected = linkingType && currentLinks.includes(n.id);
    return !isSelf && !isAlreadyConnected;
  });

  // --- 2. HANDLERS ---
  const handleLinkSelection = (targetId) => {
    // Pass selectedNote.id as the SOURCE, targetId as the TARGET
    onAddLink(selectedNote.id, targetId, linkingType); 
    setLinkingType(null);
  };

  // Safety check: If no note is selected, don't render anything (or render a fallback)
  if (!selectedNote) return null;

  return (
    <>
      {/* MODAL: LINK SELECTOR */}
      {linkingType && (
        <LinkSelector 
          notes={linkableNotes} 
          onClose={() => setLinkingType(null)} 
          onSelect={handleLinkSelection} 
        />
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-2xl mx-auto px-2 py-2">
        
        {/* HEADER: Navigation Controls */}
        <div className="flex justify-between items-center mb-2">
            <button 
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Back to Index"
            >
                <ArrowLeft size={20} className="text-gray-600" />
            </button>
            
            <button
                onClick={onOpenMap}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="View in Map"
            >
                <Map size={20} className="text-gray-400" />
            </button>
        </div>
        
        {/* THE THREAD: Vertical Timeline */}
        <div className="flex flex-col gap-2 relative">
          
          {/* SECTION: ANTERIOR (The Source/Basis) */}
          <div className="flex flex-col">
            <ConnectionStack 
              title="Anterior" 
              linkedNotes={getLinkedNotes('anterior')} 
              onSelectNote={onSelectNote}
              // Specific removal for Anterior links
              onRemove={(targetId) => onRemoveLink(selectedNote.id, targetId, 'anterior')}
            />
            <button 
              onClick={() => setLinkingType('anterior')}
              className="p-2 text-gray-200 hover:text-black transition-colors self-start"
              title="Add Anterior Connection"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* SECTION: CURRENT NOTE (The Anchor) */}
          <article className="max-w-prose py-4 border-y border-transparent">
             <p className="text-xl md:text-2xl leading-relaxed text-[#1a1a1a] font-light">
               {selectedNote.content}
             </p>
          </article>

          {/* SECTION: POSTERIOR (The Extension/Outcome) */}
          <div className="flex flex-col">
            <button 
              onClick={() => setLinkingType('posterior')}
              className="p-2 text-gray-200 hover:text-black transition-colors self-start"
              title="Add Posterior Connection"
            >
              <Plus size={24} />
            </button>
            <ConnectionStack 
              title="Posterior" 
              linkedNotes={getLinkedNotes('posterior')} 
              onSelectNote={onSelectNote}
              // Specific removal for Posterior links
              onRemove={(targetId) => onRemoveLink(selectedNote.id, targetId, 'posterior')}
            />
          </div>

        </div>
      </main>
    </>
  );
};

export default FocusView;