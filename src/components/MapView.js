import React, { useEffect, useRef, useState } from 'react';
import { X, Minimize2 } from 'lucide-react';

const MapView = ({ notes, onSelectNote, onClose, activeNoteId }) => {
  const [nodes, setNodes] = useState([]);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Initialize Simulation Data
  useEffect(() => {
    const initialNodes = notes.map(note => ({
      ...note,
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: 0,
      vy: 0
    }));
    setNodes(initialNodes);
  }, [notes, dimensions]);

  // The Physics Engine (The "Organic" Movement)
  useEffect(() => {
    let animationFrameId;

    const runSimulation = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => ({ ...node })); // Deep copy for mutability in calc

        // 1. Repulsion (Nodes push apart)
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 5000 / (distance * distance); // Repulsion strength
            
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            newNodes[i].vx -= fx;
            newNodes[i].vy -= fy;
            newNodes[j].vx += fx;
            newNodes[j].vy += fy;
          }
        }

        // 2. Attraction (Links pull together)
        newNodes.forEach(node => {
            // Check anterior links
            if (node.links.anterior) {
                node.links.anterior.forEach(targetId => {
                    const target = newNodes.find(n => n.id === targetId);
                    if (target) {
                        const dx = target.x - node.x;
                        const dy = target.y - node.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = (distance - 150) * 0.005; // Spring constant

                        const fx = (dx / distance) * force;
                        const fy = (dy / distance) * force;

                        node.vx += fx;
                        node.vy += fy;
                        target.vx -= fx;
                        target.vy -= fy;
                    }
                });
            }
        });

        // 3. Center Gravity (Keep them on screen)
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        newNodes.forEach(node => {
          node.vx += (centerX - node.x) * 0.0005;
          node.vy += (centerY - node.y) * 0.0005;
          
          // Apply Velocity & Friction
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= 0.9; // Friction
          node.vy *= 0.9;
        });

        return newNodes;
      });

      animationFrameId = requestAnimationFrame(runSimulation);
    };

    runSimulation();
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa] animate-in fade-in duration-300">
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-50">
        <button onClick={onClose} className="p-2 bg-white shadow-sm rounded-full hover:bg-gray-50 transition-colors">
          <X size={24} className="text-gray-500" />
        </button>
      </div>

      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        className="cursor-move"
      >
        {/* Draw Connections */}
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
                     strokeWidth="1.5"
                   />
               );
           })
        ))}

        {/* Draw Nodes */}
        {nodes.map(node => {
          const isActive = node.id === activeNoteId;
          return (
            <g 
              key={node.id} 
              transform={`translate(${node.x},${node.y})`}
              onClick={() => onSelectNote(node.id)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <circle 
                r={isActive ? 8 : 5} 
                fill={isActive ? "#1a1a1a" : "#d4d4d4"} 
              />
              <text 
                y={-10} 
                textAnchor="middle" 
                className="text-[8px] fill-gray-400 pointer-events-none select-none"
              >
                {node.content.slice(0, 15)}...
              </text>
            </g>
          );
        })}
      </svg>
      
      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
        <p className="text-xs text-gray-300 uppercase tracking-widest">Mental Topography</p>
      </div>
    </div>
  );
};

export default MapView;
