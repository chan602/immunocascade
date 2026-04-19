/**
 * canvas.js — Freeform pathway builder (Canvas Mode)
 *
 * Lets users drag immune cell nodes onto a canvas and draw connections
 * between them to map the immune cascade from memory. After building a
 * pathway, the Evaluate button sends it to Claude via the Cloudflare
 * Worker proxy for biological feedback.
 *
 * State:
 *   cvPlaced   : { [nodeId]: { id, x, y, def, z } }
 *   cvLinks    : [{ from, to }]
 *   CV_NODES_DEF / CV_VALID : set per level by cvSetLevel()
 *
 * Canvas mode unlocks after completing each level's story mode, and
 * shows the node set and valid connections for that specific level.
 * Nodes are draggable; connections are made by dragging from the ● dot.
 * Right-click a connection to delete it. Drag a node to the trash zone
 * (top-right corner) to remove it.
 *
 * Depends on: cells.js (draw functions, NS constant)
 */

/* ── Per-level canvas definitions ── */
const CV_LEVELS={
  flu:{
    title:'Influenza immune cascade',
    coreNodes:['influenza','tlr7','ifn','macrophage','dendritic','cd4','cd8','clearance'],
    nodes:[
      {id:'influenza', label:'Influenza\nvirion',  cat:'pathogen', draw:()=>drawInfluenza},
      {id:'tlr7',      label:'TLR7\ndetection',    cat:'innate',   draw:()=>drawTLR},
      {id:'nfkb',      label:'NF-κB\nsignaling',   cat:'innate',   draw:()=>drawNFkB},
      {id:'ifn',       label:'IFN-α/β\nrelease',   cat:'cytokine', draw:()=>drawCytokine},
      {id:'macrophage',label:'Macrophage',          cat:'innate',   draw:()=>drawMacrophage},
      {id:'nkcell',    label:'NK cell',             cat:'innate',   draw:()=>drawNK},
      {id:'dendritic', label:'Dendritic\ncell',     cat:'innate',   draw:()=>drawDendritic},
      {id:'cd4',       label:'CD4+\nT cell',        cat:'adaptive', draw:()=>drawCD4},
      {id:'cd8',       label:'CD8+\nT cell',        cat:'adaptive', draw:()=>drawCD8},
      {id:'bcell',     label:'B cell',              cat:'adaptive', draw:()=>drawBcell},
      {id:'antibody',  label:'IgG\nantibody',       cat:'outcome',  draw:()=>drawAntibody},
      {id:'memory',    label:'Memory\ncell',        cat:'outcome',  draw:()=>drawMemory},
      {id:'clearance', label:'Viral\nclearance',    cat:'outcome',  draw:()=>drawClearance},
    ],
    valid:new Set([
      'influenza->tlr7','influenza->macrophage','tlr7->nfkb','tlr7->ifn',
      'nfkb->ifn','nfkb->macrophage','ifn->nkcell','ifn->dendritic',
      'macrophage->dendritic','nkcell->dendritic','dendritic->cd4','dendritic->cd8',
      'cd4->bcell','cd4->cd8','bcell->antibody','antibody->clearance',
      'cd8->clearance','cd4->memory','cd8->memory','bcell->memory',
    ]),
    promptContext:'influenza immune response cascade (TLR7/innate → DC migration → T cell priming → B cell/GC → CTL clearance + memory)',
  },
  bacterial:{
    title:'Bacterial infection response',
    coreNodes:['bacteria','macrophage','neutrophil','complement','dendritic','cd4','antibody','clearance'],
    nodes:[
      {id:'bacteria',   label:'S. aureus',          cat:'pathogen', draw:()=>drawBacteria},
      {id:'tlr2',       label:'TLR2/NOD2\ndetection',cat:'innate',  draw:()=>drawTLR},
      {id:'macrophage', label:'Macrophage',          cat:'innate',  draw:()=>drawMacrophage},
      {id:'neutrophil', label:'Neutrophil',          cat:'innate',  draw:()=>drawNeutrophil},
      {id:'complement', label:'C3b\nopsonin',        cat:'innate',  draw:()=>drawComplement},
      {id:'il8',        label:'IL-8\ngradient',      cat:'cytokine',draw:()=>drawCytokine},
      {id:'dendritic',  label:'Dendritic\ncell',     cat:'adaptive',draw:()=>drawDendritic},
      {id:'cd4',        label:'CD4+\nTh17',          cat:'adaptive',draw:()=>drawCD4},
      {id:'antibody',   label:'IgG\nopsonin',        cat:'outcome', draw:()=>drawAntibody},
      {id:'memory',     label:'Memory\ncell',        cat:'outcome', draw:()=>drawMemory},
      {id:'clearance',  label:'Bacterial\nclearance',cat:'outcome', draw:()=>drawClearance},
    ],
    valid:new Set([
      'bacteria->tlr2','bacteria->complement','bacteria->macrophage',
      'tlr2->macrophage','tlr2->il8','macrophage->il8','macrophage->neutrophil',
      'il8->neutrophil','complement->neutrophil','complement->macrophage',
      'neutrophil->clearance','macrophage->clearance','macrophage->dendritic',
      'dendritic->cd4','cd4->antibody','antibody->clearance',
      'cd4->memory','antibody->memory',
    ]),
    promptContext:'Gram-positive bacterial infection (TLR2/NOD2 → IL-8 → neutrophil recruitment → C3b opsonization → phagocytosis → Th17 → IgG memory)',
  },
  covid:{
    title:'SARS-CoV-2 immune response',
    coreNodes:['coronavirus','ace2','macrophage','cytokine','exhaustedT','antibody','memory'],
    nodes:[
      {id:'coronavirus', label:'SARS-CoV-2',        cat:'pathogen', draw:()=>drawCoronavirus},
      {id:'ace2',        label:'ACE2\nentry',        cat:'pathogen', draw:()=>drawACE2},
      {id:'ifn_block',   label:'IFN-I\nsuppressed',  cat:'innate',   draw:()=>drawCytokine},
      {id:'macrophage',  label:'Macrophage\n(hyper)',cat:'innate',   draw:()=>drawMacrophage},
      {id:'cytokine',    label:'Cytokine\nstorm',    cat:'cytokine', draw:()=>drawCytokine},
      {id:'pdl1',        label:'PD-L1\nupregulation',cat:'innate',  draw:()=>drawTumorCell},
      {id:'exhaustedT',  label:'Exhausted\nTIL',     cat:'adaptive', draw:()=>drawExhaustedT},
      {id:'cd8',         label:'CD8+\nCTL',          cat:'adaptive', draw:()=>drawCD8},
      {id:'antibody',    label:'anti-RBD\nnAb',      cat:'outcome',  draw:()=>drawAntibody},
      {id:'memory',      label:'Memory\ncell',       cat:'outcome',  draw:()=>drawMemory},
      {id:'clearance',   label:'Viral\nclearance',   cat:'outcome',  draw:()=>drawClearance},
    ],
    valid:new Set([
      'coronavirus->ace2','ace2->ifn_block','ifn_block->macrophage',
      'macrophage->cytokine','cytokine->pdl1','pdl1->exhaustedT',
      'coronavirus->macrophage','macrophage->cd8','cd8->clearance',
      'cd8->memory','antibody->clearance','antibody->memory',
      'exhaustedT->clearance',
    ]),
    promptContext:'SARS-CoV-2 (ACE2 entry → IFN-I suppression → cytokine storm → PD-L1/PD-1 T cell exhaustion → nAb resolution)',
  },
  allergy:{
    title:'Type I hypersensitivity',
    coreNodes:['allergen','dendritic','cd4th2','ige','mastcell','histamine','eosinophil'],
    nodes:[
      {id:'allergen',   label:'Allergen\n(pollen)',  cat:'pathogen', draw:()=>drawCytokine},
      {id:'dendritic',  label:'Dendritic\ncell',     cat:'innate',   draw:()=>drawDendritic},
      {id:'cd4th2',     label:'CD4+\nTh2',           cat:'adaptive', draw:()=>drawCD4},
      {id:'bcell',      label:'B cell\n→ IgE',       cat:'adaptive', draw:()=>drawBcell},
      {id:'ige',        label:'IgE\nantibody',       cat:'adaptive', draw:()=>drawIgE},
      {id:'mastcell',   label:'Mast cell\n(armed)',  cat:'innate',   draw:()=>drawMastCell},
      {id:'histamine',  label:'Histamine\nPGD₂ LTC₄',cat:'cytokine',draw:()=>drawCytokine},
      {id:'eosinophil', label:'Eosinophil',          cat:'innate',   draw:()=>drawEosinophil},
      {id:'il5',        label:'IL-5\neotaxin',       cat:'cytokine', draw:()=>drawCytokine},
    ],
    valid:new Set([
      'allergen->dendritic','dendritic->cd4th2','cd4th2->bcell',
      'bcell->ige','ige->mastcell','allergen->mastcell',
      'mastcell->histamine','cd4th2->il5','il5->eosinophil',
      'histamine->eosinophil',
    ]),
    promptContext:'type I hypersensitivity/allergy (DC → Th2 → IgE class switch → FcεRI mast cell arming → allergen crosslinking → degranulation → late-phase eosinophil)',
  },
  cancer:{
    title:'Cancer immunology / TME',
    coreNodes:['tumorcell','pdl1','exhaustedT','treg','mdsc','cartcell','clearance'],
    nodes:[
      {id:'tumorcell',  label:'Tumour\ncell',        cat:'pathogen', draw:()=>drawTumorCell},
      {id:'mhc_loss',   label:'MHC-I\nloss',         cat:'pathogen', draw:()=>drawTumorCell},
      {id:'pdl1',       label:'PD-L1\nexpression',   cat:'pathogen', draw:()=>drawTumorCell},
      {id:'cd8',        label:'CD8+\nTIL',           cat:'adaptive', draw:()=>drawCD8},
      {id:'exhaustedT', label:'Exhausted\nT cell',   cat:'adaptive', draw:()=>drawExhaustedT},
      {id:'treg',       label:'Treg\nFoxP3+',        cat:'innate',   draw:()=>drawTreg},
      {id:'mdsc',       label:'MDSC\narginase-1',    cat:'innate',   draw:()=>drawMacrophage},
      {id:'vegf',       label:'VEGF\nIDO TGF-β',    cat:'cytokine', draw:()=>drawCytokine},
      {id:'antipd1',    label:'anti-PD-1\nblockade', cat:'outcome',  draw:()=>drawAntibody},
      {id:'cartcell',   label:'CAR-T\ncell',         cat:'outcome',  draw:()=>drawCARTCell},
      {id:'clearance',  label:'Tumour\nclearance',   cat:'outcome',  draw:()=>drawClearance},
    ],
    valid:new Set([
      'tumorcell->mhc_loss','tumorcell->pdl1','tumorcell->vegf',
      'pdl1->exhaustedT','mhc_loss->cd8','cd8->exhaustedT',
      'treg->exhaustedT','mdsc->exhaustedT','vegf->treg','vegf->mdsc',
      'antipd1->exhaustedT','antipd1->cd8','antipd1->clearance',
      'cartcell->clearance','cartcell->tumorcell','cd8->clearance',
    ]),
    promptContext:'cancer immunology/TME (MHC-I loss → CTL evasion, PD-L1 → TIL exhaustion, Treg/MDSC/IDO/VEGF immunosuppression, CAR-T + anti-PD-1 → clearance)',
  },
};

