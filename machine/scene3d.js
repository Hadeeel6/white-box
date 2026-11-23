/* White Box · Inside the machine: the 3D model.
   One persistent three.js scene of a language model, built as a stack you can walk up:
   token tray → number columns (embeddings) → 6 layers with 12 attention heads each → next-word odds → temperature dial.
   A second mode shows a loss landscape for the "learning from mistakes" lesson.
   machine.js owns the lesson logic and calls apply(state). This file only draws. */
window.MXScene=function(THREE,opts){
'use strict';
opts=opts||{};
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:false});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.setClearColor(0x10141F,1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
const canvas=renderer.domElement;canvas.className='mx-canvas';canvas.tabIndex=0;
canvas.setAttribute('role','img');
canvas.setAttribute('aria-label','3D model of a language model. Drag to turn it, scroll or pinch to zoom, shift-drag to move. Arrow keys also turn it.');
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x10141F,34,70);
const camera=new THREE.PerspectiveCamera(38,1.6,0.1,200);
scene.add(new THREE.HemisphereLight(0xDDE4FF,0x1A1F2E,1.6));
const sun=new THREE.DirectionalLight(0xFFFFFF,1.5);sun.position.set(6,14,10);scene.add(sun);
const rim=new THREE.DirectionalLight(0x8EA4FF,0.6);rim.position.set(-8,6,-10);scene.add(rim);

const COL={tray:0x1C2236,token:0xE8EBF4,tokenHi:0xFF8A3D,slab:0x2C3554,slabEdge:0x4A5680,head:0x3B4466,headHot:0xFFC845,bar:0x5B6B95,barHi:0xFF8A3D,arc:0xFF8A3D,lane:0x8EA4FF,dial:0x262D41,needle:0xFF8A3D,ko:0x3B4258};
const root=new THREE.Group();scene.add(root);
const G={};['platform','tokens','embed','lanes','stack','heads','arcs','out','dial','flow','labels'].forEach(k=>{G[k]=new THREE.Group();G[k].name=k;root.add(G[k])});
const lossG=new THREE.Group();lossG.visible=false;scene.add(lossG);

/* ---------- helpers ---------- */
const disposeGroup=g=>{for(let i=g.children.length-1;i>=0;i--){const o=g.children[i];g.remove(o);o.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material){const m=x.material;if(m.map)m.map.dispose();m.dispose()}})}};
function labelCanvas(text,o){o=o||{};const fs=o.size||44,pad=o.pad==null?14:o.pad;const font=`${o.weight||600} ${fs}px Lexend, system-ui, sans-serif`;
  const c=document.createElement('canvas');const x=c.getContext('2d');x.font=font;const w=Math.ceil(x.measureText(text).width)+pad*2,h=fs+pad*2;
  c.width=Math.max(8,w);c.height=h;x.font=font;
  if(o.bg){x.fillStyle=o.bg;const r=Math.min(h/2,o.radius||14);x.beginPath();x.moveTo(r,0);x.arcTo(w,0,w,h,r);x.arcTo(w,h,0,h,r);x.arcTo(0,h,0,0,r);x.arcTo(0,0,w,0,r);x.fill();
    if(o.border){x.strokeStyle=o.border;x.lineWidth=3;x.stroke()}}
  x.fillStyle=o.fg||'#E8EBF4';x.textBaseline='middle';x.textAlign='center';x.fillText(text,w/2,h/2+2);return c}
