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
 *   CV_VALID   : Set of "from->to" strings representing correct connections
 *
 * Canvas mode is locked behind story completion (prog.flu.levelComplete).
 * Nodes are draggable; connections are made by dragging from the ● dot.
 * Right-click a connection to delete it. Drag a node to the trash zone
 * (top-right corner) to remove it from the canvas.
 *
 * Depends on: cells.js (draw functions, NS constant)
 */


/* ═══════════════════════════════════════════════
   CANVAS MODE
═══════════════════════════════════════════════ */
const CV_NODES_DEF=[
  {id:'influenza', label:'Influenza\nvirion',  cat:'pathogen', draw:drawInfluenza},
  {id:'tlr7',      label:'TLR7\ndetection',    cat:'innate',   draw:drawTLR},
  {id:'nfkb',      label:'NF-κB\nsignaling',   cat:'innate',   draw:drawNFkB},
  {id:'ifn',       label:'IFN-α/β\nrelease',   cat:'cytokine', draw:drawCytokine},
  {id:'macrophage',label:'Macrophage',          cat:'innate',   draw:drawMacrophage},
  {id:'nkcell',    label:'NK cell',             cat:'innate',   draw:drawNK},
  {id:'dendritic', label:'Dendritic\ncell',     cat:'innate',   draw:drawDendritic},
  {id:'cd4',       label:'CD4+\nT cell',        cat:'adaptive', draw:drawCD4},
  {id:'cd8',       label:'CD8+\nT cell',        cat:'adaptive', draw:drawCD8},
  {id:'bcell',     label:'B cell',              cat:'adaptive', draw:drawBcell},
  {id:'antibody',  label:'IgG\nantibody',       cat:'outcome',  draw:drawAntibody},
  {id:'memory',    label:'Memory\ncell',        cat:'outcome',  draw:drawMemory},
  {id:'clearance', label:'Viral\nclearance',    cat:'outcome',  draw:drawClearance},
];

const CV_VALID=new Set([
  'influenza->tlr7','influenza->macrophage','tlr7->nfkb','tlr7->ifn',
  'nfkb->ifn','nfkb->macrophage','ifn->nkcell','ifn->dendritic',
  'macrophage->dendritic','nkcell->dendritic','dendritic->cd4','dendritic->cd8',
  'cd4->bcell','cd4->cd8','bcell->antibody','antibody->clearance',
  'cd8->clearance','cd4->memory','cd8->memory','bcell->memory',
]);

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

function cvInit(){
  cvInitDone=true;
  buildCvTray();
  cvRender();
  const cvSvg=document.getElementById('canvas-svg');
  cvSvg.addEventListener('mousemove',cvOnMove);
  cvSvg.addEventListener('mouseup',cvOnUp);
  cvSvg.addEventListener('dragover',ev=>ev.preventDefault());
  cvSvg.addEventListener('drop',cvOnDrop);
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
  return{x:(clientX-r.left)*(680/r.width),y:(clientY-r.top)*(520/r.height)};
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
  x=Math.max(60,Math.min(620,x)); y=Math.max(40,Math.min(520,y));
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
  const pt=cvSvgPoint(ev.clientX,ev.clientY);
  if(cvDraggingNode&&cvPlaced[cvDraggingNode]){
    const p=cvPlaced[cvDraggingNode];
    p.x=Math.max(60,Math.min(620,pt.x-cvDragOffset.x));
    p.y=Math.max(40,Math.min(520,pt.y-cvDragOffset.y));
    // Show trash zone and highlight if near top-right corner (SVG coords ~x>580 y<70)
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
  const coreRequired=['influenza','tlr7','ifn','macrophage','dendritic','cd4','cd8','clearance'];
  const missing=coreRequired.filter(id=>!placedIds.includes(id));

  const prompt=`You are an immunology educator evaluating a student's attempt to map the influenza immune response cascade.

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
