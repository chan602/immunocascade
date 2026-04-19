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
// LEVEL 3 — COVID-19 (SARS-CoV-2)
//
// Key immunological themes distinct from Level 1 (flu):
//   - Spike/ACE2 entry into type II pneumocytes, not ciliated epithelium
//   - Active IFN-I suppression (ORF3a, NSP1, PLpro antagonists)
//   - Delayed but explosive cytokine storm (IL-6, IL-1β, TNF, CXCL10)
//   - T cell exhaustion / lymphopenia in severe disease
//   - Neutralizing antibody targets: RBD of spike
// ─────────────────────────────────────────────────────────────────────────────

function baseLung(root){
  // Alveolar space — blue-grey, type I/II pneumocytes lining the walls
  root.appendChild(e('rect',{x:0,y:0,width:680,height:300,fill:'#0a1628'}));
  // Alveolar wall — curved at top and bottom
  root.appendChild(e('path',{d:'M0 60 Q170 20 340 55 Q510 90 680 50 L680 0 L0 0 Z',fill:'#0f2240',opacity:'.9'}));
  root.appendChild(e('path',{d:'M0 240 Q170 275 340 245 Q510 215 680 255 L680 300 L0 300 Z',fill:'#0f2240',opacity:'.9'}));
  // Alveolar space label
  txt(root,'ALVEOLAR SPACE',340,18,'7.5','rgba(147,197,253,.4)','middle');
  // Type I pneumocytes — thin squamous cells lining the wall
  [60,160,260,360,460,560].forEach(x=>{
    root.appendChild(e('ellipse',{cx:x,cy:58,rx:44,ry:10,fill:'#1e3a5f',stroke:'#1d4ed8','stroke-width':'0.8',opacity:'.7'}));
  });
  [60,160,260,360,460,560].forEach(x=>{
    root.appendChild(e('ellipse',{cx:x,cy:242,rx:44,ry:10,fill:'#1e3a5f',stroke:'#1d4ed8','stroke-width':'0.8',opacity:'.7'}));
  });
  txt(root,'TYPE I PNEUMOCYTES',14,46,'6.5','rgba(29,78,216,.55)');
  // Capillary on right
  root.appendChild(e('rect',{x:604,y:0,width:76,height:300,fill:'#4a1515',opacity:'.8'}));
  root.appendChild(e('line',{x1:604,y1:0,x2:604,y2:300,stroke:'#6b2020','stroke-width':'2.5'}));
  txt(root,'BLOOD',634,90,'7','#6b2020','middle');
  // Type II pneumocyte (cuboidal, surfactant-producing) — ACE2-high
  root.appendChild(e('rect',{x:260,y:44,width:28,height:20,rx:4,fill:'#1d4ed8',stroke:'#3b82f6','stroke-width':'1',opacity:'.8'}));
  txt(root,'type II',274,40,'6.5','rgba(59,130,246,.6)','middle');
}

