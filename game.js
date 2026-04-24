/**
 * game.js — Story mode game loop
 *
 * Manages stage progression, drag-and-drop interactions, progress
 * persistence (localStorage), feedback display, and touch support.
 *
 * Flow:
 *   startLevel() → resetGame() → loadStage(0)
 *   loadStage(idx) builds scene + tray for getStages()[idx]
 *   Drag cell chip → mousedown → mousemove (ghost) → mouseup (hit-test drop zones)
 *   Correct drop → placeCell() → all zones met → showResult() → nextStage()
 *   Final stage → showComplete() → unlocks Canvas tab
 *
 * Progress is stored under localStorage key 'immunocascade_v1' as:
 *   { flu: { stage0: true, …, levelComplete: true } }
 *
 * Depends on: cells.js, levels.js, canvas.js (for setMode canvas branch)
 */

/* PROGRESS */
const SAVE='immunocascade_v1';
function loadP(){try{return JSON.parse(localStorage.getItem(SAVE))||{};}catch{return{};}}
function saveP(d){localStorage.setItem(SAVE,JSON.stringify(d));}

// Active level ID and stage list — set by startLevel()
let currentLevel='flu';
function getStages(){
  if(currentLevel==='bacterial') return STAGES_BACTERIAL;
  if(currentLevel==='covid')     return STAGES_COVID;
  if(currentLevel==='allergy')   return STAGES_ALLERGY;
  if(currentLevel==='cancer')    return STAGES_CANCER;
  return STAGES;
}

let stageIdx=0,placed={},dzMet={},dragging=null;