function sprite(text,o,height){const c=labelCanvas(text,o);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const m=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:o&&o.depthTest===false?false:true});const s=new THREE.Sprite(m);const H=height||0.4;s.scale.set(H*c.width/c.height,H,1);s.renderOrder=5;return s}
const std=(color,extra)=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:0.62,metalness:0.08},extra||{}));
function hash(a,b){let h=(a*374761393+b*668265263)>>>0;h=(h^(h>>>13))*1274126177>>>0;return ((h^(h>>>16))>>>0)/4294967295}
const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- fixed parts: platform, stack, heads, out tray, dial ---------- */
const NL=6,NH=12,STACK_Y0=2.75,STACK_DY=0.62,STACK_Z=0.5;
let W=10;  // stack width, adapts to the number of tokens
const anchors={};
function buildFixed(){
  disposeGroup(G.platform);disposeGroup(G.stack);disposeGroup(G.heads);disposeGroup(G.dial);disposeGroup(G.labels);
  const plat=new THREE.Mesh(new THREE.BoxGeometry(W+5,0.35,8.2),std(COL.tray,{roughness:0.85}));plat.position.set(0,-0.18,1.4);G.platform.add(plat);
  const grid=new THREE.GridHelper(W+5,Math.round(W+5),0x2A3150,0x20263A);grid.position.set(0,0.005,1.4);grid.scale.z=8.2/(W+5);G.platform.add(grid);
  for(let l=0;l<NL;l++){
    const y=STACK_Y0+l*STACK_DY;
    const slab=new THREE.Mesh(new THREE.BoxGeometry(W,0.24,2.6),std(COL.slab,{transparent:true,opacity:0.9,emissive:0x8EA4FF,emissiveIntensity:0}));
    slab.position.set(0,y,STACK_Z);slab.userData.kind='layer';slab.userData.layer=l;G.stack.add(slab);
    const edge=new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry),new THREE.LineBasicMaterial({color:COL.slabEdge,transparent:true,opacity:0.7}));edge.position.copy(slab.position);G.stack.add(edge);
    const lab=sprite('Layer '+(l+1),{fg:'#A4ACC4',size:34,weight:600},0.42);lab.position.set(-W/2-1.15,y,STACK_Z+1.1);G.labels.add(lab);
    for(let h=0;h<NH;h++){const tile=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.13,0.05),std(COL.head,{emissive:COL.headHot,emissiveIntensity:0}));
      tile.position.set(W/2-0.35-h*0.32,y,STACK_Z+1.31);tile.userData.layer=l;tile.userData.head=h;G.heads.add(tile)}}
  const outY=STACK_Y0+NL*STACK_DY+0.05;
  const tray=new THREE.Mesh(new THREE.BoxGeometry(W,0.14,2.0),std(0x232A40));tray.position.set(0,outY,STACK_Z);G.stack.add(tray);
  const tl=sprite('Next-word odds',{fg:'#8EA4FF',size:34},0.46);tl.position.set(-W/2-1.6,outY+0.1,STACK_Z+1.1);G.labels.add(tl);
  const hl=sprite('12 heads per layer',{fg:'#A4ACC4',size:30},0.36);hl.position.set(W/2-2.1,STACK_Y0-0.42,STACK_Z+1.4);G.labels.add(hl);
  // dial
  const dx=W/2+1.9,dy=outY+1.2;
  const face=new THREE.Mesh(new THREE.CylinderGeometry(0.95,0.95,0.16,48),std(COL.dial,{metalness:0.2}));face.rotation.x=Math.PI/2;face.position.set(dx,dy,STACK_Z);G.dial.add(face);
  for(let i=0;i<=10;i++){const a=lerp(-2.2,2.2,i/10);const t=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.16,0.03),new THREE.MeshBasicMaterial({color:i<3?0x6E8BFF:i>7?0xFF6B5A:0xC9D2E8}));
    t.position.set(dx+Math.sin(a)*0.78,dy+Math.cos(a)*0.78,STACK_Z+0.1);t.rotation.z=-a;G.dial.add(t)}
  const needle=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.7,0.05),std(COL.needle,{emissive:COL.needle,emissiveIntensity:0.4}));needle.geometry.translate(0,0.33,0);needle.position.set(dx,dy,STACK_Z+0.12);G.dial.add(needle);G.dial.userData.needle=needle;
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.11,0.1,20),std(0xE8EBF4));hub.rotation.x=Math.PI/2;hub.position.set(dx,dy,STACK_Z+0.16);G.dial.add(hub);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,dy-0.1,12),std(0x2A3150));post.position.set(dx,(dy-0.1)/2,STACK_Z-0.2);G.dial.add(post);
  G.dial.userData.label=null;G.dial.userData.pos=new THREE.Vector3(dx,dy,STACK_Z);
  anchors.layers=new THREE.Vector3(-W/2,STACK_Y0+2.5*STACK_DY,STACK_Z+1.3);
  anchors.heads=new THREE.Vector3(W/2-2,STACK_Y0+4*STACK_DY,STACK_Z+1.35);
  anchors.output=new THREE.Vector3(0,outY+1.6,STACK_Z);
  anchors.sampler=new THREE.Vector3(dx,dy+1,STACK_Z);
  cur.outY=outY;}