function buildCovStage0(root){
  baseLung(root);
  txt(root,'SARS-CoV-2 ENTRY — Day 0–2',340,18,'8','rgba(251,191,36,.55)','middle');

  // SARS-CoV-2 virions in alveolar space
  [[130,105],[220,130],[350,95],[470,115]].forEach(([cx,cy],i)=>{
    const vg=e('g'); vg.style.animation=`spinSlow ${10+i*3}s linear infinite${i%2?' reverse':''}`; vg.style.transformOrigin=`${cx}px ${cy}px`;
    drawCoronavirus(vg,cx,cy,18); root.appendChild(vg);
  });

  // ACE2 receptor on type II pneumocyte — spike binding
  const acG=e('g'); acG.style.animation='floatY 3s ease-in-out infinite'; acG.style.transformOrigin='274px 120px';
  drawACE2(acG,274,120,22); root.appendChild(acG);

  // Spike binding arrow
  const bindArr=e('path',{d:'M220 118 Q248 112 255 112',fill:'none',stroke:'#D97706','stroke-width':'1.3','stroke-dasharray':'4 3','marker-end':'url(#arr)',opacity:'.8'});
  bindArr.style.animation='dashFlow 1.5s linear infinite'; root.appendChild(bindArr);
  txt(root,'Spike RBD → ACE2',238,104,'7','rgba(217,119,6,.7)','middle');
  txt(root,'TMPRSS2 cleavage',238,113,'6.5','rgba(217,119,6,.5)','middle');

  // IFN suppression — X mark over IFN signal
  const ifnG=e('g'); ifnG.style.animation='pulse 2s ease-in-out infinite'; ifnG.style.transformOrigin='460px 175px';
  drawCytokine(ifnG,460,170,16); root.appendChild(ifnG);
  // Red X over IFN
  root.appendChild(e('line',{x1:445,y1:155,x2:475,y2:185,stroke:'#DC2626','stroke-width':'2.5','stroke-linecap':'round',opacity:'.85'}));
  root.appendChild(e('line',{x1:475,y1:155,x2:445,y2:185,stroke:'#DC2626','stroke-width':'2.5','stroke-linecap':'round',opacity:'.85'}));
  txt(root,'IFN-I suppressed',460,196,'7.5','rgba(220,38,38,.7)','middle');
  txt(root,'ORF3a · NSP1 · PLpro',460,206,'6.5','rgba(220,38,38,.5)','middle');

  // Viral replication arrow
  const repArr=e('path',{d:'M288 115 Q340 110 380 118',fill:'none',stroke:'rgba(251,191,36,.6)','stroke-width':'1.1','stroke-dasharray':'4 3','marker-end':'url(#arr)',opacity:'.6'});
  repArr.style.animation='dashFlow 2s linear infinite'; root.appendChild(repArr);
  txt(root,'unchecked replication',340,108,'7','rgba(251,191,36,.5)','middle');
  txt(root,'(IFN delay → viral load ↑↑)',340,117,'6.5','rgba(251,191,36,.35)','middle');

  txt(root,'drag ACE2 receptor to the pneumocyte entry site',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildCovStage1(root){
  baseLung(root);
  txt(root,'CYTOKINE STORM — Day 6–12',340,18,'8','rgba(220,38,38,.65)','middle');
  txt(root,'delayed IFN-I + hyperactivated macrophages → IL-6, TNF-α, CXCL10 surge',340,30,'6.5','rgba(220,38,38,.35)','middle');

  // Dying infected cells (lytic)
  [[140,110],[185,95],[160,135]].forEach(([cx,cy])=>{
    root.appendChild(e('ellipse',{cx,cy,rx:20,ry:15,fill:'rgba(220,38,38,.2)',stroke:'#DC2626','stroke-width':'1','stroke-dasharray':'3 2'}));
    for(let a=0;a<6;a++){
      const ang=(a/6)*Math.PI*2;
      root.appendChild(e('line',{x1:cx+Math.cos(ang)*18,y1:cy+Math.sin(ang)*14,x2:cx+Math.cos(ang)*26,y2:cy+Math.sin(ang)*20,stroke:'#EF4444','stroke-width':'0.8',opacity:'.4','stroke-linecap':'round'}));
    }
  });
  txt(root,'infected cells lysing',165,160,'7','rgba(220,38,38,.5)','middle');

  // Hyperactivated macrophage — large, central
  const mG=e('g'); mG.style.animation='floatY 3s ease-in-out infinite'; mG.style.transformOrigin='340px 158px';
  drawMacrophage(mG,340,158,32);
  txt(mG,'hyperactivated',340,200,'7.5','#FDE68A','middle');
  txt(mG,'macrophage',340,210,'7.5','#FDE68A','middle');
  root.appendChild(mG);

  // Cytokine burst radiating out — multiple cytokines
  const storms=[
    [250,110,'IL-6'],[420,105,'TNF-α'],[260,210,'IL-1β'],[415,215,'CXCL10'],[200,160,'IL-8'],[480,160,'IL-12'],
  ];
  storms.forEach(([cx,cy,label],i)=>{
    const cg=e('g'); cg.style.animation=`pulse ${1.5+i*.2}s ease-in-out infinite ${i*.15}s`;
    cg.style.transformOrigin=`${cx}px ${cy}px`;
    drawCytokine(cg,cx,cy,12); root.appendChild(cg);
    txt(root,label,cx,cy+22,'6.5','rgba(244,114,182,.65)','middle');
    // Arrow from macrophage to cytokine
    const arr=e('path',{d:`M${340+Math.sign(cx-340)*35} ${158+Math.sign(cy-158)*35} Q${(340+cx)/2} ${(158+cy)/2} ${cx} ${cy}`,
      fill:'none',stroke:'rgba(244,114,182,.35)','stroke-width':'0.8','stroke-dasharray':'3 2','marker-end':'url(#arr)',opacity:'.5'});
    arr.style.animation='dashFlow 2s linear infinite'; root.appendChild(arr);
  });

  // ARDS label
  txt(root,'ARDS risk: vascular leak · fibrin deposition · hyaline membranes',340,268,'7','rgba(220,38,38,.45)','middle');
}

function buildCovStage2(root){
  baseLung(root);
  txt(root,'T CELL EXHAUSTION & LYMPHOPENIA — Day 10–14',340,18,'7.5','rgba(109,40,217,.6)','middle');
  txt(root,'PD-L1 upregulation on infected cells → PD-1 on T cells → functional exhaustion',340,30,'6','rgba(109,40,217,.35)','middle');

  // Infected cell expressing PD-L1
  root.appendChild(e('ellipse',{cx:220,cy:155,rx:32,ry:26,fill:'rgba(220,38,38,.15)',stroke:'#DC2626','stroke-width':'1.2','stroke-dasharray':'3 2'}));
  root.appendChild(e('ellipse',{cx:220,cy:155,rx:14,ry:11,fill:'rgba(220,38,38,.3)'}));
  txt(root,'infected cell',220,190,'7','rgba(220,38,38,.55)','middle');
  txt(root,'PD-L1↑  MHC-I↓',220,200,'6.5','rgba(220,38,38,.4)','middle');

  // PD-1/PD-L1 checkpoint interaction
  const pdArr=e('path',{d:'M252 152 Q310 145 340 148',fill:'none',stroke:'rgba(220,38,38,.6)','stroke-width':'1.2','stroke-dasharray':'4 3','marker-end':'url(#arr-r)',opacity:'.7'});
  pdArr.style.animation='dashFlow 1.5s linear infinite'; root.appendChild(pdArr);
  txt(root,'PD-L1 : PD-1',295,137,'7','rgba(220,38,38,.55)','middle');
  txt(root,'checkpoint engagement',295,146,'6.5','rgba(220,38,38,.4)','middle');

  // Exhausted T cells
  [[370,148],[430,138],[490,150]].forEach(([cx,cy],i)=>{
    const eg=e('g'); eg.style.animation=`floatY ${3+i*.5}s ease-in-out infinite ${i*.4}s`; eg.style.transformOrigin=`${cx}px ${cy}px`;
    drawExhaustedT(eg,cx,cy,22); root.appendChild(eg);
  });
  txt(root,'exhausted CD8+ T cells',430,195,'7.5','rgba(109,40,217,.6)','middle');
  txt(root,'PD-1↑  TIM-3↑  LAG-3↑  IFN-γ↓',430,205,'7','rgba(109,40,217,.45)','middle');

  // Lymphopenia — fading normal cells in background
  [[100,180],[140,160],[90,210]].forEach(([cx,cy])=>{
    const g=e('g'); g.setAttribute('opacity','.2'); drawCD8(g,cx,cy,14); root.appendChild(g);
  });
  txt(root,'lymphopenia: CD4/CD8 count ↓↓',150,235,'7','rgba(109,40,217,.45)','middle');

  // IL-6 → JAK/STAT3 amplification loop
  const ck=e('g'); ck.style.animation='pulse 2s ease-in-out infinite'; ck.style.transformOrigin='530px 190px';
  drawCytokine(ck,530,190,14); root.appendChild(ck);
  txt(root,'IL-6 → JAK/STAT3',530,215,'7','rgba(244,114,182,.55)','middle');
  txt(root,'→ PD-L1 ↑ loop',530,224,'6.5','rgba(244,114,182,.4)','middle');

  txt(root,'drag the exhausted T cell into the checkpoint zone',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildCovStage3(root){
  baseLung(root);
  txt(root,'NEUTRALIZATION & RESOLUTION — Day 14–28',340,18,'7.5','rgba(16,185,129,.55)','middle');
  txt(root,'nAb → RBD blockade · convalescent T cells · lung repair',340,30,'6.5','rgba(16,185,129,.3)','middle');

  // Fading virions (mostly cleared)
  [[140,100],[280,85]].forEach(([cx,cy])=>{
    const vg=e('g'); vg.setAttribute('opacity','.18'); drawCoronavirus(vg,cx,cy,14); root.appendChild(vg);
  });

  // Neutralizing antibodies blocking spike
  [[200,130],[160,110],[230,115]].forEach(([cx,cy],i)=>{
    const ag=e('g'); ag.style.animation=`floatY ${2.5+i*.4}s ease-in-out infinite ${i*.3}s`;
    ag.style.transformOrigin=`${cx}px ${cy}px`;
    drawAntibody(ag,cx,cy,14); root.appendChild(ag);
  });
  txt(root,'nAb: anti-RBD IgG',195,162,'7.5','rgba(244,114,182,.65)','middle');
  txt(root,'blocks ACE2 binding',195,172,'7','rgba(244,114,182,.45)','middle');

  // Recovered CD8+ T cells
  const recT=e('g'); recT.style.animation='floatY 3s ease-in-out infinite 0.5s'; recT.style.transformOrigin='380px 155px';
  drawCD8(recT,380,155,26);
  txt(recT,'recovered CTL',380,190,'7.5','#C4B5FD','middle');
  txt(recT,'IFN-γ restored',380,200,'7','rgba(196,181,253,.55)','middle');
  root.appendChild(recT);

  // Memory B cell
  const memB=e('g'); memB.style.animation='floatY 4s ease-in-out infinite 1s'; memB.style.transformOrigin='480px 148px';
  drawMemory(memB,480,148,24);
  txt(memB,'memory B cell',480,182,'7.5','rgba(167,243,208,.7)','middle');
  txt(memB,'RBD-specific',480,192,'7','rgba(167,243,208,.45)','middle');
  root.appendChild(memB);

  // Lung repair — type II → type I pneumocyte regeneration
  root.appendChild(e('rect',{x:260,y:44,width:28,height:20,rx:4,fill:'#065f46',stroke:'#10B981','stroke-width':'1',opacity:'.6'}));
  txt(root,'type II → I repair',274,40,'6.5','rgba(16,185,129,.6)','middle');
  const repArr=e('path',{d:'M274 64 Q274 80 274 100',fill:'none',stroke:'rgba(16,185,129,.5)','stroke-width':'1','stroke-dasharray':'3 2','marker-end':'url(#arr-g)',opacity:'.6'});
  repArr.style.animation='dashFlow 2s linear infinite'; root.appendChild(repArr);

  // Long COVID note
  txt(root,'~10% develop long COVID: persistent inflammation, microclots, viral reservoir',340,265,'7','rgba(217,119,6,.4)','middle');
  txt(root,'memory T + B cells provide durable protection (vaccine basis)',340,275,'6.5','rgba(16,185,129,.38)','middle');
}

const STAGES_COVID=[
  {
    id:'c0',tlIndex:0,day:'Day 0–2',dayNum:'0–2d',
    narr:'SARS-CoV-2 spike protein binds <strong style="color:#F59E0B">ACE2</strong> on type II pneumocytes (high ACE2 expression in lower respiratory tract). TMPRSS2 cleaves spike, enabling membrane fusion. Critically, viral proteins (ORF3a, NSP1, PLpro) <strong style="color:#F59E0B">actively suppress IFN-I signalling</strong> — unlike influenza, this delays the innate alarm, allowing unchecked early replication.',
    prompt:'→ Drag the ACE2 receptor to the pneumocyte to initiate viral entry.',
    buildScene:buildCovStage0,
    trayIds:['ace2','coronavirus','macrophage','tlr7'],
    dropZones:[
      {id:'dz-c0',cx:274,cy:120,r:38,accepts:['ace2'],correctMsg:'✓ ACE2 on type II pneumocyte — spike RBD binds → TMPRSS2 cleavage → membrane fusion → IFN-I suppressed'},
    ],
    wrongMsgs:{coronavirus:'✗ The virus is already present — ACE2 is the host receptor that enables entry',macrophage:'✗ Macrophages arrive later — ACE2 on pneumocytes is the initial entry point',tlr7:'✗ TLR7 detects the virus after entry — ACE2 enables the entry itself'},
    resultEmoji:'🦠',resultTitle:'Viral entry established',
    resultMsg:'SARS-CoV-2 enters type II pneumocytes via ACE2/TMPRSS2. IFN-I production is actively blocked by viral proteins. This silent early replication phase — absent in influenza — is why COVID-19 peaks later and more severely.',
  },
  {
    id:'c1',tlIndex:1,day:'Day 6–12',dayNum:'6–12d',
    narr:'The delayed IFN-I response finally triggers, but viral load is already high. Hyperactivated macrophages and monocytes produce a massive surge of <strong style="color:#F59E0B">IL-6, TNF-α, IL-1β, and CXCL10</strong>. This cytokine storm drives vascular leak, fibrin deposition, and ARDS. IL-6 in particular signals through JAK/STAT3 and is the target of tocilizumab therapy.',
    prompt:'→ Drag the macrophage into the alveolus to trigger cytokine release.',
    buildScene:buildCovStage1,
    trayIds:['macrophage','neutrophil','cytokine','dendritic'],
    dropZones:[
      {id:'dz-c1',cx:340,cy:158,r:44,accepts:['macrophage'],correctMsg:'✓ Hyperactivated macrophage → IL-6, TNF-α, IL-1β, CXCL10 storm → vascular leak → ARDS'},
    ],
    wrongMsgs:{neutrophil:'✗ Neutrophils contribute to lung damage but macrophages drive the cytokine storm',cytokine:'✗ Cytokines are the output — drag the macrophage that produces them',dendritic:'✗ DCs prime T cells but are not the primary cytokine storm driver here'},
    resultEmoji:'🌪️',resultTitle:'Cytokine storm',
    resultMsg:'Macrophage hyperactivation drives a pathological cytokine surge. IL-6 is the key mediator targetable by tocilizumab. CXCL10 predicts severity. Vascular leak and ARDS emerge from endothelial damage, not direct viral injury.',
  },
  {
    id:'c2',tlIndex:2,day:'Day 10–14',dayNum:'10–14d',
    narr:'Prolonged IL-6 signalling upregulates <strong style="color:#F59E0B">PD-L1</strong> on infected cells. Sustained antigen exposure drives CD8+ T cells into exhaustion — characterised by upregulation of <strong style="color:#F59E0B">PD-1, TIM-3, and LAG-3</strong>, and loss of IFN-γ production. CD4 and CD8 counts fall (lymphopenia). This impairs viral clearance and is associated with severe and critical disease.',
    prompt:'→ Drag the exhausted T cell into the checkpoint zone.',
    buildScene:buildCovStage2,
    trayIds:['exhaustedT','cd8','cd4','memory'],
    dropZones:[
      {id:'dz-c2',cx:430,cy:148,r:48,accepts:['exhaustedT'],correctMsg:'✓ Exhausted CD8+ T cell — PD-1↑ TIM-3↑ LAG-3↑ IFN-γ↓ → impaired viral clearance'},
    ],
    wrongMsgs:{cd8:'✗ Functional CD8+ cells are depleted in severe COVID — drag the exhausted T cell',cd4:'✗ CD4+ T cells are also lymphopenic but exhausted CD8+ CTLs are the key effectors here',memory:'✗ Memory cells form after recovery — exhaustion precedes that in severe disease'},
    resultEmoji:'😮',resultTitle:'T cell exhaustion',
    resultMsg:'PD-1/PD-L1 engagement silences CD8+ CTLs. Lymphopenia correlates with disease severity. Anti-PD-1 checkpoint blockade (e.g. pembrolizumab) has been explored therapeutically. Recovery requires re-invigoration of exhausted T cells.',
  },
  {
    id:'c3',tlIndex:3,day:'Day 14–28',dayNum:'14–28d',
    narr:'Potent <strong style="color:#F59E0B">anti-RBD neutralizing IgG</strong> (nAb) blocks spike–ACE2 interaction and is the primary correlate of protection. Convalescent CD8+ T cells recover IFN-γ production. Type II pneumocytes regenerate type I cells to repair the alveolar epithelium. Long COVID affects ~10% — proposed mechanisms include viral reservoir, microclots, and persistent low-level inflammation.',
    prompt:'→ Drag the memory cell to complete long-term protection.',
    buildScene:buildCovStage3,
    trayIds:['memory','antibody','cd8','plasma'],
    dropZones:[
      {id:'dz-c3m',cx:480,cy:148,r:38,accepts:['memory'],correctMsg:'✓ Memory B cell — RBD-specific, long-lived; rapid nAb recall on re-exposure'},
      {id:'dz-c3a',cx:195,cy:140,r:42,accepts:['antibody'],correctMsg:'✓ Anti-RBD IgG — neutralizes by blocking spike:ACE2 → primary vaccine correlate of protection'},
    ],
    wrongMsgs:{cd8:'✗ Drag memory or antibody — CD8 CTLs are already recovering in the scene',plasma:'✗ Plasma cells produced the antibodies already — drag the secreted IgG or memory cell'},
    resultEmoji:'🏆',resultTitle:'Resolved with immunity',
    resultMsg:'Anti-RBD nAbs and memory B/T cells provide durable protection. mRNA vaccines (BNT162b2, mRNA-1273) mimic this response by expressing spike in muscle cells, generating high-titre nAbs before infection. Long COVID remains under active investigation.',
  },
];
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

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL 4 — ALLERGY / TYPE I HYPERSENSITIVITY
//
// Key concepts distinct from all prior levels:
//   - Two-phase response: sensitization (first exposure) vs elicitation (re-exposure)
//   - IgE class switch driven by IL-4/IL-13 from Th2 cells
//   - FcεRI on mast cells / basophils binds IgE Fc; allergen crosslinks → degranulation
//   - Acute phase: histamine, tryptase, PGD2, LTC4 → vasodilation, bronchoconstriction
//   - Late phase: eosinophil recruitment via IL-5, eotaxin → MBP/ECP tissue damage
//   - Background: mucosal epithelium / airway — pollen allergen model
// ─────────────────────────────────────────────────────────────────────────────

function baseAirway(root){
  // Airway mucosal epithelium — cyan-teal tones
  root.appendChild(e('rect',{x:0,y:0,width:680,height:300,fill:'#0c1a2e'}));
  // Airway lumen top
  root.appendChild(e('rect',{x:0,y:0,width:680,height:48,fill:'#0e2a3a',opacity:'.9'}));
  txt(root,'AIRWAY LUMEN',14,15,'7.5','#0e7490');
  // Mucus layer
  root.appendChild(e('rect',{x:0,y:46,width:680,height:8,fill:'#155e75',opacity:'.6'}));
  txt(root,'MUCUS LAYER',14,44,'6.5','rgba(21,94,117,.8)');
  // Epithelial cells — columnar, ciliated
  root.appendChild(e('rect',{x:0,y:52,width:680,height:48,fill:'#164e63',opacity:'.7'}));
  [40,100,160,220,280,340,400,460,520,580,640].forEach(x=>{
    // Cell body
    root.appendChild(e('rect',{x:x-22,y:54,width:44,height:44,rx:4,fill:'#155e75',stroke:'#0e7490','stroke-width':'0.8',opacity:'.8'}));
    // Cilia — short lines upward
    for(let c=0;c<5;c++){
      root.appendChild(e('line',{x1:x-16+c*8,y1:54,x2:x-14+c*8,y2:46,stroke:'#22d3ee','stroke-width':'0.7',opacity:'.6'}));
    }
  });
  txt(root,'CILIATED EPITHELIUM',14,92,'6.5','rgba(14,116,144,.65)');
  // Submucosa / lamina propria
  root.appendChild(e('rect',{x:0,y:100,width:680,height:200,fill:'#0f2240',opacity:'.8'}));
  txt(root,'SUBMUCOSA',14,116,'6.5','rgba(30,58,138,.55)');
  // Blood vessel
  root.appendChild(e('rect',{x:604,y:100,width:76,height:200,fill:'#4a1515',opacity:'.8'}));
  root.appendChild(e('line',{x1:604,y1:100,x2:604,y2:300,stroke:'#6b2020','stroke-width':'2'}));
  txt(root,'BLOOD',634,155,'7','#6b2020','middle');
}

function buildAllStage0(root){
  // Sensitization — first allergen exposure, no symptoms
  baseAirway(root);
  txt(root,'SENSITIZATION — First Allergen Exposure',340,18,'8','rgba(251,191,36,.55)','middle');
  txt(root,'no symptoms yet · Th2 polarization · IgE class switch',340,30,'6.5','rgba(251,191,36,.3)','middle');

  // Pollen grains in lumen
  [[110,25],[220,28],[350,22],[490,30],[580,24]].forEach(([cx,cy])=>{
    const pg=e('g');
    pg.appendChild(e('circle',{cx,cy,r:8,fill:'#FDE68A',stroke:'#D97706','stroke-width':'1'}));
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2;
      pg.appendChild(e('circle',{cx:cx+Math.cos(a)*9,cy:cy+Math.sin(a)*9,r:2,fill:'#F59E0B'}));
    }
    root.appendChild(pg);
  });
  txt(root,'allergen (pollen)',340,38,'7','rgba(217,119,6,.5)','middle');

  // Dendritic cell sampling allergen through epithelium
  const dcG=e('g'); dcG.style.animation='floatY 4s ease-in-out infinite'; dcG.style.transformOrigin='180px 130px';
  drawDendritic(dcG,180,130,26);
  txt(dcG,'DC sampling',180,165,'7.5','#FDE68A','middle');
  root.appendChild(dcG);

  // Th2 CD4 cell in submucosa
  const th2=e('g'); th2.style.animation='floatY 3s ease-in-out infinite 0.8s'; th2.style.transformOrigin='320px 185px';
  drawCD4(th2,320,185,24);
  txt(th2,'CD4+ Th2',320,218,'7.5','#A5B4FC','middle');
  txt(th2,'IL-4 · IL-13 · IL-5',320,228,'7','rgba(165,180,252,.55)','middle');
  root.appendChild(th2);

  // DC → Th2 arrow
  const da=e('path',{d:'M200 142 Q258 160 296 178',fill:'none',stroke:'rgba(217,119,6,.5)','stroke-width':'1.1','stroke-dasharray':'4 3','marker-end':'url(#arr)',opacity:'.65'});
  da.style.animation='dashFlow 2s linear infinite'; root.appendChild(da);

  // B cell → IgE plasma cell (IL-4/IL-13 class switch)
  const bcG=e('g'); bcG.style.animation='floatY 3.5s ease-in-out infinite 1s'; bcG.style.transformOrigin='460px 185px';
  drawBcell(bcG,460,185,22);
  txt(bcG,'B cell → IgE',460,216,'7.5','#BAE6FD','middle');
  txt(bcG,'IL-4/IL-13 → ε CSR',460,226,'7','rgba(186,230,253,.45)','middle');
  root.appendChild(bcG);

  // IgE molecules arming mast cell
  const mcG=e('g'); mcG.style.animation='floatY 5s ease-in-out infinite 0.5s'; mcG.style.transformOrigin='570px 195px';
  drawMastCell(mcG,570,195,26);
  txt(mcG,'mast cell',570,232,'7.5','#E9D5FF','middle');
  txt(mcG,'FcεRI armed w/ IgE',570,242,'7','rgba(233,213,255,.45)','middle');
  root.appendChild(mcG);

  // IgE arming arrow
  const ia=e('path',{d:'M482 185 Q525 188 545 190',fill:'none',stroke:'#F97316','stroke-width':'1.1','stroke-dasharray':'4 3','marker-end':'url(#arr)',opacity:'.65'});
  ia.style.animation='dashFlow 1.8s linear infinite'; root.appendChild(ia);

  txt(root,'→ drag DC to sample the allergen and initiate sensitization',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildAllStage1(root){
  // Re-exposure: allergen crosslinks IgE on mast cell → degranulation trigger
  baseAirway(root);
  txt(root,'RE-EXPOSURE — IgE Crosslinking',340,18,'8','rgba(168,85,247,.6)','middle');
  txt(root,'allergen bridges two FcεRI-bound IgE → aggregation → degranulation signal',340,30,'6.5','rgba(168,85,247,.3)','middle');

  // Heavy allergen load in lumen
  [[80,25],[180,22],[290,28],[400,24],[520,26],[610,22]].forEach(([cx,cy])=>{
    const pg=e('g');
    pg.appendChild(e('circle',{cx,cy,r:9,fill:'#FDE68A',stroke:'#D97706','stroke-width':'1.2'}));
    for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;pg.appendChild(e('circle',{cx:cx+Math.cos(a)*10,cy:cy+Math.sin(a)*10,r:2.5,fill:'#F59E0B'}));}
    root.appendChild(pg);
  });

  // Armed mast cell with IgE — central, large
  const mcG=e('g'); mcG.style.animation='floatY 3s ease-in-out infinite'; mcG.style.transformOrigin='340px 185px';
  drawMastCell(mcG,340,185,34);
  txt(mcG,'IgE-armed mast cell',340,230,'7.5','#E9D5FF','middle');
  root.appendChild(mcG);

  // IgE molecules on surface bridged by allergen (crosslinking)
  [[290,148],[390,148]].forEach(([cx,cy],i)=>{
    const ig=e('g'); ig.style.animation=`floatY ${2.5+i*.5}s ease-in-out infinite ${i*.4}s`;
    drawIgE(ig,cx,cy,18); root.appendChild(ig);
  });
  // Allergen bridging the two IgEs
  root.appendChild(e('ellipse',{cx:340,cy:132,rx:18,ry:10,fill:'#FDE68A',stroke:'#D97706','stroke-width':'1.5'}));
  root.appendChild(e('line',{x1:302,y1:138,x2:323,y2:133,stroke:'#D97706','stroke-width':'1.3','stroke-dasharray':'3 2',opacity:'.8'}));
  root.appendChild(e('line',{x1:378,y1:138,x2:357,y2:133,stroke:'#D97706','stroke-width':'1.3','stroke-dasharray':'3 2',opacity:'.8'}));
  txt(root,'allergen crosslinks IgE',340,118,'7.5','rgba(217,119,6,.7)','middle');
  txt(root,'FcεRI aggregation → signal cascade',340,108,'7','rgba(217,119,6,.5)','middle');

  // PKC / Ca²⁺ signalling
  txt(root,'PLCγ → IP3 → Ca²⁺↑ → PKC → degranulation',340,258,'7','rgba(168,85,247,.45)','middle');

  txt(root,'drag the IgE antibody to arm the mast cell surface',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildAllStage2(root){
  // Acute phase: degranulation — histamine, PGD2, LTC4 release
  baseAirway(root);
  txt(root,'ACUTE PHASE — Mast Cell Degranulation',340,18,'8','rgba(244,63,94,.65)','middle');
  txt(root,'histamine · PGD2 · LTC4 · tryptase · TNF-α → symptoms within minutes',340,30,'6.5','rgba(244,63,94,.3)','middle');

  // Degranulating mast cell — centre stage
  const mcG=e('g'); mcG.style.animation='pulse 1.8s ease-in-out infinite'; mcG.style.transformOrigin='340px 178px';
  drawMastCellDegranulating(mcG,340,178,34); root.appendChild(mcG);
  txt(root,'degranulating mast cell',340,228,'7.5','#E9D5FF','middle');

  // Released mediators radiating out with labels
  const mediators=[
    [220,130,'histamine','#F472B6','vasodilation\n& itch'],
    [460,130,'PGD₂','#FB923C','bronchoconstriction'],
    [200,220,'LTC₄','#A78BFA','mucus ↑\nbronchoconstriction'],
    [480,220,'tryptase','#6EE7B7','mast cell\nmarker'],
    [340,268,'TNF-α','#FCD34D','late phase\nrecruitment'],
  ];
  mediators.forEach(([cx,cy,label,col,effect])=>{
    const mg=e('g'); mg.style.animation='pulse 2s ease-in-out infinite'; mg.style.transformOrigin=`${cx}px ${cy}px`;
    drawCytokine(mg,cx,cy,13); root.appendChild(mg);
    txt(root,label,cx,cy+20,'7.5',col,'middle');
    // Arrow from mast cell
    const arr=e('path',{d:`M${340+Math.sign(cx-340)*38} ${178+Math.sign(cy-178)*38} L${cx} ${cy}`,
      fill:'none',stroke:col+'88','stroke-width':'0.9','stroke-dasharray':'3 2','marker-end':'url(#arr)',opacity:'.6'});
    arr.style.animation='dashFlow 2s linear infinite'; root.appendChild(arr);
  });

  // Symptoms
  txt(root,'symptoms: urticaria · rhinorrhoea · wheeze · anaphylaxis (severe)',340,285,'7','rgba(244,63,94,.45)','middle');

  txt(root,'drag the mast cell into the submucosa to trigger degranulation',340,295,'6.5','rgba(217,119,6,.3)','middle');
}

function buildAllStage3(root){
  // Late phase: eosinophil infiltration, tissue damage, chronic inflammation
  baseAirway(root);
  txt(root,'LATE PHASE — Eosinophil Recruitment',340,18,'8','rgba(244,63,94,.55)','middle');
  txt(root,'IL-5 + eotaxin → eosinophil influx → MBP/ECP → tissue remodelling',340,30,'6.5','rgba(244,63,94,.3)','middle');

  // Th2 cells producing IL-5
  const th2=e('g'); th2.style.animation='floatY 4s ease-in-out infinite'; th2.style.transformOrigin='130px 175px';
  drawCD4(th2,130,175,24);
  txt(th2,'Th2',130,208,'7.5','#A5B4FC','middle');
  txt(th2,'IL-5 · IL-4 · IL-13',130,218,'7','rgba(165,180,252,.55)','middle');
  root.appendChild(th2);

  // IL-5 arrow to eosinophil
  const il5=e('path',{d:'M158 175 Q220 168 250 170',fill:'none',stroke:'rgba(244,63,94,.6)','stroke-width':'1.2','stroke-dasharray':'4 3','marker-end':'url(#arr-r)',opacity:'.7'});
  il5.style.animation='dashFlow 1.6s linear infinite'; root.appendChild(il5);
  txt(root,'IL-5',205,162,'7','rgba(244,63,94,.55)','middle');

  // Eosinophils infiltrating
  [[280,170],[340,155],[400,168],[460,175],[520,160]].forEach(([cx,cy],i)=>{
    const eg=e('g'); eg.style.animation=`floatY ${3+i*.4}s ease-in-out infinite ${i*.3}s`; eg.style.transformOrigin=`${cx}px ${cy}px`;
    drawEosinophil(eg,cx,cy,24); root.appendChild(eg);
  });
  txt(root,'eosinophil infiltration',400,210,'7.5','rgba(244,63,94,.6)','middle');

  // MBP/ECP release — tissue damage lines
  [[300,155],[360,148],[420,160]].forEach(([cx,cy])=>{
    for(let a=0;a<5;a++){
      const ang=(a/5)*Math.PI*2;
      root.appendChild(e('line',{x1:cx+Math.cos(ang)*18,y1:cy+Math.sin(ang)*16,
        x2:cx+Math.cos(ang)*28,y2:cy+Math.sin(ang)*24,
        stroke:'#F43F5E','stroke-width':'1','stroke-linecap':'round',opacity:'.35'}));
    }
  });
  txt(root,'MBP · ECP → epithelial damage · mucus ↑',400,228,'7','rgba(244,63,94,.45)','middle');

  // Chronic remodelling
  txt(root,'chronic: subepithelial fibrosis · airway remodelling · hyperresponsiveness',340,265,'7','rgba(217,119,6,.4)','middle');
  // Treatment note
  txt(root,'Rx: ICS (corticosteroids) · anti-IL-5 (mepolizumab) · anti-IgE (omalizumab)',340,277,'6.5','rgba(16,185,129,.38)','middle');

  txt(root,'drag the eosinophil into the tissue to complete the late-phase response',340,290,'6.5','rgba(217,119,6,.3)','middle');
}

const STAGES_ALLERGY=[
  {
    id:'a0',tlIndex:0,day:'Exposure 1',dayNum:'Exp.1',
    narr:'On first allergen exposure (e.g. pollen), dendritic cells in the airway mucosa capture and process allergen peptides. They drive <strong style="color:#F59E0B">Th2 polarisation</strong> (IL-4/IL-13 environment). Th2 cytokines drive B cell class switch to <strong style="color:#F59E0B">IgE</strong>. IgE binds FcεRI on tissue mast cells and circulating basophils — the cell is now "sensitized." No symptoms occur at this stage.',
    prompt:'→ Drag the dendritic cell to sample the allergen and initiate sensitization.',
    buildScene:buildAllStage0,
    trayIds:['dendritic','macrophage','cd4','bcell'],
    dropZones:[
      {id:'dz-a0',cx:180,cy:130,r:40,accepts:['dendritic'],correctMsg:'✓ DC captures allergen → Th2 polarization → IL-4/IL-13 → B cell IgE class switch → mast cell arming via FcεRI'},
    ],
    wrongMsgs:{macrophage:'✗ Macrophages don\'t drive Th2 polarization — dendritic cells are the key allergen-presenting APC',cd4:'✗ CD4+ Th2 cells respond after DC priming — the DC needs to sample first',bcell:'✗ B cells class-switch to IgE later — DC sampling and Th2 priming come first'},
    resultEmoji:'🌿',resultTitle:'Sensitization complete',
    resultMsg:'Mast cells are now armed with allergen-specific IgE via FcεRI. The immune system is primed but silent. On re-exposure to the same allergen, the armed mast cells will respond within seconds — the sensitization phase sets the trap.',
  },
  {
    id:'a1',tlIndex:1,day:'Exposure 2',dayNum:'Exp.2',
    narr:'Re-exposure to the allergen causes it to bridge two adjacent IgE molecules on the mast cell surface (<strong style="color:#F59E0B">IgE crosslinking</strong>). FcεRI aggregation activates PLCγ → IP₃ → Ca²⁺ influx → PKC activation. This triggers fusion of granules with the plasma membrane and release of preformed mediators within <strong style="color:#F59E0B">seconds to minutes</strong>.',
    prompt:'→ Drag the IgE antibody to arm the mast cell surface receptors.',
    buildScene:buildAllStage1,
    trayIds:['ige','mastcell','antibody','bcell'],
    dropZones:[
      {id:'dz-a1',cx:340,cy:185,r:50,accepts:['ige'],correctMsg:'✓ IgE binds FcεRI on mast cell → allergen crosslinks two IgE → receptor aggregation → degranulation signal'},
    ],
    wrongMsgs:{mastcell:'✗ The mast cell is already present — IgE is what arms its surface receptors',antibody:'✗ IgG antibodies are not involved in type I hypersensitivity — IgE binds FcεRI specifically',bcell:'✗ B cells produced the IgE earlier — drag the IgE antibody itself to arm the mast cell'},
    resultEmoji:'⚡',resultTitle:'Mast cell armed',
    resultMsg:'IgE crosslinking by allergen aggregates FcεRI receptors and triggers the degranulation signal cascade. This is the molecular switch for the acute allergic response — the same mechanism exploited in anaphylaxis and the target of omalizumab (anti-IgE therapy).',
  },
  {
    id:'a2',tlIndex:2,day:'Minutes',dayNum:'min',
    narr:'Within minutes, mast cells release preformed granule contents: <strong style="color:#F59E0B">histamine</strong> (vasodilation, itch, bronchoconstriction), <strong style="color:#F59E0B">tryptase</strong> (mast cell marker, protease activity), and heparin. Newly synthesised lipid mediators follow: <strong style="color:#F59E0B">PGD₂</strong> (bronchoconstriction, vasodilation) and <strong style="color:#F59E0B">LTC₄/D₄/E₄</strong> (potent bronchoconstriction, mucus secretion). Severe reactions → anaphylaxis.',
    prompt:'→ Drag the mast cell into the submucosa to trigger degranulation.',
    buildScene:buildAllStage2,
    trayIds:['mastcell','eosinophil','neutrophil','cytokine'],
    dropZones:[
      {id:'dz-a2',cx:340,cy:178,r:50,accepts:['mastcell'],correctMsg:'✓ Mast cell degranulation → histamine + PGD₂ + LTC₄ + tryptase → acute symptoms within minutes'},
    ],
    wrongMsgs:{eosinophil:'✗ Eosinophils arrive in the late phase (hours) — mast cell degranulation is the immediate trigger',neutrophil:'✗ Neutrophils are not major players in type I hypersensitivity — mast cells are',cytokine:'✗ Cytokines are released by the mast cell — drag the mast cell itself to initiate degranulation'},
    resultEmoji:'💥',resultTitle:'Acute allergic response',
    resultMsg:'Histamine, PGD₂, and LTC₄ produce the classic symptoms of allergy within minutes. Antihistamines block H1 receptors. Epinephrine reverses bronchoconstriction and vasodilation in anaphylaxis by acting on β2 and α1 adrenoceptors.',
  },
  {
    id:'a3',tlIndex:3,day:'Hours',dayNum:'hrs',
    narr:'4–8 hours after the acute phase, a <strong style="color:#F59E0B">late-phase response</strong> develops. Th2-derived IL-5 and epithelial eotaxin recruit <strong style="color:#F59E0B">eosinophils</strong> from blood. Eosinophil degranulation releases major basic protein (MBP) and eosinophil cationic protein (ECP), causing epithelial damage and mucus hypersecretion. Repeated late-phase responses lead to <strong style="color:#F59E0B">airway remodelling</strong> and asthma.',
    prompt:'→ Drag the eosinophil into the tissue to complete the late-phase response.',
    buildScene:buildAllStage3,
    trayIds:['eosinophil','neutrophil','memory','cd4'],
    dropZones:[
      {id:'dz-a3',cx:400,cy:168,r:52,accepts:['eosinophil'],correctMsg:'✓ Eosinophil → MBP/ECP degranulation → epithelial damage + mucus ↑ → airway remodelling'},
    ],
    wrongMsgs:{neutrophil:'✗ Neutrophils don\'t drive the late phase — eosinophils are recruited by IL-5 and eotaxin',memory:'✗ Memory cells are not the effectors here — eosinophils cause the late-phase tissue damage',cd4:'✗ Th2 cells drive eosinophil recruitment but are already present — drag the eosinophil itself'},
    resultEmoji:'🏆',resultTitle:'Allergic response complete',
    resultMsg:'The two-phase allergic response is complete. Acute symptoms from mast cell mediators resolve within an hour; late-phase eosinophilic inflammation persists for hours and drives chronic asthma with repeated exposure. Anti-IL-5 (mepolizumab) and anti-IgE (omalizumab) are key biologics targeting this pathway.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL 5 — CANCER IMMUNOLOGY / TUMOUR MICROENVIRONMENT
//
// Key concepts distinct from all prior levels:
//   - Immune editing: elimination → equilibrium → escape
//   - MHC-I downregulation / antigen loss → NK & CTL evasion
//   - PD-L1 on tumour cells → PD-1 on CTLs → functional exhaustion
//   - Immunosuppressive TME: Tregs (IL-10/TGF-β), MDSCs (arginase-1/NO),
//     IDO (tryptophan depletion), VEGF (dysfunctional vasculature)
//   - CAR-T therapy: ex vivo engineering of patient T cells with
//     synthetic antigen receptor (scFv + CD3ζ + co-stimulatory domains)
//   - Resolution via CAR-T + immune checkpoint blockade (anti-PD-1)
// Background: solid tumour mass in tissue
// ─────────────────────────────────────────────────────────────────────────────

function baseTME(root){
  // Tumour microenvironment — dense, hypoxic, immunosuppressive
  root.appendChild(e('rect',{x:0,y:0,width:680,height:300,fill:'#1a0e00'}));
  // Tumour mass — central irregular mass
  root.appendChild(e('ellipse',{cx:340,cy:152,rx:220,ry:125,fill:'#2d1a00',stroke:'#854D0E','stroke-width':'2','stroke-dasharray':'6 4',opacity:'.9'}));
  txt(root,'TUMOUR MICROENVIRONMENT',340,20,'8','rgba(202,138,4,.45)','middle');
  // Hypoxia gradient — darker toward centre
  root.appendChild(e('ellipse',{cx:340,cy:152,rx:120,ry:70,fill:'rgba(30,10,0,.55)',stroke:'rgba(133,77,14,.3)','stroke-width':'1','stroke-dasharray':'4 3'}));
  txt(root,'HYPOXIC CORE',340,140,'7','rgba(133,77,14,.4)','middle');
  txt(root,'VEGF↑  IDO↑  TGF-β↑',340,152,'6.5','rgba(133,77,14,.3)','middle');
  // Dysfunctional vasculature (right)
  root.appendChild(e('path',{d:'M604 0 Q610 80 600 150 Q595 220 604 300',fill:'none',stroke:'#6b2020','stroke-width':'12',opacity:'.6'}));
  root.appendChild(e('path',{d:'M604 0 Q610 80 600 150 Q595 220 604 300',fill:'none',stroke:'#4a1515','stroke-width':'8',opacity:'.8'}));
  txt(root,'DYSFUNCTIONAL\nVASSEL',630,140,'6','#6b2020','middle');
  // Normal tissue border (left)
  root.appendChild(e('rect',{x:0,y:0,width:52,height:300,fill:'rgba(30,20,10,.6)'}));
  root.appendChild(e('line',{x1:52,y1:0,x2:52,y2:300,stroke:'rgba(133,77,14,.3)','stroke-width':'1.5','stroke-dasharray':'5 4'}));
  txt(root,'NORMAL\nTISSUE',14,140,'6.5','rgba(133,77,14,.35)','middle');
}

function buildCanStage0(root){
  baseTME(root);
  txt(root,'IMMUNE EDITING — Elimination to Escape',340,18,'7.5','rgba(202,138,4,.6)','middle');
  txt(root,'elimination → equilibrium → escape · MHC-I loss · antigen editing',340,30,'6.5','rgba(202,138,4,.3)','middle');

  // Tumour cells — cluster, some with MHC-I (being eliminated) some without (escaping)
  [[240,120],[290,105],[350,115],[410,108],[270,160],[330,155],[390,160],[450,150]].forEach(([cx,cy],i)=>{
    const tg=e('g'); tg.setAttribute('opacity',(.55+.25*(i%2)).toFixed(2));
    drawTumorCell(tg,cx,cy,i%3===0?20:16); root.appendChild(tg);
  });

  // Normal CTL being evaded (left side, frustrated)
  const ctlG=e('g'); ctlG.style.animation='floatY 3s ease-in-out infinite'; ctlG.style.transformOrigin='100px 155px';
  drawCD8(ctlG,100,155,24);
  txt(ctlG,'CTL',100,188,'7.5','#C4B5FD','middle');
  txt(ctlG,'MHC-I?',100,198,'7','rgba(196,181,253,.5)','middle');
  root.appendChild(ctlG);

  // CTL → tumour frustrated arrow
  const fArr=e('path',{d:'M124 155 Q175 150 215 135',fill:'none',stroke:'rgba(196,181,253,.4)','stroke-width':'1','stroke-dasharray':'3 2','marker-end':'url(#arr-p)',opacity:'.5'});
  fArr.style.animation='dashFlow 2s linear infinite'; root.appendChild(fArr);

  // MHC-I loss label
  root.appendChild(e('line',{x1:340,y1:88,x2:370,y2:76,stroke:'#DC2626','stroke-width':'1.5','stroke-linecap':'round',opacity:'.7'}));
  root.appendChild(e('line',{x1:370,y1:88,x2:340,y2:76,stroke:'#DC2626','stroke-width':'1.5','stroke-linecap':'round',opacity:'.7'}));
  txt(root,'MHC-I ↓',355,72,'7','rgba(220,38,38,.65)','middle');
  txt(root,'antigen loss',355,82,'6.5','rgba(220,38,38,.45)','middle');

  // NK cell (should catch MHC-I-low cells — but VEGF blocks extravasation)
  const nkG=e('g'); nkG.setAttribute('opacity','.5');
  drawNK(nkG,100,225,18);
  txt(nkG,'NK cell\n(blocked)',100,253,'6.5','rgba(234,88,12,.5)','middle');
  root.appendChild(nkG);

  txt(root,'drag the tumour cell to the centre to establish immune escape',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildCanStage1(root){
  baseTME(root);
  txt(root,'CHECKPOINT EVASION — PD-1/PD-L1',340,18,'7.5','rgba(239,68,68,.6)','middle');
  txt(root,'tumour PD-L1 silences tumour-infiltrating lymphocytes (TILs)',340,30,'6.5','rgba(239,68,68,.3)','middle');

  // Tumour cells expressing PD-L1 — central
  [[280,140],[340,125],[400,140],[320,168],[380,165]].forEach(([cx,cy],i)=>{
    const tg=e('g'); tg.setAttribute('opacity',(.7+.15*(i%2)).toFixed(2));
    drawTumorCell(tg,cx,cy,18); root.appendChild(tg);
  });

  // PD-L1 : PD-1 checkpoint interaction with exhausted T cells
  [[170,130],[165,185]].forEach(([cx,cy],i)=>{
    const eg=e('g'); eg.style.animation=`floatY ${3+i*.6}s ease-in-out infinite ${i*.5}s`; eg.style.transformOrigin=`${cx}px ${cy}px`;
    drawExhaustedT(eg,cx,cy,22); root.appendChild(eg);
  });
  txt(root,'exhausted TILs',168,218,'7.5','rgba(109,40,217,.55)','middle');

  // PD-L1:PD-1 synapse arrows
  [[250,143,170,138],[252,155,172,178]].forEach(([x1,y1,x2,y2])=>{
    const arr=e('path',{d:`M${x1} ${y1} Q${(x1+x2)/2} ${(y1+y2)/2} ${x2} ${y2}`,
      fill:'none',stroke:'rgba(239,68,68,.65)','stroke-width':'1.2','stroke-dasharray':'4 3','marker-end':'url(#arr-r)',opacity:'.7'});
    arr.style.animation='dashFlow 1.5s linear infinite'; root.appendChild(arr);
  });
  txt(root,'PD-L1 : PD-1',210,130,'7','rgba(239,68,68,.6)','middle');
  txt(root,'→ IFN-γ↓  IL-2↓  killing↓',210,140,'6.5','rgba(239,68,68,.45)','middle');

  // Anti-PD-1 checkpoint blockade hint (right)
  root.appendChild(e('rect',{x:480,y:115,width:110,height:52,rx:8,fill:'rgba(16,185,129,.08)',stroke:'rgba(16,185,129,.35)','stroke-width':'1.2'}));
  txt(root,'anti-PD-1',535,132,'7.5','rgba(16,185,129,.7)','middle');
  txt(root,'pembrolizumab',535,143,'7','rgba(16,185,129,.55)','middle');
  txt(root,'nivolumab',535,154,'7','rgba(16,185,129,.45)','middle');
  txt(root,'→ restores TIL function',535,165,'6.5','rgba(16,185,129,.4)','middle');

  txt(root,'drag the exhausted T cell into the tumour to show checkpoint silencing',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildCanStage2(root){
  baseTME(root);
  txt(root,'IMMUNOSUPPRESSIVE TME',340,18,'7.5','rgba(148,163,184,.6)','middle');
  txt(root,'Tregs · MDSCs · IDO · TGF-β · VEGF — a coordinated suppressive network',340,30,'6.5','rgba(148,163,184,.3)','middle');

  // Tumour cells — background
  [[280,138],[345,122],[405,138],[325,165],[385,162]].forEach(([cx,cy])=>{
    const tg=e('g'); tg.setAttribute('opacity','.45'); drawTumorCell(tg,cx,cy,15); root.appendChild(tg);
  });

  // Tregs infiltrating
  [[155,128],[155,185]].forEach(([cx,cy],i)=>{
    const tg=e('g'); tg.style.animation=`floatY ${3.5+i*.5}s ease-in-out infinite ${i*.6}s`; tg.style.transformOrigin=`${cx}px ${cy}px`;
    drawTreg(tg,cx,cy,24); root.appendChild(tg);
  });
  txt(root,'Tregs',155,218,'7.5','rgba(148,163,184,.6)','middle');
  txt(root,'IL-10 · TGF-β',155,228,'7','rgba(148,163,184,.45)','middle');

  // MDSC (represented as macrophage-like, grey)
  const mdscG=e('g'); mdscG.setAttribute('opacity','.6');
  drawMacrophage(mdscG,490,155,22);
  txt(root,'MDSC',490,188,'7.5','rgba(148,163,184,.55)','middle');
  txt(root,'arginase-1 · NO · ROS',490,198,'7','rgba(148,163,184,.4)','middle');
  root.appendChild(mdscG);

  // Suppressive signals radiating from TME core
  const signals=[
    [340,152,'TGF-β','rgba(148,163,184,.5)'],
    [260,190,'IDO','rgba(148,163,184,.45)'],
    [420,188,'VEGF','rgba(148,163,184,.45)'],
    [260,110,'IL-10','rgba(148,163,184,.45)'],
    [420,110,'arginase-1','rgba(148,163,184,.4)'],
  ];
  signals.forEach(([cx,cy,label,col])=>{
    txt(root,label,cx,cy,'7',col,'middle');
  });

  // Exhausted CTL in corner, fading
  const exG=e('g'); exG.setAttribute('opacity','.4');
  drawExhaustedT(exG,100,155,20); root.appendChild(exG);
  txt(root,'TIL (suppressed)',100,188,'6.5','rgba(109,40,217,.4)','middle');

  txt(root,'drag the Treg into the tumour to complete the immunosuppressive network',340,268,'7','rgba(217,119,6,.35)','middle');
}

function buildCanStage3(root){
  baseTME(root);
  txt(root,'CAR-T THERAPY — Engineering the Kill',340,18,'7.5','rgba(13,148,136,.65)','middle');
  txt(root,'ex vivo T cell engineering · tumour antigen targeting · checkpoint blockade combo',340,30,'6.5','rgba(13,148,136,.3)','middle');

  // Dying/cleared tumour cells
  [[280,138],[345,122],[405,138]].forEach(([cx,cy])=>{
    const tg=e('g'); tg.setAttribute('opacity','.2'); drawTumorCell(tg,cx,cy,15); root.appendChild(tg);
    // Apoptosis burst
    for(let a=0;a<5;a++){
      const ang=(a/5)*Math.PI*2;
      root.appendChild(e('line',{x1:cx+Math.cos(ang)*16,y1:cy+Math.sin(ang)*14,x2:cx+Math.cos(ang)*24,y2:cy+Math.sin(ang)*20,stroke:'#EF4444','stroke-width':'0.8',opacity:'.3','stroke-linecap':'round'}));
    }
  });

  // CAR-T cells attacking
  [[170,128],[175,185],[240,155]].forEach(([cx,cy],i)=>{
    const cg=e('g'); cg.style.animation=`floatY ${2.5+i*.5}s ease-in-out infinite ${i*.4}s`; cg.style.transformOrigin=`${cx}px ${cy}px`;
    drawCARTCell(cg,cx,cy,26); root.appendChild(cg);
  });
  txt(root,'CAR-T cells',195,222,'7.5','#2DD4BF','middle');
  txt(root,'CD19 / HER2 / BCMA target',195,232,'7','rgba(45,212,191,.5)','middle');

  // Kill arrows from CAR-T to tumour
  [[240,148,268,135],[242,165,278,148]].forEach(([x1,y1,x2,y2])=>{
    const arr=e('path',{d:`M${x1} ${y1} L${x2} ${y2}`,fill:'none',stroke:'rgba(13,148,136,.7)','stroke-width':'1.4','stroke-dasharray':'4 2','marker-end':'url(#arr-g)',opacity:'.75'});
    arr.style.animation='dashFlow 1.2s linear infinite'; root.appendChild(arr);
  });

  // Anti-PD-1 combo (right panel)
  root.appendChild(e('rect',{x:460,y:108,width:128,height:80,rx:8,fill:'rgba(16,185,129,.07)',stroke:'rgba(16,185,129,.3)','stroke-width':'1.2'}));
  txt(root,'+ anti-PD-1',524,124,'7.5','rgba(16,185,129,.7)','middle');
  txt(root,'checkpoint blockade',524,136,'7','rgba(16,185,129,.55)','middle');
  txt(root,'pembrolizumab',524,147,'6.5','rgba(16,185,129,.45)','middle');
  txt(root,'restores endogenous TILs',524,158,'6.5','rgba(16,185,129,.4)','middle');
  txt(root,'synergy with CAR-T',524,170,'6.5','rgba(16,185,129,.38)','middle');

  // CAR-T manufacturing pipeline note
  txt(root,'manufacturing: apheresis → lentiviral transduction → expansion → infusion',340,258,'6.5','rgba(13,148,136,.4)','middle');
  txt(root,'toxicity: CRS (cytokine release syndrome) · ICANS (neurotoxicity)',340,268,'6.5','rgba(239,68,68,.35)','middle');
  txt(root,'approved: CD19 (tisagenlecleucel) · BCMA (idecabtagene vicleucel)',340,278,'6.5','rgba(217,119,6,.35)','middle');
}

const STAGES_CANCER=[
  {
    id:'k0',tlIndex:0,day:'Months–Years',dayNum:'m–yr',
    narr:'Cancer immunoediting proceeds through three phases: <strong style="color:#F59E0B">elimination</strong> (immune cells destroy early tumour cells), <strong style="color:#F59E0B">equilibrium</strong> (dynamic balance), and <strong style="color:#F59E0B">escape</strong>. Tumour cells that survive selection lose MHC-I expression (CTL evasion), downregulate tumour antigens, and upregulate anti-apoptotic proteins. NK cells should catch MHC-I-low cells, but dysfunctional VEGF-driven vasculature impairs lymphocyte extravasation.',
    prompt:'→ Drag the tumour cell into the microenvironment to establish immune escape.',
    buildScene:buildCanStage0,
    trayIds:['tumorcell','cd8','nkcell','macrophage'],
    dropZones:[
      {id:'dz-k0',cx:340,cy:140,r:55,accepts:['tumorcell'],correctMsg:'✓ Tumour escapes: MHC-I↓ blocks CTL recognition, antigen loss prevents TCR engagement, VEGF blocks NK extravasation'},
    ],
    wrongMsgs:{cd8:'✗ CD8+ CTLs are trying to kill tumour cells — drag the tumour cell to show what they\'re evading',nkcell:'✗ NK cells are blocked from entering by dysfunctional vasculature — drag the tumour cell',macrophage:'✗ Macrophages become pro-tumour (M2) in the TME — drag the tumour cell first'},
    resultEmoji:'🎯',resultTitle:'Immune escape established',
    resultMsg:'Tumour cells evade elimination by losing MHC-I and tumour antigens. This is the evolutionary pressure of cancer immunoediting — selection for the least immunogenic clones. The result is a heterogeneous tumour that has already outrun the immune system.',
  },
  {
    id:'k1',tlIndex:1,day:'Active tumour',dayNum:'active',
    narr:'Tumour cells upregulate <strong style="color:#F59E0B">PD-L1</strong> (often via IFN-γ signalling from infiltrating T cells — a feedback loop). PD-L1 engages PD-1 on tumour-infiltrating lymphocytes (TILs), triggering a programme of functional exhaustion: loss of IFN-γ, TNF-α, and cytotoxic granule secretion. Anti-PD-1 antibodies (pembrolizumab, nivolumab) block this interaction and are approved for >20 cancer types.',
    prompt:'→ Drag the exhausted T cell into the tumour to show checkpoint silencing.',
    buildScene:buildCanStage1,
    trayIds:['exhaustedT','cd8','treg','tumorcell'],
    dropZones:[
      {id:'dz-k1',cx:170,cy:157,r:48,accepts:['exhaustedT'],correctMsg:'✓ TIL exhaustion: PD-L1:PD-1 → BATF/TOX transcription programme → IFN-γ↓, IL-2↓, killing↓'},
    ],
    wrongMsgs:{cd8:'✗ Functional CD8+ T cells are already trying — drag the exhausted version to show the checkpoint effect',treg:'✗ Tregs suppress via IL-10/TGF-β, not PD-1 — drag the exhausted T cell for the checkpoint stage',tumorcell:'✗ The tumour is already present — drag the exhausted T cell to show the PD-1/PD-L1 interaction'},
    resultEmoji:'🔒',resultTitle:'Checkpoint evasion active',
    resultMsg:'PD-L1:PD-1 engagement silences tumour-infiltrating CTLs. Checkpoint blockade with anti-PD-1 or anti-PD-L1 antibodies reverses this exhaustion — the 2018 Nobel Prize mechanism. Response rates of 20–40% in solid tumours; higher with TMB-high or MSI-H tumours.',
  },
  {
    id:'k2',tlIndex:2,day:'Established TME',dayNum:'TME',
    narr:'The established TME is a coordinated immunosuppressive network. <strong style="color:#F59E0B">Tregs</strong> (FoxP3+, recruited by CCL22) secrete IL-10 and TGF-β. <strong style="color:#F59E0B">MDSCs</strong> (myeloid-derived suppressor cells) deplete arginine via arginase-1 and generate NO/ROS. IDO converts tryptophan to kynurenine (T cell toxic). VEGF creates dysfunctional vessels that exclude T cells. Together these create a "cold" tumour resistant to immunotherapy.',
    prompt:'→ Drag the Treg into the tumour to complete the immunosuppressive network.',
    buildScene:buildCanStage2,
    trayIds:['treg','exhaustedT','macrophage','dendritic'],
    dropZones:[
      {id:'dz-k2',cx:155,cy:155,r:50,accepts:['treg'],correctMsg:'✓ Treg infiltration → IL-10/TGF-β → MDSC co-suppression → IDO/VEGF → "cold" tumour immune desert'},
    ],
    wrongMsgs:{exhaustedT:'✗ TIL exhaustion is already shown — drag the Treg to add the suppressive cellular network',macrophage:'✗ MDSCs (macrophage-like) are already present — drag the Treg (FoxP3+) to complete the network',dendritic:'✗ DCs are often tolerogenic in the TME but the Treg is the key suppressive cell here'},
    resultEmoji:'❄️',resultTitle:'Cold tumour established',
    resultMsg:'The immunosuppressive TME creates a "cold" tumour — excluded from immune attack. Strategies to "heat" cold tumours include: anti-VEGF (bevacizumab), IDO inhibitors, anti-TGF-β, STING agonists (innate immune activation), and combining checkpoint blockade with chemotherapy to release tumour antigens.',
  },
  {
    id:'k3',tlIndex:3,day:'Treatment',dayNum:'Rx',
    narr:'CAR-T cell therapy engineers a patient\'s own T cells ex vivo to express a <strong style="color:#F59E0B">chimeric antigen receptor (CAR)</strong> — a synthetic fusion of a tumour-specific scFv (antibody fragment), transmembrane domain, and intracellular CD3ζ + CD28/4-1BB co-stimulatory domains. CAR-T cells are MHC-independent, bypassing MHC-I downregulation. Combined with <strong style="color:#F59E0B">anti-PD-1 checkpoint blockade</strong>, this is the most powerful current immunotherapy approach.',
    prompt:'→ Drag the CAR-T cell in to eliminate the tumour.',
    buildScene:buildCanStage3,
    trayIds:['cartcell','cd8','antibody','memory'],
    dropZones:[
      {id:'dz-k3',cx:205,cy:155,r:50,accepts:['cartcell'],correctMsg:'✓ CAR-T: scFv targets tumour antigen → CD3ζ/CD28 signalling → MHC-independent killing → tumour clearance'},
    ],
    wrongMsgs:{cd8:'✗ Ordinary CD8+ T cells are blocked by PD-L1 and MHC-I loss — CAR-T bypasses both',antibody:'✗ Antibodies can opsonize but don\'t directly kill — CAR-T provides cellular cytotoxicity',memory:'✗ Memory T cells need MHC-I for re-activation — CAR-T bypasses this requirement via the scFv'},
    resultEmoji:'🏆',resultTitle:'Tumour eliminated',
    resultMsg:'CAR-T cells achieve MHC-independent tumour killing by recognising surface antigens directly via the scFv. FDA-approved CAR-T products include tisagenlecleucel (CD19, B-ALL) and idecabtagene vicleucel (BCMA, myeloma). Toxicities include cytokine release syndrome (CRS) and ICANS — managed with tocilizumab and steroids.',
  },
];