function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');}
function goHome(){showScreen('title-screen');}
function startLevel(id){
  if(id!=='flu'&&id!=='bacterial'&&id!=='covid'&&id!=='allergy'&&id!=='cancer')return;
  currentLevel=id;
  const lvlName={flu:'Level 1 — Influenza',bacterial:'Level 2 — Bacterial',covid:'Level 3 — COVID-19',allergy:'Level 4 — Allergy',cancer:'Level 5 — Cancer'}[id];
  document.getElementById('gb-name').textContent=lvlName;
  resetGame();showScreen('game-screen');
}
function setMode(m,btn){
  document.querySelectorAll('.mode-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const gm=document.getElementById('game-main');
  const cw=document.getElementById('canvas-wrap');
  if(m==='canvas'){
    const prog=loadP();
    const storyDone=prog[currentLevel]?.levelComplete===true;
    if(!storyDone){
      document.querySelectorAll('.mode-tab').forEach(t=>t.classList.remove('active'));
      document.getElementById('tab-story')?.classList.add('active');
      showFb('Complete Story Mode first to unlock Canvas Mode','#D97706');
      return;
    }
    gm.style.display='none'; cw.classList.add('active');
    cvSetLevel(currentLevel);
    if(!cvInitDone) cvInit(); else{buildCvTray();cvReset();}
  } else {
    gm.style.display=''; cw.classList.remove('active');
  }
}

function resetGame(){
  stageIdx=0;placed={};dzMet={};dragging=null;
  document.getElementById('day-display').textContent='0';
  document.getElementById('stage-display').textContent='Stage 1 of '+getStages().length;
  document.getElementById('result-overlay').classList.remove('show');
  document.getElementById('complete-overlay').classList.remove('show');
  hideFb();resetTL();loadStage(0);
}
function resetTL(){for(let i=0;i<5;i++){document.getElementById('tl-'+i)?.classList.remove('active','done');document.getElementById('tll-'+i)?.classList.remove('active','done');if(i<4)document.getElementById('tl-line-'+i)?.classList.remove('done');}}
function loadStage(idx){
  stageIdx=idx;placed={};dzMet={};
  const st=getStages()[idx];
  document.getElementById('narr-day').textContent=st.day;
  document.getElementById('narr-text').innerHTML=st.narr;
  document.getElementById('narr-prompt').textContent=st.prompt;
  document.getElementById('day-display').textContent=st.dayNum;
  document.getElementById('stage-display').textContent='Stage '+(idx+1)+' of '+getStages().length;
  document.getElementById('tl-'+st.tlIndex).classList.add('active');
  document.getElementById('tll-'+st.tlIndex).classList.add('active');
  buildScene(st); buildTray(st);
}

function buildScene(st){
  const root=document.getElementById('scene-root');
  root.innerHTML=''; st.buildScene(root);
  const pl=e('g'); pl.id='placed-layer'; root.appendChild(pl);
  st.dropZones.forEach(dz=>{
    const g=e('g'); g.id=dz.id;
    g.appendChild(e('circle',{cx:dz.cx,cy:dz.cy,r:dz.r,fill:'rgba(61,24,0,.45)',stroke:'#D97706','stroke-width':'2','stroke-dasharray':'8 5'}));
    const t1=e('text',{x:dz.cx,y:dz.cy+4,'text-anchor':'middle','font-size':'10',fill:'#D97706','font-family':"'DM Mono',monospace",'font-weight':'500'});t1.textContent='Drop here';g.appendChild(t1);
    root.appendChild(g);
  });
}
function buildTray(st){
  const row=document.getElementById('tray-row'); row.innerHTML='';
  st.trayIds.forEach(id=>{
    const def=CELL_DEFS[id]; if(!def)return;
    const card=document.createElement('div'); card.className='cell-chip'; card.id='chip-'+id;
    const svg=svgW(52,52); def.draw(svg,26,26,23);
    const nm=document.createElement('div'); nm.className='chip-name'; nm.textContent=def.label;
    card.appendChild(svg); card.appendChild(nm);
    card.addEventListener('mousedown',ev=>startDrag(ev,id,card));
    row.appendChild(card);
  });
}

function startDrag(ev,id,card){
  if(placed[id])return; ev.preventDefault(); dragging=id; card.classList.add('dragging');
  const def=CELL_DEFS[id],gs=svgW(62,62); def.draw(gs,31,31,28);
  const gh=document.getElementById('drag-ghost'); gh.innerHTML=''; gh.appendChild(gs); gh.style.display='block';
  moveGhost(ev.clientX,ev.clientY);
}
function moveGhost(cx,cy){
  const r=document.getElementById('scene-wrap').getBoundingClientRect();
  const gh=document.getElementById('drag-ghost');
  gh.style.left=(cx-r.left-31)+'px'; gh.style.top=(cy-r.top-31)+'px';
}
function svgPt(cx,cy){
  const r=document.getElementById('scene-svg').getBoundingClientRect();
  return{x:(cx-r.left)*(680/r.width),y:(cy-r.top)*(300/r.height)};
}

document.addEventListener('selectstart',ev=>{
  if(dragging||cvDraggingNode||cvConnectFrom) ev.preventDefault();
});
document.addEventListener('mousemove',ev=>{
  if(!dragging)return; moveGhost(ev.clientX,ev.clientY);
  const pt=svgPt(ev.clientX,ev.clientY);
  getStages()[stageIdx].dropZones.forEach(dz=>{
    const g=document.getElementById(dz.id); if(!g||dzMet[dz.id])return;
    const hit=Math.hypot(pt.x-dz.cx,pt.y-dz.cy)<dz.r;
    const c=g.querySelector('circle');
    c.setAttribute('stroke',hit?'#F59E0B':'#D97706');
    c.setAttribute('fill',hit?'rgba(245,158,11,.18)':'rgba(61,24,0,.45)');
  });
});

document.addEventListener('mouseup',ev=>{
  if(!dragging)return;
  const id=dragging; dragging=null;
  document.getElementById('drag-ghost').style.display='none';
  document.getElementById('chip-'+id)?.classList.remove('dragging');
  const st=getStages()[stageIdx];
  st.dropZones.forEach(dz=>{const g=document.getElementById(dz.id);if(!g)return;const c=g.querySelector('circle');c.setAttribute('stroke','#D97706');c.setAttribute('fill','rgba(61,24,0,.45)');});
  if(placed[id])return;
  const pt=svgPt(ev.clientX,ev.clientY);
  let hitDZ=null;
  st.dropZones.forEach(dz=>{if(!dzMet[dz.id]&&Math.hypot(pt.x-dz.cx,pt.y-dz.cy)<dz.r)hitDZ=dz;});
  if(!hitDZ){showFb('Drop into a highlighted zone','#D97706');return;}
  if(hitDZ.accepts.includes(id)){
    placed[id]=true; dzMet[hitDZ.id]=true;
    document.getElementById('chip-'+id).classList.add('used');
    document.getElementById(hitDZ.id).style.display='none';
    showFb(hitDZ.correctMsg,'#059669'); placeCell(id,hitDZ.cx,hitDZ.cy);
    if(st.dropZones.every(dz=>dzMet[dz.id])) setTimeout(showResult,1600);
  } else {
    showFb(st.wrongMsgs?.[id]||'✗ This cell type is not active here yet','#DC2626');
  }
});

function placeCell(id,cx,cy){
  const layer=document.getElementById('placed-layer'),def=CELL_DEFS[id];
  const g=e('g'); g.style.animation='popIn .4s ease'; def.draw(g,cx,cy,32);
  const l=e('text',{x:cx,y:cy+46,'text-anchor':'middle','font-size':'8.5',fill:'#FDE68A','font-family':"'DM Mono',monospace",'font-weight':'500'});
  l.textContent=def.label; g.appendChild(l); layer.appendChild(g);
}

function showResult(){
  const st=getStages()[stageIdx];
  document.getElementById('result-emoji').textContent=st.resultEmoji;
  document.getElementById('result-title').textContent=st.resultTitle;
  document.getElementById('result-msg').textContent=st.resultMsg;
  const hasNext=stageIdx<getStages().length-1;
  document.getElementById('next-btn').textContent=hasNext?'Next stage →':'See results';
  document.getElementById('result-overlay').classList.add('show');
  const prog=loadP(); prog[currentLevel]=prog[currentLevel]||{};
  prog[currentLevel]['stage'+stageIdx]=true; saveP(prog);
  const lvlProg=prog[currentLevel];
  const pct=Math.round((Object.keys(lvlProg).filter(k=>k.startsWith('stage')).length/getStages().length)*100);
  const fillId=currentLevel==='flu'?'prog-flu':'prog-bacterial';
  const fill=document.getElementById(fillId); if(fill)fill.style.width=pct+'%';
}
function closeResult(){document.getElementById('result-overlay').classList.remove('show');}
function nextStage(){
  document.getElementById('result-overlay').classList.remove('show');
  const st=getStages()[stageIdx];
  document.getElementById('tl-'+st.tlIndex).classList.replace('active','done');
  document.getElementById('tll-'+st.tlIndex).classList.replace('active','done');
  if(st.tlIndex<4)document.getElementById('tl-line-'+st.tlIndex).classList.add('done');
  if(stageIdx<getStages().length-1){loadStage(stageIdx+1);}
  else{showComplete();}
}
const LEVEL_COMPLETE={
  flu:{
    title:'Level 1 Complete',
    sub:'You\'ve traced the complete influenza immune response — from viral entry to long-lived memory.',
    concepts:[
      'TLR7 → IRF3/NF-κB → IFN-α/β + pro-inflammatory cytokines',
      'DC CCR7↑ → afferent lymphatics → T cell zone priming',
      'CD40L:CD40 → B cell CSR → IgG neutralizing antibodies',
      'CD8+ CTL → perforin/granzyme → viral clearance + Tcm/Tem memory',
    ],
  },
  bacterial:{
    title:'Level 2 Complete',
    sub:'You\'ve mapped the complete response to a Gram-positive bacterial infection — from PAMP recognition to adaptive resolution.',
    concepts:[
      'TLR2/NOD2 → NF-κB → IL-8 gradient → neutrophil recruitment',
      'C3b (alternative complement) + IgG → opsonization → CR1/Fcγ-R phagocytosis',
      'Oxidative burst (NADPH oxidase → ROS) + degranulation → bacterial killing',
      'DC/Th17 → IL-17A → G-CSF → sustained neutrophil reserve',
    ],
  },
  covid:{
    title:'Level 3 Complete',
    sub:'You\'ve mapped the SARS-CoV-2 immune response — from ACE2 entry to neutralizing antibody protection.',
    concepts:[
      'Spike RBD → ACE2/TMPRSS2 entry → IFN-I suppression (ORF3a, NSP1, PLpro)',
      'Delayed IFN → hyperactivated macrophage → IL-6/TNF-α/CXCL10 cytokine storm → ARDS',
      'PD-L1↑ on infected cells → PD-1 engagement → CD8+ T cell exhaustion + lymphopenia',
      'Anti-RBD nAb + memory B/T cells → durable protection (vaccine correlate)',
    ],
  },
  allergy:{
    title:'Level 4 Complete',
    sub:'You\'ve mapped the type I hypersensitivity response — from IgE sensitization to late-phase eosinophilic inflammation.',
    concepts:[
      'DC → Th2 (IL-4/IL-13) → B cell IgE class switch → FcεRI arming of mast cells',
      'Re-exposure: allergen crosslinks IgE → FcεRI aggregation → PLCγ/Ca²⁺/PKC → degranulation',
      'Acute phase: histamine · PGD₂ · LTC₄ → vasodilation, bronchoconstriction (minutes)',
      'Late phase: IL-5 + eotaxin → eosinophil MBP/ECP → epithelial damage → airway remodelling',
    ],
  },
  cancer:{
    title:'Level 5 Complete — All Levels Done!',
    sub:'You\'ve mapped cancer immunology — from tumour immune escape to CAR-T therapeutic elimination. You\'ve now completed the full Immunocascade curriculum.',
    concepts:[
      'Immune editing: elimination → equilibrium → escape via MHC-I loss + antigen editing',
      'PD-L1↑ on tumour → PD-1:TIL exhaustion → checkpoint blockade (anti-PD-1) reverses this',
      'Immunosuppressive TME: Tregs (IL-10/TGF-β) + MDSCs (arginase-1) + IDO + VEGF → cold tumour',
      'CAR-T: scFv + CD3ζ + co-stim → MHC-independent killing; CRS/ICANS managed with tocilizumab',
    ],
  },
};

function showComplete(){
  document.getElementById('complete-overlay').classList.add('show');
  const prog=loadP(); prog[currentLevel]=prog[currentLevel]||{};
  prog[currentLevel].levelComplete=true; saveP(prog);
  // Populate overlay content
  const lc=LEVEL_COMPLETE[currentLevel]||LEVEL_COMPLETE.flu;
  document.getElementById('complete-title').textContent=lc.title;
  document.getElementById('complete-sub').textContent=lc.sub;
  const cc=document.getElementById('complete-concepts');
  cc.innerHTML=lc.concepts.map(c=>`<div class="key-concept">${c}</div>`).join('');
  // Unlock canvas tab after Level 1
  if(currentLevel==='flu'){
    const tab=document.getElementById('tab-canvas');
    if(tab) tab.textContent='Canvas';
  }
  // Unlock next level card
  const unlocks={flu:'lv2',bacterial:'lv3',covid:'lv4',allergy:'lv5'};
  const nextId=unlocks[currentLevel];
  if(nextId){
    const card=document.getElementById(nextId+'-card');
    if(card){card.classList.remove('locked');card.onclick=()=>startLevel({lv2:'bacterial',lv3:'covid',lv4:'allergy',lv5:'cancer'}[nextId]);}
    const badge=document.getElementById(nextId+'-badge');
    if(badge){badge.textContent='Available';badge.className='lc-badge badge-open';}
  }
}
function closeComplete(){document.getElementById('complete-overlay').classList.remove('show');}

let fbT=null;
function showFb(msg,color='#FDE68A'){
  const fb=document.getElementById('feedback-bar');
  fb.textContent=msg; fb.style.borderColor=color; fb.style.color=color; fb.classList.add('show');
  if(fbT)clearTimeout(fbT); fbT=setTimeout(hideFb,3200);
}
function hideFb(){document.getElementById('feedback-bar').classList.remove('show');}

/* BG VIRIONS */
(function(){
  const wrap=document.getElementById('bg-virions');
  [[8,12],[22,68],[75,20],[88,55],[14,80],[60,8],[92,30],[45,90],[35,48]].forEach(([lp,tp])=>{
    const sz=40+Math.random()*55,svg=document.createElementNS(NS,'svg');
    svg.setAttribute('width',sz); svg.setAttribute('height',sz); svg.setAttribute('viewBox','0 0 60 60');
    const g=document.createElementNS(NS,'g');
    g.style.animation=`spinSlow ${8+Math.random()*10}s linear infinite${Math.random()>.5?' reverse':''}`;
    g.style.transformOrigin='30px 30px';
    g.appendChild(e('ellipse',{cx:30,cy:30,rx:14,ry:11,fill:'#FECACA',stroke:'#DC2626','stroke-width':'1.3'}));
    for(let j=0;j<6;j++){
      const a=(j/6)*Math.PI*2;
      g.appendChild(e('line',{x1:30+Math.cos(a)*13,y1:30+Math.sin(a)*13,x2:30+Math.cos(a)*21,y2:30+Math.sin(a)*21,stroke:'#DC2626','stroke-width':'1.1','stroke-linecap':'round'}));
      g.appendChild(e('circle',{cx:30+Math.cos(a)*23,cy:30+Math.sin(a)*23,r:'2.5',fill:'#991B1B'}));
    }
    svg.appendChild(g);
    const div=document.createElement('div'); div.className='bg-virion';
    div.style.left=lp+'%'; div.style.top=tp+'%';
    div.style.animation=`floatY ${6+Math.random()*8}s ease-in-out infinite ${Math.random()*4}s`;
    div.appendChild(svg); wrap.appendChild(div);
  });
})();

/* INIT */
(function(){
  const prog=loadP();
  const restoreBar=(key,barId,stages)=>{
    if(!prog[key])return;
    const n=Object.keys(prog[key]).filter(k=>k.startsWith('stage')).length;
    const fill=document.getElementById(barId);
    if(fill)fill.style.width=Math.round((n/stages.length)*100)+'%';
  };
  restoreBar('flu',       'prog-flu',        STAGES);
  restoreBar('bacterial', 'prog-bacterial',   STAGES_BACTERIAL);
  restoreBar('covid',     'prog-covid',       STAGES_COVID);
  restoreBar('allergy',   'prog-allergy',     STAGES_ALLERGY);
  restoreBar('cancer',    'prog-cancer',      STAGES_CANCER);

  // Restore canvas tab unlock
  if(prog.flu?.levelComplete){
    const tab=document.getElementById('tab-canvas'); if(tab) tab.textContent='Canvas';
  }
  // Restore level card unlocks
  const unlockCard=(cardId,badgeId,levelId)=>{
    const card=document.getElementById(cardId);
    if(card){card.classList.remove('locked');card.onclick=()=>startLevel(levelId);}
    const badge=document.getElementById(badgeId);
    if(badge){badge.textContent='Available';badge.className='lc-badge badge-open';}
  };
  if(prog.flu?.levelComplete)       unlockCard('lv2-card','lv2-badge','bacterial');
  if(prog.bacterial?.levelComplete) unlockCard('lv3-card','lv3-badge','covid');
  if(prog.covid?.levelComplete)     unlockCard('lv4-card','lv4-badge','allergy');
  if(prog.allergy?.levelComplete)   unlockCard('lv5-card','lv5-badge','cancer');
})();

/* ── TOUCH SUPPORT ── */
// Also hide trash zone on any document mouseup (covers drags that exit the SVG)
document.addEventListener('mouseup',()=>{
  document.getElementById('cv-trash-zone')?.classList.remove('active','over');
});
function touchToMouse(ev,type){
  const t=ev.touches[0]||ev.changedTouches[0];
  document.dispatchEvent(new MouseEvent(type,{clientX:t.clientX,clientY:t.clientY,bubbles:true}));
}
document.addEventListener('touchmove',ev=>{
  if(dragging||cvDraggingNode||cvConnectFrom){ev.preventDefault();touchToMouse(ev,'mousemove');}
},{passive:false});
document.addEventListener('touchend',ev=>{
  if(dragging||cvDraggingNode||cvConnectFrom) touchToMouse(ev,'mouseup');
},{passive:false});

// Story mode chips — touch start
document.addEventListener('touchstart',ev=>{
  const chip=ev.target.closest('.cell-chip');
  if(chip){
    const id=chip.id.replace('chip-','');
    const card=document.getElementById('chip-'+id);
    if(card&&!card.classList.contains('used')){
      const def=CELL_DEFS[id]; if(!def)return;
      ev.preventDefault();
      dragging=id; card.classList.add('dragging');
      const gh=document.getElementById('drag-ghost');
      const gs=svgW(62,62); def.draw(gs,31,31,28);
      gh.innerHTML=''; gh.appendChild(gs); gh.style.display='block';
      touchToMouse(ev,'mousemove');
    }
  }
  // Canvas chips — touch start
  const cvChip=ev.target.closest('.canvas-chip');
  if(cvChip){
    const id=cvChip.id.replace('cvchip-','');
    if(!cvPlaced[id]){
      ev.preventDefault();
      const def=CV_NODES_DEF.find(n=>n.id===id); if(!def)return;
      const t=ev.touches[0];
      const pt=cvSvgPoint(t.clientX,t.clientY);
      cvPlaceNode(id,pt.x,pt.y);
    }
  }
},{passive:false});