/* ---------- tokens + embeddings + lanes ---------- */
const cur={pieces:[],ids:[],xs:[],infl:null,ko:-1,probs:[],T:1,focus:'overview',flowT:-1,outY:0,showIds:false,emb:true};
const showPiece=p=>{const s=String(p);if(s==='')return '∅';return s.replace(/^ /,'·').replace(/\n/g,'⏎').replace(/�/g,'*')};
function setTokens(pieces,ids,o){
  o=o||{};cur.pieces=pieces.slice(0,14);cur.ids=(ids||[]).slice(0,14);cur.showIds=!!o.showIds;cur.emb=o.emb!==false;
  const n=Math.max(1,cur.pieces.length);const s=Math.min(1.5,12.5/n);
  const need=Math.max(8,n*s+1.6);if(Math.abs(need-W)>0.01){W=need;buildFixed();applyProbs(cur.probs,true);setTemp(cur.T,true)}
  disposeGroup(G.tokens);disposeGroup(G.embed);disposeGroup(G.lanes);
  cur.xs=cur.pieces.map((_,i)=>(i-(n-1)/2)*s);
  cur.pieces.forEach((p,i)=>{const x=cur.xs[i];const last=i===n-1;
    const m=new THREE.Mesh(new THREE.BoxGeometry(s*0.84,0.42,0.95),std(last?COL.tokenHi:COL.token,{emissive:last?COL.tokenHi:0x000000,emissiveIntensity:last?0.15:0}));
    m.position.set(x,0.24,3.1);m.userData.kind='token';m.userData.i=i;G.tokens.add(m);
    const lab=sprite(showPiece(p),{fg:last?'#1C1E22':'#161A26',bg:last?'#FFC48F':'#FFFFFF',size:40,pad:10,radius:10},0.5);lab.position.set(x,0.86,3.3);lab.userData.i=i;G.tokens.add(lab);
    if(cur.showIds&&cur.ids[i]!=null){const id=sprite('#'+cur.ids[i],{fg:'#AFC0FF',size:30},0.34);id.position.set(x,0.02,3.85);G.tokens.add(id)}
    if(cur.emb){for(let j=0;j<8;j++){const v=hash(cur.ids[i]||(i*977+p.length*31),j)*2-1;
      const c=new THREE.Color(v>0?0xFF8A3D:0x6E8BFF).lerp(new THREE.Color(0x2A3150),1-Math.abs(v));
      const cube=new THREE.Mesh(new THREE.BoxGeometry(Math.min(0.34,s*0.36),0.16,0.34),std(c,{emissive:c,emissiveIntensity:0.25}));
      cube.position.set(x,1.12+j*0.19,2.45);G.embed.add(cube)}}
    const pts=[new THREE.Vector3(x,2.6,STACK_Z+0.6),new THREE.Vector3(x,cur.outY-0.1,STACK_Z+0.6)];
    const lane=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:COL.lane,transparent:true,opacity:last?0.55:0.22}));G.lanes.add(lane)});
  anchors.tokens=new THREE.Vector3(cur.xs[0]||0,0.5,3.4);
  anchors.last=new THREE.Vector3(cur.xs[n-1]||0,0.9,3.3);
  anchors.embed=new THREE.Vector3(cur.xs[Math.floor((n-1)/2)]||0,2.0,2.45);
  setInfluence(cur.infl,cur.ko,true)}

