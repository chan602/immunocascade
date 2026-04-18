/**
 * cells.js — SVG cell & molecule asset library
 *
 * All draw functions share the same signature:
 *   drawX(container, cx, cy, s)
 *   container : SVG <g> element to append into
 *   cx, cy    : centre coordinates
 *   s         : size scale (nominal radius / half-height in px)
 *
 * CELL_DEFS maps tray IDs → { label, draw } for story mode.
 * CV_NODES_DEF is imported by canvas.js for the freeform pathway builder.
 *
 * To fix or redesign an asset, edit only the relevant drawX function here —
 * changes propagate automatically to the tray, scene placements, canvas
 * nodes, and any future levels that reference the same ID.
 */

const NS='http://www.w3.org/2000/svg';
function e(tag,a={}){const el=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,v])=>el.setAttribute(k,v));return el;}
function svgW(w,h){const s=e('svg');s.setAttribute('width',w);s.setAttribute('height',h);s.setAttribute('viewBox',`0 0 ${w} ${h}`);return s;}

/* CELL DRAW FUNCTIONS */
function drawMacrophage(g,cx,cy,s){
  const pts=[];for(let i=0;i<20;i++){const a=(i/20)*Math.PI*2,r=s*(.38+.1*Math.sin(i*2.1+.8));pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}
  g.appendChild(e('path',{d:'M'+pts.map(p=>p.join(',')).join('L')+'Z',fill:'#FDE68A',stroke:'#D97706','stroke-width':'1.6','stroke-linejoin':'round'}));
  g.appendChild(e('path',{d:`M${cx-s*.08},${cy+s*.04} Q${cx-s*.2},${cy-s*.14} ${cx+s*.04},${cy-s*.08} Q${cx+s*.18},${cy+s*.02} ${cx+s*.02},${cy+s*.18} Q${cx-s*.1},${cy+s*.22} ${cx-s*.08},${cy+s*.04}`,fill:'#92400E',opacity:'.5'}));
  g.appendChild(e('circle',{cx:cx+s*.13,cy:cy+s*.06,r:s*.08,fill:'#FEF3C7',stroke:'#D97706','stroke-width':'0.8',opacity:'.8'}));
}
function drawNK(g,cx,cy,s){
  g.appendChild(e('circle',{cx,cy,r:s*.36,fill:'#FED7AA',stroke:'#EA580C','stroke-width':'1.6'}));
  g.appendChild(e('ellipse',{cx:cx-s*.06,cy,rx:s*.13,ry:s*.18,fill:'#7C2D12',opacity:'.5'}));
  for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;g.appendChild(e('circle',{cx:cx+Math.cos(a)*s*.2,cy:cy+Math.sin(a)*s*.2,r:s*.04,fill:'#C2410C',opacity:'.65'}));}
  g.appendChild(e('path',{d:`M${cx+s*.32},${cy-s*.15} L${cx+s*.43},${cy-s*.02} L${cx+s*.36},${cy-s*.02} L${cx+s*.42},${cy+s*.14} L${cx+s*.31},${cy+s*.01} L${cx+s*.36},${cy+s*.01} Z`,fill:'#EA580C',opacity:'.9'}));
}
function drawDendritic(g,cx,cy,s){
  [[0,-1],[.64,-.77],[.98,-.2],[.77,.64],[.2,.98],[-.64,.77],[-.98,.2],[-.77,-.64],[-.2,-.98]].forEach(([ax,ay],i)=>{
    const tr=s*(.42+.1*(i%3-.5)*.4),x1=cx+ax*s*.18,y1=cy+ay*s*.18,x2=cx+ax*tr,y2=cy+ay*tr;
    const mx=cx+ax*tr*.55+ay*s*.04,my=cy+ay*tr*.55-ax*s*.04;
    g.appendChild(e('path',{d:`M${x1},${y1} Q${mx},${my} ${x2},${y2}`,fill:'none',stroke:'#F59E0B','stroke-width':i%2===0?'3.5':'2.5','stroke-linecap':'round',opacity:'.75'}));
    g.appendChild(e('circle',{cx:x2,cy:y2,r:s*.04,fill:'#B45309'}));
  });
  g.appendChild(e('circle',{cx,cy,r:s*.22,fill:'#FDE68A',stroke:'#F59E0B','stroke-width':'1.8'}));
  g.appendChild(e('ellipse',{cx,cy:cy+s*.02,rx:s*.1,ry:s*.08,fill:'#92400E',opacity:'.55'}));
}
function drawCD4(g,cx,cy,s){
  g.appendChild(e('circle',{cx,cy,r:s*.35,fill:'#A5B4FC',stroke:'#3730A3','stroke-width':'1.8'}));
  g.appendChild(e('circle',{cx,cy,r:s*.18,fill:'#312E81',opacity:'.6'}));
  [[-s*.35,0],[-s*.25,-s*.24],[-s*.25,s*.24],[0,-s*.35]].forEach(([dx,dy])=>{
    const a=Math.atan2(dy,dx),x1=cx+Math.cos(a)*s*.35,y1=cy+Math.sin(a)*s*.35,x2=cx+Math.cos(a)*s*.5,y2=cy+Math.sin(a)*s*.5;
    g.appendChild(e('line',{x1,y1,x2,y2,stroke:'#4338CA','stroke-width':'1.5','stroke-linecap':'round'}));
    g.appendChild(e('line',{x1:x2,y1:y2,x2:x2+Math.cos(a+.7)*s*.1,y2:y2+Math.sin(a+.7)*s*.1,stroke:'#3730A3','stroke-width':'1.2','stroke-linecap':'round'}));
    g.appendChild(e('line',{x1:x2,y1:y2,x2:x2+Math.cos(a-.7)*s*.1,y2:y2+Math.sin(a-.7)*s*.1,stroke:'#3730A3','stroke-width':'1.2','stroke-linecap':'round'}));
  });
  const l=e('text',{x:cx,y:cy,fill:'#E0E7FF','text-anchor':'middle','dominant-baseline':'central','font-size':s*.22,'font-weight':'700','font-family':'sans-serif'});l.textContent='4';g.appendChild(l);
}
function drawCD8(g,cx,cy,s){
  g.appendChild(e('circle',{cx,cy,r:s*.35,fill:'#C4B5FD',stroke:'#6D28D9','stroke-width':'1.8'}));
  g.appendChild(e('circle',{cx,cy,r:s*.18,fill:'#4C1D95',opacity:'.65'}));
  [[s*.35,0],[s*.25,-s*.24],[s*.25,s*.24]].forEach(([dx,dy])=>{
    const a=Math.atan2(dy,dx),x1=cx+Math.cos(a)*s*.35,y1=cy+Math.sin(a)*s*.35,x2=cx+Math.cos(a)*s*.5,y2=cy+Math.sin(a)*s*.5;
    g.appendChild(e('line',{x1,y1,x2,y2,stroke:'#6D28D9','stroke-width':'1.5','stroke-linecap':'round'}));
    g.appendChild(e('line',{x1:x2,y1:y2,x2:x2+Math.cos(a+.8)*s*.09,y2:y2+Math.sin(a+.8)*s*.09,stroke:'#5B21B6','stroke-width':'1.2','stroke-linecap':'round'}));
    g.appendChild(e('line',{x1:x2,y1:y2,x2:x2+Math.cos(a-.8)*s*.09,y2:y2+Math.sin(a-.8)*s*.09,stroke:'#5B21B6','stroke-width':'1.2','stroke-linecap':'round'}));
  });
  const l=e('text',{x:cx,y:cy,fill:'#EDE9FE','text-anchor':'middle','dominant-baseline':'central','font-size':s*.22,'font-weight':'700','font-family':'sans-serif'});l.textContent='8';g.appendChild(l);
}
function drawBcell(g,cx,cy,s){
  g.appendChild(e('circle',{cx,cy,r:s*.35,fill:'#BAE6FD',stroke:'#0369A1','stroke-width':'1.8'}));
  g.appendChild(e('ellipse',{cx:cx+s*.04,cy:cy-s*.03,rx:s*.17,ry:s*.14,fill:'#0C4A6E',opacity:'.55'}));
  for(let i=0;i<6;i++){
    const a=(i/6)*Math.PI*2,x1=cx+Math.cos(a)*s*.35,y1=cy+Math.sin(a)*s*.35,x2=cx+Math.cos(a)*s*.5,y2=cy+Math.sin(a)*s*.5;
    g.appendChild(e('line',{x1,y1,x2,y2,stroke:'#0284C7','stroke-width':'1.3','stroke-linecap':'round'}));
    g.appendChild(e('line',{x1:x2,y1:y2,x2:x2+Math.cos(a+.75)*s*.08,y2:y2+Math.sin(a+.75)*s*.08,stroke:'#075985','stroke-width':'1','stroke-linecap':'round'}));
    g.appendChild(e('line',{x1:x2,y1:y2,x2:x2+Math.cos(a-.75)*s*.08,y2:y2+Math.sin(a-.75)*s*.08,stroke:'#075985','stroke-width':'1','stroke-linecap':'round'}));
  }
}
function drawPlasma(g,cx,cy,s){
  g.appendChild(e('ellipse',{cx,cy:cy+s*.04,rx:s*.28,ry:s*.36,fill:'#DDD6FE',stroke:'#6D28D9','stroke-width':'1.8'}));
  const nc=cx-s*.07,ny=cy-s*.1;
  g.appendChild(e('circle',{cx:nc,cy:ny,r:s*.14,fill:'#EDE9FE',stroke:'#4C1D95','stroke-width':'1'}));
  for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;g.appendChild(e('circle',{cx:nc+Math.cos(a)*s*.1,cy:ny+Math.sin(a)*s*.1,r:s*.028,fill:'#4C1D95',opacity:'.8'}));}
  for(let i=0;i<3;i++){g.appendChild(e('path',{d:`M${cx-s*.2},${cy+s*(.05+i*.1)} Q${cx},${cy+s*(.02+i*.1)} ${cx+s*.18},${cy+s*(.05+i*.1)}`,fill:'none',stroke:'#8B5CF6','stroke-width':'1',opacity:'.5'}));}
}
function drawMemory(g,cx,cy,s){
  const ring=e('circle',{cx,cy,r:s*.44,fill:'none',stroke:'#10B981','stroke-width':'1','stroke-dasharray':`${s*.1} ${s*.07}`,opacity:'.55'});
  ring.style.animation='spinSlow 12s linear infinite'; ring.style.transformOrigin=`${cx}px ${cy}px`;
  g.appendChild(ring);
  g.appendChild(e('circle',{cx,cy,r:s*.33,fill:'#A7F3D0',stroke:'#059669','stroke-width':'1.8'}));
  g.appendChild(e('circle',{cx,cy,r:s*.15,fill:'#064E3B',opacity:'.6'}));
  const l=e('text',{x:cx,y:cy,fill:'#ECFDF5','text-anchor':'middle','dominant-baseline':'central','font-size':s*.2,'font-weight':'700','font-family':'sans-serif'});l.textContent='M';g.appendChild(l);
}
function drawAntibody(g,cx,cy,s){
  // IgG Y-shape — stroked paths only, no rotated groups.
  // Hinge sits at (cx, cy+s*0.05); whole glyph fits within ~s*0.65 radius.
  //
  // Colour regions:
  //   Fc / Fab constant  → pink  (#F472B6)
  //   CDR antigen tips   → deep purple (#5B21B6)
  //   Hinge circle       → hot pink (#DB2777)
  const sw = s * 0.17;           // uniform stroke width
  const hx = cx, hy = cy + s*.05; // hinge

  // Fc stem — straight down
  g.appendChild(e('line',{x1:hx,y1:hy,x2:hx,y2:hy+s*.5,
    stroke:'#F472B6','stroke-width':sw,'stroke-linecap':'round'}));
  // CH2/CH3 notch
  g.appendChild(e('line',{x1:hx-s*.09,y1:hy+s*.27,x2:hx+s*.09,y2:hy+s*.27,
    stroke:'#DB2777','stroke-width':s*.045,'stroke-linecap':'round',opacity:'.7'}));

  // Left Fab — two segments: hinge→elbow, elbow→VL tip
  const lEx=hx-s*.26, lEy=hy-s*.18;
  const lTx=hx-s*.42, lTy=hy-s*.46;
  g.appendChild(e('line',{x1:hx,y1:hy,x2:lEx,y2:lEy,
    stroke:'#F472B6','stroke-width':sw,'stroke-linecap':'round'}));
  g.appendChild(e('line',{x1:lEx,y1:lEy,x2:lTx,y2:lTy,
    stroke:'#F472B6','stroke-width':sw,'stroke-linecap':'round'}));
  // CDR tip — short purple cap + filled circle
  const lCx=lTx-s*.07, lCy=lTy-s*.12;
  g.appendChild(e('line',{x1:lTx,y1:lTy,x2:lCx,y2:lCy,
    stroke:'#7C3AED','stroke-width':sw,'stroke-linecap':'round'}));
  g.appendChild(e('circle',{cx:lCx,cy:lCy,r:s*.075,fill:'#5B21B6',stroke:'#4C1D95','stroke-width':'1'}));

  // Right Fab
  const rEx=hx+s*.26, rEy=hy-s*.18;
  const rTx=hx+s*.42, rTy=hy-s*.46;
  g.appendChild(e('line',{x1:hx,y1:hy,x2:rEx,y2:rEy,
    stroke:'#F472B6','stroke-width':sw,'stroke-linecap':'round'}));
  g.appendChild(e('line',{x1:rEx,y1:rEy,x2:rTx,y2:rTy,
    stroke:'#F472B6','stroke-width':sw,'stroke-linecap':'round'}));
  const rCx=rTx+s*.07, rCy=rTy-s*.12;
  g.appendChild(e('line',{x1:rTx,y1:rTy,x2:rCx,y2:rCy,
    stroke:'#7C3AED','stroke-width':sw,'stroke-linecap':'round'}));
  g.appendChild(e('circle',{cx:rCx,cy:rCy,r:s*.075,fill:'#5B21B6',stroke:'#4C1D95','stroke-width':'1'}));

  // Hinge circle
  g.appendChild(e('circle',{cx:hx,cy:hy,r:s*.09,fill:'#DB2777',stroke:'#9D174D','stroke-width':'1'}));
}

