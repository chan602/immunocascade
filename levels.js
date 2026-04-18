/**
 * levels.js — Scene builders and level data
 *
 * Each level is defined by a STAGES array entry containing:
 *   id, tlIndex, day, narr, prompt  — display metadata
 *   buildScene(root)                — draws the SVG background into <g id="scene-root">
 *   trayIds[]                       — cell IDs available in the drag tray
 *   dropZones[]                     — { id, cx, cy, r, accepts[], correctMsg }
 *   wrongMsgs{}                     — per-cell feedback for incorrect drops
 *   resultEmoji, resultTitle, resultMsg — stage completion card copy
 *
 * Scene coordinate system: viewBox 0 0 680 300 (story mode).
 * All draw helpers (e, txt, virusGrp, dashArrow, drawX…) are defined in cells.js,
 * which must be loaded before this file.
 *
 * Adding a new level: append a new STAGES array and export it, then register
 * it in game.js. Split into levels/flu.js, levels/bacterial.js etc. if this
 * file exceeds ~600 lines.
 */

/* SCENE BUILDERS */
function baseEpithelium(root){
  root.appendChild(e('rect',{x:0,y:0,width:680,height:300,fill:'#3d1800'}));
  root.appendChild(e('rect',{x:0,y:0,width:680,height:48,fill:'#2a0f00',opacity:'.65'}));
  txt(root,'AIRWAY LUMEN',14,15,'7.5','#5c2400');
  root.appendChild(e('rect',{x:0,y:228,width:680,height:72,fill:'#5c2a00'}));
  root.appendChild(e('rect',{x:0,y:226,width:680,height:4,fill:'#7a3500'}));
  txt(root,'RESPIRATORY EPITHELIUM',14,221,'7.5','#7a3500');
  [85,175,265,355,445,535,625].forEach(x=>root.appendChild(e('line',{x1:x,y1:230,x2:x,y2:300,stroke:'#6b2c00','stroke-width':'1',opacity:'.7'})));
  [42,130,220,310,400,490,580].forEach(cx=>root.appendChild(e('ellipse',{cx,cy:262,rx:24,ry:14,fill:'#7a3500',opacity:'.65'})));
  root.appendChild(e('rect',{x:598,y:0,width:82,height:120,fill:'#4a1515',opacity:'.9'}));
  root.appendChild(e('line',{x1:598,y1:0,x2:598,y2:120,stroke:'#6b2020','stroke-width':'2.5'}));
  txt(root,'BLOOD',639,14,'7.5','#6b2020','middle');
}
function txt(p,str,x,y,fs,fill,anchor='start'){
  const t=e('text',{x,y,'font-size':fs,fill,'font-family':"'DM Mono',monospace",'font-weight':'500','letter-spacing':'.07em'});
  if(anchor!=='start')t.setAttribute('text-anchor',anchor);
  t.textContent=str; p.appendChild(t); return t;
}
function virusGrp(cx,cy,rx,ry,dur,rev){
  const g=e('g'); g.style.animation=`spinSlow ${dur}s linear infinite${rev?' reverse':''}`; g.style.transformOrigin=`${cx}px ${cy}px`;
  g.appendChild(e('ellipse',{cx,cy,rx,ry,fill:'#FECACA',stroke:'#DC2626','stroke-width':'1.8'}));
  g.appendChild(e('ellipse',{cx,cy,rx:rx*.38,ry:ry*.38,fill:'#FEE2E2',stroke:'#DC2626','stroke-width':'.8',opacity:'.7'}));
  [[0,-1],[.71,-.71],[1,0],[.71,.71],[0,1],[-.71,.71],[-1,0],[-.71,-.71]].forEach(([ax,ay],i)=>{
    const x1=cx+ax*rx,y1=cy+ay*ry,x2=cx+ax*(rx+12),y2=cy+ay*(ry+10);
    g.appendChild(e('line',{x1,y1,x2,y2,stroke:'#DC2626','stroke-width':'1.4','stroke-linecap':'round'}));
    if(i%2===0){g.appendChild(e('polygon',{points:`${x2-3*ay},${y2+3*ax} ${x2+4*ax},${y2+4*ay} ${x2+3*ay},${y2-3*ax}`,fill:'#B91C1C'}));}
    else{g.appendChild(e('ellipse',{cx:x2,cy:y2,rx:4,ry:2.5,fill:'#991B1B',transform:`rotate(${Math.atan2(ay,ax)*180/Math.PI} ${x2} ${y2})`}));}
  });
  return g;
}
function dashArrow(root,d,stroke,marker){
  const p=e('path',{d,fill:'none',stroke,'stroke-width':'1.1','stroke-dasharray':'5 3','marker-end':`url(#${marker})`,opacity:'.55'});
  p.style.animation='dashFlow 2s linear infinite'; root.appendChild(p); return p;
}

function buildStage0(root){
  baseEpithelium(root);

  // ── Virions in lumen ──
  root.appendChild(virusGrp(130,82,22,16,12,false));
  root.appendChild(virusGrp(275,50,15,11,18,true));
  root.appendChild(virusGrp(480,68,18,13,15,false));

  // ── Virus entering epithelium (HA binding) ──
  const vi=e('g'); vi.style.animation='floatY 2.5s ease-in-out infinite'; vi.style.transformOrigin='390px 175px';
  vi.appendChild(e('ellipse',{cx:390,cy:175,rx:13,ry:9,fill:'#FECACA',stroke:'#DC2626','stroke-width':'1.3',opacity:'.95'}));
  // HA binding line to membrane
  vi.appendChild(e('line',{x1:390,y1:184,x2:390,y2:226,stroke:'#DC2626','stroke-width':'1','stroke-dasharray':'3 2',opacity:'.6'}));
  txt(vi,'HA binds',390,170,'7','#FCA5A5','middle');
  txt(vi,'sialic acid',390,180,'6.5','#FCA5A5','middle');
  root.appendChild(vi);

  // ── TLR7 receptor ON the membrane ──
  // Draw it sitting in the epithelial layer at ~cx=248
  const tlrG=e('g');
  drawTLR(tlrG,248,215,22); // sits right in the membrane band
  txt(root,'TLR7',248,199,'7','#FB923C','middle');
  root.appendChild(tlrG);

  // ── NF-κB activation arrow from TLR7 ──
  const nfArrow=e('path',{d:'M248 238 Q248 265 248 275',fill:'none',stroke:'#EA580C','stroke-width':'1.2','stroke-dasharray':'4 3','marker-end':'url(#arr)',opacity:'.75'});
  nfArrow.style.animation='dashFlow 1.8s linear infinite'; root.appendChild(nfArrow);
  txt(root,'NF-κB',248,285,'7','rgba(234,88,12,.65)','middle');

  // ── IFN-α/β burst (from infected cell) ──
  // Small cytokine cluster to the right of TLR7
  const ifnG=e('g'); ifnG.style.animation='pulse 2s ease-in-out infinite'; ifnG.style.transformOrigin='355px 210px';
  drawCytokine(ifnG,355,210,14); root.appendChild(ifnG);
  txt(root,'IFN-α/β',355,232,'7','rgba(244,114,182,.7)','middle');

  // Dashed signal arrow: TLR7 → IFN
  const ifnArr=e('path',{d:'M262 215 Q308 213 340 210',fill:'none',stroke:'rgba(251,146,60,.5)','stroke-width':'1','stroke-dasharray':'3 2','marker-end':'url(#arr)',opacity:'.6'});
  ifnArr.style.animation='dashFlow 2s linear infinite'; root.appendChild(ifnArr);

  // ── MHC-I upregulation label on blood vessel side ──
  txt(root,'MHC-I ↑',630,70,'7','rgba(107,32,32,.9)','middle');
  txt(root,'on epithelium',630,80,'6.5','rgba(107,32,32,.7)','middle');

  // ── Drop zone hints (subtle, behind game zone circles) ──
  // These are decorative anchors — actual interactive zones are added by buildScene()
  // Small label above where macrophage zone will be
  txt(root,'innate patrol zone',360,132,'7','rgba(217,119,6,.28)','middle');
}

