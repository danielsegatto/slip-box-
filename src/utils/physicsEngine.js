// --- CONSTANTS ---
// CHANGED: Increased font size for legibility
const FONT_SIZE = 18;
const REPULSION = 8000; 
const SPRING_LEN = 300; 
const PADDING = 50;     
const MAX_SPEED = 3;  
const FRICTION = 0.95;  
const WANDER = 0.1;    

// --- HELPER: Calculate Node Size based on Text ---
export const getDimensions = (text) => {
  // CHANGED: Wider base widths to accommodate larger text on mobile
  let w = 220;
  if (text.length > 50) w = 260;
  if (text.length > 150) w = 320;
  
  // CHANGED: Improved height estimation
  // 16px font averages ~9px width per character. 
  // We use a safe divisor to slightly overestimate height (preventing scroll/cutoff).
  const charsPerLine = w / 9;
  const lines = Math.ceil(text.length / charsPerLine);
  
  // Height = (Lines * LineHeight) + Vertical Padding + Space for Tags
  // LineHeight is 1.6 (matches leading-relaxed)
  const h = Math.max(120, (lines * FONT_SIZE * 1.6) + 60);
  
  return { width: w, height: h };
};

// --- CORE: The Force-Directed Graph Logic ---
export const runPhysicsTick = (currentNodes, isSetup = false) => {
  const nextNodes = currentNodes.map(n => ({ ...n }));
  const currentMaxSpeed = isSetup ? 20 : MAX_SPEED;
  
  // 1. Apply Forces
  for (let i = 0; i < nextNodes.length; i++) {
      const nodeA = nextNodes[i];
      
       // A. Repulsion (Nodes push each other away)
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

      // B. Attraction (Links pull nodes together)
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

      // C. Ambient Wander (Organic movement)
      if (!isSetup) {
          nodeA.vx += (Math.random() - 0.5) * WANDER;
          nodeA.vy += (Math.random() - 0.5) * WANDER;
      }

      // D. Centering (Gravity towards center)
      nodeA.vx -= nodeA.x * 0.0005;
      nodeA.vy -= nodeA.y * 0.0005;
  }

  // 2. Move & Resolve Collisions
  nextNodes.forEach(nodeA => {
      nodeA.vx *= FRICTION;
      nodeA.vy *= FRICTION;

      const speed = Math.sqrt(nodeA.vx*nodeA.vx + nodeA.vy*nodeA.vy);
      if (speed > currentMaxSpeed) {
          nodeA.vx = (nodeA.vx / speed) * currentMaxSpeed;
          nodeA.vy = (nodeA.vy / speed) * currentMaxSpeed;
      }

      nodeA.x += nodeA.vx;
      nodeA.y += nodeA.vy;
  });

  // 3. HARD COLLISION CHECK (Prevent Overlap)
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