// Active canvas level — set by cvSetLevel(), called from game.js setMode()
let CV_NODES_DEF=CV_LEVELS.flu.nodes.map(n=>({...n,draw:n.draw()}));
let CV_VALID=CV_LEVELS.flu.valid;
let CV_CONTEXT=CV_LEVELS.flu.promptContext;
let CV_CORE=CV_LEVELS.flu.coreNodes;

function cvSetLevel(levelId){
  const def=CV_LEVELS[levelId]||CV_LEVELS.flu;
  // Resolve draw function references (stored as thunks to avoid hoisting issues)
  CV_NODES_DEF=def.nodes.map(n=>({...n,draw:n.draw()}));
  CV_VALID=def.valid;
  CV_CONTEXT=def.promptContext;
  CV_CORE=def.coreNodes;
}

const CAT_COLORS={
  pathogen:{fill:'#FEE2E2',stroke:'#EF4444',text:'#7F1D1D'},
  innate:  {fill:'#FEF3C7',stroke:'#F59E0B',text:'#78350F'},
  cytokine:{fill:'#FCE7F3',stroke:'#EC4899',text:'#831843'},
  adaptive:{fill:'#EDE9FE',stroke:'#8B5CF6',text:'#4C1D95'},
  outcome: {fill:'#D1FAE5',stroke:'#10B981',text:'#064E3B'},
};