/* ---------- influence arcs (which earlier words mattered) ---------- */
function setInfluence(arr,ko,force){
  if(!force&&JSON.stringify(arr)===JSON.stringify(cur.infl)&&ko===cur.ko)return;
  cur.infl=arr?arr.slice():null;cur.ko=ko==null?-1:ko;disposeGroup(G.arcs);
  G.tokens.children.forEach(m=>{if(m.isMesh&&m.userData.kind==='token'){const i=m.userData.i;const isKo=i===cur.ko;m.material.color.set(isKo?COL.ko:(i===cur.pieces.length-1?COL.tokenHi:COL.token));m.material.opacity=isKo?0.5:1;m.material.transparent=isKo}});
  if(!arr)return;const n=cur.pieces.length;if(n<2)return;
  const vals=arr.map(v=>v==null?0:v);const mx=Math.max(...vals,1e-6);const sum=vals.reduce((a,b)=>a+b,0)||1;
  const xl=cur.xs[n-1];let apex=null,best=-1;
  for(let i=0;i<n-1;i++){const w=vals[i]/mx;if(w<=0)continue;
    const xa=cur.xs[i];const h=0.55+Math.abs(xl-xa)*0.32;
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(xl,0.98,3.15),new THREE.Vector3((xl+xa)/2,0.98+h,3.35),new THREE.Vector3(xa,0.98,3.15));
    const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,40,0.018+0.1*w,10,false),new THREE.MeshStandardMaterial({color:COL.arc,emissive:COL.arc,emissiveIntensity:0.35+0.4*w,transparent:true,opacity:0.3+0.65*w}));
    G.arcs.add(tube);
    const pct=Math.round(vals[i]/sum*100);
    if(pct>=6){const lab=sprite(pct+'%',{fg:'#FFD8B8',size:30,bg:'rgba(22,26,38,.75)',pad:8},0.34);const top=curve.getPoint(0.5);lab.position.set(top.x,top.y+0.2,top.z);G.arcs.add(lab)}
    if(vals[i]>best){best=vals[i];apex=curve.getPoint(0.5)}}
  anchors.attention=apex||anchors.last}

/* ---------- next-word odds bars ---------- */
const bars=[];
function applyProbs(list,force){
  list=(list||[]).slice(0,8);
  if(!force&&JSON.stringify(list)===JSON.stringify(cur.probs))return;
  cur.probs=list;disposeGroup(G.out);bars.length=0;
  const n=list.length;if(!n)return;const gap=Math.min(1.15,(W-0.6)/n);
  const mx=Math.max(...list.map(x=>x[1]),0.01);
  list.forEach((x,i)=>{const p=x[1];const h=0.08+1.9*(p/Math.max(mx,0.25));
    const geo=new THREE.BoxGeometry(gap*0.62,1,0.62);geo.translate(0,0.5,0);
    const b=new THREE.Mesh(geo,std(i===0?COL.barHi:COL.bar,{emissive:i===0?COL.barHi:0x000000,emissiveIntensity:i===0?0.25:0}));
    const bx=(i-(n-1)/2)*gap;b.position.set(bx,cur.outY+0.07,STACK_Z);b.scale.y=reduce?h:0.01;b.userData.h=h;G.out.add(b);bars.push(b);
    const lab=sprite(showPiece(x[0]),{fg:'#E8EBF4',size:34,bg:'rgba(22,26,38,.8)',pad:8},0.4);lab.position.set(bx,cur.outY+0.07+h+0.4,STACK_Z+0.2);lab.userData.bar=b;G.out.add(lab);
    const pl=sprite(Math.round(p*100)+'%',{fg:i===0?'#FFC48F':'#C9D2E8',size:30},0.32);pl.position.set(bx,cur.outY+0.07+h+0.8,STACK_Z+0.2);pl.userData.bar=b;G.out.add(pl)});
  anchors.output=new THREE.Vector3(0,cur.outY+1.3,STACK_Z)}