function buildStage1(root){
  // Background: left = infected tissue (warm brown), right = lymph node (cool purple)
  root.appendChild(e('rect',{x:0,y:0,width:680,height:300,fill:'#0e0820'}));
  root.appendChild(e('rect',{x:0,y:0,width:185,height:300,fill:'#2d1200',opacity:'.95'}));
  txt(root,'INFECTED TISSUE',14,16,'7','#5c2400');

  // Afferent lymphatic vessel — tapered tube from tissue to lymph node
  // Drawn as a filled rounded trapezoid path
  root.appendChild(e('path',{d:'M182 110 Q250 108 310 118 L310 182 Q250 192 182 190 Z',
    fill:'rgba(13,148,136,.12)',stroke:'#0D9488','stroke-width':'1.8','stroke-dasharray':'6 4'}));
  txt(root,'AFFERENT LYMPHATIC',246,100,'7','#0D9488','middle');
  // Flow dots animating along the vessel path
  for(let i=0;i<5;i++){
    const d=e('circle',{r:'3',fill:'#0D9488',opacity:'.7'});
    const anim=e('animateMotion',{dur:`${2.5+i*.4}s`,repeatCount:'indefinite',
      begin:`${i*.5}s`,path:'M185 150 Q250 148 308 150'});
    d.appendChild(anim); root.appendChild(d);
  }

  // Lymph node — large ellipse right side
  root.appendChild(e('ellipse',{cx:500,cy:152,rx:155,ry:132,fill:'rgba(124,58,237,.07)',stroke:'#7C3AED','stroke-width':'1.8','stroke-dasharray':'7 5'}));
  txt(root,'LYMPH NODE',500,28,'8.5','rgba(124,58,237,.7)','middle');

  // Paracortex / T cell zone sub-region (upper right inside node)
  root.appendChild(e('ellipse',{cx:490,cy:130,rx:105,ry:72,fill:'rgba(124,58,237,.09)',stroke:'rgba(124,58,237,.4)','stroke-width':'1','stroke-dasharray':'4 3'}));
  txt(root,'T CELL ZONE / PARACORTEX',490,62,'7','rgba(165,180,252,.55)','middle');

  // Naive T cells waiting in paracortex — use real drawCD4 / drawCD8 at small scale
  [[448,100],[492,98],[536,102],[462,138],[504,136],[546,140],[478,118],[520,116]].forEach(([cx,cy],i)=>{
    const g=e('g'); g.setAttribute('opacity','.55');
    if(i%2===0) drawCD4(g,cx,cy,14); else drawCD8(g,cx,cy,14);
    root.appendChild(g);
  });
  txt(root,'naïve T cells (quiescent)',490,176,'7.5','rgba(165,180,252,.5)','middle');

  // HEV — high endothelial venule entry (small oval, bottom of node)
  root.appendChild(e('ellipse',{cx:500,cy:248,rx:38,ry:14,fill:'rgba(220,38,38,.08)',stroke:'#DC2626','stroke-width':'1','stroke-dasharray':'3 2',opacity:'.6'}));
  txt(root,'HEV entry',500,248,'7','rgba(220,38,38,.5)','middle');

  // Mature DC (left, in tissue — about to enter vessel)
  const dcG=e('g'); dcG.style.animation='floatY 3.5s ease-in-out infinite'; dcG.style.transformOrigin='95px 148px';
  drawDendritic(dcG,95,148,26);
  txt(dcG,'mature DC',95,184,'7.5','#FDE68A','middle');
  txt(dcG,'CCR7↑',95,194,'7','#92400E','middle');
  root.appendChild(dcG);

  // Arrow from DC into vessel
  const mArrow=e('path',{d:'M124 148 Q155 148 178 148',fill:'none',stroke:'#D97706','stroke-width':'1.3','stroke-dasharray':'5 3','marker-end':'url(#arr)',opacity:'.7'});
  mArrow.style.animation='dashFlow 1.5s linear infinite'; root.appendChild(mArrow);

  // CCL19/CCL21 gradient label
  txt(root,'CCL19 / CCL21 gradient →',246,260,'7','rgba(13,148,136,.65)','middle');

  // Drop zone label hint (where the DC should be dragged)
  root.appendChild(e('ellipse',{cx:380,cy:150,rx:44,ry:44,fill:'rgba(217,119,6,.04)',stroke:'rgba(217,119,6,.25)','stroke-width':'1.2','stroke-dasharray':'4 3'}));
  txt(root,'drop zone',380,218,'7','rgba(217,119,6,.35)','middle');
}

