import React from 'react';
import { Plus } from 'lucide-react';

const ImpulseCapture = ({ input, setInput, addNote, textareaRef }) => (
  <section className={STYLES.container}>
    <textarea
      ref={textareaRef}
      placeholder="..."
      className={STYLES.textarea}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          addNote();
        }
      }}
    />
    <div className={STYLES.actions}>
      <button 
        onClick={addNote}
        disabled={!input.trim()}
        className={STYLES.addButton}
      >
        <Plus size={28} />
      </button>
    </div>
  </section>
);

const STYLES = {
  container: "py-6 border-b border-gray-100 mb-8",
  textarea: "w-full border-gray-200 p-4 text-2xl resize-none min-h-[140px] placeholder:text-gray-200 leading-relaxed bg-transparent focus:outline-none",
  actions: "flex justify-end items-center mt-4",
  addButton: "p-4 bg-black text-white rounded-full shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
};

export default ImpulseCapture;