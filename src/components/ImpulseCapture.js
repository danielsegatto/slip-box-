import React from 'react';
import { Plus } from 'lucide-react';

const ImpulseCapture = ({ input, setInput, addNote, textareaRef }) => (
  <section className="py-6 border-b border-gray-100 mb-12">
    <textarea
      ref={textareaRef}
      placeholder="..."
      className="w-full bg-transparent border-none p-2 focus:ring-0 text-xl md:text-2xl resize-none min-h-[120px] placeholder:text-gray-200 leading-relaxed"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          addNote();
        }
      }}
    />
    <div className="flex justify-end items-center mt-2">
      <button 
        onClick={addNote}
        disabled={!input.trim()}
        className="p-2 rounded-full"
      >
        <Plus size={24} />
      </button>
    </div>
  </section>
);

export default ImpulseCapture;
