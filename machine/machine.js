/* White Box · Inside the machine: core.
   A deep-dive course on how language models work, built into the existing Lessons page.
   16 lessons in 5 units; each lesson is a set of guided steps beside a 3D model of a real model (distilGPT-2).
   Lesson content lives in lessons.js. The 3D drawing lives in scene3d.js. The live model lives in model.js.
   index.html calls MX.init(WB) once, MX.afterRender() after every render, and routes mx:* inputs here. */
(function(){
'use strict';
const MX=window.MX={};
let WB,S,ACT,esc;
const M=window.MXModel;
const REC=window.MX_REC||{},TOK=window.MX_TOK||{};
const cache={full:{}};                    // big arrays that must never go into saved state
const PRESETS=['dog','trophy','maria','france','zorbax','eat','subject','once'];

/* ---------- catalog: 5 units, 16 lessons ---------- */
const UNITS=[['Meet the machine','What a chatbot is made of'],['Reading in context','How earlier words change what comes next'],['Writing an answer','How it picks the next piece'],['How it learned','Mistakes, data and scale'],['Using it wisely','Checking, testing and building']];
const CAT=[
  {id:'tour',u:0,title:'Tour of a chatbot',sub:'Follow one sentence through a real model, from text to next word.',min:10,cover:'stack',links:[1]},
  {id:'tokens',u:0,title:'Text to tokens',sub:'The machine reads pieces of words, not letters. Some languages cost more pieces.',min:12,cover:'tokens',links:[1]},
  {id:'embed',u:0,title:'Words as numbers',sub:'Every token becomes a list of numbers. Similar words end up close together.',min:12,cover:'scatter',plan:{
    steps:['Each token becomes 768 numbers','Fly through a 3D map of words','King − man + woman ≈ ?','Bias hiding in the map (nurse, engineer)','Math: distance and direction','What the 3D picture flattens'],
    scene:'Fly-through 3D scatter of real distilGPT-2 word vectors, squashed to 3D. Students drag one word and watch its neighbors.',
    model:'Live: type a word, see its 10 nearest neighbors from the model’s own number lists.',link:'Mission 2: bias can hide in which words sit close together.'}},
  {id:'order',u:1,title:'Word order',sub:'“Dog bites man” and “man bites dog” use the same tokens. How does it tell them apart?',min:8,cover:'order',plan:{
    steps:['Same tokens, different meaning','Shuffle a sentence and run it','Position stamps on each token','Math: adding a position vector','What happens past the last position'],
    scene:'Tokens on the tray get a glowing position stamp that travels up with them.',model:'Live: shuffle the words of a sentence and compare the next-word odds.',link:'Lesson 9: the context window has a last position.'}},
  {id:'attention',u:1,title:'Attention: looking back',sub:'Knock out earlier words and measure which ones the model relied on.',min:14,cover:'arcs',links:[1]},
  {id:'layers',u:1,title:'Layers',sub:'The same step, done 6 times. What changes from layer to layer?',min:10,cover:'layers',plan:{
    steps:['One layer, step by step','Six layers stacked','Peek at a guess after each layer','Heads that specialize','Math: adding back what came in','Big models have 100+ layers'],
    scene:'Pull one layer out of the stack and open it like a drawer.',model:'Live: show the best next-word guess after layer 1, 2, … 6.',link:'Lesson 5: each layer has 12 attention heads.'}},
  {id:'odds',u:2,title:'Next-word odds',sub:'A score for all 50,257 tokens, turned into percentages. Confident is not the same as correct.',min:12,cover:'bars',links:[1]},
  {id:'temp',u:2,title:'Temperature',sub:'Why the same question can get different answers, and the dial that controls it.',min:10,cover:'dial',links:[1]},
  {id:'context',u:2,title:'Context window',sub:'Why chatbots forget the start of a long chat, and why that matters for privacy.',min:10,cover:'window',plan:{
    steps:['Feed it a long story','Watch the window slide','What falls out of memory','Chat history is just more text','Privacy: what you paste stays in the window','Math: cost grows with length'],
    scene:'A conveyor belt of tokens moves through a window; old tokens fall off the end.',model:'Live: the model forgets a name you gave it 1,024 tokens ago.',link:'Values: privacy. Keep private things private.'}},
  {id:'data',u:3,title:'Training data',sub:'Where the words came from, and what that means for whose voices it learned.',min:10,cover:'data',plan:{
    steps:['What the model read','Guess the mix of sources','Who is missing?','Copying old patterns','Math: counting how often things appear','Who chose the data?'],
    scene:'A library of glowing shelves feeds books into the machine; shelf sizes show the mix.',model:'Live: compare odds for “The doctor said that he/she…”.',link:'Mission 2: the Shortlist copied old hiring patterns.'}},
  {id:'learning',u:3,title:'Learning from mistakes',sub:'Roll a ball down a 3D landscape of mistakes. This is how training works.',min:14,cover:'loss',links:[2]},
  {id:'scale',u:3,title:'Scale: servers and energy',sub:'Zoom out from one model to the data centers that train and run big ones.',min:8,cover:'servers',plan:{
    steps:['How big is big?','Zoom out: chip, rack, data center','How long training takes','Energy and water','Math: counting the calculations','Who can afford to build these?'],
    scene:'Zoom out from the model to a GPU, a server rack and a data center floor.',model:'Compare distilGPT-2 (82M numbers) with published sizes of bigger models.',link:'Values: responsibility. Every question costs energy.'}},
  {id:'feedback',u:3,title:'Fine-tuning and feedback',sub:'How a text predictor becomes a helpful assistant, and why it can be too eager to agree.',min:12,cover:'feedback',plan:{
    steps:['Base model vs assistant','People rate answers','The model learns to please','Too eager to agree','Ask it for the other side','Math: a reward score'],
    scene:'Thumbs-up and thumbs-down tokens flow back into the stack and nudge its numbers.',model:'Live: same prompt to distilGPT-2 (base) and to an assistant.',link:'Scenario “Too eager to agree” and the value of honesty.'}},
  {id:'madeup',u:4,title:'Making things up',sub:'Why a model invents facts, sources and quotes, and how to catch it.',min:12,cover:'madeup',plan:{
    steps:['A confident wrong answer','Odds look the same for real and fake','Fake sources','Give it something true to look at','Check it somewhere else','What tools fix and don’t fix'],
    scene:'The odds tray for a real fact and a made-up one, side by side.',model:'Live: “The capital of Zorbax is…” vs a real place.',link:'Mission 1: The Confident Liar.'}},
  {id:'testing',u:4,title:'How we test AI',sub:'Run a mini test set, score it, and see what a single score hides.',min:12,cover:'testing',plan:{
    steps:['What is an eval?','Run 10 questions','Score it','Same score, different mistakes','Test it for fairness','Math: accuracy and error bars'],
    scene:'A testing bench: questions go in, a scoreboard lights up.',model:'Live: run a 10-question set through distilGPT-2 and grade it together.',link:'Calibrated trust: when to check, not distrust everything.'}},
  {id:'capstone',u:4,title:'Capstone experiment',sub:'Design your own experiment on the machine, predict, run it and report.',min:20,cover:'capstone',plan:{
    steps:['Pick a question','Write a prediction','Run it on the machine','Compare with an assistant','Write what you found','Add it to your guide'],
    scene:'The whole machine, with your experiment’s inputs and results pinned to it.',model:'Live: any lesson tool.',link:'Creates a guideline for your values board.'}}
];
const byId=id=>CAT.find(c=>c.id===id);
MX.CAT=CAT;MX.UNITS=UNITS;

/* parts of the machine (used by callouts and the Parts tab) */
const PARTS={
  tokens:['Tokens','Your text, cut into pieces the machine can read. Each piece has an ID number.','tokens'],
  embed:['Numbers','Each token becomes a list of 768 numbers in this model. We show 8 of them as colored cubes.','embed'],
  layers:['6 layers','The same kind of step, done 6 times. Each layer mixes in information from other tokens.','layers'],
  heads:['12 heads per layer','Each layer looks back at earlier tokens in 12 different ways at the same time.','heads'],
  attention:['Looking back','Lines show which earlier words changed the answer most when we removed them.','attention'],
  output:['Next-word odds','A score for every one of 50,257 tokens, turned into percentages. The top 8 are shown.','output'],
  sampler:['Temperature dial','Decides how adventurous the pick is: low picks the top choice, high takes more chances.','sampler'],
  last:['Current token','The machine is predicting what comes right after this piece.','tokens']};
MX.PARTS=PARTS;

/* ---------- state ---------- */
function X(){if(!S.mx)S.mx={L:{},mon:{},notes:{}};S.mx.L=S.mx.L||{};S.mx.notes=S.mx.notes||{};return S.mx}
function LS(id){const L=X().L;return L[id]||(L[id]={step:0,max:0,done:false,f:{},tab:'steps'})}
function mon(){const m=X().mon;if(!m.preset&&!m.text){m.preset='dog';m.T=1;m.gen=[]}m.gen=m.gen||[];if(m.T==null)m.T=1;return m}
MX.LS=LS;MX.mon=mon;

/* ---------- probabilities ---------- */
function lse(a){let mx=-Infinity;for(const v of a)if(v>mx)mx=v;let s=0;for(const v of a)s+=Math.exp(v-mx);return mx+Math.log(s)}
/* top-k probabilities at temperature T. Exact for live runs; for recorded runs, exact at T=1 and estimated at other temperatures
   (the 50,000-token tail is treated as many equal small scores so the estimate matches exactly at T=1). */
function probs(res,T,k){if(!res||!res.top)return [];T=T||1;k=k||8;const top=res.top;
  if(res.src==='live'&&cache.full[res.key]){const full=cache.full[res.key];const z=M.logZ(full,T);return top.slice(0,k).map(x=>[x[0],Math.exp(x[1]/T-z)])}
  const p1=top.map(x=>Math.exp(x[1]-res.logZ));const tail=Math.max(1e-9,1-p1.reduce((a,b)=>a+b,0));
  if(Math.abs(T-1)<1e-6)return top.slice(0,k).map((x,i)=>[x[0],p1[i]]);
  const N=50257-top.length;const leq=res.logZ+Math.log(tail)-Math.log(N);
  const z=lse(top.map(x=>x[1]/T).concat([Math.log(N)+leq/T]));return top.slice(0,k).map(x=>[x[0],Math.exp(x[1]/T-z)])}
MX.probs=probs;

function recRes(key){const r=REC[key];if(!r)return null;return {key,text:r.text,pieces:r.pieces,ids:r.ids,top:r.top,logZ:r.logZ,src:'recorded'}}
MX.recRes=recRes;
function curRes(){const m=mon();if(m.res&&(m.res.key===m.preset||m.res.key==='custom:'+m.text))return m.res;return m.preset?recRes(m.preset):null}
MX.curRes=curRes;

/* ---------- live model plumbing ---------- */
let rerenderT=0;function soon(){clearTimeout(rerenderT);rerenderT=setTimeout(()=>{if(S.screen==='mx'||S.screen==='lessons')WB.render()},60)}
let wasReady=false;
if(M)M.on(()=>{if(S&&M.ready()&&!wasReady){wasReady=true;const m=mon();if(m.preset)MX.runPreset(m.preset).then(soon)}soon()});
function liveOn(){return M&&M.ready()}
MX.liveOn=liveOn;
async function runText(text,key){const m=mon();
  if(!liveOn()){m.res=recRes(key)||m.res;return m.res}
  m.busy=true;soon();
  try{const r=await M.next(text,30);cache.full[key]=r.full;m.res={key,text,pieces:r.pieces,ids:r.ids,top:r.top,logZ:r.logZ,src:'live'}}
  catch(e){m.err='The live model hit a problem. Using the recorded run instead.';m.res=recRes(key)}
  m.busy=false;soon();return m.res}
MX.runPreset=async k=>{const m=mon();m.preset=k;m.text=REC[k]?REC[k].text:'';m.err=null;m.res=recRes(k);if(liveOn())await runText(m.text,k);return m.res};
MX.runCustom=async t=>{const m=mon();const c=M.checkInput(t);if(!c.ok){m.err=c.why;soon();return null}
  if(!liveOn()){m.err='Your own sentences need the live model. Turn it on above, or pick one of the ready-made sentences.';soon();return null}
  m.preset=null;m.text=t;m.err=null;return runText(t,'custom:'+t)};

/* ---------- tiny UI helpers shared with lessons.js ---------- */
const h={};MX.h=h;
h.pct=p=>p>=0.995?'99%':p<0.005?'<1%':Math.round(p*100)+'%';
h.piece=p=>{const s=String(p);return s===''?'∅':esc(s.replace(/^ /,'·').replace(/�/g,'*'))};
h.bars=(list,o)=>{o=o||{};if(!list||!list.length)return '<p class="muted" style="font-size:14px">Run a sentence to see the odds.</p>';
  const mx=Math.max(...list.map(x=>x[1]),0.01);const rest=Math.max(0,1-list.reduce((a,b)=>a+b[1],0));
  return `<div class="mxbars" ${o.id?`id="${o.id}"`:''}>${list.map((x,i)=>`<div class="mxbar ${i===0?'hi':''} ${o.mark===x[0]?'mark':''}"><span>${h.piece(x[0])}</span><i><b style="width:${Math.max(1.5,x[1]/mx*100).toFixed(1)}%"></b></i><em>${h.pct(x[1])}</em></div>`).join('')}${o.rest===false?'':`<div class="mxbar rest"><span>everything else</span><i><b style="width:0"></b></i><em>${h.pct(rest)}</em></div>`}</div>`};
h.quiz=(L,key,q,opts,right,fb)=>{const a=L.f[key];
  return `<div class="mxq"><strong>${q}</strong><div class="stack" style="gap:8px">${opts.map((o,i)=>`<button class="qopt ${a===i?(i===right||right<0?'right':'wrongv'):''}" data-act="mxAns" data-arg="${key}|${i}" ${a===right&&right>=0?'disabled':''}>${o}</button>`).join('')}</div>${a!=null?`<div class="fbk ${a===right||right<0?'ok':''} fade-in">${fb[a]||fb[0]}</div>`:''}</div>`};
h.take=t=>`<div class="mxtake"><span class="kicker">Key idea</span><span>${t}</span></div>`;
h.note=t=>`<div class="mxnote">${t}</div>`;
h.chips=(pieces,o)=>{o=o||{};return `<div class="mxchips">${pieces.map((p,i)=>`<${o.act?'button':'span'} class="mxchip c${i%6} ${o.ko===i?'ko':''} ${o.last&&i===pieces.length-1?'last':''}" ${o.act?`data-act="${o.act}" data-arg="${i}"`:''}>${h.piece(p)}${o.ids?`<small>#${o.ids[i]}</small>`:''}</${o.act?'button':'span'}>`).join('')}</div>`};
h.presets=(act,cur,keys)=>`<div class="mxpresets">${(keys||PRESETS).map(k=>`<button class="mxpre ${cur===k?'on':''}" data-act="${act}" data-arg="${k}">${esc(REC[k].text)}…</button>`).join('')}</div>`;
h.slider=(key,label,min,max,step,val,fmt)=>`<label class="mxslide"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-input="mx:${key}" aria-label="${label}"><b id="mxv-${key}">${fmt?fmt(val):val}</b></label>`;
h.src=res=>res?`<span class="mxsrc ${res.src}">${res.src==='live'?'Live · running on this device':'Recorded run of distilGPT-2'}</span>`:'';
h.esc=s=>esc(s);

/* ---------- model monitor (shared panel, like a serial monitor for a language model) ---------- */
function liveChip(){if(!M)return '';const st=M.status;
  if(st==='ready')return `<span class="mxlive on">Live model on · ${M.name}</span>`;
  if(st==='loading')return `<span class="mxlive load">Downloading the model… ${M.progress||0}%</span>`;
  if(st==='error')return `<span class="mxlive err">Live model unavailable here · using recorded runs</span>`;
  return `<button class="mxlive off" data-act="mxLive">Turn on the live model <small>${M.size}, runs on this device</small></button>`}
MX.liveChip=liveChip;
h.monitor=(o)=>{o=o||{};const m=mon();const res=curRes();const T=o.T!=null?o.T:1;const P=probs(res,T,8);
  return `<section class="mxmon" aria-label="Model monitor">
    <div class="mxmon-h"><strong>Model monitor</strong>${liveChip()}</div>
    ${o.presets===false?'':h.presets('mxPreset',m.preset)}
    ${o.custom===false?'':`<form class="mxrow" data-form="mxRun"><input type="text" id="mxtext" maxlength="160" placeholder="${liveOn()?'Type your own sentence':'Your own sentence (needs the live model)'}" value="${m.preset?'':esc(m.text||'')}" aria-label="Your own sentence"><button class="btn btn-ghost mxbtn" type="submit">Run</button></form>`}
    ${m.err?`<div class="fbk">${esc(m.err)}</div>`:''}
    ${res?`<div class="mxmon-in"><span class="muted">Input</span>${h.chips(res.pieces,{last:true})}</div>`:''}
    <div class="mxmon-out"><div class="mxrow" style="justify-content:space-between"><span class="muted">Next-word odds${T!==1?' at temperature '+T.toFixed(1):''}</span>${h.src(res)}</div>${m.busy?'<p class="muted">Running…</p>':h.bars(P,{id:'mxbars'})}</div>
    ${o.extra||''}
  </section>`};
MX.monitorBars=()=>{const el=document.getElementById('mxbars');if(!el)return;const m=mon();el.outerHTML=h.bars(probs(curRes(),m.T,8),{id:'mxbars'})};

/* ---------- assistant comparison ---------- */
const EXAMPLE_ASSIST={dog:'“…was scared.” (An assistant usually finishes the sentence and may ask what you want help with.)',
  france:'“The capital of France is Paris.”',zorbax:'“I don’t know of a place called Zorbax. It might be fictional. Can you tell me where it’s from?”',
  eat:'“…pizza, fruit or a snack!” (and it might ask what kinds of food you like)',trophy:'“…big.” (The trophy was too big for the suitcase.)',
  subject:'“…a question only you can answer! What subjects do you enjoy?”',maria:'“…was going to read it on the trip.” (One possible ending.)',once:'“…a curious fox who lived at the edge of a forest.”'};
h.assist=(key,text)=>{const A=X().assist||{};const a=A[key];
  return `<div class="mxassist"><div class="mxrow" style="justify-content:space-between"><strong>Compare with an assistant</strong><button class="btn btn-ghost mxbtn" data-act="mxAsk" data-arg="${esc(key)}">${a?'Ask again':'Ask'}</button></div>
    ${a?`<div class="mxassist-a ${a.pending?'pend':''}"><span class="kicker">${a.live?'Live assistant':'Example answer (written by the White Box team)'}</span><p>${a.pending?'Thinking…':esc(a.text)}</p></div>`:'<p class="muted" style="font-size:14px">Assistants are built on the same kind of machine, then trained further to follow instructions.</p>'}</div>`};
async function askAssistant(key){const X0=X();X0.assist=X0.assist||{};const text=key.startsWith('custom:')?key.slice(7):(REC[key]||{}).text||'';
  const SAMPLE=WB.SAMPLE;
  if(!SAMPLE){X0.assist[key]={text:EXAMPLE_ASSIST[key]||'(No example answer for your own sentence. With a live assistant connected, this would show its real reply.)',live:false};WB.render();return}
  X0.assist[key]={pending:true};WB.render();
  try{const r=await SAMPLE(`You are helping a 10th-grade class compare a tiny text-predicting model with an assistant. Respond to this text the way you normally would, in at most two short sentences, school-appropriate, plain text: "${text}"`,{cache:false,modelTier:'quick'});X0.assist[key]={text:(r&&r.text||'').trim()||'(no reply)',live:true}}
  catch(e){X0.assist[key]={text:EXAMPLE_ASSIST[key]||'(The assistant could not be reached.)',live:false}}
  WB.render()}

/* ---------- covers for lesson cards (code-built, like the existing lesson covers) ---------- */
function cover(k){switch(k){
  case 'stack':return `<div class="lc mxc"><svg viewBox="0 0 240 120" aria-hidden="true">${[0,1,2,3,4,5].map(i=>`<path d="M${60} ${96-i*12} l60 -14 l60 14 l-60 14z" fill="${i===5?'#FF8A3D':'#2C3554'}" stroke="#4A5680" stroke-width="1" opacity="${0.55+i*0.08}"/>`).join('')}${[0,1,2,3,4].map(i=>`<rect x="${72+i*20}" y="104" width="16" height="10" rx="2" fill="${i===4?'#FFC48F':'#E8EBF4'}"/>`).join('')}</svg></div>`;
  case 'tokens':return `<div class="lc mxc mxc-t">${['un','bel','iev','able'].map((t,i)=>`<span class="c${i}">${t}<small>#${[403,6667,11203,540][i]}</small></span>`).join('')}</div>`;
  case 'scatter':return `<div class="lc mxc"><svg viewBox="0 0 240 120" aria-hidden="true">${Array.from({length:40},(_,i)=>{const a=(i*137.5)%360,r=(i*29)%50;return `<circle cx="${120+Math.cos(a)*r*1.9}" cy="${60+Math.sin(a)*r*0.9}" r="${2+(i%3)}" fill="${i%7===0?'#FF8A3D':'#6E8BFF'}" opacity="${0.4+(i%5)/8}"/>`}).join('')}</svg></div>`;
  case 'order':return `<div class="lc mxc mxc-t">${['dog','bites','man'].map((t,i)=>`<span class="c${i}">${t}<small>pos ${i+1}</small></span>`).join('')}</div>`;
  case 'arcs':return `<div class="lc mxc"><svg viewBox="0 0 240 120" aria-hidden="true">${[[30,0.3],[70,0.8],[110,0.25],[150,0.7]].map(a=>`<path d="M200 96 Q ${(200+a[0])/2} ${96-30-(200-a[0])*0.3} ${a[0]} 96" fill="none" stroke="#FF8A3D" stroke-width="${1+a[1]*6}" opacity="${0.3+a[1]*0.7}"/>`).join('')}${[30,70,110,150,200].map((x,i)=>`<rect x="${x-14}" y="98" width="28" height="12" rx="3" fill="${i===4?'#FFC48F':'#E8EBF4'}"/>`).join('')}</svg></div>`;
  case 'layers':return `<div class="lc mxc"><svg viewBox="0 0 240 120" aria-hidden="true">${[0,1,2,3,4,5].map(i=>`<rect x="40" y="${12+i*16}" width="160" height="10" rx="3" fill="#2C3554" stroke="#4A5680"/>${Array.from({length:12},(_,j)=>`<rect x="${120+j*6.5}" y="${14+i*16}" width="4" height="6" fill="${(i+j)%5===0?'#FFC845':'#3B4466'}"/>`).join('')}`).join('')}</svg></div>`;
  case 'bars':return `<div class="lc lc1"><div class="lc1-s"><span>After</span><span>school,</span><span>I</span><span>like</span><span>to</span><span>eat</span><span class="q">___</span></div><div class="lc1-p">${[['my',9],['a',8],['food',4]].map((x,i)=>`<div><em>${x[0]}</em><i><b style="width:${x[1]*9}%;${i===0?'background:#FF8A3D':''}"></b></i><small>${x[1]}%</small></div>`).join('')}</div></div>`;
  case 'dial':return `<div class="lc mxc"><svg viewBox="0 0 240 120" aria-hidden="true"><path d="M70 96 A50 50 0 0 1 170 96" fill="none" stroke="#2A3150" stroke-width="14"/><path d="M70 96 A50 50 0 0 1 100 52" fill="none" stroke="#6E8BFF" stroke-width="14"/><path d="M140 52 A50 50 0 0 1 170 96" fill="none" stroke="#FF6B5A" stroke-width="14"/><line x1="120" y1="96" x2="146" y2="58" stroke="#FF8A3D" stroke-width="5" stroke-linecap="round"/><circle cx="120" cy="96" r="6" fill="#E8EBF4"/><text x="58" y="114" fill="#8E97B3" font-size="10" font-family="Lexend, system-ui, sans-serif">safe</text><text x="160" y="114" fill="#8E97B3" font-size="10" font-family="Lexend, system-ui, sans-serif">wild</text></svg></div>`;
  case 'window':return `<div class="lc mxc mxc-t mxc-win">${['…','the','name','was','Ana','and'].map((t,i)=>`<span class="c${i%6} ${i<1?'off':''}">${t}</span>`).join('')}</div>`;
  case 'data':return `<div class="lc mxc"><svg viewBox="0 0 240 120" aria-hidden="true">${[[30,70],[56,40],[82,90],[108,25],[134,55],[160,15],[186,35]].map((b,i)=>`<rect x="${b[0]}" y="${100-b[1]}" width="20" height="${b[1]}" rx="2" fill="${i===2?'#FF8A3D':'#5B6B95'}"/>`).join('')}<line x1="22" y1="100" x2="216" y2="100" stroke="#4A5680"/></svg></div>`;
  case 'loss':return `<div class="lc mxc"><svg viewBox="0 0 240 120" aria-hidden="true">${[46,38,30,22,14,7].map((r,i)=>`<ellipse cx="150" cy="66" rx="${r*1.8}" ry="${r}" fill="none" stroke="${['#FF8A3D','#E07A5F','#9A7BD0','#6E8BFF','#3FA98A','#2BB58A'][i]}" stroke-width="1.6"/>`).join('')}<path d="M40 20 Q 70 40 90 50 T 140 64" fill="none" stroke="#FFC845" stroke-width="2" stroke-dasharray="4 3"/><circle cx="142" cy="65" r="6" fill="#fff"/></svg></div>`;
  case 'servers':return `<div class="lc mxc"><svg viewBox="0 0 240 120" aria-hidden="true">${[0,1,2,3,4].map(i=>`<rect x="${32+i*38}" y="22" width="28" height="80" rx="3" fill="#1F2536" stroke="#3B4258"/>${[0,1,2,3,4,5].map(j=>`<rect x="${36+i*38}" y="${28+j*12}" width="20" height="6" rx="1" fill="#2C3554"/><circle cx="${58+i*38}" cy="${31+j*12}" r="1.6" fill="${(i+j)%3?'#2BB58A':'#FFC845'}"/>`).join('')}`).join('')}</svg></div>`;
  case 'feedback':return `<div class="lc mxc mxc-t">${['👍','great!','👎','hmm'].map((t,i)=>`<span class="c${i}">${t}</span>`).join('')}</div>`;
  case 'madeup':return `<div class="lc lc1"><div class="lc1-s"><span>The</span><span>capital</span><span>of</span><span>Zorbax</span><span>is</span><span class="q">___</span></div><div class="lc1-p">${[['a',6],['located',6],['the',4]].map((x,i)=>`<div><em>${x[0]}</em><i><b style="width:${x[1]*12}%;${i===0?'background:#FF8A3D':''}"></b></i><small>${x[1]}%</small></div>`).join('')}</div></div>`;
  case 'testing':return `<div class="lc mxc mxc-t">${['Q1 ✓','Q2 ✓','Q3 ✗','Q4 ✓','7/10'].map((t,i)=>`<span class="c${i}">${t}</span>`).join('')}</div>`;
  default:return `<div class="lc mxc mxc-t"><span class="c0">predict</span><span class="c1">run</span><span class="c2">report</span></div>`}}

/* ---------- library section on the Lessons page ---------- */
MX.libraryHTML=()=>{const built=CAT.filter(c=>MX.LESSONS[c.id]);const done=built.filter(c=>LS(c.id).done).length;
  return `<section class="stack mxlib" style="gap:18px">
    <div class="mxlib-head"><div class="stack" style="gap:6px"><span class="kicker">Deep dive · ${CAT.length} lessons in ${UNITS.length} units</span><h2 class="mxlib-t">Inside the machine</h2>
      <p class="psub">Open up a real language model. Turn it in 3D, run your own sentences through it, and see the math behind every step.</p></div>
      <div class="mxlib-stat"><strong>${done}/${built.length}</strong><span>lessons done</span>${liveChip()}</div></div>
    ${UNITS.map((u,ui)=>{const items=CAT.filter(c=>c.u===ui);const ud=items.filter(c=>LS(c.id).done).length;const ub=items.filter(c=>MX.LESSONS[c.id]).length;
      return `<div class="mxunit"><div class="mxunit-h"><span class="bnum sm">${ui+1}</span><div class="stack" style="gap:0"><strong>${u[0]}</strong><span class="muted" style="font-size:14px">${u[1]}</span></div><span class="muted mxunit-c">${ud}/${ub}${ub<items.length?' · '+(items.length-ub)+' planned':''}</span></div>
        <div class="libgrid">${items.map(c=>card(c)).join('')}</div></div>`}).join('')}
  </section>`};
function card(c){const n=CAT.indexOf(c)+1;const D=MX.LESSONS[c.id];const L=LS(c.id);
  const status=!D?'Storyboard →':L.done?'✓ Done · Revisit':L.max>0?'Continue · step '+(L.step+1)+' of '+D.steps.length+' →':'Start →';
  return `<button class="libcard mxcard ${D?'':'planned'}" data-act="go" data-arg="mx/${c.id}"><div class="libart">${cover(c.cover)}</div>
    <div class="stack" style="gap:6px;padding:16px 18px 18px"><span class="kicker">Unit ${c.u+1} · Lesson ${n}</span><strong style="font-size:20px">${c.title}</strong><span class="muted">${c.sub}</span>
    <span class="mxmeta">${D?`<span>${D.steps.length} steps</span><span>${c.min} min</span><span>3D</span>${D.live?'<span>Live model</span>':''}`:'<span class="plan">Planned · storyboard</span>'}</span>
    <span class="vgo">${status}</span></div></button>`}

/* ---------- mission page + journey hooks ---------- */
MX.missionHTML=n=>{const list=CAT.filter(c=>(c.links||[]).includes(n)&&MX.LESSONS[c.id]);if(!list.length)return '';
  return `<div class="mxgo"><span class="kicker">Go deeper · Inside the machine</span><div class="mxgo-row">${list.map(c=>`<button class="mxgo-b ${LS(c.id).done?'done':''}" data-act="go" data-arg="mx/${c.id}">${LS(c.id).done?'✓ ':''}${c.title} →</button>`).join('')}</div></div>`};
MX.journeyHTML=()=>{const notes=X().notes;const ids=CAT.filter(c=>notes[c.id]);const built=CAT.filter(c=>MX.LESSONS[c.id]);
  return `<section class="card stack" style="gap:10px"><div class="row" style="justify-content:space-between;align-items:baseline"><h2 style="font-size:20px">Inside the machine: field notes</h2><span class="muted">${ids.length}/${built.length} lessons</span></div>
    ${ids.length?ids.map(c=>`<div class="stack" style="gap:2px;padding:10px 12px;border-radius:10px;background:var(--bg)"><span class="kicker">${c.title}</span><span>${notes[c.id]}</span></div>`).join(''):'<p class="muted">Finish a lesson in Inside the machine to collect a field note.</p>'}
    <div><button class="btn btn-ghost" data-act="go" data-arg="lessons">Open the lessons →</button></div></section>`};
MX.title=()=>{const c=byId(S.param);return c?c.title+' · Inside the machine':'Inside the machine'};

/* ---------- guides: how to use the page, and what's happening in each step ---------- */
const val=v=>typeof v==='function'?v():v;
const PAGE_HELP=['<b>The model (left)</b>: drag to turn it, scroll or pinch to zoom, shift-drag to move it. ⌂ resets the view, ▶ replays the flow, and <b>2D view</b> shows a flat diagram instead.',
  '<b>Glowing dots</b> on the model are labels. Click one to learn that part.',
  '<b>Steps (right)</b>: each step has a small task. <b>Next</b> unlocks when you’ve done it. The numbered dots under the model take you back to any step you’ve reached.',
  '<b>Tabs</b>: <b>The math</b> shows the formulas, <b>Parts</b> names everything on the model, and <b>What this leaves out</b> says where the model is simplified.',
  '<b>Recorded or live</b>: recorded runs were made with the real model ahead of time. <b>Turn on the live model</b> to run it on this device (about 80 MB, once). Nothing you type leaves your device.'];
function helpCard(D){const a=D.about;
  return `<section class="mxhelp lcard fade-in" aria-label="How this lesson works"><div class="mxrow" style="justify-content:space-between"><span class="kicker">How this lesson works</span><button class="linkbtn" data-act="mxHelpClose" aria-label="Close the lesson guide">Close</button></div>
    <div class="mxhelp-g"><div><span class="mxg-k see">What you’re looking at</span><p>${val(a.see)}</p></div><div><span class="mxg-k do">What you can do</span><p>${val(a.do)}</p></div><div><span class="mxg-k model">What the model is doing</span><p>${val(a.model)}</p></div></div>
    <details class="mxhelp-d"><summary>Using this page</summary><ul>${PAGE_HELP.map(t=>`<li>${t}</li>`).join('')}</ul></details>
    <button class="btn btn-primary" data-act="mxHelpClose">Got it</button></section>`}
function guideCard(g){const open=X().guide!==false;
  return `<section class="mxguide ${open?'open':''}"><button class="mxguide-h" data-act="mxGuide" aria-expanded="${open}"><span>What’s happening in this step</span><i aria-hidden="true">${open?'−':'+'}</i></button>
    ${open?`<dl><div><dt class="mxg-k see">On the model</dt><dd>${val(g.see)}</dd></div><div><dt class="mxg-k do">Your move</dt><dd>${val(g.do)}</dd></div><div><dt class="mxg-k model">Behind the scenes</dt><dd>${val(g.model)}</dd></div></dl>`:''}</section>`}

/* ---------- the lesson player ---------- */
let sceneApi=null,sceneTried=false,sceneFailed=false,threeLib=null;
const VISIT=new Set();
function view(){const id=S.param;const c=byId(id);if(!c){WB.go('lessons');return ''}
  const D=MX.LESSONS[id];if(!D)return storyboard(c);
  if(X().live&&M&&M.status==='off')M.load();
  if(D.init)D.init(LS(id));
  return player(c,D)}
function stepOk(D,L,i){const st=D.steps[i];return !st.need||st.need(L)}
function player(c,D){const L=LS(c.id);if(L.step>=D.steps.length)L.step=D.steps.length-1;const st=D.steps[L.step];const n=CAT.indexOf(c)+1;
  const ok=stepOk(D,L,L.step);const last=L.step===D.steps.length-1;const free=!!S.unlockAll;
  const tabs=[['steps','Steps'],['math','The math'],['parts','Parts'],['leaves','What this leaves out']];const tab=L.tab||'steps';
  const metrics=(D.metrics?D.metrics(L):[]);
  const is2d=!!X().v2d||sceneFailed;
  const help=!!D.about&&(L.f.help===true||(!L.f.introSeen&&L.step===0&&L.max===0&&L.f.help!==false));
  return `<main class="pg wide mx">
    <header class="mx-top"><button class="crumb" data-act="go" data-arg="lessons">← Lessons</button>
      <div class="mx-titlebar"><div class="stack" style="gap:4px"><span class="kicker">Inside the machine · Unit ${c.u+1}: ${UNITS[c.u][0]} · Lesson ${n}</span><h1 class="ptitle mx-h1">${c.title}</h1><p class="psub">${c.sub}</p></div>
      <div class="mx-badges"><button class="mx-helpbtn ${help?'on':''}" data-act="mxHelp" aria-expanded="${help}">? How this lesson works</button><span>${c.min} min</span><span>${D.steps.length} steps</span>${L.done?'<span class="ok">✓ Done</span>':''}</div></div></header>
    <div class="mx-grid">
      <section class="mx-left">
        ${metrics.length?`<div class="mx-metrics">${metrics.map(x=>`<div><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}</div>`:''}
        <div class="mx-stage ${is2d?'is2d':''}" id="mxstage">
          ${is2d?`<div class="mx-2d">${schematic(D,L)}</div>`:'<div class="mx-loading" id="mxload">Building the machine…</div>'}
          <div class="mx-calls" id="mxcalls">${is2d?'':(st.calls||[]).map(k=>{const P=PARTS[k];return P?`<button class="mx-call ${VISIT.has(c.id+':'+k)||(L.f.visited||[]).includes(k)?'seen':''}" data-anchor="${k}" data-act="mxPart" data-arg="${k}" style="transform:translate(-999px,-999px)"><i></i><span><b>${P[0]}</b>${L.f.open===k?`<em>${P[1]}</em>`:''}</span></button>`:''}).join('')}</div>
          <div class="mx-tools" role="toolbar" aria-label="Model controls">
            ${is2d?'':`<button class="iconb" data-act="mxTool" data-arg="left" aria-label="Turn left">↺</button><button class="iconb" data-act="mxTool" data-arg="right" aria-label="Turn right">↻</button><button class="iconb" data-act="mxTool" data-arg="out" aria-label="Zoom out">−</button><button class="iconb" data-act="mxTool" data-arg="in" aria-label="Zoom in">+</button><button class="iconb" data-act="mxTool" data-arg="reset" aria-label="Reset view">⌂</button>${D.mode!=='loss'?'<button class="iconb" data-act="mxTool" data-arg="flow" aria-label="Play the flow">▶</button>':''}`}
            <button class="iconb mx-2dbtn" data-act="mxTool" data-arg="2d" aria-pressed="${is2d}">${sceneFailed?'2D only':is2d?'3D view':'2D view'}</button></div>
          ${is2d?'':'<div class="mx-hint">Drag to turn · scroll to zoom · shift-drag to move · click a token</div>'}
        </div>
        <nav class="mx-scrub" aria-label="Steps in this lesson"><div class="mx-scrub-h"><span class="kicker">In this lesson</span><span class="muted">Step ${L.step+1} of ${D.steps.length}</span></div>
          <div class="mx-dots">${D.steps.map((s,i)=>{const can=free||i<=L.max;return `<button class="mx-dot ${i<L.step||i<L.max||L.done?'done':''} ${i===L.step?'now':''}" data-act="mxStep" data-arg="${i}" ${can?'':'disabled'} title="${esc(s.tag)}"><i>${i+1}</i><span>${esc(s.label)}</span></button>`}).join('')}</div></nav>
      </section>
      <aside class="mx-panel">
        ${help?helpCard(D):''}
        <div class="mx-tabs" role="tablist">${tabs.map(t=>`<button role="tab" aria-selected="${tab===t[0]}" class="${tab===t[0]?'on':''}" data-act="mxTab" data-arg="${t[0]}">${t[1]}</button>`).join('')}</div>
        ${tab==='steps'?`<section class="mx-step lcard" aria-live="polite">
          <div class="mxrow" style="justify-content:space-between"><span class="mxtag t-${st.tag.toLowerCase().replace(/[^a-z]/g,'')}">${st.tag}</span><span class="muted" style="font-size:13px">Step ${L.step+1} of ${D.steps.length}</span></div>
          <h2 class="mx-st">${st.title}</h2><div class="mx-body">${typeof st.body==='function'?st.body(L):st.body}</div>
          <div class="mx-nav">${L.step>0?'<button class="btn btn-ghost" data-act="mxBack">← Back</button>':'<span></span>'}
            ${last?`<button class="btn btn-primary" data-act="mxFinish">${L.done?'Finish again ✓':'Finish lesson ✓'}</button>`:ok||free?`<button class="btn btn-primary" data-act="mxNext">Next: ${esc(D.steps[L.step+1].label)} →</button>`:`<span class="mx-need">${st.hint||'Try it to continue'}</span>`}</div>
        </section>
        ${st.guide?guideCard(st.guide):''}
        ${st.monitor?st.monitor(L):''}`
        :tab==='math'?`<section class="mx-step lcard"><span class="mxtag t-math">The math</span>${D.math(L)}</section>`
        :tab==='parts'?`<section class="mx-step lcard"><span class="mxtag t-setup">Parts in view</span><div class="stack" style="gap:8px">${(D.parts||Object.keys(PARTS)).map(k=>{const P=PARTS[k];return `<div class="mxpart"><div class="stack" style="gap:2px;flex:1"><strong>${P[0]}</strong><span class="muted">${P[1]}</span></div>${is2d?'':`<button class="btn btn-ghost mxbtn" data-act="mxView" data-arg="${P[2]}">Show me</button>`}</div>`}).join('')}</div></section>`
        :`<section class="mx-step lcard"><span class="mxtag t-leavesout">What this leaves out</span>${D.leaves}</section>`}
        <section class="mx-learn lcard"><span class="kicker">You’ll learn</span><ul>${D.learn.map((t,i)=>`<li class="${L.done||L.max>=D.learnAt[i]?'on':''}"><i></i>${t}</li>`).join('')}</ul></section>
      </aside>
    </div>
    <p class="fict">This is a simplified model of how language models work. The 3D machine is not drawn to scale; the numbers and odds come from a real small model (distilGPT-2).</p>
  </main>`}

function storyboard(c){const n=CAT.indexOf(c)+1;const P=c.plan;const next=CAT.find((x,i)=>i>CAT.indexOf(c)&&MX.LESSONS[x.id]);
  return `<main class="pg mx mxsb">
    <header class="mx-top"><button class="crumb" data-act="go" data-arg="lessons">← Lessons</button>
      <div class="stack" style="gap:6px"><span class="kicker">Inside the machine · Unit ${c.u+1}: ${UNITS[c.u][0]} · Lesson ${n} · Planned</span><h1 class="ptitle">${c.title}</h1><p class="psub">${c.sub}</p></div></header>
    <section class="mxsb-grid">
      <div class="lcard stack" style="gap:12px"><span class="kicker">Storyboard · ${P.steps.length} steps</span>
        <ol class="mxsb-steps">${P.steps.map((s,i)=>`<li><span class="bnum sm">${i+1}</span><span>${s}</span></li>`).join('')}</ol></div>
      <div class="stack" style="gap:14px">
        <div class="lcard stack" style="gap:6px"><span class="kicker">In the 3D machine</span><p>${P.scene}</p></div>
        <div class="lcard stack" style="gap:6px"><span class="kicker">With the real model</span><p>${P.model}</p></div>
        <div class="lcard stack" style="gap:6px"><span class="kicker">Connects to</span><p>${P.link}</p></div>
        <div class="libart mxsb-art">${cover(c.cover)}</div>
      </div>
    </section>
    <div class="row" style="gap:10px">${next?`<button class="btn btn-primary" data-act="go" data-arg="mx/${next.id}">Next built lesson: ${next.title} →</button>`:''}<button class="btn btn-ghost" data-act="go" data-arg="lessons">All lessons</button></div>
  </main>`}

/* ---------- 2D schematic (for 2D view, reduced graphics, or when 3D can't load) ---------- */
function schematic(D,L){const st=sceneState(D,L);
  if(st.mode==='loss'){const f=st.lossFn;const N=28,cells=[];let lo=Infinity,hi=-Infinity;const v=[];for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=-6+12*(i+0.5)/N,z=-6+12*(j+0.5)/N;const y=f(x,z);v.push([i,j,y]);lo=Math.min(lo,y);hi=Math.max(hi,y)}
    v.forEach(([i,j,y])=>{const t=(y-lo)/(hi-lo);const c=t<0.4?`rgb(${Math.round(43+(110-43)*t/0.4)},${Math.round(181+(139-181)*t/0.4)},${Math.round(138+(255-138)*t/0.4)})`:`rgb(${Math.round(110+(255-110)*(t-0.4)/0.6)},${Math.round(139+(138-139)*(t-0.4)/0.6)},${Math.round(255+(61-255)*(t-0.4)/0.6)})`;cells.push(`<rect x="${i*14}" y="${j*14}" width="14.5" height="14.5" fill="${c}"/>`)});
    const px=x=>(x+6)/12*N*14;const path=(st.path||[]).map((p,i)=>`${i?'L':'M'}${px(p[0]).toFixed(1)} ${px(p[1]).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${N*14} ${N*14}" role="img" aria-label="Map of the loss landscape seen from above. Green is low, orange is high."><title>Loss landscape from above</title>${cells.join('')}${path?`<path d="${path}" fill="none" stroke="#FFC845" stroke-width="2.5"/>`:''}${st.ball?`<circle cx="${px(st.ball[0])}" cy="${px(st.ball[1])}" r="8" fill="#fff" stroke="#161A26" stroke-width="2"/>`:''}</svg>`}
  const P=st.pieces||[];const n=P.length;const w=640,bw=Math.min(78,(w-40)/Math.max(n,1));const x0=(w-bw*n)/2;
  const toks=P.map((p,i)=>`<g><rect x="${x0+i*bw+3}" y="330" width="${bw-6}" height="30" rx="6" fill="${st.ko===i?'#3B4258':i===n-1?'#FFC48F':'#E8EBF4'}"/><text x="${x0+i*bw+bw/2}" y="350" text-anchor="middle" font-size="12" fill="#161A26" font-family="Lexend, system-ui, sans-serif">${h.piece(p).slice(0,9)}</text>${st.showIds&&st.ids?`<text x="${x0+i*bw+bw/2}" y="376" text-anchor="middle" font-size="10" fill="#8EA4FF" font-family="Lexend, system-ui, sans-serif">#${st.ids[i]}</text>`:''}</g>`).join('');
  const infl=st.infl;let arcs='';if(infl){const vals=infl.map(v=>v||0);const mx=Math.max(...vals,1e-6);const xl=x0+(n-1)*bw+bw/2;
    vals.forEach((v,i)=>{if(i>=n-1||v<=0)return;const xa=x0+i*bw+bw/2;const k=v/mx;arcs+=`<path d="M${xl} 328 Q ${(xl+xa)/2} ${328-30-Math.abs(xl-xa)*0.22} ${xa} 328" fill="none" stroke="#FF8A3D" stroke-width="${1+k*7}" opacity="${0.3+k*0.7}"/>`})}
  const layers=[0,1,2,3,4,5].map(l=>`<rect x="60" y="${236-l*30}" width="520" height="20" rx="5" fill="#2C3554" stroke="#4A5680"/><text x="52" y="${250-l*30}" text-anchor="end" font-size="11" fill="#8E97B3" font-family="Lexend, system-ui, sans-serif">Layer ${l+1}</text>${Array.from({length:12},(_,hh)=>`<rect x="${560-hh*12}" y="${241-l*30}" width="8" height="10" fill="#3B4466"/>`).join('')}`).join('');
  const pr=st.probs||[];const bwp=Math.min(70,520/Math.max(pr.length,1));const mxp=Math.max(...pr.map(x=>x[1]),0.01);
  const bars=pr.map((x,i)=>{const hh=10+60*x[1]/Math.max(mxp,0.25);return `<rect x="${320-pr.length*bwp/2+i*bwp+6}" y="${66-hh+24}" width="${bwp-12}" height="${hh}" rx="3" fill="${i?'#5B6B95':'#FF8A3D'}"/><text x="${320-pr.length*bwp/2+i*bwp+bwp/2}" y="${66-hh+16}" text-anchor="middle" font-size="11" fill="#E8EBF4" font-family="Lexend, system-ui, sans-serif">${h.piece(x[0]).slice(0,8)} ${h.pct(x[1])}</text>`}).join('');
  const T=st.T==null?1:st.T;const a=-2.2+4.4*Math.min(1,Math.max(0,(T-0.1)/1.9));
  return `<svg viewBox="0 0 640 390" role="img" aria-label="Flat diagram of the machine: tokens at the bottom, 6 layers, next-word odds at the top."><title>The machine, flat</title>
    <text x="52" y="100" text-anchor="end" font-size="11" fill="#8EA4FF" font-family="Lexend, system-ui, sans-serif">Odds</text><rect x="60" y="92" width="520" height="8" rx="3" fill="#232A40"/>${bars}
    ${layers}${st.emb!==false?P.map((p,i)=>`<g>${[0,1,2,3,4].map(j=>`<rect x="${x0+i*bw+bw/2-5}" y="${266+j*11}" width="10" height="9" fill="${(st.ids&&st.ids[i]||i*7+j)%3===j%3?'#FF8A3D':'#6E8BFF'}" opacity=".7"/>`).join('')}</g>`).join(''):''}
    ${arcs}${toks}
    <g transform="translate(605 40)"><circle r="24" fill="#262D41"/><line x1="0" y1="0" x2="${(Math.sin(a)*18).toFixed(1)}" y2="${(-Math.cos(a)*18).toFixed(1)}" stroke="#FF8A3D" stroke-width="3" stroke-linecap="round"/><text y="40" text-anchor="middle" font-size="10" fill="#FFC48F" font-family="Lexend, system-ui, sans-serif">T ${T.toFixed(1)}</text></g></svg>`}

/* ---------- scene state + mounting ---------- */
function sceneState(D,L){const st=D.steps[L.step];const base=D.scene?D.scene(L,L.step):{};const s=Object.assign({focus:st.view||'overview',view:st.view||'overview'},base,st.scene?st.scene(L):{});if(D.mode)s.mode=s.mode||D.mode;return s}
MX.sceneState=()=>{const D=MX.LESSONS[S.param];return D?sceneState(D,LS(S.param)):null};
async function loadThree(){if(threeLib)return threeLib;
  const local=new URL('machine/vendor/three.module.min.js',document.baseURI).href;
  try{threeLib=await import(local)}catch(e){threeLib=await import('https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.min.js')}
  return threeLib}
async function ensureScene(){if(sceneApi||sceneTried)return sceneApi;sceneTried=true;
  try{const c=document.createElement('canvas');if(!(c.getContext('webgl2')||c.getContext('webgl')))throw new Error('no webgl');
    const THREE=await loadThree();
    sceneApi=window.MXScene(THREE,{onFrame:placeCalls,onInteract:onInteract,onPick:onPick,onFlowDone:()=>{const D=MX.LESSONS[S.param];if(D&&D.onFlowDone){D.onFlowDone(LS(S.param));WB.render()}}});
  }catch(e){sceneFailed=true;console.warn('Inside the machine: 3D unavailable, using 2D view.',e)}
  WB.render();return sceneApi}
let callEls=[];
function placeCalls(a){for(const el of callEls){const p=a[el.dataset.anchor];if(!p||!p.vis){el.style.transform='translate(-999px,-999px)';continue}el.style.transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px)`}}
function onInteract(kind){const id=S.param;const D=MX.LESSONS[id];if(!D)return;const L=LS(id);if(!L.f.turned&&(kind==='rotate'||kind==='zoom'||kind==='pan')){L.f.turned=true;WB.render()}}
function onPick(p){const id=S.param;const D=MX.LESSONS[id];if(!D||!D.onPick)return;D.onPick(LS(id),p)}
MX.afterRender=()=>{
  if(S.screen!=='mx'){if(sceneApi)sceneApi.stop();callEls=[];return}
  const D=MX.LESSONS[S.param];if(!D){if(sceneApi)sceneApi.stop();return}
  const L=LS(S.param);
  if(X().v2d||sceneFailed){if(sceneApi)sceneApi.stop();return}
  const host=document.getElementById('mxstage');if(!host)return;
  if(!sceneApi){ensureScene();return}
  const ld=document.getElementById('mxload');if(ld)ld.remove();
  sceneApi.mount(host);callEls=[...host.querySelectorAll('.mx-call')];
  sceneApi.apply(sceneState(D,L));
  if(L.pendingFlow){L.pendingFlow=false;sceneApi.runFlow()}};
MX.applyScene=()=>{const D=MX.LESSONS[S.param];if(sceneApi&&D&&!X().v2d)sceneApi.apply(sceneState(D,LS(S.param)));else if(D&&(X().v2d||sceneFailed)){const el=document.querySelector('.mx-2d');if(el)el.innerHTML=schematic(D,LS(S.param))}};
MX.flow=()=>{const L=LS(S.param);if(sceneApi&&!X().v2d){sceneApi.runFlow()}else{const D=MX.LESSONS[S.param];if(D&&D.onFlowDone)D.onFlowDone(L)}};

/* ---------- actions ---------- */
function stepTo(i){const id=S.param;const D=MX.LESSONS[id];const L=LS(id);i=Math.max(0,Math.min(D.steps.length-1,i));if(D.steps[i].enter&&i!==L.step)D.steps[i].enter(L);L.step=i;L.max=Math.max(L.max,i);L.tab='steps';L.f.open=null;WB.render();
  const p=document.querySelector('.mx-panel');if(p&&window.innerWidth<1060)p.scrollIntoView({behavior:'smooth',block:'start'})}
MX.init=wb=>{WB=wb;S=wb.S;ACT=wb.ACT;esc=wb.esc;X();
  wb.VIEWS.mx=view;
  ACT.mxStep=i=>{const L=LS(S.param);if(+i<=L.max||S.unlockAll)stepTo(+i)};
  ACT.mxNext=()=>{const D=MX.LESSONS[S.param];const L=LS(S.param);L.f.introSeen=true;if(L.f.help!==true)L.f.help=false;if(stepOk(D,L,L.step)||S.unlockAll)stepTo(L.step+1)};
  ACT.mxBack=()=>{stepTo(LS(S.param).step-1)};
  ACT.mxTab=t=>{LS(S.param).tab=t;WB.render()};
  ACT.mxHelp=()=>{const L=LS(S.param);const on=L.f.help===true||(!L.f.introSeen&&L.step===0&&L.max===0&&L.f.help!==false);L.f.help=!on;L.f.introSeen=true;WB.render()};
  ACT.mxHelpClose=()=>{const L=LS(S.param);L.f.help=false;L.f.introSeen=true;WB.render()};
  ACT.mxGuide=()=>{X().guide=X().guide===false;WB.render()};
  ACT.mxAns=arg=>{const [k,i]=arg.split('|');LS(S.param).f[k]=+i;WB.render()};
  ACT.mxPart=k=>{const L=LS(S.param);const v=L.f.visited=L.f.visited||[];if(!v.includes(k))v.push(k);L.f.open=L.f.open===k?null:k;if(sceneApi&&PARTS[k])sceneApi.viewTo(PARTS[k][2]);WB.render()};
  ACT.mxView=k=>{LS(S.param).tab='steps';if(sceneApi)sceneApi.viewTo(k);WB.render()};
  ACT.mxTool=a=>{if(a==='2d'){if(sceneFailed)return;X().v2d=!X().v2d;WB.render();return}
    if(!sceneApi)return;if(a==='left')sceneApi.rotate(1);else if(a==='right')sceneApi.rotate(-1);else if(a==='in')sceneApi.zoom(0.85);else if(a==='out')sceneApi.zoom(1.18);else if(a==='reset')sceneApi.reset();else if(a==='flow')MX.flow();
    const L=LS(S.param);if(!L.f.turned&&a!=='flow'&&a!=='reset'){L.f.turned=true;WB.render()}};
  ACT.mxLive=()=>{X().live=true;if(M)M.load();WB.render()};
  ACT.mxPreset=async k=>{const m=mon();m.gen=[];await MX.runPreset(k);const D=MX.LESSONS[S.param];if(D&&D.onRun)D.onRun(LS(S.param),k);WB.render()};
  ACT.mxAsk=k=>askAssistant(k);
  ACT.mxFinish=()=>{const id=S.param;const D=MX.LESSONS[id];const L=LS(id);const first=!L.done;L.done=true;L.max=D.steps.length-1;X().notes[id]=D.note;if(first)S.cred+=10;
    const c=byId(id);const nxt=CAT.find((x,i)=>i>CAT.indexOf(c)&&MX.LESSONS[x.id]&&!LS(x.id).done)||CAT.find(x=>MX.LESSONS[x.id]&&!LS(x.id).done);
    S.modal={icon:'💡',kicker:'Lesson complete'+(first?' · +10 XP':'')+' · field note saved',title:c.title,body:D.takeaway,cta:nxt?['Next: '+nxt.title,'mx/'+nxt.id]:['Back to lessons','lessons'],sec:['All lessons','lessons']};WB.render()};
  Object.keys(MX.ACT||{}).forEach(k=>{ACT[k]=MX.ACT[k]});
};

/* inputs (sliders) are handled without a full re-render so dragging stays smooth */
MX.onInput=(key,el)=>{const k=key.slice(3);const D=MX.LESSONS[S.param];const L=LS(S.param);
  if(D&&D.input&&D.input(L,k,el))return;
  if(k==='T'){const m=mon();m.T=+el.value;const b=document.getElementById('mxv-T');if(b)b.textContent=m.T.toFixed(1);L.f.tMoved=true;MX.monitorBars();MX.applyScene();if(D&&D.afterT)D.afterT(L)}};
MX.onChange=(key,el)=>{WB.render()};
MX.onSubmit=(form,el)=>{const D=MX.LESSONS[S.param];const L=S.param?LS(S.param):null;
  if(form==='mxRun'){const t=el.querySelector('input').value.trim();mon().gen=[];MX.runCustom(t).then(r=>{if(r&&D&&D.onRun)D.onRun(L,'custom:'+t);WB.render()});return}
  if(D&&D.submit)D.submit(L,form,el)};
MX.render=()=>WB.render();
MX.esc=s=>esc(s);
MX.cache=cache;
})();