/* ---------- temperature dial ---------- */
function setTemp(t,force){if(!force&&t===cur.T)return;cur.T=t;const nd=G.dial.userData.needle;if(!nd)return;
  const a=lerp(-2.2,2.2,Math.min(1,Math.max(0,(t-0.1)/1.9)));nd.rotation.z=-a;
  if(G.dial.userData.label){G.dial.remove(G.dial.userData.label);G.dial.userData.label.material.map.dispose();G.dial.userData.label.material.dispose()}
  const l=sprite('Temperature '+t.toFixed(1),{fg:'#FFC48F',size:32,bg:'rgba(22,26,38,.8)',pad:8},0.38);const p=G.dial.userData.pos;l.position.set(p.x,p.y-1.25,p.z+0.3);G.dial.add(l);G.dial.userData.label=l}

/* ---------- focus glow ---------- */
const FOCUS_GROUPS={tokens:['tokens'],embed:['embed'],attention:['arcs','tokens'],layers:['stack'],heads:['heads'],output:['out'],sampler:['dial'],overview:[]};
function setFocus(f){cur.focus=f||'overview';const on=new Set(FOCUS_GROUPS[cur.focus]||[]);
  G.stack.children.forEach(m=>{if(m.isMesh&&m.userData.kind==='layer')m.material.emissiveIntensity=on.has('stack')?0.18:0});
  G.heads.children.forEach(m=>{m.material.emissiveIntensity=on.has('heads')?0.35:0});
  G.embed.children.forEach(m=>{m.material.emissiveIntensity=on.has('embed')?0.6:0.25})}

/* ---------- flow animation: follow a sentence up the machine ---------- */
let flow=null;
function runFlow(){disposeGroup(G.flow);const n=cur.pieces.length;if(!n)return;
  if(reduce){flow=null;bars.forEach(b=>{b.scale.y=b.userData.h});return}
  const balls=cur.xs.map((x,i)=>{const s=new THREE.Mesh(new THREE.SphereGeometry(0.12,16,12),new THREE.MeshBasicMaterial({color:i===n-1?0xFFC845:0x8EA4FF}));s.position.set(x,0.9,3.1);G.flow.add(s);return s});
  bars.forEach(b=>{b.scale.y=0.01});flow={t0:performance.now(),balls,dur:2200}}
function tickFlow(now){if(!flow)return;const k=Math.min(1,(now-flow.t0)/flow.dur);const n=flow.balls.length;
  flow.balls.forEach((b,i)=>{const kk=Math.min(1,Math.max(0,k*1.15-i*0.015));const y=kk<0.18?lerp(0.9,2.0,kk/0.18):lerp(2.0,cur.outY,(kk-0.18)/0.82);const z=kk<0.25?lerp(3.1,STACK_Z+0.6,kk/0.25):STACK_Z+0.6;
    b.position.set(cur.xs[i],y,z);b.visible=kk<0.999||i===n-1;
    if(i===n-1&&kk>=1){b.position.set(cur.xs[i]+(0-cur.xs[i])*0.5,cur.outY+0.25,STACK_Z)}});
  const layer=Math.floor(((k*1.15-0.18)/0.82)*NL);
  G.heads.children.forEach(t=>{t.material.emissiveIntensity=t.userData.layer===layer?(0.4+0.6*hash(t.userData.head,Math.floor(now/120))):0});
  G.stack.children.forEach(m=>{if(m.isMesh&&m.userData.kind==='layer')m.material.emissiveIntensity=m.userData.layer===layer?0.3:0});
  if(k>=1){disposeGroup(G.flow);flow=null;setFocus(cur.focus);G.heads.children.forEach(t=>{t.material.emissiveIntensity=cur.focus==='heads'?0.35:0});if(opts.onFlowDone)opts.onFlowDone()}}

