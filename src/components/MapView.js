import React, { useEffect, useState, useRef } from 'react';
import { X, Plus, Minus } from 'lucide-react';

const NODE_WIDTH_BASE = 180;
const FONT_SIZE = 12;

// --- PHYSICS CONSTANTS ---
// High repulsion for clear separation
const REPULSION = 4000; 
const SPRING_LEN = 250; 
const PADDING = 30;     
// "Slow Motion" constraints
const MAX_SPEED = 0.15; // Pixels per frame (Very slow)
const FRICTION = 0.95;  // High friction (Drift, don't glide)
const WANDER = 0.02;    // Tiny random force to keep them alive

const MapView = ({ notes, onSelectNote, onClose, activeNoteId }) => {
  const [nodes, setNodes] = useState([]);
  const [viewDepth, setViewDepth] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const pointersRef = useRef(new Map());
  const requestRef = useRef();
  
  // Helper: Calculate card size
  const getDimensions = (text) => {
    let w = 200;
    if (text.length > 50) w = 240;
    if (text.length > 150) w = 300;
    
    const charsPerLine = w / 7;
    const lines = Math.ceil(text.length / charsPerLine);
    const h = Math.max(100, (lines * FONT_SIZE * 1.4) + 50);
    return { width: w, height: h };
  };

  // --- 1. INITIALIZATION (The "Instant Layout") ---
  useEffect(() => {
    if (!activeNoteId) return;

    // A. BFS for visibility
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
    // We try to preserve positions of nodes that already exist to avoid jumps
    setNodes(prevNodes => {
        const prevMap = new Map(prevNodes.map(n => [n.id, n]));
        
        let newNodes = notes
            .filter(n => visited.has(n.id))
            .map(n => {
                const existing = prevMap.get(n.id);
                const dims = getDimensions(n.content);
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

        // C. Pre-solve Layout (Run 200 times instantly so it starts settled)
        for (let i = 0; i < 200; i++) {
            newNodes = runPhysicsTick(newNodes, true); // true = high speed setup
        }
        
        return newNodes;
    });

  }, [notes, activeNoteId, viewDepth]);


  // --- 2. PHYSICS ENGINE (The "Slow Drift") ---
  const runPhysicsTick = (currentNodes, isSetup = false) => {
    // Clone to avoid mutation
    const nextNodes = currentNodes.map(n => ({ ...n }));
    
    // Limits: Setup phase is fast/loose, Drift phase is slow/strict
    const currentMaxSpeed = isSetup ? 20 : MAX_SPEED;
    
    // 1. Apply Forces
    for (let i = 0; i < nextNodes.length; i++) {
        const nodeA = nextNodes[i];
        
        // A. Repulsion (Push apart)
        for (let j = 0; j < nextNodes.length; j++) {
            if (i === j) continue;
            const nodeB = nextNodes[j];
            const dx = nodeA.x - nodeB.x;
            const dy = nodeA.y - nodeB.y;
            const distSq = dx*dx + dy*dy || 1;
            const dist = Math.sqrt(distSq);
            
            const force = REPULSION / distSq;
            nodeA.vx += (dx / dist) * force;
            nodeA.vy += (dy / dist) * force;
        }

        // B. Attraction (Links)
        const links = [...nodeA.links.anterior, ...nodeA.links.posterior];
        links.forEach(targetId => {
            const nodeB = nextNodes.find(n => n.id === targetId);
            if (!nodeB) return;
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            
            const force = (dist - SPRING_LEN) * 0.005;
            nodeA.vx += (dx / dist) * force;
            nodeA.vy += (dy / dist) * force;
        });

        // C. Ambient Wander (Only during live phase)
        if (!isSetup) {
            nodeA.vx += (Math.random() - 0.5) * WANDER;
            nodeA.vy += (Math.random() - 0.5) * WANDER;
        }

        // D. Centering (Weak gravity)
        nodeA.vx -= nodeA.x * 0.0005;
        nodeA.vy -= nodeA.y * 0.0005;
    }

    // 2. Move & Resolve Collisions
    nextNodes.forEach(nodeA => {
        // Apply Friction
        nodeA.vx *= FRICTION;
        nodeA.vy *= FRICTION;

        // Cap Speed
        const speed = Math.sqrt(nodeA.vx*nodeA.vx + nodeA.vy*nodeA.vy);
        if (speed > currentMaxSpeed) {
            nodeA.vx = (nodeA.vx / speed) * currentMaxSpeed;
            nodeA.vy = (nodeA.vy / speed) * currentMaxSpeed;
        }

        // Move
        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;
    });

    // 3. HARD COLLISION CHECK (Prevent Overlap)
    // Run this multiple times per frame to be sure
    const passes = isSetup ? 1 : 2; 
    for (let p = 0; p < passes; p++) {
        for (let i = 0; i < nextNodes.length; i++) {
            for (let j = i + 1; j < nextNodes.length; j++) {
                const nodeA = nextNodes[i];
                const nodeB = nextNodes[j];

                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const w = (nodeA.width + nodeB.width) / 2 + PADDING;
                const h = (nodeA.height + nodeB.height) / 2 + PADDING;

                if (Math.abs(dx) < w && Math.abs(dy) < h) {
                    const overlapX = w - Math.abs(dx);
                    const overlapY = h - Math.abs(dy);

                    if (overlapX < overlapY) {
                        const shift = overlapX / 2;
                        const sign = dx > 0 ? 1 : -1;
                        nodeA.x -= shift * sign;
                        nodeB.x += shift * sign;
                        // Kill velocity on collision axis
                        nodeA.vx *= 0.5;
                        nodeB.vx *= 0.5;
                    } else {
                        const shift = overlapY / 2;
                        const sign = dy > 0 ? 1 : -1;
                        nodeA.y -= shift * sign;
                        nodeB.y += shift * sign;
                        nodeA.vy *= 0.5;
                        nodeB.vy *= 0.5;
                    }
                }
            }
        }
    }

    return nextNodes;
  };

  // --- 3. ANIMATION LOOP ---
  const animate = () => {
    setNodes(prev => runPhysicsTick(prev, false)); // Run one tick of "Drift"
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // Run forever

  // --- 4. INTERACTION (Zoom/Pan) ---
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

      {/* Map */}
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
            
            {/* Links */}
            {nodes.map(node => (
                node.links.anterior.map(targetId => {
                    const target = nodes.find(n => n.id === targetId);
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

            {/* Cards */}
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