let cvInitDone=false;
let cvPlaced={};  // id -> {id,x,y,def,z}
let cvLinks=[];   // [{from,to}]
let cvDraggingNode=null,cvDragOffset={x:0,y:0};
let cvConnectFrom=null,cvTempLine=null;
let cvNextZ=1;
// Pan state
let cvPanX=0,cvPanY=0,cvPanning=false,cvPanStart={x:0,y:0};
const CV_W=1400,CV_H=1000; // logical canvas size

function cvApplyPan(){
  document.getElementById('cv-world').setAttribute('transform',`translate(${cvPanX},${cvPanY})`);
}

function cvInit(){
  cvInitDone=true;
  buildCvTray();
  cvRender();
  const cvSvg=document.getElementById('canvas-svg');
  cvSvg.addEventListener('mousemove',cvOnMove);
  cvSvg.addEventListener('mouseup',cvOnUp);
  cvSvg.addEventListener('dragover',ev=>ev.preventDefault());
  cvSvg.addEventListener('drop',cvOnDrop);
  // Pan: mousedown on background starts pan
  cvSvg.addEventListener('mousedown',ev=>{
    // Only pan if clicking directly on svg background or grid rect (not a node/link)
    if(ev.target===cvSvg||ev.target.tagName==='rect'&&ev.target.getAttribute('fill')==='#1a0800'||
       ev.target.tagName==='rect'&&ev.target.getAttribute('fill')==='url(#cv-grid)'){
      cvPanning=true;
      cvPanStart={x:ev.clientX-cvPanX,y:ev.clientY-cvPanY};
      cvSvg.classList.add('panning');
      ev.preventDefault();
    }
  });
}

