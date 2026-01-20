import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Map } from 'lucide-react'; 
import ConnectionStack from '../ConnectionStack';
import LinkSelector from '../LinkSelector';

const FocusView = ({ 
  selectedNote, allNotes, getLinkedNotes, onBack, onSelectNote, 
  onUpdateNote, onAddLink, onRemoveLink, onOpenMap 
}) => {
  const [linkingType, setLinkingType] = useState(null); 
  const textareaRef = useRef(null);

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

      <main className={STYLES.container}>
        
        {/* HEADER */}
        <div className={STYLES.header}>
            <button onClick={onBack} className={STYLES.navButton}>
                <ArrowLeft size={28} className="text-black" />
            </button>
            <button onClick={onOpenMap} className={STYLES.navButton}>
                <Map size={28} className="text-black" />
            </button>
        </div>
        
        <div className={STYLES.threadContainer}>
          
          {/* ANTERIOR */}
          <div className={STYLES.connectionGroup}>
            <ConnectionStack 
              title="Anterior" 
              linkedNotes={getLinkedNotes('anterior')} 
              onSelectNote={onSelectNote}
              onRemove={(targetId) => onRemoveLink(selectedNote.id, targetId, 'anterior')}
            />
            <button 
              onClick={() => setLinkingType('anterior')}
              className={STYLES.addButton}
            >
              <Plus size={28} />
            </button>
          </div>

          {/* CURRENT NOTE (EDITABLE) */}
          <article className={STYLES.activeNoteContainer}>
             <textarea
               ref={textareaRef}
               value={selectedNote.content}
               onChange={(e) => onUpdateNote(selectedNote.id, e.target.value)}
               className={STYLES.textarea}
               spellCheck={false}
             />
          </article>

          {/* POSTERIOR */}
          <div className={STYLES.connectionGroup}>
            <button 
              onClick={() => setLinkingType('posterior')}
              className={STYLES.addButton}
            >
              <Plus size={28} />
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

const STYLES = {
  container: "max-w-2xl mx-auto px-5 py-4 min-h-screen flex flex-col",
  header: "flex justify-between items-center mb-6",
  navButton: "p-3 -ml-3 rounded-full active:bg-gray-100 transition-colors",
  threadContainer: "flex flex-col gap-6 relative flex-1",
  connectionGroup: "flex flex-col gap-2",
  addButton: "p-2 text-gray-300 hover:text-black self-start transition-colors",
  activeNoteContainer: "py-6 border-y border-gray-100",
  textarea: "w-full text-2xl leading-relaxed text-[#1a1a1a] font-light resize-none bg-transparent outline-none overflow-hidden"
};

export default FocusView;