function drawTLR(g,cx,cy,s){
  // Toll-like receptor 7 — horseshoe shape opening downward (toward cytoplasm).
  // LRR (leucine-rich repeat) segments drawn as alternating orange bands around the arc.
  // Transmembrane stem + TIR domain below.
  //
  // Arc convention: angles measured from positive-x axis, standard SVG coords (y down).
  // Horseshoe spans from ~210° to ~330° (opens at bottom, ~120° gap).
  const R = s * .32, thick = s * .13;
  const gapDeg = 60; // half-gap in degrees either side of straight down
  const startDeg = 90 + gapDeg;  // 150° — left opening edge
  const endDeg   = 90 - gapDeg;  // 30°  — right opening edge
  // Convert to radians, sweep CCW (larger arc)
  const startR = startDeg * Math.PI / 180;
  const endR   = endDeg   * Math.PI / 180;
  const steps  = 14;
  const sweep  = (2 * Math.PI - (startR - endR)); // major arc
  for(let i = 0; i < steps; i++){
    const a0 = startR + i     * (2*Math.PI - (startR - endR)) / steps;
    const a1 = startR + (i+1) * (2*Math.PI - (startR - endR)) / steps;
    const ox0=cx+Math.cos(a0)*(R+thick), oy0=cy+Math.sin(a0)*(R+thick);
    const ox1=cx+Math.cos(a1)*(R+thick), oy1=cy+Math.sin(a1)*(R+thick);
    const ix0=cx+Math.cos(a0)*R,         iy0=cy+Math.sin(a0)*R;
    const ix1=cx+Math.cos(a1)*R,         iy1=cy+Math.sin(a1)*R;
    const fill = i%2===0 ? '#FB923C' : '#FDBA74';
    // Each segment: trapezoid via path
    g.appendChild(e('path',{
      d:`M${ix0},${iy0} L${ox0},${oy0} A${R+thick},${R+thick} 0 0,1 ${ox1},${oy1} L${ix1},${iy1} A${R},${R} 0 0,0 ${ix0},${iy0}`,
      fill,stroke:'#EA580C','stroke-width':'0.6'
    }));
  }
  // Transmembrane stems — two short rects descending from the opening gap
  const stemW = s*.07, stemH = s*.2;
  const lx = cx + Math.cos(startR) * (R + thick/2);
  const ly = cy + Math.sin(startR) * (R + thick/2);
  const rx = cx + Math.cos(endR)   * (R + thick/2);
  const ry = cy + Math.sin(endR)   * (R + thick/2);
  g.appendChild(e('rect',{x:lx-stemW/2,y:ly,          width:stemW,height:stemH,rx:stemW/2,fill:'#9A3412',opacity:'.85'}));
  g.appendChild(e('rect',{x:rx-stemW/2,y:ry,          width:stemW,height:stemH,rx:stemW/2,fill:'#9A3412',opacity:'.85'}));
  // TIR domain — oval between the two stems below
  const tirY = Math.max(ly, ry) + stemH * .55;
  g.appendChild(e('ellipse',{cx,cy:tirY,rx:s*.17,ry:s*.09,fill:'#C2410C',stroke:'#9A3412','stroke-width':'1'}));
  const tl=e('text',{x:cx,y:tirY,fill:'#FFF7ED','text-anchor':'middle','dominant-baseline':'central','font-size':s*.11,'font-weight':'700','font-family':'sans-serif'});
  tl.textContent='TIR'; g.appendChild(tl);
}