function buildStage2(root){
  // Paracortex of lymph node — deep purple
  root.appendChild(e('rect',{x:0,y:0,width:680,height:300,fill:'#110b28'}));
  // Outer node boundary hint
  root.appendChild(e('ellipse',{cx:340,cy:152,rx:326,ry:140,fill:'none',stroke:'rgba(124,58,237,.2)','stroke-width':'1','stroke-dasharray':'8 6'}));
  txt(root,'LYMPH NODE — PARACORTEX / T CELL ZONE',340,18,'7.5','rgba(165,180,252,.5)','middle');

  // Background naive T cell crowd (faint, far back)
  [[80,80],[130,100],[80,170],[130,200],[560,75],[610,100],[590,165],[630,185],[620,130],[70,130]].forEach(([cx,cy])=>{
    const g=e('g'); g.setAttribute('opacity','.22');
    drawCD4(g,cx,cy,13); root.appendChild(g);
  });

  // DC at center — large, upregulated
  const dcG=e('g'); dcG.style.animation='floatY 4s ease-in-out infinite'; dcG.style.transformOrigin='340px 148px';
  drawDendritic(dcG,340,148,38);
  txt(dcG,'mature DC',340,200,'8','#FDE68A','middle');
  txt(dcG,'MHC-I·MHC-II · CD80/86↑',340,212,'7','#92400E','middle');
  root.appendChild(dcG);

  // MHC-II groove label (left arm)
  root.appendChild(e('path',{d:'M303 142 L252 138',fill:'none',stroke:'rgba(67,56,202,.55)','stroke-width':'1','stroke-dasharray':'3 2','marker-end':'url(#arr-p)',opacity:'.7'}));
  root.appendChild(e('rect',{x:170,y:118,width:80,height:36,rx:6,fill:'rgba(67,56,202,.1)',stroke:'rgba(67,56,202,.4)','stroke-width':'1'}));
  txt(root,'MHC-II',210,133,'7.5','rgba(165,180,252,.9)','middle');
  txt(root,'viral peptide',210,144,'7','rgba(165,180,252,.6)','middle');

  // MHC-I groove label (right arm)
  root.appendChild(e('path',{d:'M377 142 L428 138',fill:'none',stroke:'rgba(109,40,217,.55)','stroke-width':'1','stroke-dasharray':'3 2','marker-end':'url(#arr-p)',opacity:'.7'}));
  root.appendChild(e('rect',{x:430,y:118,width:80,height:36,rx:6,fill:'rgba(109,40,217,.1)',stroke:'rgba(109,40,217,.4)','stroke-width':'1'}));
  txt(root,'MHC-I',470,133,'7.5','rgba(196,181,253,.9)','middle');
  txt(root,'cross-presented',470,144,'7','rgba(196,181,253,.6)','middle');

  // CD4+ T cell left — engaging MHC-II
  const cd4g=e('g'); cd4g.style.animation='floatY 3s ease-in-out infinite 0.5s'; cd4g.style.transformOrigin='218px 200px';
  drawCD4(cd4g,218,200,26);
  txt(cd4g,'CD4+ T cell',218,234,'7.5','#A5B4FC','middle');
  root.appendChild(cd4g);
  // Immunological synapse line CD4 → DC
  const syn1=e('path',{d:'M234 185 Q278 170 308 162',fill:'none',stroke:'rgba(67,56,202,.6)','stroke-width':'1.3','stroke-dasharray':'4 3',opacity:'.8'});
  syn1.style.animation='dashFlow 1.5s linear infinite'; root.appendChild(syn1);
  txt(root,'TCR:MHC-II',265,165,'6.5','rgba(165,180,252,.6)','middle');

  // CD8+ T cell right — engaging MHC-I
  const cd8g=e('g'); cd8g.style.animation='floatY 3.5s ease-in-out infinite 1s'; cd8g.style.transformOrigin='462px 200px';
  drawCD8(cd8g,462,200,26);
  txt(cd8g,'CD8+ T cell',462,234,'7.5','#C4B5FD','middle');
  root.appendChild(cd8g);
  const syn2=e('path',{d:'M448 185 Q406 170 375 162',fill:'none',stroke:'rgba(109,40,217,.6)','stroke-width':'1.3','stroke-dasharray':'4 3',opacity:'.8'});
  syn2.style.animation='dashFlow 1.5s linear infinite'; root.appendChild(syn2);
  txt(root,'TCR:MHC-I',415,165,'6.5','rgba(196,181,253,.6)','middle');

  // IL-12 cytokine bubble from DC (downward)
  const ck=e('g'); ck.style.animation='pulse 2.2s ease-in-out infinite';ck.style.transformOrigin='340px 252px';
  drawCytokine(ck,340,252,16); root.appendChild(ck);
  txt(root,'IL-12 (Signal 3)',340,278,'7','rgba(244,114,182,.55)','middle');

  // Three signals footer
  root.appendChild(e('rect',{x:60,y:285,width:560,height:13,rx:4,fill:'rgba(217,119,6,.06)'}));
  txt(root,'Signal 1: TCR/MHC  ·  Signal 2: CD28/CD80  ·  Signal 3: IL-12 → full T cell activation',340,294,'7','rgba(217,119,6,.55)','middle');
}

function buildStage3(root){
  // Deep blue-black — B cell follicle
  root.appendChild(e('rect',{x:0,y:0,width:680,height:300,fill:'#060e1c'}));
  // Outer follicle boundary
  root.appendChild(e('ellipse',{cx:340,cy:152,rx:326,ry:140,fill:'none',stroke:'rgba(3,105,161,.25)','stroke-width':'1.5','stroke-dasharray':'8 6'}));
  txt(root,'LYMPH NODE — B CELL FOLLICLE / GERMINAL CENTER',340,18,'7.5','rgba(147,197,253,.45)','middle');

  // ── DARK ZONE (left) ──
  root.appendChild(e('ellipse',{cx:200,cy:155,rx:148,ry:118,fill:'rgba(3,105,161,.1)',stroke:'#0369A1','stroke-width':'1.5','stroke-dasharray':'5 3'}));
  txt(root,'DARK ZONE',200,42,'8','rgba(147,197,253,.7)','middle');
  txt(root,'SHM · AID · rapid division',200,55,'6.5','rgba(147,197,253,.4)','middle');

  // Centroblasts in dark zone
  [[148,100],[196,95],[244,98],[164,138],[210,132],[256,136],[150,172],[200,170],[250,172],[176,210],[224,207]].forEach(([cx,cy],i)=>{
    const g=e('g'); g.setAttribute('opacity',(0.4+0.2*(i%3)).toFixed(1));
    drawBcell(g,cx,cy,12); root.appendChild(g);
  });
  txt(root,'centroblasts',200,234,'7.5','rgba(147,197,253,.5)','middle');

  // AID mutation sparks
  [[170,118],[220,105],[175,155],[228,148]].forEach(([cx,cy])=>{
    for(let a=0;a<5;a++){
      const ang=(a/5)*Math.PI*2;
      root.appendChild(e('line',{x1:cx,y1:cy,x2:cx+Math.cos(ang)*5,y2:cy+Math.sin(ang)*5,stroke:'#38BDF8','stroke-width':'0.7',opacity:'.4','stroke-linecap':'round'}));
    }
  });

  // Arrow: dark zone → light zone
  const dz2lz=e('path',{d:'M350 152 Q380 152 400 152',fill:'none',stroke:'rgba(5,150,105,.6)','stroke-width':'1.2','stroke-dasharray':'5 3','marker-end':'url(#arr-g)',opacity:'.7'});
  dz2lz.style.animation='dashFlow 2s linear infinite'; root.appendChild(dz2lz);
  txt(root,'selection',375,143,'6.5','rgba(5,150,105,.5)','middle');

  // ── LIGHT ZONE (right) ──
  root.appendChild(e('ellipse',{cx:500,cy:155,rx:148,ry:118,fill:'rgba(5,150,105,.08)',stroke:'#059669','stroke-width':'1.5','stroke-dasharray':'5 3'}));
  txt(root,'LIGHT ZONE',500,42,'8','rgba(110,231,183,.7)','middle');
  txt(root,'affinity maturation · FDC display',500,55,'6.5','rgba(110,231,183,.4)','middle');

  // Centrocytes in light zone
  [[450,100],[496,96],[542,100],[464,138],[508,134],[552,138],[458,175],[504,172],[550,175]].forEach(([cx,cy],i)=>{
    const g=e('g'); g.setAttribute('opacity',(0.35+0.15*(i%3)).toFixed(1));
    drawBcell(g,cx,cy,12); root.appendChild(g);
  });

  // Follicular DC
  const fdc=e('g'); fdc.setAttribute('opacity','.8');
  drawDendritic(fdc,500,162,20);
  txt(root,'FDC',500,192,'7','rgba(110,231,183,.7)','middle');
  txt(root,'antigen display',500,202,'6.5','rgba(110,231,183,.45)','middle');
  root.appendChild(fdc);

  // ── Tfh cell at junction ──
  const tfh=e('g'); tfh.style.animation='floatY 4s ease-in-out infinite'; tfh.style.transformOrigin='340px 148px';
  drawCD4(tfh,340,148,26);
  txt(tfh,'Tfh',340,183,'7.5','#A5B4FC','middle');
  txt(tfh,'CD40L↑ · CXCR5↑',340,193,'6.5','rgba(165,180,252,.6)','middle');
  root.appendChild(tfh);

  // CD40L:CD40 → dark zone
  const cd40=e('path',{d:'M322 155 Q270 155 252 155',fill:'none',stroke:'rgba(67,56,202,.7)','stroke-width':'1.2','stroke-dasharray':'4 3','marker-end':'url(#arr-p)',opacity:'.7'});
  cd40.style.animation='dashFlow 1.6s linear infinite'; root.appendChild(cd40);
  txt(root,'CD40L:CD40',283,148,'6.5','rgba(165,180,252,.55)','middle');

  // IL-21 → light zone
  const il21=e('path',{d:'M358 150 Q390 144 430 140',fill:'none',stroke:'rgba(244,114,182,.6)','stroke-width':'1','stroke-dasharray':'4 3','marker-end':'url(#arr)',opacity:'.6'});
  il21.style.animation='dashFlow 1.8s linear infinite'; root.appendChild(il21);
  txt(root,'IL-21',400,135,'6.5','rgba(244,114,182,.55)','middle');

  // Footer
  txt(root,'→ CSR: IgM→IgG · plasma cells → bone marrow · memory B cells',340,268,'7','rgba(217,119,6,.5)','middle');
}

