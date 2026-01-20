import React, { useEffect, useState, useRef } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { runPhysicsTick, getDimensions } from '../../utils/physicsEngine'; // New Import

const MapView = ({ notes, onSelectNote, onClose, activeNoteId }) => {
  const [nodes, setNodes] = useState([]);
  const [viewDepth, setViewDepth] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [highlightedId, setHighlightedId] = useState(null);

  const dimensions = { width: window.innerWidth, height: window.innerHeight };

  const pointersRef = useRef(new Map());
  const requestRef = useRef();
  const clickStartRef = useRef(0);

  // --- 1. INITIALIZATION & DATA SYNC ---
  useEffect(() => {
    if (!activeNoteId) return;

    // A. BFS for visibility (Which nodes should be on the map?)
    const visited = new Set([activeNoteId]);
    let currentLayer = [activeNoteId];
    for (let d = 0; d < viewDepth; d++) {
        const nextLayer = [];
        currentLayer.forEach(id => {
            const note = notes.find(n => n.id === id);
            if (!note) return;
            [...note.links.anterior, ...note.links.posterior].forEach(linkId => {
                if (!visited.has(linkId)) { visited.add(linkId); nextLayer.push(linkId); }
            });
        });
        currentLayer = nextLayer;
    }

    // B. Build Node Objects
    setNodes(prevNodes => {
        const prevMap = new Map(prevNodes.map(n => [n.id, n]));
        
        let newNodes = notes
            .filter(n => visited.has(n.id))
            .map(n => {
                const existing = prevMap.get(n.id);
                const dims = getDimensions(n.content); // Use Helper
                if (existing) return { ...existing, ...dims };
                
                return {
                    ...n,
                    ...dims,
                    x: Math.random() * 20 - 10,
                    y: Math.random() * 20 - 10,
                    vx: 0,
                    vy: 0
                };
            });

        // C. Pre-solve Layout (Run physics fast for initial placement)
        for (let i = 0; i < 200; i++) {
            newNodes = runPhysicsTick(newNodes, true); // Use Helper
        }
        
        return newNodes;
    });

  }, [notes, activeNoteId, viewDepth]);


  // --- 2. ANIMATION LOOP ---
  useEffect(() => {
    const animate = () => {
        setNodes(prev => runPhysicsTick(prev, false)); // Use Helper
        requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); 

  // --- 3. INPUT HANDLERS (Zoom/Pan/Click) ---
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * 0.001; 
    setZoom(z => Math.min(Math.max(0.2, z * (1 - delta)), 4));
  };

  const handlePointerDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'g') {
      e.target.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    const prev = pointersRef.current.get(e.pointerId);
    setPan(p => ({
        x: p.x + (e.clientX - prev.x),
        y: p.y + (e.clientY - prev.y)
    }));
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
  };

  // --- 4. RENDER ---
  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa]">
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
        <button onClick={onClose} className="p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 hover:text-black">
          <X size={20} />
        </button>
        <div className="h-4"></div>
        <button onClick={() => setViewDepth(d => d + 1)} className="p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500">
          <Plus size={20} />
        </button>
        <button onClick={() => setViewDepth(d => Math.max(1, d - 1))} className="p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500">
          <Minus size={20} />
        </button>
      </div>

      {/* Map Canvas */}
      <svg 
        width="100%" 
        height="100%" 
        className="cursor-move touch-none bg-[#fafafa]"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <g transform={`translate(${pan.x + dimensions.width/2}, ${pan.y + dimensions.height/2}) scale(${zoom})`}>
            
            {/* Layer 1: Links */}
            {nodes.map(node => (
                node.links.anterior.map(targetId => {
                    const target = nodes.find(n => n.id === targetId);
                    if (!target) return null;
                    
                    const isHighlighted = highlightedId && (node.id === highlightedId || target.id === highlightedId);

                    return (
                        <line 
                            key={`${node.id}-${target.id}`}
                            x1={node.x} y1={node.y}
                            x2={target.x} y2={target.y}
                            stroke={isHighlighted ? "#000000" : "#e5e5e5"} 
                            strokeWidth={isHighlighted ? "4" : "4"} 
                            className="transition-colors duration-200"
                        />
                    );
                })
            ))}

            {/* Layer 2: Thought Cards */}
            {nodes.map(node => (
                <foreignObject
                    key={node.id}
                    x={node.x - node.width / 2}
                    y={node.y - node.height / 2}
                    width={node.width}
                    height={node.height}
                    className="overflow-visible" 
                >
                    <div 
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            setHighlightedId(node.id);
                            clickStartRef.current = Date.now();
                        }}
                        onPointerUp={(e) => {
                            e.stopPropagation();
                            setHighlightedId(null);
                        }}
                        onPointerLeave={() => setHighlightedId(null)}
                        
                        onClick={(e) => {
                            e.stopPropagation();
                            // Tactile Logic: Only navigate if the hold was shorter than 200ms
                            const pressDuration = Date.now() - clickStartRef.current;
                            if (pressDuration < 200) {
                                onSelectNote(node.id);
                            }
                        }}
                        className={`
                            h-full w-full p-4 bg-white border flex flex-col select-none transition-none
                            ${node.id === activeNoteId ? 'border-black shadow-lg z-20' : 'border-gray-300 shadow-sm z-10'}
                            ${node.id === highlightedId ? 'ring-2 ring-black' : ''}
                        `}
                    >
                        {node.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {node.tags.map(t => (
                                    <span key={t} className="text-[10px] uppercase text-gray-400 font-medium">#{t}</span>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-[#1a1a1a] whitespace-pre-wrap font-mono leading-relaxed">
                            {node.content}
                        </p>
                    </div>
                </foreignObject>
            ))}
        </g>
      </svg>
    </div>
  );
};

export default MapView;