function drawCytokine(g,cx,cy,s){
  // Cluster of small triangles + dots radiating outward — inflammatory signals
  // pulsing animation handled via style on the group
  g.style.animation='pulse 2s ease-in-out infinite';
  g.style.transformOrigin=`${cx}px ${cy}px`;
  const positions=[
    [0,-1],[.71,-.71],[1,0],[.71,.71],[0,1],[-.71,.71],[-1,0],[-.71,-.71]
  ];
  positions.forEach(([ax,ay],i)=>{
    const r=s*(.22+.08*(i%2));
    const tx=cx+ax*r, ty=cy+ay*r;
    if(i%2===0){
      // triangle pointing outward
      const ang=Math.atan2(ay,ax);
      const ts=s*.1;
      const x1=tx+Math.cos(ang)*ts,       y1=ty+Math.sin(ang)*ts;
      const x2=tx+Math.cos(ang+2.2)*ts*.7, y2=ty+Math.sin(ang+2.2)*ts*.7;
      const x3=tx+Math.cos(ang-2.2)*ts*.7, y3=ty+Math.sin(ang-2.2)*ts*.7;
      g.appendChild(e('polygon',{points:`${x1},${y1} ${x2},${y2} ${x3},${y3}`,fill:'#F472B6',stroke:'#DB2777','stroke-width':'0.8'}));
    } else {
      // small dot
      g.appendChild(e('circle',{cx:tx,cy:ty,r:s*.07,fill:'#FB7185',stroke:'#E11D48','stroke-width':'0.8'}));
    }
  });
  // tiny central nucleus dot
  g.appendChild(e('circle',{cx,cy,r:s*.08,fill:'#BE185D'}));
}

