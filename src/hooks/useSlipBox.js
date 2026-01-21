import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  where, 
  writeBatch, 
  getDocs,
  arrayUnion,
  arrayRemove,
  setDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { extractTags } from '../utils/textProcessor';

const useSlipBox = () => {
  const [notes, setNotes] = useState([]);

  // 1. SYNC: Real-time listener for notes
  useEffect(() => {
    // Listen to the "notes" collection
    const q = query(collection(db, "notes"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort client-side by timestamp descending (newest first)
      setNotes(notesData.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => unsubscribe();
  }, []);

  // 2. CREATE: Generate ID locally -> Save to FireStore
  const addNote = (content = '') => {
    const newNoteRef = doc(collection(db, "notes"));
    
    const newNote = {
      id: newNoteRef.id,
      content: content,
      timestamp: Date.now(),
      tags: extractTags(content),
      links: { anterior: [], posterior: [] }
    };

    setDoc(newNoteRef, newNote).catch(console.error);
    return newNote; 
  };

  // 3. UPDATE: Update content and regenerate tags
  const updateNote = async (id, newContent) => {
    const noteRef = doc(db, "notes", id);
    await updateDoc(noteRef, {
      content: newContent,
      tags: extractTags(newContent)
    });
  };

  // 4. DELETE: Atomic cleanup (Remove note + Remove links to it)
  const deleteNote = async (id) => {
    const batch = writeBatch(db);
    const noteRef = doc(db, "notes", id);

    // A. Delete the note itself
    batch.delete(noteRef);

    // B. Remove this ID from any "anterior" lists
    const antQuery = query(collection(db, "notes"), where("links.anterior", "array-contains", id));
    const antSnap = await getDocs(antQuery);
    antSnap.forEach(doc => {
      batch.update(doc.ref, { "links.anterior": arrayRemove(id) });
    });

    // C. Remove this ID from any "posterior" lists
    const postQuery = query(collection(db, "notes"), where("links.posterior", "array-contains", id));
    const postSnap = await getDocs(postQuery);
    postSnap.forEach(doc => {
      batch.update(doc.ref, { "links.posterior": arrayRemove(id) });
    });

    await batch.commit();
  };

  // 5. LINK: Connect two notes
  const addLink = async (sourceId, targetId, type) => {
    const batch = writeBatch(db);
    
    const sourceRef = doc(db, "notes", sourceId);
    const targetRef = doc(db, "notes", targetId);
    const reverseType = type === 'anterior' ? 'posterior' : 'anterior';

    batch.update(sourceRef, { [`links.${type}`]: arrayUnion(targetId) });
    batch.update(targetRef, { [`links.${reverseType}`]: arrayUnion(sourceId) });

    await batch.commit();
  };

  // 6. UNLINK: Disconnect two notes
  const removeLink = async (sourceId, targetId, type) => {
    const batch = writeBatch(db);
    
    const sourceRef = doc(db, "notes", sourceId);
    const targetRef = doc(db, "notes", targetId);
    const reverseType = type === 'anterior' ? 'posterior' : 'anterior';

    batch.update(sourceRef, { [`links.${type}`]: arrayRemove(targetId) });
    batch.update(targetRef, { [`links.${reverseType}`]: arrayRemove(sourceId) });

    await batch.commit();
  };

  return { 
    notes, 
    addNote, 
    updateNote, 
    deleteNote, 
    addLink,
    removeLink 
  };
};

export default useSlipBox;