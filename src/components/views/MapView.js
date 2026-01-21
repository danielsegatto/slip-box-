import React, { useEffect, useState, useRef, useMemo } from 'react';
import { runPhysicsTick, getDimensions } from '../../utils/physicsEngine';
import MapControls from '../MapControls'; // Import the new component

// --- CONSTANTS ---
const MAX_VIEW_DEPTH = 5; 

// --- GEOMETRY HELPER ---
const calculateIntersection = (source, target) => {
    const w = (target.width / 2) + 5; 
    const h = (target.height / 2) + 5;
    const dx = source.x - target.x;
    const dy = source.y - target.y;
    if (dx === 0 && dy === 0) return { x: target.x, y: target.y };
    const scaleX = w / Math.abs(dx);
    const scaleY = h / Math.abs(dy);
    const scale = Math.min(scaleX, scaleY);
    return {
        x: target.x + (dx * scale),
        y: target.y + (dy * scale)
    };
};

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
  const prevPinchDistRef = useRef(null);

  // --- 1. RESET DEPTH ON NAVIGATION ---
  useEffect(() => {
    setViewDepth(1);
  }, [activeNoteId]);

  // --- 2. CALCULATE MAX AVAILABLE DEPTH ---
  const maxAvailableDepth = useMemo(() => {
    if (!activeNoteId) return 1;
    let d = 0;
    let currentLayer = [activeNoteId];
    const visited = new Set([activeNoteId]);

    while (d < MAX_VIEW_DEPTH - 1) {
        const nextLayer = [];
        for (const id of currentLayer) {
            const note = notes.find(n => n.id === id);
            if (!note) continue;
            const links = [...note.links.anterior, ...note.links.posterior];
            for (const linkId of links) {
                if (!visited.has(linkId)) {
                    visited.add(linkId);
                    nextLayer.push(linkId);
                }
            }
        }
        if (nextLayer.length === 0) break;
        currentLayer = nextLayer;
        d++;
    }
    return Math.max(1, d);
  }, [notes, activeNoteId]);

  // --- 3. INITIALIZATION & DATA SYNC ---
  useEffect(() => {
    const anchorId = activeNoteId || notes[0]?.id;
    if (!anchorId) return;

    const visited = new Set([anchorId]);
    let currentLayer = [activeNoteId];
    const actualDepth = Math.min(viewDepth, maxAvailableDepth);

    for (let d = 0; d < actualDepth; d++) {
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

    setNodes(prevNodes => {
        const prevMap = new Map(prevNodes.map(n => [n.id, n]));
        let newNodes = notes.filter(n => visited.has(n.id)).map(n => {
            const existing = prevMap.get(n.id);
            const dims = getDimensions(n.content);
            if (existing) return { ...existing, ...dims };
            return { ...n, ...dims, x: Math.random() * 20 - 10, y: Math.random() * 20 - 10, vx: 0, vy: 0 };
        });
        if (prevNodes.length === 0) {
            for (let i = 0; i < 200; i++) { newNodes = runPhysicsTick(newNodes, true); }
        }
        return newNodes;
    });
  }, [notes, activeNoteId, viewDepth, maxAvailableDepth]);

  // --- 4. ANIMATION LOOP ---
  useEffect(() => {
    const animate = () => {
        setNodes(prev => runPhysicsTick(prev, false));
        requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); 

  // --- 5. INPUT HANDLERS ---
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * 0.001; 
    setZoom(z => Math.min(Math.max(0.2, z * (1 - delta)), 4));
  };

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    const prev = pointersRef.current.get(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {        
        const points = [...pointersRef.current.values()];
        const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        if (prevPinchDistRef.current) {
            const scale = dist / prevPinchDistRef.current;
            setZoom(z => Math.min(Math.max(0.2, z * scale), 4));
        }
        prevPinchDistRef.current = dist;
    } else if (pointersRef.current.size === 1) {
        prevPinchDistRef.current = null; 
        setPan(p => ({
            x: p.x + (e.clientX - prev.x),
            y: p.y + (e.clientY - prev.y)
        }));
    }
  };

  const handlePointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) prevPinchDistRef.current = null;
  };

  // --- 6. HIGHLIGHT LOGIC ---
  const highlightedSet = useMemo(() => {
    if (!highlightedId) return new Set();
    const node = nodes.find(n => n.id === highlightedId);
    if (!node) return new Set([highlightedId]);
    return new Set([
        highlightedId,
        ...node.links.anterior,
        ...node.links.posterior
    ]);
  }, [highlightedId, nodes]);

  const canIncreaseDepth = viewDepth < maxAvailableDepth;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#fafafa] touch-none select-none overflow-hidden"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      
      {/* EXTRACTED UI CONTROLS */}
      <MapControls 
        onClose={onClose}
        onIncreaseDepth={() => setViewDepth(d => Math.min(maxAvailableDepth, d + 1))}
        onDecreaseDepth={() => setViewDepth(d => Math.max(1, d - 1))}
        canIncrease={canIncreaseDepth}
        canDecrease={viewDepth > 1}
      />

      <div 
        className="absolute top-0 left-0 w-full h-full origin-top-left will-change-transform"
        style={{ 
          transform: `translate(${pan.x + dimensions.width/2}px, ${pan.y + dimensions.height/2}px) scale(${zoom})` 
        }}
      >
        
        {/* LAYER 0: PASSIVE LINES (Background - z-0) */}
        <svg className="absolute inset-0 overflow-visible pointer-events-none z-0">
          <defs>
            <marker id="arrow-default" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#e5e5e5" />
            </marker>
          </defs>
          
          {nodes.map(node => (
            node.links.anterior.map(sourceId => {
              const source = nodes.find(n => n.id === sourceId);
              if (!source) return null;
              
              const isHighlighted = highlightedId && (node.id === highlightedId || source.id === highlightedId);
              if (isHighlighted) return null; 

              const start = calculateIntersection(node, source);
              const end = calculateIntersection(source, node);

              return (
                <line 
                  key={`bg-${source.id}-${node.id}`}
                  x1={start.x} y1={start.y}
                  x2={end.x} y2={end.y}
                  stroke="#e5e5e5" 
                  strokeWidth="2" 
                  markerEnd="url(#arrow-default)"
                />
              );
            })
          ))}
        </svg>

        {/* LAYER 10: NOTE CARDS (Middle - z-10) */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {nodes.map(node => {
             const isLit = highlightedSet.has(node.id);
             return (
               <div 
                 key={node.id}
                 className={`
                   absolute pointer-events-auto flex flex-col p-2 bg-white border transition-shadow duration-300 overflow-hidden
                   ${node.id === activeNoteId ? 'border-black shadow-lg z-20' : 'border-gray-300 shadow-sm z-10'}
                   ${isLit ? 'ring-2 ring-black z-30' : ''} 
                 `}
                 style={{
                   left: node.x,
                   top: node.y,
                   width: node.width,
                   height: node.height,
                   transform: 'translate(-50%, -50%)'
                 }}
                 onPointerDown={(e) => {
                     e.stopPropagation();
                     setHighlightedId(node.id);
                     clickStartRef.current = Date.now();
                 }}
                 onPointerUp={(e) => {
                     e.stopPropagation();
                     setHighlightedId(null);
                 }}
                 onClick={(e) => {
                     e.stopPropagation();
                     const pressDuration = Date.now() - clickStartRef.current;
                     if (pressDuration < 200) {
                         onSelectNote(node.id);
                     }
               }}
             >
                {node.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {node.tags.map(t => (
                            <span key={t} className="text-[10px] uppercase text-gray-400 font-medium">#{t}</span>
                        ))}
                    </div>
                )}
                <p className="text-base text-[#1a1a1a] whitespace-pre-wrap break-words font-mono leading-relaxed pointer-events-none">
                    {node.content}
                </p>
             </div>
            );
          })}
        </div>

        {/* LAYER 20: ACTIVE LINES (Foreground - z-20) */}
        <svg className="absolute inset-0 overflow-visible pointer-events-none z-20">
          <defs>
            <marker id="arrow-active" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#000000" />
            </marker>
          </defs>
          
          {nodes.map(node => (
            node.links.anterior.map(sourceId => {
              const source = nodes.find(n => n.id === sourceId);
              if (!source) return null;

              const isHighlighted = highlightedId && (node.id === highlightedId || source.id === highlightedId);
              if (!isHighlighted) return null;

              const start = calculateIntersection(node, source); 
              const end = calculateIntersection(source, node);   

              return (
                <line 
                  key={`fg-${source.id}-${node.id}`}
                  x1={start.x} y1={start.y}
                  x2={end.x} y2={end.y}
                  stroke="#000000" 
                  strokeWidth="2" 
                  markerEnd="url(#arrow-active)"
                />
              );
            })
          ))}
        </svg>

      </div>
    </div>
  );
};

export default MapView;