function drawNFkB(g,cx,cy,s){
  // NF-κB: p65/p50 dimer unlocking from IκB — depicted as two interlocked
  // Rel-homology domain lobes (ovals) with a DNA-binding "foot" below and
  // a small IκB chain shown detaching (dashed arc, fading)
  // Two subunit ovals (p65 left, p50 right)
  const lx=cx-s*.13, rx=cx+s*.13, oy=cy-s*.08;
  const lobe=s*.2, lobeH=s*.27;
  g.appendChild(e('ellipse',{cx:lx,cy:oy,rx:lobe,ry:lobeH,fill:'#F97316',stroke:'#C2410C','stroke-width':'1.5'}));
  g.appendChild(e('ellipse',{cx:rx,cy:oy,rx:lobe,ry:lobeH,fill:'#FB923C',stroke:'#C2410C','stroke-width':'1.5'}));
  // "p65" and "p50" micro labels
  const lt=e('text',{x:lx,y:oy,fill:'#7C2D12','text-anchor':'middle','dominant-baseline':'central','font-size':s*.14,'font-weight':'700','font-family':'sans-serif'});lt.textContent='p65';g.appendChild(lt);
  const rt=e('text',{x:rx,y:oy,fill:'#7C2D12','text-anchor':'middle','dominant-baseline':'central','font-size':s*.14,'font-weight':'700','font-family':'sans-serif'});rt.textContent='p50';g.appendChild(rt);
  // DNA-binding foot — two curved prongs down to a thick horizontal "DNA" bar
  const bY=cy+s*.22;
  g.appendChild(e('line',{x1:lx,y1:oy+lobeH,x2:lx,y2:bY,stroke:'#9A3412','stroke-width':'1.3','stroke-linecap':'round'}));
  g.appendChild(e('line',{x1:rx,y1:oy+lobeH,x2:rx,y2:bY,stroke:'#9A3412','stroke-width':'1.3','stroke-linecap':'round'}));
  g.appendChild(e('rect',{x:cx-s*.28,y:bY,width:s*.56,height:s*.08,rx:s*.04,fill:'#1D4ED8',stroke:'#1E40AF','stroke-width':'1'}));
  // IκB chain detaching — dashed arc to upper-right, fading
  const ikb=e('path',{d:`M${rx+lobe},${oy-lobeH*.5} Q${cx+s*.45},${cy-s*.45} ${cx+s*.42},${cy-s*.52}`,fill:'none',stroke:'#94A3B8','stroke-width':'1.1','stroke-dasharray':'3 2',opacity:'.65','stroke-linecap':'round'});
  g.appendChild(ikb);
  const ik=e('text',{x:cx+s*.44,y:cy-s*.58,fill:'#94A3B8','text-anchor':'middle','font-size':s*.12,'font-family':'sans-serif'});ik.textContent='IκB';g.appendChild(ik);
}