/* ---------- loss landscape mode ---------- */
let lossFn=null,ball=null,trail=null,lossMesh=null;
function buildLoss(f){lossFn=f;disposeGroup(lossG);
  const N=90,S=12;const geo=new THREE.PlaneGeometry(S,S,N,N);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;const cols=[];
  let lo=Infinity,hi=-Infinity;const ys=[];for(let i=0;i<pos.count;i++){const y=f(pos.getX(i),pos.getZ(i));ys.push(y);lo=Math.min(lo,y);hi=Math.max(hi,y)}
  const cLo=new THREE.Color(0x2BB58A),cMid=new THREE.Color(0x6E8BFF),cHi=new THREE.Color(0xFF8A3D);
  for(let i=0;i<pos.count;i++){pos.setY(i,ys[i]);const t=(ys[i]-lo)/(hi-lo);const c=t<0.4?cLo.clone().lerp(cMid,t/0.4):cMid.clone().lerp(cHi,(t-0.4)/0.6);cols.push(c.r,c.g,c.b)}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();
  lossMesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.75,metalness:0.05,side:THREE.DoubleSide}));lossG.add(lossMesh);
  const wire=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.PlaneGeometry(S,S,30,30).rotateX(-Math.PI/2)),new THREE.LineBasicMaterial({color:0xFFFFFF,transparent:true,opacity:0.07}));
  const wp=wire.geometry.attributes.position;for(let i=0;i<wp.count;i++)wp.setY(i,f(wp.getX(i),wp.getZ(i))+0.01);lossG.add(wire);
  ball=new THREE.Mesh(new THREE.SphereGeometry(0.26,24,18),std(0xFFFFFF,{emissive:0xFFC845,emissiveIntensity:0.5}));lossG.add(ball);
  trail=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xFFC845}));lossG.add(trail);
  const a1=sprite('knob 1 →',{fg:'#C9D2E8',size:30},0.5);a1.position.set(S/2+0.2,f(S/2,0)+0.4,0);lossG.add(a1);
  const a2=sprite('knob 2 →',{fg:'#C9D2E8',size:30},0.5);a2.position.set(0,f(0,S/2)+0.4,S/2+0.4);lossG.add(a2);
  const hl=sprite('Height = how wrong the model is (loss)',{fg:'#E8EBF4',size:30,bg:'rgba(22,26,38,.8)',pad:10},0.5);hl.position.set(-S/2+2.6,hi+0.8,-S/2);lossG.add(hl)}
function setBall(x,z,path){if(!ball)return;ball.position.set(x,lossFn(x,z)+0.26,z);anchors.ball=ball.position.clone();
  const pts=(path||[]).map(p=>new THREE.Vector3(p[0],lossFn(p[0],p[1])+0.08,p[1]));trail.geometry.dispose();trail.geometry=new THREE.BufferGeometry().setFromPoints(pts.length>1?pts:[new THREE.Vector3(),new THREE.Vector3()]);trail.visible=pts.length>1}

/* ---------- camera ---------- */
const VIEWS={overview:{t:[0.6,3.7,0.9],r:25,th:0.55,ph:1.16},tokens:{t:[0,0.8,3.0],r:11,th:0.14,ph:1.1},embed:{t:[0,1.6,2.6],r:9.5,th:0.45,ph:1.12},
  attention:{t:[0,1.5,3.0],r:12,th:0.1,ph:1.02},layers:{t:[0,4.3,0.6],r:13,th:0.82,ph:1.2},heads:{t:[2.5,4.2,1.6],r:9,th:0.35,ph:1.25},
  output:{t:[0.8,7.2,0.6],r:14,th:0.12,ph:1.22},sampler:{t:[2.2,6.8,0.6],r:17,th:0.2,ph:1.22},loss:{t:[0,0.6,0],r:20,th:0.75,ph:0.98}};