function buildCvTray(){
  const row=document.getElementById('canvas-tray-row');
  row.innerHTML='';
  CV_NODES_DEF.forEach(nd=>{
    const card=document.createElement('div');
    card.className='canvas-chip'; card.id='cvchip-'+nd.id;
    card.draggable=true;
    const svg=svgW(52,52);
    if(nd.draw){nd.draw(svg,26,26,22);}
    else{
      const col=CAT_COLORS[nd.cat];
      const r=e('rect',{x:4,y:8,width:44,height:36,rx:8,fill:col.fill,stroke:col.stroke,'stroke-width':'1.4'});
      svg.appendChild(r);
      nd.label.split('\n').forEach((line,i)=>{
        const t=e('text',{x:26,y:22+i*13,'text-anchor':'middle','dominant-baseline':'central','font-size':'9','font-weight':'600',fill:col.text,'font-family':'sans-serif'});
        t.textContent=line; svg.appendChild(t);
      });
    }
    const nm=document.createElement('div'); nm.className='canvas-chip-name'; nm.textContent=nd.label.replace('\n',' ');
    card.appendChild(svg); card.appendChild(nm);
    card.addEventListener('dragstart',ev=>ev.dataTransfer.setData('cvNodeId',nd.id));
    row.appendChild(card);
  });
}

function cvSvgPoint(clientX,clientY){
  const svg=document.getElementById('canvas-svg');
  const r=svg.getBoundingClientRect();
  // Account for pan offset — raw SVG point minus pan
  const rawX=(clientX-r.left)*(CV_W/r.width);
  const rawY=(clientY-r.top)*(CV_H/r.height);
  return{x:rawX-cvPanX, y:rawY-cvPanY};
}

function cvOnDrop(ev){
  ev.preventDefault();
  const id=ev.dataTransfer.getData('cvNodeId'); if(!id||cvPlaced[id])return;
  const pt=cvSvgPoint(ev.clientX,ev.clientY);
  cvPlaceNode(id,pt.x,pt.y);
}

function cvPlaceNode(id,x,y){
  if(cvPlaced[id])return;
  const def=CV_NODES_DEF.find(n=>n.id===id); if(!def)return;
  x=Math.max(60,Math.min(CV_W-60,x)); y=Math.max(40,Math.min(CV_H-60,y));
  cvPlaced[id]={id,x,y,def,z:cvNextZ++};
  document.getElementById('cvchip-'+id)?.classList.add('placed');
  document.getElementById('canvas-hint').style.display='none';
  cvRender();
}