function drawInfluenza(g,cx,cy,s){
  // Influenza virion: segmented RNA genome inside, HA + NA surface spikes
  // Inner body — spherical with genome segments hinted
  g.appendChild(e('ellipse',{cx,cy,rx:s*.36,ry:s*.32,fill:'#FECACA',stroke:'#DC2626','stroke-width':'1.8'}));
  g.appendChild(e('ellipse',{cx,cy,rx:s*.2,ry:s*.17,fill:'#FEE2E2',stroke:'#DC2626','stroke-width':'.8',opacity:'.7'}));
  // 8 RNA segments — short curved arcs inside
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    const x1=cx+Math.cos(a)*s*.05,y1=cy+Math.sin(a)*s*.05;
    const x2=cx+Math.cos(a)*s*.16,y2=cy+Math.sin(a)*s*.16;
    g.appendChild(e('line',{x1,y1,x2,y2,stroke:'#991B1B','stroke-width':'1','stroke-linecap':'round',opacity:'.7'}));
  }
  // HA spikes (blunt-headed, longer) at cardinal positions
  [[0],[Math.PI/2],[Math.PI],[Math.PI*1.5]].forEach(([a])=>{
    const x1=cx+Math.cos(a)*s*.34,y1=cy+Math.sin(a)*s*.3;
    const x2=cx+Math.cos(a)*s*.52,y2=cy+Math.sin(a)*s*.46;
    g.appendChild(e('line',{x1,y1,x2,y2,stroke:'#DC2626','stroke-width':'1.4','stroke-linecap':'round'}));
    g.appendChild(e('circle',{cx:x2,cy:y2,r:s*.06,fill:'#B91C1C'}));
  });
  // NA spikes (mushroom-shaped, shorter) at diagonal positions
  [Math.PI/4,Math.PI*3/4,Math.PI*5/4,Math.PI*7/4].forEach(a=>{
    const x1=cx+Math.cos(a)*s*.32,y1=cy+Math.sin(a)*s*.28;
    const x2=cx+Math.cos(a)*s*.47,y2=cy+Math.sin(a)*s*.42;
    g.appendChild(e('line',{x1,y1,x2,y2,stroke:'#EF4444','stroke-width':'1.1','stroke-linecap':'round'}));
    g.appendChild(e('ellipse',{cx:x2,cy:y2,rx:s*.06,ry:s*.035,fill:'#991B1B',transform:`rotate(${Math.atan2(Math.sin(a),Math.cos(a))*180/Math.PI+90} ${x2} ${y2})`}));
  });
}

