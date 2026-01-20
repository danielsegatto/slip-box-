import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Map } from 'lucide-react'; 
import ConnectionStack from '../ConnectionStack';
import LinkSelector from '../LinkSelector';

const FocusView = ({ 
  selectedNote, 
  allNotes, 
  getLinkedNotes, 
  onBack, 
  onSelectNote, 
  onUpdateNote, // Receive the updater
  onAddLink, 
  onRemoveLink, 
  onOpenMap 
}) => {
  const [linkingType, setLinkingType] = useState(null); 
  const textareaRef = useRef(null);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [selectedNote.content]);

  const linkableNotes = allNotes.filter(n => {
    if (!selectedNote) return false;
    const isSelf = n.id === selectedNote.id;
    const currentLinks = selectedNote.links?.[linkingType] || []; 
    const isAlreadyConnected = linkingType && currentLinks.includes(n.id);
    return !isSelf && !isAlreadyConnected;
  });

  const handleLinkSelection = (targetId) => {
    onAddLink(selectedNote.id, targetId, linkingType); 
    setLinkingType(null);
  };

  if (!selectedNote) return null;

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
        
        {/* HEADER */}
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
        
        <div className="flex flex-col gap-2 relative">
          
          {/* ANTERIOR */}
          <div className="flex flex-col">
            <ConnectionStack 
              title="Anterior" 
              linkedNotes={getLinkedNotes('anterior')} 
              onSelectNote={onSelectNote}
              onRemove={(targetId) => onRemoveLink(selectedNote.id, targetId, 'anterior')}
            />
            <button 
              onClick={() => setLinkingType('anterior')}
              className="p-2 text-gray-200 hover:text-black transition-colors self-start"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* CURRENT NOTE (EDITABLE) */}
          <article className="max-w-prose py-4 border-y border-transparent">
             <textarea
               ref={textareaRef}
               value={selectedNote.content}
               onChange={(e) => onUpdateNote(selectedNote.id, e.target.value)}
               className="w-full text-xl md:text-2xl leading-relaxed text-[#1a1a1a] font-light resize-none bg-transparent outline-none overflow-hidden"
               spellCheck={false}
             />
          </article>

          {/* POSTERIOR */}
          <div className="flex flex-col">
            <button 
              onClick={() => setLinkingType('posterior')}
              className="p-2 text-gray-200 hover:text-black transition-colors self-start"
            >
              <Plus size={24} />
            </button>
            <ConnectionStack 
              title="Posterior" 
              linkedNotes={getLinkedNotes('posterior')} 
              onSelectNote={onSelectNote}
              onRemove={(targetId) => onRemoveLink(selectedNote.id, targetId, 'posterior')}
            />
          </div>

        </div>
      </main>
    </>
  );
};

export default FocusView;