function cvRender(){
  cvRenderLinks();
  cvRenderNodes();
  document.getElementById('cv-node-count').textContent=Object.keys(cvPlaced).length;
  document.getElementById('cv-link-count').textContent=cvLinks.length;
}

function cvRenderLinks(){
  const layer=document.getElementById('cv-links'); layer.innerHTML='';
  cvLinks.forEach((lk,idx)=>{
    const a=cvPlaced[lk.from],b=cvPlaced[lk.to]; if(!a||!b)return;
    const valid=CV_VALID.has(`${lk.from}->${lk.to}`)||CV_VALID.has(`${lk.to}->${lk.from}`);
    const col=valid?'#10B981':'#EF4444';
    // visible line
    const ln=e('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:col,'stroke-width':'2','marker-end':'url(#cv-arr)','stroke-opacity':'.85'});
    // wide invisible hit area for easier right-click
    const hit=e('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'transparent','stroke-width':'14',cursor:'pointer'});
    hit.addEventListener('contextmenu',ev=>{
      ev.preventDefault();
      cvLinks.splice(idx,1);
      cvShowFb('Connection removed — right-click any link to delete','#D97706');
      cvRender();
    });
    hit.title='Right-click to remove';
    layer.appendChild(ln);
    layer.appendChild(hit);
  });
}

function cvRenderNodes(){
  const layer=document.getElementById('cv-nodes'); layer.innerHTML='';
  Object.values(cvPlaced).sort((a,b)=>a.z-b.z).forEach(p=>{
    const def=p.def,col=CAT_COLORS[def.cat];
    const g=e('g',{cursor:'grab','data-id':p.id});
    // background card
    const W=80,H=50;
    g.appendChild(e('rect',{x:p.x-W/2,y:p.y-H/2,width:W,height:H,rx:10,fill:col.fill,stroke:col.stroke,'stroke-width':'1.5'}));
    // antibody draw fn renders huge at s=14 — use label-only for it
    const useIllustration=def.draw && def.id!=='antibody';
    if(useIllustration){
      const ig=e('g'); def.draw(ig,p.x-18,p.y,14); g.appendChild(ig);
      def.label.split('\n').forEach((line,i)=>{
        const t=e('text',{x:p.x+8,y:p.y-5+i*13,'text-anchor':'middle','dominant-baseline':'central','font-size':'8','font-weight':'700',fill:col.text,'font-family':'sans-serif'});
        t.textContent=line; g.appendChild(t);
      });
    } else {
      def.label.split('\n').forEach((line,i)=>{
        const t=e('text',{x:p.x,y:p.y-6+i*13,'text-anchor':'middle','dominant-baseline':'central','font-size':'9','font-weight':'700',fill:col.text,'font-family':'sans-serif'});
        t.textContent=line; g.appendChild(t);
      });
    }
    // connect dot (top-right)
    const dot=e('circle',{cx:p.x+W/2-6,cy:p.y-H/2+6,r:5,fill:col.stroke,cursor:'crosshair','data-connect':p.id});
    g.appendChild(dot);
    // drag handler
    g.addEventListener('mousedown',ev=>{
      if(ev.target.getAttribute('data-connect'))return;
      ev.preventDefault(); ev.stopPropagation(); p.z=cvNextZ++;
      cvDraggingNode=p.id;
      const pt=cvSvgPoint(ev.clientX,ev.clientY);
      cvDragOffset={x:pt.x-p.x,y:pt.y-p.y};
    });
    // connect handler
    dot.addEventListener('mousedown',ev=>{
      ev.preventDefault(); ev.stopPropagation(); cvConnectFrom=p.id;
      const pt=cvSvgPoint(ev.clientX,ev.clientY);
      cvTempLine=e('line',{x1:p.x,y1:p.y,x2:pt.x,y2:pt.y,stroke:col.stroke,'stroke-width':'1.5','stroke-dasharray':'5 4','marker-end':'url(#cv-arr)'});
      document.getElementById('cv-drag-line').appendChild(cvTempLine);
    });
    layer.appendChild(g);
  });
}

function cvOnMove(ev){
  // Pan handler
  if(cvPanning&&!cvDraggingNode&&!cvConnectFrom){
    cvPanX=ev.clientX-cvPanStart.x;
    cvPanY=ev.clientY-cvPanStart.y;
    cvApplyPan();
    return;
  }
  const pt=cvSvgPoint(ev.clientX,ev.clientY);
  if(cvDraggingNode&&cvPlaced[cvDraggingNode]){
    const p=cvPlaced[cvDraggingNode];
    p.x=Math.max(60,Math.min(CV_W-60,pt.x-cvDragOffset.x));
    p.y=Math.max(40,Math.min(CV_H-60,pt.y-cvDragOffset.y));
    // Show trash zone and highlight if near top-right corner of screen
    const trashEl=document.getElementById('cv-trash-zone');
    trashEl.classList.add('active');
    const nearTrash=(pt.x-cvDragOffset.x)>540&&(pt.y-cvDragOffset.y)<80;
    trashEl.classList.toggle('over',nearTrash);
    cvRender();
  }
  if(cvConnectFrom&&cvTempLine){
    cvTempLine.setAttribute('x2',pt.x); cvTempLine.setAttribute('y2',pt.y);
  }
}

function cvOnUp(ev){
  // Stop panning
  if(cvPanning){
    cvPanning=false;
    document.getElementById('canvas-svg').classList.remove('panning');
  }
  // Hide trash zone
  const trashEl=document.getElementById('cv-trash-zone');
  trashEl.classList.remove('active','over');

  if(cvDraggingNode){
    const pt=cvSvgPoint(ev.clientX,ev.clientY);
    const p=cvPlaced[cvDraggingNode];
    // Remove if dropped into trash zone (SVG x>540 y<80, accounting for offset)
    if(p&&(pt.x-cvDragOffset.x)>540&&(pt.y-cvDragOffset.y)<80){
      const label=p.def.label.replace('\n',' ');
      // Remove any links involving this node
      cvLinks=cvLinks.filter(l=>l.from!==cvDraggingNode&&l.to!==cvDraggingNode);
      document.getElementById('cvchip-'+cvDraggingNode)?.classList.remove('placed');
      delete cvPlaced[cvDraggingNode];
      cvShowFb(`Removed ${label}`,  '#D97706');
      cvRender();
    }
    cvDraggingNode=null;
  }

  if(cvConnectFrom){
    const pt=cvSvgPoint(ev.clientX,ev.clientY);
    let target=null,minD=45;
    Object.values(cvPlaced).forEach(p=>{
      if(p.id===cvConnectFrom)return;
      const d=Math.hypot(p.x-pt.x,p.y-pt.y);
      if(d<minD){minD=d;target=p.id;}
    });
    if(target){
      const exists=cvLinks.find(l=>(l.from===cvConnectFrom&&l.to===target)||(l.from===target&&l.to===cvConnectFrom));
      if(!exists){
        cvLinks.push({from:cvConnectFrom,to:target});
        const valid=CV_VALID.has(`${cvConnectFrom}->${target}`)||CV_VALID.has(`${target}->${cvConnectFrom}`);
        const fa=CV_NODES_DEF.find(n=>n.id===cvConnectFrom)?.label.replace('\n',' ');
        const tb=CV_NODES_DEF.find(n=>n.id===target)?.label.replace('\n',' ');
        cvShowFb(valid?`✓ ${fa} → ${tb}`:`✗ Unexpected — does this make biological sense?`,valid?'#10B981':'#EF4444');
        document.getElementById('cv-link-count').textContent=cvLinks.length;
      }
    }
    document.getElementById('cv-drag-line').innerHTML='';
    cvTempLine=null; cvConnectFrom=null;
    cvRender();
  }
}

function cvReset(){
  cvPlaced={}; cvLinks=[]; cvNextZ=1;
  cvPanX=0; cvPanY=0; cvApplyPan();
  document.getElementById('cv-drag-line').innerHTML='';
  document.getElementById('canvas-hint').style.display='';
  document.getElementById('ai-empty').style.display='';
  document.getElementById('ai-result').style.display='none';
  document.getElementById('ai-loading').style.display='none';
  document.getElementById('canvas-hint').style.display='';
  CV_NODES_DEF.forEach(nd=>document.getElementById('cvchip-'+nd.id)?.classList.remove('placed'));
  cvRender();
}

async function cvEvaluate(){
  const placedIds=Object.keys(cvPlaced);
  if(placedIds.length===0){cvShowFb('Add some nodes first','#D97706');return;}

  const correctLinks=cvLinks.filter(l=>CV_VALID.has(`${l.from}->${l.to}`)||CV_VALID.has(`${l.to}->${l.from}`)).length;
  const wrongLinks=cvLinks.length-correctLinks;
  const pct=cvLinks.length===0?0:Math.round((correctLinks/cvLinks.length)*100);

  const nodeList=placedIds.join(', ');
  const linkList=cvLinks.map(l=>`${l.from} → ${l.to} (${CV_VALID.has(`${l.from}->${l.to}`)||CV_VALID.has(`${l.to}->${l.from}`)?'correct':'incorrect'})`).join('\n');
  const missing=CV_CORE.filter(id=>!placedIds.includes(id));

  const prompt=`You are an immunology educator evaluating a student's attempt to map the ${CV_CONTEXT}.

The student placed these nodes: ${nodeList}
Their connections:
${linkList||'(none)'}
Missing core nodes: ${missing.join(', ')||'none'}
Connection accuracy: ${pct}% (${correctLinks} correct, ${wrongLinks} incorrect)

Give concise feedback in 3 short paragraphs:
1. What they got right (be specific about the biology)
2. What is missing or incorrect and why it matters mechanistically
3. One key concept to focus on next

Be direct, use proper immunology terminology, keep each paragraph to 2-3 sentences. Do not use markdown headers or bullet points.`;

  const panel=document.getElementById('ai-panel-inner');
  const loading=document.getElementById('ai-loading');
  const result=document.getElementById('ai-result');
  const empty=document.getElementById('ai-empty');
  const accEl=document.getElementById('ai-accuracy');
  const textEl=document.getElementById('ai-text');
  const btn=document.getElementById('eval-btn');

  empty.style.display='none';
  result.style.display='none';
  loading.style.display='flex';
  btn.disabled=true; btn.textContent='Evaluating...';

  try{
    const res=await fetch('https://anthropic-proxy.emailtonathan.workers.dev',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-App-Secret':'3w-daskinvoden',
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:400,
        messages:[{role:'user',content:prompt}]
      })
    });
    const data=await res.json();
    console.log('[immunocascade] proxy response status:',res.status,'body:',JSON.stringify(data).slice(0,400));
    // Handle both direct Anthropic shape {content:[{text}]} and possible proxy wrapper {response:{content:[{text}]}}
    const text=
      data?.content?.[0]?.text ||
      data?.response?.content?.[0]?.text ||
      data?.text ||
      data?.message ||
      (typeof data==='string'?data:null) ||
      'Unable to get feedback — check console for response details.';
    if(!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0,200)}`);
    loading.style.display='none';
    accEl.textContent=`${pct}% accuracy — ${correctLinks} correct, ${wrongLinks} incorrect`;
    accEl.style.color=pct>=80?'#10B981':pct>=50?'#F59E0B':'#EF4444';
    textEl.textContent=text;
    result.style.display='block';
  }catch(err){
    console.error('[immunocascade] eval error:',err);
    loading.style.display='none';
    textEl.textContent=`Error: ${err.message}. Check the browser console (F12) for details.`;
    accEl.textContent=`${pct}% accuracy`;
    result.style.display='block';
  }finally{
    btn.disabled=false; btn.textContent='Evaluate ↗';
  }
}

let cvFbTimer=null;
function cvShowFb(msg,color='#FDE68A'){
  const fb=document.getElementById('cv-feedback');
  fb.textContent=msg; fb.style.borderColor=color; fb.style.color=color; fb.classList.add('show');
  if(cvFbTimer)clearTimeout(cvFbTimer); cvFbTimer=setTimeout(()=>fb.classList.remove('show'),3500);
}

// Continue pan even if mouse leaves the SVG
document.addEventListener('mousemove',ev=>{
  if(cvPanning&&!cvDraggingNode&&!cvConnectFrom){
    cvPanX=ev.clientX-cvPanStart.x;
    cvPanY=ev.clientY-cvPanStart.y;
    cvApplyPan();
  }
});
document.addEventListener('mouseup',ev=>{
  if(cvPanning){
    cvPanning=false;
    document.getElementById('canvas-svg')?.classList.remove('panning');
  }
});