function drawClearance(g,cx,cy,s){
  // Viral clearance: a fading/dissolving virion overlaid with a green checkmark shield
  // Faint ghost virion (cleared)
  g.appendChild(e('ellipse',{cx,cy:cy+s*.04,rx:s*.28,ry:s*.22,fill:'rgba(254,202,202,.25)',stroke:'rgba(220,38,38,.3)','stroke-width':'1','stroke-dasharray':'3 2'}));
  for(let i=0;i<5;i++){
    const a=(i/5)*Math.PI*2;
    g.appendChild(e('line',{x1:cx+Math.cos(a)*s*.27,y1:cy+s*.04+Math.sin(a)*s*.21,
      x2:cx+Math.cos(a)*s*.38,y2:cy+s*.04+Math.sin(a)*s*.3,
      stroke:'rgba(220,38,38,.2)','stroke-width':'1','stroke-linecap':'round'}));
  }
  // Green shield background
  const shieldPath=`M${cx},${cy-s*.38} C${cx+s*.3},${cy-s*.38} ${cx+s*.38},${cy-s*.1} ${cx+s*.38},${cy+s*.12} C${cx+s*.38},${cy+s*.34} ${cx},${cy+s*.46} ${cx},${cy+s*.46} C${cx},${cy+s*.46} ${cx-s*.38},${cy+s*.34} ${cx-s*.38},${cy+s*.12} C${cx-s*.38},${cy-s*.1} ${cx-s*.3},${cy-s*.38} ${cx},${cy-s*.38}`;
  g.appendChild(e('path',{d:shieldPath,fill:'rgba(5,150,105,.22)',stroke:'#059669','stroke-width':'1.5'}));
  // Checkmark inside shield
  const ck=e('path',{d:`M${cx-s*.14},${cy+s*.04} L${cx-s*.02},${cy+s*.18} L${cx+s*.18},${cy-s*.14}`,
    fill:'none',stroke:'#10B981','stroke-width':s*.1,'stroke-linecap':'round','stroke-linejoin':'round'});
  g.appendChild(ck);
}

