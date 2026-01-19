import React, { useMemo, useState, useRef } from 'react';
import { X, Plus, Minus } from 'lucide-react';

const NODE_WIDTH_BASE = 180;
const FONT_SIZE = 12;

// --- LAYOUT CONSTANTS (Adjusted for Static Calculation) ---
const ITERATIONS = 200; // How many times to refine the layout before showing
const REPULSION = 4000; // Strong push between nodes
const SPRING_LEN = 250; // Ideal link distance
const PADDING = 30;     // Minimum whitespace between cards

const MapView = ({ notes, onSelectNote, onClose, activeNoteId }) => {
  // State for Viewport (Pan/Zoom) only
  const [viewDepth, setViewDepth] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Refs for interaction
  const pointersRef = useRef(new Map());
  // const prevPinchDistRef = useRef(null);

  // --- 1. PREPARE DATA (Helper Functions) ---
  
  // Calculate size based on text
  const getDimensions = (text) => {
    let w = 200;
    if (text.length > 50) w = 240;
    if (text.length > 150) w = 300;
    
    const charsPerLine = w / 7;
    const lines = Math.ceil(text.length / charsPerLine);
    const h = Math.max(100, (lines * FONT_SIZE * 1.4) + 50);
    return { width: w, height: h };
  };

  // --- 2. STATIC LAYOUT ENGINE (The "Simpler" Core) ---
  // This runs ONCE when data changes. No animations.
  const layoutNodes = useMemo(() => {
    if (!activeNoteId) return [];

    // A. Identify Visible Nodes (BFS)
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

    // B. Initialize Nodes with random positions
    let nodes = notes
        .filter(n => visited.has(n.id))
        .map(n => ({
            ...n,
            ...getDimensions(n.content),
            x: Math.random() * 100 - 50, // Start near center
            y: Math.random() * 100 - 50,
        }));

    // C. The "Solver" Loop (Runs instantly in JS)
    // We strictly separate overlaps.
    for (let i = 0; i < ITERATIONS; i++) {
        // 1. Forces
        nodes.forEach(nodeA => {
            let dx = 0, dy = 0;

            // Repulsion (Push everything away)
            nodes.forEach(nodeB => {
                if (nodeA.id === nodeB.id) return;
                const vx = nodeA.x - nodeB.x;
                const vy = nodeA.y - nodeB.y;
                const distSq = vx*vx + vy*vy || 1;
                const factor = REPULSION / distSq;
                dx += (vx / Math.sqrt(distSq)) * factor;
                dy += (vy / Math.sqrt(distSq)) * factor;
            });

            // Attraction (Pull links closer)
            const neighbors = [...nodeA.links.anterior, ...nodeA.links.posterior];
            neighbors.forEach(targetId => {
                const nodeB = nodes.find(n => n.id === targetId);
                if (!nodeB) return;
                const vx = nodeB.x - nodeA.x;
                const vy = nodeB.y - nodeA.y;
                const dist = Math.sqrt(vx*vx + vy*vy) || 1;
                const factor = (dist - SPRING_LEN) * 0.05; // Stiffness
                dx += (vx / dist) * factor;
                dy += (vy / dist) * factor;
            });

            // Apply slight movement
            nodeA.x += Math.max(-10, Math.min(10, dx)); // Cap speed
            nodeA.y += Math.max(-10, Math.min(10, dy));
        });

        // 2. HARD COLLISION RESOLUTION (The "No Overlap" Guarantee)
        // If two boxes touch, we force them apart immediately.
        for (let j = 0; j < nodes.length; j++) {
            for (let k = j + 1; k < nodes.length; k++) {
                const nodeA = nodes[j];
                const nodeB = nodes[k];

                // Calculate overlap
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const w = (nodeA.width + nodeB.width) / 2 + PADDING;
                const h = (nodeA.height + nodeB.height) / 2 + PADDING;

                if (Math.abs(dx) < w && Math.abs(dy) < h) {
                    // We have a collision!
                    const overlapX = w - Math.abs(dx);
                    const overlapY = h - Math.abs(dy);

                    // Push apart along the easiest axis
                    if (overlapX < overlapY) {
                        const shift = overlapX / 2;
                        const sign = dx > 0 ? 1 : -1;
                        nodeA.x -= shift * sign;
                        nodeB.x += shift * sign;
                    } else {
                        const shift = overlapY / 2;
                        const sign = dy > 0 ? 1 : -1;
                        nodeA.y -= shift * sign;
                        nodeB.y += shift * sign;
                    }
                }
            }
        }
    }

    return nodes;
  }, [notes, activeNoteId, viewDepth]); // Re-run only if data changes

  // --- 3. INTERACTION (Zoom/Pan Only) ---
  
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * 0.001; 
    setZoom(z => Math.min(Math.max(0.2, z * (1 - delta)), 4));
    // Simplified Zoom: Zooms to center for stability, 
    // or we can keep pointer-based if preferred. Let's keep it simpler for now.
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
    
    // Simple Pan
    setPan(p => ({
        x: p.x + (e.clientX - prev.x),
        y: p.y + (e.clientY - prev.y)
    }));
    
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa]">
      
      {/* --- Simple Header Controls --- */}
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

      {/* --- The Static Map --- */}
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
            
            {/* 1. Draw Links First (Background) */}
            {layoutNodes.map(node => (
                node.links.anterior.map(targetId => {
                    const target = layoutNodes.find(n => n.id === targetId);
                    if (!target) return null;
                    return (
                        <line 
                            key={`${node.id}-${target.id}`}
                            x1={node.x} y1={node.y}
                            x2={target.x} y2={target.y}
                            stroke="#e5e5e5" 
                            strokeWidth="2"
                        />
                    );
                })
            ))}

            {/* 2. Draw Cards */}
            {layoutNodes.map(node => (
                <foreignObject
                    key={node.id}
                    x={node.x - node.width / 2}
                    y={node.y - node.height / 2}
                    width={node.width}
                    height={node.height}
                    className="overflow-visible" 
                >
                    <div 
                        onPointerDown={(e) => e.stopPropagation()} 
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(node.id);
                        }}
                        className={`
                            h-full w-full p-4 bg-white border flex flex-col select-none transition-none
                            ${node.id === activeNoteId ? 'border-black shadow-lg z-20' : 'border-gray-300 shadow-sm z-10'}
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