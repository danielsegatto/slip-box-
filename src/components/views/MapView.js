import React, { useEffect, useState, useRef } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { runPhysicsTick, getDimensions } from '../../utils/physicsEngine';

// --- GEOMETRY HELPER: CLIP LINE TO RECTANGLE ---
// Calculates where the line from 'source' should stop to touch 'target's border
const calculateIntersection = (source, target) => {
    // Target dimensions (half-width/height) plus a small buffer for the arrow tip
    const w = (target.width / 2) + 5; 
    const h = (target.height / 2) + 5;

    const dx = source.x - target.x;
    const dy = source.y - target.y;

    if (dx === 0 && dy === 0) return { x: target.x, y: target.y };

    // Calculate scale factor to project vector onto the box boundary
    // We are looking for the point on the target box that faces the source.
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
  
  // Track previous distance between two fingers for pinch-zoom
  const prevPinchDistRef = useRef(null);

  // --- 1. INITIALIZATION & DATA SYNC ---
  useEffect(() => {
    // If no active note, show everything (or a default set)
    // For now, we require an activeNoteId to "anchor" the map view
    const anchorId = activeNoteId || notes[0]?.id;
    if (!anchorId) return;
    // A. BFS for visibility (Which nodes should be on the map?)
    const visited = new Set([anchorId]);
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
    // B. Build/Update Node Objects (Preserve positions of existing nodes)
    setNodes(prevNodes => {
        const prevMap = new Map(prevNodes.map(n => [n.id, n]));
        let newNodes = notes.filter(n => visited.has(n.id)).map(n => {
            const existing = prevMap.get(n.id);
            const dims = getDimensions(n.content);
            if (existing) return { ...existing, ...dims };
            return { ...n, ...dims, x: Math.random() * 20 - 10, y: Math.random() * 20 - 10, vx: 0, vy: 0 };
        });
        // C. Pre-solve Layout if it's a fresh load (low node count)
        if (prevNodes.length === 0) {
            for (let i = 0; i < 200; i++) { newNodes = runPhysicsTick(newNodes, true); }
        }
        return newNodes;
    });
  }, [notes, activeNoteId, viewDepth]); // Re-runs when activeNoteId changes to re-center graph

  // --- 2. ANIMATION LOOP ---
  useEffect(() => {
    const animate = () => {
        setNodes(prev => runPhysicsTick(prev, false));
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
    // 1. Update the current pointer's position
    if (!pointersRef.current.has(e.pointerId)) return;
    const prev = pointersRef.current.get(e.pointerId);
    
    // Update the record for this pointer
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 2. CHECK FOR PINCH (2 fingers)
    if (pointersRef.current.size === 2) {
        const points = [...pointersRef.current.values()];
        const p1 = points[0];
        const p2 = points[1];
        
        // Calculate distance between fingers
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (prevPinchDistRef.current) {
            // Compare current distance to previous frame's distance
            const scale = dist / prevPinchDistRef.current;
            setZoom(z => Math.min(Math.max(0.2, z * scale), 4));
        }
        
        // Store for next frame
        prevPinchDistRef.current = dist;
    } 
    // 3. CHECK FOR PAN (1 finger)
    else if (pointersRef.current.size === 1) {
        // Only pan if we aren't pinching (clears jitter)
        prevPinchDistRef.current = null; 
        
        setPan(p => ({
            x: p.x + (e.clientX - prev.x),
            y: p.y + (e.clientY - prev.y)
        }));
    }
  };

  const handlePointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    // Reset pinch tracking when fingers lift
    if (pointersRef.current.size < 2) {
        prevPinchDistRef.current = null;
    }
  };
  // --- 4. RENDER ---
  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa]">
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
        <button onClick={onClose} className="p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 hover:text-black transition-colors">
          <X size={20} />
        </button>
        <div className="h-4"></div>
        <button onClick={() => setViewDepth(d => d + 1)} className="p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 hover:text-black transition-colors">
          <Plus size={20} />
        </button>
        <button onClick={() => setViewDepth(d => Math.max(1, d - 1))} className="p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 hover:text-black transition-colors">
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
        {/* DEFINITIONS FOR ARROWS */}
        <defs>
          <marker id="arrow-default" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#e5e5e5" />
          </marker>
          <marker id="arrow-active" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#000000" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x + dimensions.width/2}, ${pan.y + dimensions.height/2}) scale(${zoom})`}>
            
            {/* LINKS (Anterior -> Node) */}
            {nodes.map(node => (
                node.links.anterior.map(sourceId => {
                    const source = nodes.find(n => n.id === sourceId);
                    if (!source) return null;
                    
                    const isHighlighted = highlightedId && (node.id === highlightedId || source.id === highlightedId);
                    // Logic: Line goes FROM Source TO Current Node.
                    // We clip the endpoint so the arrow sits on the box edge.
                    const end = calculateIntersection(source, node);

                    return (
                        <line 
                            key={`${source.id}-${node.id}`}
                            x1={source.x} y1={source.y}
                            x2={end.x} y2={end.y}
                            stroke={isHighlighted ? "#000000" : "#e5e5e5"} 
                            strokeWidth={isHighlighted ? "2" : "2"} 
                            className="transition-colors duration-200"
                            markerEnd={isHighlighted ? "url(#arrow-active)" : "url(#arrow-default)"}
                        />
                    );
                })
            ))}

            {/* NODES */}
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
                            const pressDuration = Date.now() - clickStartRef.current;
                            if (pressDuration < 200) {
                                onSelectNote(node.id);
                            }
                        }}
                        className={`
                            h-full w-full p-4 bg-white border flex flex-col select-none transition-all duration-300
                            ${node.id === activeNoteId ? 'border-black shadow-lg z-20 scale-105' : 'border-gray-300 shadow-sm z-10 opacity-90'}
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