const cam={t:new THREE.Vector3(0,3.6,0.9),r:21,th:0.62,ph:1.12};const goal={t:cam.t.clone(),r:cam.r,th:cam.th,ph:cam.ph};let tweening=false;
function viewTo(name,instant){const v=VIEWS[name]||VIEWS.overview;const wide=W>12?(W-12)*0.9:0;
  goal.t.set(v.t[0],v.t[1],v.t[2]);goal.r=v.r+(name==='overview'||name==='output'||name==='layers'?wide:wide*0.6);goal.th=v.th;goal.ph=v.ph;
  if(instant||reduce){cam.t.copy(goal.t);cam.r=goal.r;cam.th=goal.th;cam.ph=goal.ph;tweening=false}else tweening=true}
function placeCamera(){const sp=Math.sin(cam.ph);const r=cam.r*Math.max(1,Math.min(2.2,1.45/camera.aspect));camera.position.set(cam.t.x+r*sp*Math.sin(cam.th),cam.t.y+r*Math.cos(cam.ph),cam.t.z+r*sp*Math.cos(cam.th));camera.lookAt(cam.t)}

/* pointer controls (no addons needed) */
let drag=null,moved=0;const ptrs=new Map();
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY,pan:e.shiftKey||e.button===2};moved=0;tweening=false});
canvas.addEventListener('pointermove',e=>{if(!drag||!ptrs.has(e.pointerId))return;
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];const d0=Math.hypot(a.x-b.x,a.y-b.y);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});const [c,d]=[...ptrs.values()];const d1=Math.hypot(c.x-d.x,c.y-d.y);if(d0>0){cam.r=Math.min(45,Math.max(4,cam.r*d0/d1));moved+=5;if(opts.onInteract)opts.onInteract('zoom')}return}
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});moved+=Math.abs(dx)+Math.abs(dy);
  if(drag.pan){const right=new THREE.Vector3().subVectors(camera.position,cam.t).cross(camera.up).normalize();const k=cam.r*0.0016;cam.t.addScaledVector(right,dx*k);cam.t.y+=dy*k;if(opts.onInteract)opts.onInteract('pan')}
  else{cam.th-=dx*0.008;cam.ph=Math.min(1.5,Math.max(0.2,cam.ph-dy*0.006));if(moved>12&&opts.onInteract)opts.onInteract('rotate')}});
const endPtr=e=>{ptrs.delete(e.pointerId);if(!drag)return;if(moved<6&&ptrs.size===0)pick(e);if(ptrs.size===0)drag=null};
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();tweening=false;cam.r=Math.min(45,Math.max(4,cam.r*(1+Math.sign(e.deltaY)*0.08)));if(opts.onInteract)opts.onInteract('zoom')},{passive:false});
canvas.addEventListener('keydown',e=>{const k=e.key;let used=true;tweening=false;
  if(k==='ArrowLeft'||k==='a'||k==='A')cam.th+=0.12;else if(k==='ArrowRight'||k==='d'||k==='D')cam.th-=0.12;
  else if(k==='ArrowUp'||k==='w'||k==='W')cam.ph=Math.max(0.2,cam.ph-0.08);else if(k==='ArrowDown'||k==='s'||k==='S')cam.ph=Math.min(1.5,cam.ph+0.08);
  else if(k==='+'||k==='=')cam.r=Math.max(4,cam.r*0.9);else if(k==='-'||k==='_')cam.r=Math.min(45,cam.r*1.1);else used=false;
  if(used){e.preventDefault();if(opts.onInteract)opts.onInteract('rotate')}});
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pick(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects([...G.tokens.children.filter(m=>m.isMesh),...G.stack.children.filter(m=>m.isMesh&&m.userData.kind==='layer'),...G.heads.children],false);
  if(hits[0]&&opts.onPick){const u=hits[0].object.userData;opts.onPick(u.kind==='token'?{type:'token',i:u.i}:u.head!=null?{type:'head',layer:u.layer,head:u.head}:{type:'layer',layer:u.layer})}}

