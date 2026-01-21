import React from 'react';
import { X, Plus, Minus } from 'lucide-react';

const MapControls = ({ onClose, onIncreaseDepth, onDecreaseDepth, canIncrease, canDecrease }) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-50 pointer-events-auto">
      <button onClick={onClose} className="p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 hover:text-black">
        <X size={20} />
      </button>
      <div className="h-4"></div>
      
      <button 
          onClick={onIncreaseDepth}
          disabled={!canIncrease}
          className={`p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 transition-colors ${!canIncrease ? 'opacity-50 cursor-not-allowed' : 'hover:text-black'}`}
      >
        <Plus size={20} />
      </button>
      
      <button 
          onClick={onDecreaseDepth} 
          disabled={!canDecrease}
          className={`p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 transition-colors ${!canDecrease ? 'opacity-50 cursor-not-allowed' : 'hover:text-black'}`}
      >
        <Minus size={20} />
      </button>
    </div>
  );
};

export default MapControls;