function buildStage4(root){
  baseEpithelium(root);

  // ── Header ──
  txt(root,'VIRAL CLEARANCE — Day 7–14',340,18,'8','rgba(5,150,105,.6)','middle');
  txt(root,'IFN-γ antiviral state · contraction phase',340,30,'7','rgba(217,119,6,.38)','middle');

  // ── Faint dying virions (mostly cleared) ──
  const vf=e('g'); vf.style.opacity='.2';
  vf.appendChild(e('ellipse',{cx:140,cy:78,rx:14,ry:10,fill:'#FECACA',stroke:'#DC2626','stroke-width':'1.2'}));
  vf.appendChild(e('ellipse',{cx:280,cy:52,rx:9,ry:6,fill:'#FECACA',stroke:'#DC2626','stroke-width':'1'}));
  root.appendChild(vf);

  // ── Infected epithelial cell (being killed) ──
  // Dying cell — irregular outline, orange/red, with viral debris inside
  root.appendChild(e('ellipse',{cx:175,cy:182,rx:28,ry:22,fill:'rgba(220,38,38,.18)',stroke:'#DC2626','stroke-width':'1.3','stroke-dasharray':'3 2'}));
  root.appendChild(e('ellipse',{cx:175,cy:182,rx:12,ry:9,fill:'rgba(220,38,38,.35)',opacity:'.6'})); // nucleus
  txt(root,'infected cell',175,211,'6.5','rgba(220,38,38,.55)','middle');
  txt(root,'MHC-I:peptide',175,220,'6','rgba(220,38,38,.4)','middle');

  // ── CD8 CTL attacking the infected cell ──
  const ctlG=e('g'); ctlG.style.animation='floatY 2.8s ease-in-out infinite'; ctlG.style.transformOrigin='230px 155px';
  drawCD8(ctlG,230,155,26);
  txt(ctlG,'CTL',230,188,'7.5','#C4B5FD','middle');
  root.appendChild(ctlG);
  // Kill arrow from CTL to infected cell
  const killArr=e('path',{d:'M216 170 Q200 175 192 180',fill:'none',stroke:'#DC2626','stroke-width':'1.5','stroke-dasharray':'4 2','marker-end':'url(#arr-r)',opacity:'.8'});
  killArr.style.animation='dashFlow 1.2s linear infinite'; root.appendChild(killArr);
  txt(root,'perforin',200,162,'6.5','rgba(220,38,38,.6)','middle');
  txt(root,'granzyme B',200,170,'6','rgba(220,38,38,.45)','middle');
  // Apoptosis burst on the cell
  for(let a=0;a<7;a++){
    const ang=(a/7)*Math.PI*2;
    root.appendChild(e('line',{x1:175+Math.cos(ang)*22,y1:182+Math.sin(ang)*17,x2:175+Math.cos(ang)*32,y2:182+Math.sin(ang)*25,stroke:'#EF4444','stroke-width':'1',opacity:'.4','stroke-linecap':'round'}));
  }

  // ── Plasma cell releasing IgG antibodies ──
  const pcG=e('g'); pcG.style.animation='floatY 3.5s ease-in-out infinite 0.8s'; pcG.style.transformOrigin='440px 180px';
  drawPlasma(pcG,440,180,26);
  txt(pcG,'plasma cell',440,214,'7.5','rgba(221,214,254,.7)','middle');
  root.appendChild(pcG);
  // Three antibodies launching outward
  [[370,90],[320,60],[280,75]].forEach(([tx,ty],i)=>{
    const abG=e('g'); abG.style.animation=`floatY ${2+i*.4}s ease-in-out infinite ${i*.3}s`;
    abG.style.transformOrigin=`${tx}px ${ty}px`;
    drawAntibody(abG,tx,ty,12); root.appendChild(abG);
  });
  // Arrow from plasma → antibodies
  const abArr=e('path',{d:'M422 170 Q390 140 365 100',fill:'none',stroke:'rgba(5,150,105,.5)','stroke-width':'1','stroke-dasharray':'4 3','marker-end':'url(#arr-g)',opacity:'.6'});
  abArr.style.animation='dashFlow 2s linear infinite'; root.appendChild(abArr);
  txt(root,'IgG neutralization',388,138,'7','rgba(5,150,105,.6)','middle');

  // ── Memory T cell in blood vessel (right panel) ──
  const memG=e('g'); memG.style.animation='floatY 4s ease-in-out infinite 1.2s'; memG.style.transformOrigin='634px 60px';
  drawMemory(memG,634,60,22);
  txt(root,'Tcm / Tem',634,90,'7','rgba(16,185,129,.65)','middle');
  txt(root,'CCR7± persist',634,100,'6.5','rgba(16,185,129,.45)','middle');
  root.appendChild(memG);
  txt(root,'→ years of protection',634,112,'6','rgba(217,119,6,.4)','middle');

  // ── Contraction label ──
  txt(root,'>90% effector cells → apoptosis',340,268,'7','rgba(217,119,6,.45)','middle');
  txt(root,'survivors differentiate into memory (Tcm·Tem·Trm)',340,279,'6.5','rgba(217,119,6,.35)','middle');
}