/* ---------- loop, sizing, mounting ---------- */
let host=null,running=false,raf=0,ro=null;
function resize(){if(!host)return;const w=host.clientWidth||600,h=host.clientHeight||420;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
const tmp=new THREE.Vector3();
function frame(now){if(!running)return;raf=requestAnimationFrame(frame);
  if(tweening){const k=0.085;cam.t.lerp(goal.t,k);cam.r=lerp(cam.r,goal.r,k);cam.th=lerp(cam.th,goal.th,k);cam.ph=lerp(cam.ph,goal.ph,k);if(Math.abs(cam.r-goal.r)<0.02&&cam.t.distanceTo(goal.t)<0.01)tweening=false}
  placeCamera();
  if(!reduce)bars.forEach(b=>{if(!flow)b.scale.y=lerp(b.scale.y,b.userData.h,0.12)});
  tickFlow(now);
  if(!reduce&&!flow&&cur.focus==='heads'){G.heads.children.forEach(t=>{t.material.emissiveIntensity=0.25+0.25*Math.sin(now/400+t.userData.head*0.7+t.userData.layer)})}
  renderer.render(scene,camera);
  if(opts.onFrame){const r=canvas.getBoundingClientRect();const out={};for(const k in anchors){const a=anchors[k];if(!a)continue;tmp.copy(a).project(camera);out[k]={x:(tmp.x+1)/2*r.width,y:(1-tmp.y)/2*r.height,vis:tmp.z<1&&tmp.x>-1.1&&tmp.x<1.1&&tmp.y>-1.1&&tmp.y<1.1}}opts.onFrame(out)}}
function mount(el){if(host===el&&canvas.parentNode===el)return;host=el;el.insertBefore(canvas,el.firstChild);if(ro)ro.disconnect();ro=new ResizeObserver(resize);ro.observe(el);resize();start()}
function start(){if(running)return;running=true;raf=requestAnimationFrame(frame)}
function stop(){running=false;cancelAnimationFrame(raf)}

buildFixed();setTemp(1,true);

/* ---------- public: apply a whole lesson state at once ---------- */
let lastKey='';
function apply(st){
  const mode=st.mode||'machine';root.visible=mode==='machine';lossG.visible=mode==='loss';
  if(mode==='loss'){if(!lossMesh&&st.lossFn)buildLoss(st.lossFn);if(st.ball)setBall(st.ball[0],st.ball[1],st.path)}
  const key=JSON.stringify([mode,st.pieces,st.ids,st.showIds,st.emb]);
  if(mode==='machine'&&key!==lastKey){setTokens(st.pieces||[],st.ids||[],{showIds:st.showIds,emb:st.emb})}
  if(key!==lastKey||st.view!==cur.view){cur.view=st.view;viewTo(st.view||st.focus||'overview',!lastKey)}
  lastKey=key;
  if(mode==='machine'){setInfluence(st.infl||null,st.ko);applyProbs(st.probs||[]);setTemp(st.T==null?1:st.T);setFocus(st.focus)}}
return {canvas,mount,start,stop,apply,runFlow,viewTo,resize,
  rotate:d=>{tweening=false;cam.th+=d*0.35},zoom:f=>{tweening=false;cam.r=Math.min(45,Math.max(4,cam.r*f))},
  reset:()=>viewTo(cur.view||cur.focus||'overview'),setBall,
  isFlowing:()=>!!flow}};
