import { useState, useEffect } from 'react';
import { extractTags } from '../utils/textProcessor';

const STORAGE_KEY = 'slip-box-atoms';

export const useSlipBox = () => {
  const [notes, setNotes] = useState([]);

  // 1. Load from Memory (Mount)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  // 2. Save to Memory (Update)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // 3. Action: Create Atom
  const addNote = (content) => {
    if (!content.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: new Date().toISOString(),
      tags: extractTags(content),
      links: { anterior: [], posterior: [] }
    };
    setNotes(prev => [newNote, ...prev]);
  };

  // 4. Action: Update Atom
  const updateNote = (id, newContent) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        return {
          ...note,
          content: newContent,
          tags: extractTags(newContent) // Re-calculate tags dynamically
        };
      }
      return note;
    }));
  };

  // 5. Action: Delete Atom
  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // 6. Action: The Synapse (Connect)
  const addLink = (sourceId, targetId, type) => {
    setNotes(prevNotes => prevNotes.map(note => {
      // A. Update Source
      if (note.id === sourceId) {
        return { 
          ...note, 
          links: { 
            ...note.links, 
            [type]: [...new Set([...note.links[type], targetId])] 
          } 
        };
      }
      // B. Update Target (Inverse Link)
      if (note.id === targetId) {
        const inverseType = type === 'anterior' ? 'posterior' : 'anterior';
        return { 
          ...note, 
          links: { 
            ...note.links, 
            [inverseType]: [...new Set([...note.links[inverseType], sourceId])] 
          } 
        };
      }
      return note;
    }));
  };

  // 7. Action: The Severance (Disconnect)
  const removeLink = (sourceId, targetId, type) => {
    setNotes(prevNotes => prevNotes.map(note => {
      // A. Remove from Source
      if (note.id === sourceId) {
        return { 
          ...note, 
          links: { 
            ...note.links, 
            [type]: note.links[type].filter(id => id !== targetId)
          } 
        };
      }
      // B. Remove from Target (Inverse)
      if (note.id === targetId) {
        const inverseType = type === 'anterior' ? 'posterior' : 'anterior';
        return { 
          ...note, 
          links: { 
            ...note.links, 
            [inverseType]: note.links[inverseType].filter(id => id !== sourceId)
          } 
        };
      }
      return note;
    }));
  };

  return {
    notes,
    addNote,
    updateNote, // Export new function
    deleteNote,
    addLink,
    removeLink
  };
};