/* STAGES */
const STAGES=[
  {
    id:'s0',tlIndex:0,day:'Day 0',dayNum:'0',
    narr:'Influenza virions bind sialic acid receptors via hemagglutinin (HA) and enter airway epithelial cells. Endosomal ssRNA activates <strong style="color:#F59E0B">TLR7 → IRF3/NF-κB</strong>, triggering IFN-α/β release and upregulation of MHC-I on neighboring cells.',
    prompt:'→ Drag the correct innate cells into the infection zone.',
    buildScene:buildStage0,
    trayIds:['macrophage','nkcell','bcell','cd8'],
    dropZones:[
      {id:'dz-m',cx:360,cy:165,r:44,accepts:['macrophage'],correctMsg:'✓ Macrophage — TLR detection → NF-κB → TNF-α, IL-1β, IL-6, IL-12'},
      {id:'dz-n',cx:510,cy:148,r:36,accepts:['nkcell'],correctMsg:'✓ NK cell — "missing self" → perforin/granzyme + IFN-γ'},
    ],
    wrongMsgs:{bcell:'✗ Too early — B cells are adaptive (day 5–7)',cd8:'✗ CD8+ T cells need APC priming first'},
    resultEmoji:'🦠',resultTitle:'Innate response engaged',
    resultMsg:'Macrophages and NK cells are active at the infection site. IFN-γ from NK cells amplifies the antiviral state. Dendritic cells are sampling antigen and beginning to mature.',
  },
  {
    id:'s1',tlIndex:1,day:'Day 1–3',dayNum:'1–3',
    narr:'Tissue-resident dendritic cells have phagocytosed viral debris and are maturing. They upregulate <strong style="color:#F59E0B">CCR7</strong> (downregulating CCR1/5) and migrate via afferent lymphatics toward the lymph node T cell zone, guided by CCL19/CCL21.',
    prompt:'→ Drag the mature dendritic cell into the afferent lymphatic.',
    buildScene:buildStage1,
    trayIds:['dendritic','macrophage','bcell'],
    dropZones:[
      {id:'dz-dc',cx:380,cy:145,r:44,accepts:['dendritic'],correctMsg:'✓ DC upregulates CCR7 → migrates via CCL19/CCL21 gradient to T cell zone'},
    ],
    wrongMsgs:{macrophage:'✗ Macrophages are tissue-resident — DCs are the migratory APC',bcell:'✗ B cells home to follicles, not afferent lymphatics'},
    resultEmoji:'🔬',resultTitle:'DC migrating to lymph node',
    resultMsg:'The mature DC carries peptide-MHC complexes via afferent lymphatics to the T cell zone, where it will prime naïve T cells to initiate the adaptive response.',
  },
  {
    id:'s2',tlIndex:2,day:'Day 3–5',dayNum:'3–5',
    narr:'The DC arrives in the lymph node T cell zone. <strong style="color:#F59E0B">Signal 1</strong>: TCR binds MHC/peptide. <strong style="color:#F59E0B">Signal 2</strong>: CD28 binds CD80/86. <strong style="color:#F59E0B">Signal 3</strong>: IL-12. MHC-I cross-presentation activates CD8+ CTLs. CD4+ Tfh cells upregulate CXCR5 and migrate to B cell follicles.',
    prompt:'→ Drag CD4+ and CD8+ T cells to the dendritic cell to initiate priming.',
    buildScene:buildStage2,
    trayIds:['cd4','cd8','bcell','macrophage'],
    dropZones:[
      {id:'dz-cd4',cx:242,cy:153,r:40,accepts:['cd4'],correctMsg:'✓ CD4+ TCR:MHC-II + CD28:CD80 → IL-2 autocrine → Th1 / Tfh differentiation'},
      {id:'dz-cd8',cx:438,cy:153,r:40,accepts:['cd8'],correctMsg:'✓ CD8+ TCR:MHC-I (cross-presentation) → CTL effector: perforin, granzyme, FasL'},
    ],
    wrongMsgs:{bcell:'✗ B cell activation is in follicles — not direct DC contact here',macrophage:'✗ Macrophages are not the primary priming APC in the lymph node T cell zone'},
    resultEmoji:'⚡',resultTitle:'Adaptive response primed',
    resultMsg:'CD4+ Th cells are proliferating via IL-2 autocrine signalling. CD8+ CTLs are differentiating. Tfh cells upregulate CXCR5 and move toward the B cell follicle to license B cell activation.',
  },
  {
    id:'s3',tlIndex:3,day:'Day 5–7',dayNum:'5–7',
    narr:'Tfh cells enter the B cell follicle and provide <strong style="color:#F59E0B">CD40L:CD40</strong> co-stimulation + IL-21/IL-4. This drives B cell class switch recombination (CSR) to IgG and somatic hypermutation (SHM) in the germinal center dark zone. High-affinity B cell clones are selected in the light zone by follicular DCs.',
    prompt:'→ Drag the B cell into the germinal center to initiate antibody production.',
    buildScene:buildStage3,
    trayIds:['bcell','cd8','plasma','macrophage'],
    dropZones:[
      {id:'dz-bc',cx:230,cy:155,r:55,accepts:['bcell'],correctMsg:'✓ B cell enters GC → AID-driven SHM + CSR → affinity maturation → IgG'},
    ],
    wrongMsgs:{cd8:'✗ CD8+ CTLs act at the infection site, not in GC reactions',plasma:'✗ Plasma cells are the output of GC — they form after B cell activation',macrophage:'✗ Macrophages are not GC participants'},
    resultEmoji:'💉',resultTitle:'Germinal center reaction',
    resultMsg:'B cells undergo AID-driven somatic hypermutation and class switch recombination. High-affinity IgG-secreting plasma cells form. Long-lived plasma cells migrate to bone marrow niches. Memory B cells are established.',
  },
  {
    id:'s4',tlIndex:4,day:'Day 7–14',dayNum:'7–14',
    narr:'CD8+ CTLs recognize viral peptide/MHC-I on infected cells and kill via <strong style="color:#F59E0B">perforin/granzyme B</strong> and FasL. Neutralizing IgG antibodies block HA binding and opsonize virions for phagocytosis. After clearance, >90% of effector cells undergo apoptosis. Long-lived <strong style="color:#F59E0B">Tcm and Tem memory cells</strong> persist.',
    prompt:'→ Drag the memory cell and antibody into the scene to complete the response.',
    buildScene:buildStage4,
    trayIds:['memory','antibody','cd8','bcell'],
    dropZones:[
      {id:'dz-mem',cx:530,cy:155,r:44,accepts:['memory'],correctMsg:'✓ Memory T cells — Tcm (CCR7+) and Tem (CCR7−) persist for years'},
      {id:'dz-ab', cx:370,cy:148,r:40,accepts:['antibody'],correctMsg:'✓ IgG antibodies neutralize HA, fix complement, opsonize for phagocytosis'},
    ],
    wrongMsgs:{cd8:'✗ Effector CD8+ cells are contracting — memory is what persists',bcell:'✗ Drag the antibody (secreted product) rather than the B cell itself'},
    resultEmoji:'🏆',resultTitle:'Viral clearance complete',
    resultMsg:'The influenza virus has been cleared. Immunological memory is established. Upon re-exposure, memory T and B cells will mount a faster, stronger secondary response — the basis of vaccine protection.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL 2 — BACTERIAL (Staphylococcus aureus / Gram-positive)
//
// Scene coordinate system: viewBox 0 0 680 300 (same as Level 1).
// New cell assets: drawBacteria, drawNeutrophil, drawComplement (cells.js).
// ─────────────────────────────────────────────────────────────────────────────

function baseSkin(root){
  // Dermis / subcutaneous tissue — warm pinkish brown
  root.appendChild(e('rect',{x:0,y:0,width:680,height:300,fill:'#2d1a0e'}));
  // Epidermis band at top
  root.appendChild(e('rect',{x:0,y:0,width:680,height:52,fill:'#c0824a',opacity:'.28'}));
  root.appendChild(e('rect',{x:0,y:48,width:680,height:4,fill:'#92400E',opacity:'.6'}));
  txt(root,'EPIDERMIS / WOUND ENTRY',14,16,'7','#92400E');
  // Dermis label
  txt(root,'DERMIS',14,72,'7','rgba(146,64,14,.45)');
  // Capillary on right
  root.appendChild(e('rect',{x:604,y:0,width:76,height:300,fill:'#4a1515',opacity:'.85'}));
  root.appendChild(e('line',{x1:604,y1:0,x2:604,y2:300,stroke:'#6b2020','stroke-width':'2.5'}));
  txt(root,'BLOOD\nVESSEL',634,90,'7','#6b2020','middle');
  // Collagen fibres (diagonal lines)
  for(let i=0;i<8;i++){
    const y=40+i*35;
    root.appendChild(e('line',{x1:0,y1:y,x2:598,y2:y+20,stroke:'rgba(146,64,14,.12)','stroke-width':'1.5'}));
  }
}

function buildBacStage0(root){
  baseSkin(root);
  txt(root,'BACTERIAL INFECTION — Hour 0',340,18,'8','rgba(163,230,53,.5)','middle');
  txt(root,'Staphylococcus aureus · Gram-positive · peptidoglycan wall · Protein A',340,30,'6.5','rgba(163,230,53,.32)','middle');

  // Cluster of bacteria at wound entry
  [[140,110],[168,98],[155,128],[190,112],[175,140]].forEach(([cx,cy])=>{
    const bg=e('g'); drawBacteria(bg,cx,cy,15); root.appendChild(bg);
  });
  txt(root,'S. aureus cluster',165,162,'7.5','rgba(163,230,53,.6)','middle');

  // TLR2 on macrophage surface — PAMP recognition
  // Macrophage tissue-resident, left side
  const mG=e('g'); mG.style.animation='floatY 4s ease-in-out infinite'; mG.style.transformOrigin='80px 200px';
  drawMacrophage(mG,80,200,24);
  txt(mG,'tissue macrophage',80,234,'7','#FDE68A','middle');
  root.appendChild(mG);

  // TLR2 signal arrow from bacteria to macrophage
  const tlr2=e('path',{d:'M145 130 Q115 160 98 188',fill:'none',stroke:'#EA580C','stroke-width':'1.2','stroke-dasharray':'4 3','marker-end':'url(#arr)',opacity:'.7'});
  tlr2.style.animation='dashFlow 1.8s linear infinite'; root.appendChild(tlr2);
  txt(root,'TLR2/6 · NOD2',118,154,'7','rgba(234,88,12,.6)','middle');
  txt(root,'peptidoglycan / LTA',118,163,'6.5','rgba(234,88,12,.45)','middle');

  // NF-κB → cytokine burst (TNF-α, IL-1β, IL-8)
  const ckG=e('g'); ckG.style.animation='pulse 2s ease-in-out infinite'; ckG.style.transformOrigin='80px 255px';
  drawCytokine(ckG,80,255,13); root.appendChild(ckG);
  txt(root,'TNF-α · IL-1β · IL-8 →',80,278,'6.5','rgba(244,114,182,.55)','middle');

  // Complement activation (alternative pathway) — C3b tagging bacteria
  const cG=e('g'); cG.style.animation='floatY 3s ease-in-out infinite 0.5s'; cG.style.transformOrigin='300px 125px';
  drawComplement(cG,300,118,18); root.appendChild(cG);
  txt(root,'alternative pathway C3b',300,148,'7','rgba(6,182,212,.6)','middle');

  // Drop zone hint
  txt(root,'innate sentinels mobilising →',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildBacStage1(root){
  baseSkin(root);
  txt(root,'ACUTE INFLAMMATION — Hour 1–4',340,18,'8','rgba(239,68,68,.55)','middle');
  txt(root,'IL-8 gradient · selectin upregulation · neutrophil extravasation',340,30,'6.5','rgba(239,68,68,.3)','middle');

  // Bacteria still present (fewer, being attacked)
  [[145,115],[170,100],[160,135]].forEach(([cx,cy])=>{
    const bg=e('g'); bg.setAttribute('opacity','.7'); drawBacteria(bg,cx,cy,13); root.appendChild(bg);
  });

  // IL-8 chemokine gradient from tissue → blood vessel (right to left)
  for(let i=0;i<5;i++){
    const d=e('circle',{r:'2.5',fill:'#F472B6',opacity:'.6'});
    const anim=e('animateMotion',{dur:`${2+i*.35}s`,repeatCount:'indefinite',begin:`${i*.4}s`,
      path:'M580 150 Q450 145 300 148 Q200 150 130 155'});
    d.appendChild(anim); root.appendChild(d);
  }
  txt(root,'IL-8 / CXCL8 gradient',360,128,'7','rgba(244,114,182,.5)','middle');

  // Neutrophils rolling/extravasating from blood vessel
  const n1=e('g'); n1.style.animation='floatY 2.5s ease-in-out infinite'; n1.style.transformOrigin='555px 155px';
  drawNeutrophil(n1,555,155,22); txt(n1,'rolling',555,185,'7','rgba(99,102,241,.6)','middle'); root.appendChild(n1);

  const n2=e('g'); n2.style.animation='floatY 3s ease-in-out infinite 0.7s'; n2.style.transformOrigin='490px 158px';
  drawNeutrophil(n2,490,158,22); txt(n2,'transmigrating',490,188,'7','rgba(99,102,241,.6)','middle'); root.appendChild(n2);

  // Selectin / integrin labels on vessel wall
  txt(root,'P-selectin ↑',610,60,'7','rgba(239,68,68,.55)','middle');
  txt(root,'ICAM-1 ↑',610,72,'7','rgba(239,68,68,.45)','middle');

  // Arriving neutrophil at infection site
  const n3=e('g'); n3.style.animation='floatY 2s ease-in-out infinite 1.2s'; n3.style.transformOrigin='340px 170px';
  drawNeutrophil(n3,340,170,26);
  txt(n3,'neutrophil',340,204,'7.5','#818CF8','middle');
  txt(n3,'arriving',340,214,'7','rgba(99,102,241,.55)','middle');
  root.appendChild(n3);

  // Drop zone context
  txt(root,'drag neutrophil to the infection site',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildBacStage2(root){
  baseSkin(root);
  txt(root,'OPSONIZATION & PHAGOCYTOSIS — Hour 4–12',340,18,'8','rgba(6,182,212,.55)','middle');
  txt(root,'C3b + IgG opsonins coat bacteria → Fcγ-R + CR1 recognition → phagolysosome',340,30,'6.5','rgba(6,182,212,.3)','middle');

  // Opsonized bacteria — bacteria with C3b tags
  [[175,145],[210,130],[195,165]].forEach(([cx,cy],i)=>{
    const bg=e('g'); drawBacteria(bg,cx,cy,14); root.appendChild(bg);
    const cg=e('g'); drawComplement(cg,cx+12,cy-14,11); root.appendChild(cg);
  });
  txt(root,'opsonized bacteria',195,195,'7.5','rgba(6,182,212,.6)','middle');
  txt(root,'C3b · IgG coat',195,205,'7','rgba(6,182,212,.4)','middle');

  // Neutrophil engulfing — large, central
  const nG=e('g'); nG.style.animation='floatY 3.5s ease-in-out infinite'; nG.style.transformOrigin='370px 160px';
  drawNeutrophil(nG,370,160,32);
  txt(nG,'neutrophil',370,202,'7.5','#818CF8','middle');
  root.appendChild(nG);

  // Phagocytosis arrow
  const phArr=e('path',{d:'M218 150 Q290 152 338 158',fill:'none',stroke:'rgba(6,182,212,.7)','stroke-width':'1.3','stroke-dasharray':'4 3','marker-end':'url(#arr-g)',opacity:'.75'});
  phArr.style.animation='dashFlow 1.5s linear infinite'; root.appendChild(phArr);
  txt(root,'CR1 · Fcγ-R',278,143,'7','rgba(6,182,212,.55)','middle');

  // ROS/degranulation burst
  const rosG=e('g'); rosG.style.animation='pulse 1.5s ease-in-out infinite'; rosG.style.transformOrigin='370px 160px';
  for(let a=0;a<8;a++){
    const ang=(a/8)*Math.PI*2;
    rosG.appendChild(e('line',{x1:370+Math.cos(ang)*34,y1:160+Math.sin(ang)*34,
      x2:370+Math.cos(ang)*46,y2:160+Math.sin(ang)*46,
      stroke:'#FCD34D','stroke-width':'1.4','stroke-linecap':'round',opacity:'.5'}));
  }
  root.appendChild(rosG);
  txt(root,'oxidative burst · ROS',370,240,'7.5','rgba(252,211,77,.6)','middle');
  txt(root,'elastase · MPO · defensins',370,250,'7','rgba(252,211,77,.4)','middle');

  // Macrophage alongside
  const mG=e('g'); mG.style.animation='floatY 4s ease-in-out infinite 1s'; mG.style.transformOrigin='520px 160px';
  drawMacrophage(mG,520,160,24);
  txt(mG,'macrophage',520,194,'7.5','#FDE68A','middle');
  txt(mG,'phagocytosis',520,204,'7','rgba(253,230,138,.5)','middle');
  root.appendChild(mG);

  txt(root,'drag C3b opsonin to coat the bacteria',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildBacStage3(root){
  baseSkin(root);
  txt(root,'RESOLUTION & ADAPTIVE PRIMING — Day 3–7',340,18,'8','rgba(16,185,129,.55)','middle');
  txt(root,'Th17 · opsonizing IgG · regulatory resolution',340,30,'6.5','rgba(16,185,129,.3)','middle');

  // Cleared tissue — very faint bacteria
  [[160,110],[185,95]].forEach(([cx,cy])=>{
    const g=e('g'); g.setAttribute('opacity','.15'); drawBacteria(g,cx,cy,12); root.appendChild(g);
  });
  txt(root,'bacteria cleared',172,138,'7','rgba(163,230,53,.35)','middle');

  // DC presenting to CD4 → Th17 differentiation
  const dcG=e('g'); dcG.style.animation='floatY 4s ease-in-out infinite'; dcG.style.transformOrigin='310px 155px';
  drawDendritic(dcG,310,155,26);
  txt(dcG,'DC · TLR2-primed',310,192,'7.5','#FDE68A','middle');
  root.appendChild(dcG);

  // Th17 CD4 cell
  const th17=e('g'); th17.style.animation='floatY 3s ease-in-out infinite 0.6s'; th17.style.transformOrigin='430px 145px';
  drawCD4(th17,430,145,24);
  txt(th17,'CD4+ Th17',430,179,'7.5','#A5B4FC','middle');
  txt(th17,'IL-17A↑ · IL-22↑',430,189,'7','rgba(165,180,252,.55)','middle');
  root.appendChild(th17);

  // DC → Th17 arrow
  const dArr=e('path',{d:'M336 155 Q380 150 406 148',fill:'none',stroke:'rgba(124,58,237,.6)','stroke-width':'1.2','stroke-dasharray':'4 3','marker-end':'url(#arr-p)',opacity:'.7'});
  dArr.style.animation='dashFlow 1.8s linear infinite'; root.appendChild(dArr);
  txt(root,'IL-6 · TGF-β · IL-23',375,140,'6.5','rgba(124,58,237,.5)','middle');

  // IL-17 → neutrophil recruitment loop label
  const ilArr=e('path',{d:'M448 162 Q490 200 510 215',fill:'none',stroke:'rgba(244,114,182,.5)','stroke-width':'1','stroke-dasharray':'3 2','marker-end':'url(#arr)',opacity:'.55'});
  ilArr.style.animation='dashFlow 2s linear infinite'; root.appendChild(ilArr);
  txt(root,'IL-17A → G-CSF → neutrophil reserve',520,220,'7','rgba(244,114,182,.45)','middle');

  // IgG opsonizing antibody in blood
  const abG=e('g'); abG.style.animation='floatY 3s ease-in-out infinite 1s'; abG.style.transformOrigin='634px 155px';
  drawAntibody(abG,634,155,20); root.appendChild(abG);
  txt(root,'IgG opsonins',634,188,'6.5','rgba(244,114,182,.55)','middle');

  // Memory label
  txt(root,'memory B + T cells established → rapid recall on re-infection',340,265,'7','rgba(217,119,6,.45)','middle');
}

const STAGES_BACTERIAL=[
  {
    id:'b0',tlIndex:0,day:'Hour 0',dayNum:'0h',
    narr:'<em>Staphylococcus aureus</em> breaches the skin barrier. Tissue-resident macrophages detect <strong style="color:#F59E0B">peptidoglycan and lipoteichoic acid (LTA)</strong> via TLR2/TLR6 heterodimers and NOD2. NF-κB activation triggers TNF-α, IL-1β, and the neutrophil chemokine <strong style="color:#F59E0B">IL-8 (CXCL8)</strong>. The complement alternative pathway spontaneously deposits C3b on the bacterial surface.',
    prompt:'→ Drag the macrophage to the infection site to initiate pattern recognition.',
    buildScene:buildBacStage0,
    trayIds:['macrophage','neutrophil','bcell','cd8'],
    dropZones:[
      {id:'dz-bm',cx:80,cy:200,r:40,accepts:['macrophage'],correctMsg:'✓ Tissue macrophage — TLR2/NOD2 → NF-κB → IL-8, TNF-α, IL-1β, complement activation'},
    ],
    wrongMsgs:{neutrophil:'✗ Neutrophils arrive later — recruited by IL-8 from macrophages',bcell:'✗ B cells are adaptive — not present at the initial infection site',cd8:'✗ CD8+ T cells require APC priming in the lymph node first'},
    resultEmoji:'🦠',resultTitle:'Pattern recognition engaged',
    resultMsg:'Tissue macrophages recognize bacterial PAMPs via TLR2/NOD2 and activate NF-κB. IL-8 gradients form to recruit neutrophils. C3b begins coating the bacteria via the alternative complement pathway.',
  },
  {
    id:'b1',tlIndex:1,day:'Hour 1–4',dayNum:'1–4h',
    narr:'IL-8 and TNF-α upregulate <strong style="color:#F59E0B">P-selectin and ICAM-1</strong> on endothelial cells. Neutrophils roll, adhere, and transmigrate through the vessel wall (diapedesis) down the IL-8 gradient. This is the defining feature of acute bacterial inflammation — the <strong style="color:#F59E0B">neutrophil as first responder</strong>.',
    prompt:'→ Drag the neutrophil into the infection site.',
    buildScene:buildBacStage1,
    trayIds:['neutrophil','macrophage','cd4','bcell'],
    dropZones:[
      {id:'dz-bn',cx:340,cy:170,r:44,accepts:['neutrophil'],correctMsg:'✓ Neutrophil — IL-8-driven chemotaxis → diapedesis → arrives at infection site Hour 1–4'},
    ],
    wrongMsgs:{macrophage:'✗ Macrophages are already present — neutrophils are the recruited first responders',cd4:'✗ CD4+ T cells are adaptive — priming takes 3–5 days',bcell:'✗ B cells are adaptive — not recruited to acute bacterial infection sites'},
    resultEmoji:'⚡',resultTitle:'Neutrophil mobilisation',
    resultMsg:'Neutrophils are the dominant cell in acute bacterial infection. They arrive within hours, guided by IL-8, and are ready to phagocytose and destroy bacteria via oxidative burst and degranulation.',
  },
  {
    id:'b2',tlIndex:2,day:'Hour 4–12',dayNum:'4–12h',
    narr:'C3b and IgG coat the bacterial surface (<strong style="color:#F59E0B">opsonization</strong>). Neutrophils and macrophages recognise opsonins via complement receptor 1 (CR1) and Fcγ receptors, triggering efficient phagocytosis. Inside the phagolysosome, an <strong style="color:#F59E0B">oxidative burst</strong> (NADPH oxidase → superoxide) and degranulation of elastase, MPO, and defensins destroy the bacteria.',
    prompt:'→ Drag the C3b opsonin to coat the bacteria.',
    buildScene:buildBacStage2,
    trayIds:['complement','neutrophil','antibody','macrophage'],
    dropZones:[
      {id:'dz-bc2',cx:192,cy:148,r:48,accepts:['complement'],correctMsg:'✓ C3b opsonization → CR1 recognition → phagocytosis → phagolysosome → oxidative burst'},
    ],
    wrongMsgs:{neutrophil:'✗ Neutrophils are already present — opsonization coats the bacteria first',antibody:'✗ IgG antibodies come later in the adaptive response — C3b is the early opsonin',macrophage:'✗ Macrophages are present but C3b opsonization is the key step here'},
    resultEmoji:'💥',resultTitle:'Opsonization and phagocytosis',
    resultMsg:'C3b-opsonized bacteria are rapidly phagocytosed. The oxidative burst generates reactive oxygen species. Neutrophil degranulation releases elastase and MPO. Most bacteria are cleared within 12 hours in a healthy host.',
  },
  {
    id:'b3',tlIndex:3,day:'Day 3–7',dayNum:'3–7d',
    narr:'Dendritic cells primed by TLR2 signals migrate to the lymph node and drive <strong style="color:#F59E0B">Th17 differentiation</strong> (IL-6 + TGF-β + IL-23). Th17 cells secrete IL-17A and IL-22, amplifying neutrophil recruitment and epithelial defence. B cells class-switch to <strong style="color:#F59E0B">opsonizing IgG</strong>. Memory T and B cells provide rapid recall protection against re-infection.',
    prompt:'→ Drag the neutrophil to complete the resolution cycle.',
    buildScene:buildBacStage3,
    trayIds:['neutrophil','cd4','memory','antibody'],
    dropZones:[
      {id:'dz-bres',cx:520,cy:160,r:40,accepts:['neutrophil'],correctMsg:'✓ IL-17A → G-CSF → sustained neutrophil supply from bone marrow reserve'},
      {id:'dz-bmem',cx:430,cy:145,r:36,accepts:['memory'],correctMsg:'✓ Memory T cells — rapid Th17 recall on re-infection'},
    ],
    wrongMsgs:{cd4:'✗ CD4+ T cells are already active — drag memory or neutrophil instead',antibody:'✗ IgG opsonins are already present in the blood vessel — check the other drop zones'},
    resultEmoji:'🏆',resultTitle:'Bacterial infection resolved',
    resultMsg:'The acute neutrophilic response cleared the bulk of bacteria. Th17 cells provide ongoing mucosal and skin defence. Opsonizing IgG and memory T cells ensure rapid protection on re-exposure — the basis of vaccine-induced immunity against encapsulated bacteria.',
  },
];