// ─────────────────────────────────────────────
// LEVEL 2 — BACTERIAL ASSETS
// ─────────────────────────────────────────────

function drawBacteria(g,cx,cy,s){
  // Gram-positive coccus (Staphylococcus-style):
  // thick peptidoglycan wall rendered as a double-ring, clusters of 4 (tetrad).
  // Single cell for tray; scene builders use this fn multiple times for clusters.
  const r = s * .32;
  // Thick PG wall — outer ring
  g.appendChild(e('circle',{cx,cy,r:r+s*.06,fill:'#A3E635',stroke:'#65A30D','stroke-width':'1.2',opacity:'.4'}));
  // Inner membrane + cytoplasm
  g.appendChild(e('circle',{cx,cy,r,fill:'#BEF264',stroke:'#65A30D','stroke-width':'1.8'}));
  // Nucleoid (irregular blob)
  g.appendChild(e('ellipse',{cx:cx+s*.04,cy:cy-s*.03,rx:s*.14,ry:s*.11,fill:'#4D7C0F',opacity:'.6'}));
  // Division plane (binary fission hint)
  g.appendChild(e('line',{x1:cx-r,y1:cy,x2:cx+r,y2:cy,stroke:'#65A30D','stroke-width':'0.8',opacity:'.5'}));
  // Surface proteins (short ticks)
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    const x1=cx+Math.cos(a)*(r+s*.06), y1=cy+Math.sin(a)*(r+s*.06);
    const x2=cx+Math.cos(a)*(r+s*.14), y2=cy+Math.sin(a)*(r+s*.14);
    g.appendChild(e('line',{x1,y1,x2,y2,stroke:'#84CC16','stroke-width':'1','stroke-linecap':'round',opacity:'.7'}));
  }
}

function drawNeutrophil(g,cx,cy,s){
  // Neutrophil: multilobed nucleus (3 lobes connected by thin strands) + granules.
  // Body is pale lavender-grey; nucleus dark purple, multilobed.
  const r = s * .36;
  // Cell body
  g.appendChild(e('circle',{cx,cy,r,fill:'#E0E7FF',stroke:'#6366F1','stroke-width':'1.6'}));
  // Three nuclear lobes connected by thin filaments
  const lobes=[[-s*.1,-s*.1],[s*.1,-s*.08],[0,s*.12]];
  const lr=s*.1;
  // filaments first (behind lobes)
  for(let i=0;i<lobes.length;i++){
    const [ax,ay]=lobes[i],[bx,by]=lobes[(i+1)%lobes.length];
    g.appendChild(e('line',{x1:cx+ax,y1:cy+ay,x2:cx+bx,y2:cy+by,stroke:'#4338CA','stroke-width':'1',opacity:'.5'}));
  }
  lobes.forEach(([dx,dy])=>{
    g.appendChild(e('circle',{cx:cx+dx,cy:cy+dy,r:lr,fill:'#4338CA',opacity:'.75'}));
  });
  // Cytoplasmic granules (small pink dots)
  [[-s*.18,s*.08],[s*.16,s*.1],[s*.02,-s*.2],[-s*.16,-s*.04],[s*.18,-s*.04]].forEach(([dx,dy])=>{
    g.appendChild(e('circle',{cx:cx+dx,cy:cy+dy,r:s*.045,fill:'#F9A8D4',stroke:'#EC4899','stroke-width':'0.6',opacity:'.8'}));
  });
  // "N" label
  const l=e('text',{x:cx,y:cy+s*.22,fill:'#3730A3','text-anchor':'middle','dominant-baseline':'central','font-size':s*.16,'font-weight':'700','font-family':'sans-serif'});
  l.textContent='N'; g.appendChild(l);
}

function drawComplement(g,cx,cy,s){
  // C3b opsonin tag: shown as a small molecular complex — a bent "hook" shape
  // that anchors to the bacterial surface, with the recognition domain exposed.
  // Colour: teal/cyan (complement cascade colours in immunology diagrams).
  const arm = s * .28;
  // Alpha-chain hook (curved arm)
  g.appendChild(e('path',{
    d:`M${cx-arm},${cy+s*.1} Q${cx-arm*.6},${cy-arm} ${cx+arm*.2},${cy-arm*.8}`,
    fill:'none',stroke:'#06B6D4','stroke-width':s*.13,'stroke-linecap':'round'
  }));
  // Beta-chain short stub
  g.appendChild(e('line',{x1:cx-arm,y1:cy+s*.1,x2:cx-arm*.2,y2:cy+s*.28,
    stroke:'#0891B2','stroke-width':s*.1,'stroke-linecap':'round'}));
  // Thioester bond attachment dot (anchors to bacteria)
  g.appendChild(e('circle',{cx:cx-arm*.2,cy:cy+s*.28,r:s*.07,fill:'#0E7490',stroke:'#164E63','stroke-width':'1'}));
  // Recognition domain — small filled oval at tip
  g.appendChild(e('ellipse',{cx:cx+arm*.2,cy:cy-arm*.8,rx:s*.1,ry:s*.07,
    fill:'#22D3EE',stroke:'#06B6D4','stroke-width':'1',transform:`rotate(-30 ${cx+arm*.2} ${cy-arm*.8})`}));
  // C3b label
  const l=e('text',{x:cx+s*.18,y:cy,fill:'#06B6D4','text-anchor':'middle','font-size':s*.17,'font-weight':'700','font-family':'sans-serif'});
  l.textContent='C3b'; g.appendChild(l);
}

const CELL_DEFS={
  // Level 1 — Influenza
  macrophage:{label:'Macrophage',    draw:drawMacrophage},
  nkcell:    {label:'NK cell',       draw:drawNK},
  dendritic: {label:'Dendritic cell',draw:drawDendritic},
  cd4:       {label:'CD4+ T cell',   draw:drawCD4},
  cd8:       {label:'CD8+ T cell',   draw:drawCD8},
  bcell:     {label:'B cell',        draw:drawBcell},
  plasma:    {label:'Plasma cell',   draw:drawPlasma},
  memory:    {label:'Memory cell',   draw:drawMemory},
  antibody:  {label:'IgG antibody',  draw:drawAntibody},
  tlr7:      {label:'TLR7',          draw:drawTLR},
  cytokine:  {label:'Cytokine',      draw:drawCytokine},
  // Level 2 — Bacterial
  bacteria:    {label:'Bacteria',      draw:drawBacteria},
  neutrophil:  {label:'Neutrophil',    draw:drawNeutrophil},
  complement:  {label:'C3b opsonin',   draw:drawComplement},
};
