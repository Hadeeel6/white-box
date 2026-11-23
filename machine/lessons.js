/* White Box · Inside the machine: the six built lessons.
   Each lesson: steps (tag, label, title, body, need = what unlocks Next), the math tab, what it leaves out,
   what the 3D scene shows (scene), and a field note for the student's journey.
   Text is written for 10th graders: one idea per step, a task before the explanation, then the "why". */
(function(){
'use strict';
const MX=window.MX,M=window.MXModel,REC=window.MX_REC||{},TOK=window.MX_TOK||{};
const h=MX.h;const A=MX.ACT={};const LESSONS=MX.LESSONS={};
const R=()=>MX.curRes()||MX.recRes('dog');
const machine=()=>{const r=R();const m=MX.mon();return {pieces:r.pieces,ids:r.ids,probs:MX.probs(r,m.T,8),T:m.T}};
const live=()=>MX.liveOn();
const word=p=>String(p).trim();
const tick=(b,t)=>`<li class="${b?'on':''}"><i></i>${t}</li>`;

/* ============ 1. TOUR OF A CHATBOT ============ */
function addPiece(L){const r=R();const m=MX.mon();const key=r.key;const g=L.f.grow&&L.f.grow.key===key?L.f.grow:(L.f.grow={key,add:[],src:live()?'live':'recorded'});
  if(live()&&r.src==='live'){L.f.busy=true;MX.render();
    M.generate(M.encode(r.text+g.add.join('')),1,1).then(t=>{g.add.push(t.replace(' [end]','.'));L.f.added=(L.f.added||0)+1;L.f.busy=false;g.pieces=M.pieces(M.encode(r.text+g.add.join('')));MX.render();MX.flow()});return}
  const s=((REC[key]||REC.dog).samples['1']||[])[0]||' and then';const words=s.replace(' [end]','.').match(/\s?\S+/g)||[];
  if(g.add.length<words.length){g.add.push(words[g.add.length]);L.f.added=(L.f.added||0)+1}else{g.done=true}
  MX.render();MX.flow()}
A.mxAdd=()=>addPiece(MX.LS('tour'));
A.mxGrowReset=()=>{const L=MX.LS('tour');L.f.grow=null;MX.render()};
A.mxTourRun=()=>{const L=MX.LS('tour');L.f.ran=true;L.pendingFlow=true;MX.render()};
LESSONS.tour={live:true,
  learn:['What the parts of a language model are','That it writes one token at a time','That sounding sure is not the same as being right'],learnAt:[2,4,5],
  parts:['tokens','embed','layers','heads','attention','output','sampler'],
  metrics:L=>{const r=R();return [['Model','distilGPT-2'],['Layers','6'],['Heads','12 per layer'],['Learned numbers','82 million'],['Tokens in',r.pieces.length]]},
  scene:(L,i)=>{const s=machine();if(i===2){const r=R();s.infl=REC[r.key]?REC[r.key].infl:null}
    if(i===4&&L.f.grow&&L.f.grow.add.length){const g=L.f.grow;s.pieces=g.pieces&&g.src==='live'?g.pieces:R().pieces.concat(g.add);s.ids=g.pieces&&g.src==='live'?null:R().ids.concat(g.add.map(()=>null));if(g.src!=='live')s.probs=[]}
    return s},
  steps:[
    {tag:'Setup',label:'Meet it',title:'Meet the machine',view:'overview',
     body:L=>`<p>This is a model of a real language model called <strong>distilGPT-2</strong>. It has 6 layers and about 82 million numbers that it learned by reading web text.</p><p>The chatbots you use work the same basic way. They are just much bigger.</p>
       <ul class="mxtasks">${tick(L.f.turned,'Turn the machine: drag it, or use the ↺ ↻ buttons')}</ul>`,need:L=>!!L.f.turned,hint:'Turn the machine to continue'},
    {tag:'Try',label:'Run it',title:'Follow one sentence',view:'overview',
     body:L=>`<p>Pick a sentence and press <strong>Run</strong>. Watch the pieces travel up through all 6 layers to the odds tray at the top.</p>${h.presets('mxPreset',MX.mon().preset,['dog','eat','once','trophy'])}
       <div class="mxrow"><button class="btn btn-primary" data-act="mxTourRun">▶ Run</button>${MX.liveChip()}</div>
       ${L.f.ran?h.take('The sentence went in at the bottom. A list of possible next pieces came out at the top.'):''}`,need:L=>!!L.f.ran,hint:'Press Run to continue'},
    {tag:'Explore',label:'Parts',title:'Five stations',view:'overview',calls:['tokens','embed','layers','attention','output'],
     body:L=>{const v=L.f.visited||[];return `<p>Click the labels on the model to open each station.</p>
       <ul class="mxtasks">${[['tokens','Tokens: the sentence, cut into pieces'],['embed','Numbers: each piece becomes a list of numbers'],['layers','Layers: the same step, 6 times'],['attention','Looking back: which earlier words mattered'],['output','Odds: what might come next']].map(x=>tick(v.includes(x[0]),x[1])).join('')}</ul>
       ${v.length>=4?h.take('Text → tokens → numbers → 6 layers that look back → odds for the next piece.'):''}`},need:L=>(L.f.visited||[]).length>=4,hint:'Open at least 4 stations'},
    {tag:'Predict',label:'Guess',title:'What comes out of the top?',view:'output',
     body:L=>h.quiz(L,'q1','The machine finishes running. What comes out of the top?',['A finished answer, written all at once','A score for every possible next piece','A link to a website it searched'],1,
       ['Not quite. It never writes the whole answer at once. Look at the top of the machine: it’s a list of options with odds.','Yes. It gives every one of its 50,257 tokens a score, then picks one. That’s all it does at the top.','Not this model. It never looks anything up. It only uses patterns it learned from text. (Some assistants add a search tool on top.)']),need:L=>L.f.q1===1,hint:'Answer to continue'},
    {tag:'Try',label:'Loop',title:'One piece at a time',view:'output',
     body:L=>{const g=L.f.grow;const r=R();return `<p>Press <strong>Add a piece</strong>. The machine picks one token, adds it to the end, and runs the whole thing again.</p>
       <div class="mxgrow"><span>${h.esc(r.text)}</span>${g?g.add.map(w=>`<b class="fade-in">${h.esc(w)}</b>`).join(''):''}<i class="caret"></i></div>
       <div class="mxrow"><button class="btn btn-primary" data-act="mxAdd" ${L.f.busy?'disabled':''}>+ Add a piece</button>${g&&g.add.length?'<button class="btn btn-ghost mxbtn" data-act="mxGrowReset">Start over</button>':''}<span class="muted" style="font-size:13px">${g&&g.src==='live'?'Live model':'Recorded run'}</span></div>
       ${(L.f.added||0)>=3?h.take('Every word a chatbot writes comes from this loop: score, pick, add, repeat. It doesn’t plan the whole answer first.'):''}`},need:L=>(L.f.added||0)>=3,hint:'Add 3 pieces to continue'},
    {tag:'Compare',label:'Bigger',title:'What real chatbots add',view:'overview',
     body:L=>`<p>distilGPT-2 has 82 million learned numbers. Today’s assistants are estimated to have hundreds of billions, and companies don’t always say exactly. They are also trained further to follow instructions and be helpful.</p>
       <p>But underneath, they still score and pick the next token. None of that checks whether the answer is true.</p>${h.assist(R().key,R().text)}`},
    {tag:'Recap',label:'Recap',title:'What you saw',view:'overview',
     body:L=>`<ul class="mxrecap"><li>Text is cut into <strong>tokens</strong>, and each token becomes a list of <strong>numbers</strong>.</li><li><strong>6 layers</strong> mix in information from earlier words.</li><li>At the top, every possible next token gets <strong>odds</strong>. One is picked, added, and the loop runs again.</li><li>Nothing in this loop checks facts. Sounding sure is not the same as being right.</li></ul>
       <div class="mxfield"><span class="kicker">Field note</span><p>AI writes one piece at a time from patterns. Sounding sure is not the same as being right.</p></div>`}],
  math:L=>`<p>At the top of the machine, the model computes a score <span class="mxm">z</span> for every token in its vocabulary, then turns scores into probabilities:</p>
    <div class="mxeq">P(next = <i>w</i> | the words so far) = e<sup>z<sub>w</sub></sup> ÷ Σ e<sup>z</sup></div>
    <p>Each layer updates every token’s list of numbers <span class="mxm">h</span> by adding what attention and a small network found:</p>
    <div class="mxeq">h ← h + Attention(h)<br>h ← h + Network(h)</div>
    <p class="muted">Counting: 6 layers × about 7 million numbers each, plus about 39 million for the token list (50,257 tokens × 768 numbers), comes to about 82 million.</p>`,
  leaves:`<ul class="mxrecap"><li>The 3D picture is simplified and not to scale. Each token really has 768 numbers, not 8.</li><li>Real assistants are hundreds or thousands of times bigger, trained for months, and fine-tuned with human feedback (Lesson 13).</li><li>Some assistants can search the web or run tools. That’s an extra system added around the model, not part of the loop you saw.</li><li>This model was trained on web pages, which means it also learned the web’s mistakes and biases.</li></ul>`,
  note:'AI writes one piece at a time from patterns. Sounding sure is not the same as being right.',
  takeaway:'A language model turns text into tokens and numbers, mixes them through layers that look back, then gives odds for the next token. It picks one, adds it, and repeats. Nothing in that loop checks facts.'};

/* ============ 2. TEXT TO TOKENS ============ */
function approxTok(t){const raw=t.match(/\s?[A-Za-z]+|\s?\d{1,3}|\s?[^\sA-Za-z\d]|\s+/g)||[];const out=[];raw.forEach(w=>{const c=w.trim();if(c.length>7){const lead=w.startsWith(' ')?' ':'';out.push(lead+c.slice(0,4));for(let i=4;i<c.length;i+=4)out.push(c.slice(i,i+4))}else out.push(w)});return out}
function tokenize(L,text){text=String(text||'').slice(0,160);const T=L.f.tk={text,pieces:[],ids:[],src:''};
  if(M&&M.tokStatus==='ready'){const ids=M.encode(text);T.ids=ids;T.pieces=M.pieces(ids);T.src='live'}
  else if(TOK[text]&&TOK[text].ids){T.ids=TOK[text].ids;T.pieces=TOK[text].pieces;T.src='recorded'}
  else{T.pieces=approxTok(text);T.ids=T.pieces.map(()=>null);T.src='guess'}
  const tr=L.f.tried=L.f.tried||[];if(!tr.includes(text))tr.push(text);return T}
const TOK_PRESETS=['unbelievable','strawberry','Hello, world!','homework','HOMEWORK','ChatGPT','3.14159','Antidisestablishmentarianism','I love pizza!','lol'];
const LANGS=[['English','Where is the library?',5],['Turkish','Kütüphane nerede?',10],['French','Où est la bibliothèque ?',11],['Spanish','¿Dónde está la biblioteca?',14],['Chinese','图书馆在哪里？',17],['Hindi','पुस्तकालय कहाँ है?',29],['Amharic','ቤተ መጻሕፍቱ የት ነው?',34]];
A.mxTokPre=t=>{const L=MX.LS('tokens');tokenize(L,t);MX.render()};
A.mxIds=()=>{const L=MX.LS('tokens');L.f.ids=!L.f.ids;MX.render()};
A.mxBpe=a=>{const L=MX.LS('tokens');L.f.bpe=a==='reset'?0:Math.min(8,(L.f.bpe||0)+1);MX.render()};
function bpe(n){let words=['l o w','l o w e r','l o w e s t','s l o w','s l o w e r','n e w e r','n e w e s t'].map(w=>w.split(' '));const merges=[];
  for(let s=0;s<n;s++){const c={};words.forEach(w=>{for(let i=0;i<w.length-1;i++){const k=w[i]+'\u0001'+w[i+1];c[k]=(c[k]||0)+1}});const best=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];if(!best)break;
    const [a,b]=best[0].split('\u0001');merges.push([a+b,best[1]]);words=words.map(w=>{const o=[];for(let i=0;i<w.length;i++){if(i<w.length-1&&w[i]===a&&w[i+1]===b){o.push(a+b);i++}else o.push(w[i])}return o})}
  return {words,merges}}
function bpeHTML(L){const n=L.f.bpe||0;const b=bpe(n);return `<div class="mxbpe"><p>Tokenizers are built by counting. Start with single letters, then keep gluing together the pair that shows up most often.</p>
  <div class="stack" style="gap:6px">${b.words.map(w=>h.chips(w)).join('')}</div>
  <div class="mxrow"><button class="btn btn-ghost mxbtn" data-act="mxBpe" data-arg="step" ${n>=8?'disabled':''}>Glue the most common pair</button>${n?'<button class="linkbtn" data-act="mxBpe" data-arg="reset">Reset</button>':''}<span class="muted" style="font-size:13px">${n} of 8 merges</span></div>
  ${b.merges.length?`<p class="muted" style="font-size:14px">New tokens: ${b.merges.map(m=>`<code>${h.esc(m[0])}</code> (${m[1]}×)`).join(', ')}</p>`:''}
  ${n>=4?h.take('GPT-2 did this 50,000 times on lots of English web text. That’s why common English words get one token and other languages get chopped up.'):''}</div>`}
LESSONS.tokens={live:true,
  init:L=>{if(!L.f.tk)tokenize(L,'The machine reads tokens, not letters.');if(M&&M.tokStatus==='off')M.loadTokenizer().then(()=>{if(L.f.tk&&L.f.tk.src!=='live'&&L.f.tk.src!=='recorded'){tokenize(L,L.f.tk.text)}MX.render()})},
  learn:['How text is cut into tokens','Why spaces and capitals matter','Why some languages cost more'],learnAt:[2,3,5],
  parts:['tokens','last'],
  metrics:L=>{const T=L.f.tk||{pieces:[],text:''};return [['Characters',T.text.length],['Tokens',T.pieces.length],['Vocabulary','50,257'],['Tokenizer',T.src==='live'?'Live':T.src==='recorded'?'Recorded':'Offline guess']]},
  scene:(L,i)=>{const T=L.f.tk||{pieces:[],ids:[]};if(i===0){const r=TOK['The machine reads tokens, not letters.'];return {pieces:r.pieces,ids:r.ids,showIds:true,emb:i>=6,focus:'tokens',view:'tokens',probs:[]}}
    if(i===3){const v=['dog',' dog','Dog',' Dog','DOG'];const p=[],d=[];v.forEach(k=>{TOK[k].pieces.forEach((x,j)=>{p.push(x);d.push(TOK[k].ids[j])})});return {pieces:p,ids:d,showIds:true,emb:false,probs:[]}}
    if(i===4){const r=TOK.strawberry;return {pieces:r.pieces,ids:r.ids,showIds:true,emb:false,probs:[]}}
    return {pieces:T.pieces.length?T.pieces:['…'],ids:T.ids,showIds:!!L.f.ids||i<3,emb:i>=6,probs:[]}},
  steps:[
    {tag:'Setup',label:'Pieces',title:'The machine can’t see letters',view:'tokens',calls:['tokens'],
     body:L=>`<p>Before anything else happens, your text is cut into <strong>tokens</strong>. Each token has an ID number from a list of 50,257.</p><p>Look at the tray: 38 characters became 8 tokens. Notice the dots: a space is part of the token after it.</p>`},
    {tag:'Predict',label:'Guess',title:'How many pieces?',view:'tokens',
     body:L=>h.quiz(L,'q1','How many tokens is the word “unbelievable” (with no space before it)?',['1','2','4','12'],2,
       ['Not quite. It’s 4: un · bel · iev · able. With a space in front (“ unbelievable”), it really is 1 token, because that form is common in web text.','Close, but it’s 4: un · bel · iev · able.','Yes: un · bel · iev · able. But “ unbelievable” with a space in front is just 1 token, because that form is common.','That would be one per letter. The machine uses bigger pieces: un · bel · iev · able.']),need:L=>L.f.q1===2,hint:'Answer to continue'},
    {tag:'Try',label:'Playground',title:'Tokenizer playground',view:'tokens',
     body:L=>{const T=L.f.tk||{pieces:[]};return `<p>Type anything, or tap an example. Try your name, a long word, a number, an emoji.</p>
       <form class="mxrow" data-form="mxTok"><input type="text" id="mxtok" maxlength="160" value="${h.esc(T.text||'')}" aria-label="Text to cut into tokens"><button class="btn btn-ghost mxbtn" type="submit">Cut it</button></form>
       <div class="mxpresets">${TOK_PRESETS.map(t=>`<button class="mxpre ${T.text===t?'on':''}" data-act="mxTokPre" data-arg="${h.esc(t)}">${h.esc(t)}</button>`).join('')}</div>
       ${h.chips(T.pieces,{ids:L.f.ids?T.ids:null})}
       <div class="mxrow" style="justify-content:space-between"><span class="muted" style="font-size:14px">${T.text.length} characters → <strong>${T.pieces.length} tokens</strong></span><button class="linkbtn" data-act="mxIds">${L.f.ids?'Hide':'Show'} ID numbers</button></div>
       ${T.src==='guess'?h.note('Offline guess. The real tokenizer could not load, so this splits words roughly. Ready-made examples use the real tokenizer’s recorded results.'):''}
       ${(L.f.tried||[]).length>=4?h.take('Common words are one token. Rare words, names and numbers get chopped into several.'):''}`},need:L=>(L.f.tried||[]).length>=4,hint:'Try 3 different texts'},
    {tag:'Try',label:'Spaces',title:'Same word, different tokens',view:'tokens',
     body:L=>`<div class="mxtable"><div><span>Text</span><span>Tokens</span><span>ID</span></div>${['dog',' dog','Dog',' Dog','DOG'].map(k=>`<div><code>${h.esc(k.replace(/^ /,'·'))}</code><span>${TOK[k].pieces.map(p=>h.piece(p)).join(' · ')}</span><span>${TOK[k].ids.map(x=>'#'+x).join(' ')}</span></div>`).join('')}</div>
       ${h.quiz(L,'q2','Why do “·dog” and “Dog” get different ID numbers?',['The tokenizer made a mistake','A space or a capital letter makes it a different piece of text','They get the same ID'],1,['No mistake. The tokenizer matches exact text, so a space or capital makes it different.','Right. To the machine, “·dog”, “dog” and “Dog” are three unrelated IDs. It has to learn from examples that they mean the same animal.','Look at the table again: #3290, #9703, #32942.'])}`,need:L=>L.f.q2===1,hint:'Answer to continue'},
    {tag:'Key idea',label:'Letters',title:'Why chatbots miscount letters',view:'tokens',
     body:L=>`<p>Ask a chatbot how many r’s are in “strawberry” and it may get it wrong. Here’s what the machine actually sees:</p>${h.chips(TOK.strawberry.pieces,{ids:TOK.strawberry.ids})}
       ${h.quiz(L,'q3','Why could it miscount the r’s?',['It’s bad at counting to three','It sees 3 tokens with ID numbers, not 10 letters','Someone programmed it to lie'],1,['Counting isn’t the problem. It never sees the letters to count.','Yes. The letters are hidden inside “raw” and “berry”. It has to remember how each token is spelled, and sometimes it doesn’t.','No one programmed that. It’s a side effect of reading tokens instead of letters.'])}`,need:L=>L.f.q3===1,hint:'Answer to continue'},
    {tag:'Fairness',label:'Languages',title:'Same question, different cost',view:'tokens',
     body:L=>{const mx=34;return `<p>“Where is the library?” in 7 languages, cut by the same tokenizer:</p>
       <div class="mxbars">${LANGS.map((x,i)=>`<div class="mxbar ${i===0?'hi':''}"><span>${x[0]}</span><i><b style="width:${(x[2]/mx*100).toFixed(0)}%"></b></i><em>${x[2]}</em></div>`).join('')}</div>
       <p>The tokenizer was built mostly from English web text. Other languages get chopped into many more pieces, some into raw bytes. More tokens means it costs more to use, less fits in the model’s memory, and answers are often worse.</p>
       ${h.quiz(L,'q4','Who might this be unfair to?',['Nobody, it’s just math','People who don’t write in English','Only computer scientists'],1,['The math is neutral, but the choice of training text wasn’t. It decides who gets the cheaper, better version.','Yes. Same question, up to 7 times the cost, and often a worse answer. That’s a fairness problem built into the first step.','It affects anyone using the tool in another language, which is most people in the world.'])}`},need:L=>L.f.q4===1,hint:'Answer to continue'},
    {tag:'Math',label:'Merges',title:'How the token list was made',view:'tokens',body:L=>bpeHTML(L)},
    {tag:'Recap',label:'Recap',title:'What you saw',view:'tokens',
     body:L=>`<ul class="mxrecap"><li>Text becomes <strong>tokens</strong>: whole words, pieces of words, or single bytes.</li><li>A space or a capital makes a <strong>different token</strong>.</li><li>The machine sees token IDs, not letters, so spelling and counting tasks can trip it up.</li><li>Tokenizers built on English text make other languages <strong>cost more</strong>.</li></ul>
       <div class="mxfield"><span class="kicker">Field note</span><p>The machine reads tokens, not letters, and some languages pay more for the same question.</p></div>`}],
  math:L=>`<p>GPT-2 uses <strong>byte-pair encoding</strong>. It starts from bytes and repeats one rule: find the pair of neighbors that appears most often in the training text, and glue it into a new token.</p>${bpeHTML(L)}<p class="muted">GPT-2 ran this 50,000 times. Its list holds 256 bytes + 50,000 merges + 1 “end of text” token = 50,257.</p>`,
  leaves:`<ul class="mxrecap"><li>Different models use different tokenizers. Newer ones have bigger lists (100,000+) and handle more languages better.</li><li>Our offline guess (used only if the real tokenizer can’t load) is not the real algorithm.</li><li>Emoji and many scripts are split into raw bytes, shown here as *.</li></ul>`,
  submit:(L,form,el)=>{if(form==='mxTok'){const t=el.querySelector('input').value;if(t.trim()){tokenize(L,t);MX.render()}}},
  note:'The machine reads tokens, not letters, and some languages pay more for the same question.',
  takeaway:'Text is cut into tokens before the machine sees it. Spaces and capitals change the tokens, letters are hidden inside them, and languages other than English often need many more tokens for the same meaning.'};

/* ============ 5. ATTENTION: LOOKING BACK ============ */
const ATT_KEYS=['dog','trophy','maria','once','france'];
function attState(L){const r=R();const a=L.f.att&&L.f.att.key===r.key?L.f.att:(L.f.att={key:r.key,infl:null,src:'',ko:-1,koTop:null,kos:[]});return a}
A.mxKo=i=>{const L=MX.LS('attention');const r=R();const a=attState(L);i=+i;if(i>=r.pieces.length-1)return;a.ko=a.ko===i?-1:i;a.koTop=null;
  if(a.ko>=0&&!(L.f.kos=L.f.kos||[]).includes(r.key+':'+i))L.f.kos.push(r.key+':'+i);
  if(a.ko>=0&&live()&&r.src==='live'){a.busy=true;MX.render();M.without(r.ids,i,8).then(x=>{const z=x.logZ;a.koTop=x.top.slice(0,6).map(t=>[t[0],Math.exp(t[1]-z)]);a.busy=false;MX.render()})}else MX.render()};
A.mxMeasure=()=>{const L=MX.LS('attention');const r=R();const a=attState(L);
  if(live()&&r.src==='live'){a.busy=true;a.prog=0;MX.render();M.influence(r.ids,(i)=>{a.prog=i+1;const el=document.getElementById('mxprog');if(el)el.textContent=`Removing word ${i+1} of ${r.ids.length-1}…`}).then(v=>{a.infl=v;a.src='live';a.busy=false;L.f.measured=true;MX.render()})}
  else{a.infl=REC[r.key]?REC[r.key].infl:null;a.src='recorded';L.f.measured=!!a.infl;MX.render()}};
function inflList(a,r){if(!a.infl)return '';const v=a.infl.map(x=>x||0);const s=v.reduce((p,q)=>p+q,0)||1;const order=v.map((x,i)=>[i,x]).filter(x=>x[0]<r.pieces.length-1).sort((p,q)=>q[1]-p[1]);
  return `<div class="mxbars">${order.slice(0,6).map((x,k)=>`<div class="mxbar ${k===0?'hi':''}"><span>${h.piece(r.pieces[x[0]])}</span><i><b style="width:${(x[1]/order[0][1]*100).toFixed(0)}%"></b></i><em>${Math.round(x[1]/s*100)}%</em></div>`).join('')}</div>`}
const QK={words:['dog','cat','because'],keys:[[1,0.25],[0.85,-0.45],[-0.3,1]],vals:['an animal that chases','an animal that runs','a reason is coming']};
function qk(deg){const t=deg*Math.PI/180;const q=[2*Math.cos(t),2*Math.sin(t)];const sc=QK.keys.map(k=>(q[0]*k[0]+q[1]*k[1])/Math.SQRT2);const mx=Math.max(...sc);const ex=sc.map(s=>Math.exp(s-mx));const z=ex.reduce((a,b)=>a+b,0);return {q,sc,w:ex.map(e=>e/z)}}
function qkHTML(deg){const r=qk(deg);const c=100,s=40;
  return `<div class="mxqk" id="mxqk"><svg viewBox="0 0 200 200" class="mxqk-svg" aria-label="Query arrow and three key arrows"><circle cx="${c}" cy="${c}" r="${s*2}" fill="none" stroke="#2E3650"/><line x1="0" y1="${c}" x2="200" y2="${c}" stroke="#232A3D"/><line x1="${c}" y1="0" x2="${c}" y2="200" stroke="#232A3D"/>
    ${QK.keys.map((k,i)=>`<line x1="${c}" y1="${c}" x2="${c+k[0]*s*1.6}" y2="${c-k[1]*s*1.6}" stroke="#6E8BFF" stroke-width="${2+r.w[i]*6}" opacity="${0.4+r.w[i]*0.6}"/><text x="${c+k[0]*s*1.9}" y="${c-k[1]*s*1.9+4}" fill="#C9D2E8" font-size="12" text-anchor="middle" font-family="Lexend">${QK.words[i]}</text>`).join('')}
    <line x1="${c}" y1="${c}" x2="${c+r.q[0]*s}" y2="${c-r.q[1]*s}" stroke="#FF8A3D" stroke-width="4" stroke-linecap="round"/><text x="${c+r.q[0]*s*1.12}" y="${c-r.q[1]*s*1.12}" fill="#FFC48F" font-size="12" text-anchor="middle" font-family="Lexend">“it” asks</text></svg>
    <div class="mxtable"><div><span>Key</span><span>Score q·k ÷ √2</span><span>Share</span></div>${QK.words.map((w,i)=>`<div><code>${w}</code><span>${r.sc[i].toFixed(2)}</span><span><strong>${Math.round(r.w[i]*100)}%</strong></span></div>`).join('')}</div>
    <p class="muted" style="font-size:14px">“it” mixes in ${QK.words.map((w,i)=>`${Math.round(r.w[i]*100)}% of <em>${QK.vals[i]}</em>`).join(', ')}.</p></div>`}
LESSONS.attention={live:true,
  learn:['That earlier words change what comes next','How to measure which words a model relied on','How queries and keys turn into attention'],learnAt:[2,3,5],
  parts:['tokens','attention','heads','layers','output'],
  init:L=>{const m=MX.mon();if(!ATT_KEYS.includes(m.preset)&&m.preset){MX.runPreset('dog')}},
  onPick:(L,p)=>{if(p.type==='token'&&L.step>=2&&L.step<=3)A.mxKo(p.i)},
  metrics:L=>{const r=R();const a=attState(L);return [['Tokens',r.pieces.length],['Layers × heads','6 × 12 = 72'],['Removed',a.ko>=0?h.piece(r.pieces[a.ko]):'none'],['Measured',a.infl?(a.src==='live'?'Live':'Recorded'):'not yet']]},
  scene:(L,i)=>{const s=machine();const a=attState(L);if(i>=2&&i<=3){s.ko=a.ko;if(a.ko>=0&&a.koTop)s.probs=a.koTop}if(i===3||i===6||i===7)s.infl=a.infl||(i!==3&&REC[R().key]?REC[R().key].infl:null);return s},
  steps:[
    {tag:'Setup',label:'Meaning',title:'Same word, different meaning',view:'attention',
     body:L=>`<div class="mxpair"><div>I sat on the <strong>bank</strong> of the river.</div><div>I put money in the <strong>bank</strong>.</div></div><p>Same token, different meaning. To guess what comes next, the machine has to <strong>look back</strong> at the earlier words. This is called <strong>attention</strong>.</p>`},
    {tag:'Predict',label:'Guess',title:'Which word matters most?',view:'tokens',
     body:L=>{const r=R();return `${h.presets('mxPreset',MX.mon().preset,ATT_KEYS)}<p>The machine is about to guess what comes after <strong>“${h.esc(word(r.pieces[r.pieces.length-1]))}”</strong>. Which earlier word do you think it relies on most?</p>
       <div class="mxchips">${r.pieces.slice(0,-1).map((p,i)=>`<button class="mxchip c${i%6} ${L.f.guess===r.key+':'+i?'ko':''}" data-act="mxAttGuess" data-arg="${i}">${h.piece(p)}</button>`).join('')}</div>
       ${L.f.guess&&L.f.guess.startsWith(r.key+':')?h.note('Saved your guess. Let’s test it.'):''}`},need:L=>!!L.f.guess,hint:'Pick a word to continue'},
    {tag:'Try',label:'Knock out',title:'Knock out a word',view:'attention',
     body:L=>{const r=R();const a=attState(L);const base=MX.probs(r,1,6);return `<p>Click a word (here or on the model) to remove it. The machine runs again without it.</p>
       ${h.chips(r.pieces,{act:'mxKo',ko:a.ko,last:true})}
       ${a.ko<0?h.bars(base,{rest:false}):a.busy?'<p class="muted">Running without it…</p>':a.koTop?`<div class="mxpair"><div><span class="kicker">With every word</span>${h.bars(base,{rest:false})}</div><div><span class="kicker">Without “${h.esc(word(r.pieces[a.ko]))}”</span>${h.bars(a.koTop,{rest:false})}</div></div>`
         :`<div class="mxko"><strong>${Math.round(((REC[r.key]||{}).infl||[])[a.ko]*100)||0}%</strong><span>of the odds moved when “${h.esc(word(r.pieces[a.ko]))}” was removed (recorded run). Turn on the live model to see the new odds.</span></div>`}
       ${(L.f.kos||[]).length>=2?h.take('Some words barely matter. Others change everything. The machine leans on them more.'):''}`},need:L=>(L.f.kos||[]).length>=2,hint:'Knock out 2 different words'},
    {tag:'Try',label:'Measure',title:'Measure every word',view:'attention',calls:['attention'],enter:L=>{const a=attState(L);a.ko=-1;a.koTop=null},
     body:L=>{const r=R();const a=attState(L);const g=L.f.guess&&L.f.guess.startsWith(r.key+':')?+L.f.guess.split(':')[1]:null;
       let top=null;if(a.infl){const v=a.infl.map(x=>x||0);top=v.slice(0,-1).indexOf(Math.max(...v.slice(0,-1)))}
       return `${h.presets('mxPreset',MX.mon().preset,ATT_KEYS)}<p>Press <strong>Measure</strong> to remove every word, one at a time, and see how much the odds move. Thicker lines on the model mean the word mattered more.</p>
       <div class="mxrow"><button class="btn btn-primary" data-act="mxMeasure" ${a.busy?'disabled':''}>Measure</button>${a.busy?`<span class="muted" id="mxprog">Running…</span>`:a.infl?h.src({src:a.src}):''}</div>
       ${inflList(a,r)}
       ${top!=null&&g!=null?h.note(top===g?`You guessed “${h.esc(word(r.pieces[g]))}”, and it was the word the machine relied on most.`:`You guessed “${h.esc(word(r.pieces[g]))}”. The machine relied most on “${h.esc(word(r.pieces[top]))}”. Surprised? Small models often lean on words people wouldn’t.`):''}`},need:L=>!!L.f.measured,hint:'Press Measure to continue'},
    {tag:'Key idea',label:'Questions',title:'Questions and labels',view:'heads',calls:['heads'],
     body:L=>`<p>Inside each layer, every token does three things:</p><ul class="mxrecap"><li>It asks a <strong>question</strong> (query): “What am I looking for?”</li><li>It shows a <strong>label</strong> (key): “Here’s what I’m about.”</li><li>It offers <strong>information</strong> (value): “Here’s what you can borrow from me.”</li></ul>
       <p>When a question matches a label well, the token borrows more of that word’s information. Each of the 12 heads in a layer asks a different kind of question at the same time.</p>
       ${h.quiz(L,'q1','“it” is looking for the thing it refers to. Which label should match its question best?',['because','dog or cat','the'],1,['“because” signals a reason, not a thing. Its label is a weak match.','Yes. Nouns like “dog” and “cat” carry the labels that answer “what could ‘it’ be?”','“the” appears everywhere, so its label tells you very little.'])}`,need:L=>L.f.q1===1,hint:'Answer to continue'},
    {tag:'Math',label:'Scores',title:'Turn the question',view:'heads',
     body:L=>`<p>Here “it” asks a question (the orange arrow). Each earlier word has a label (blue). The score is how much they point the same way. Turn the question and watch the shares change.</p>
       ${h.slider('qa','Question direction',-180,180,1,L.f.qa==null?20:L.f.qa,v=>v+'°')}${qkHTML(L.f.qa==null?20:L.f.qa)}`,need:L=>L.f.qaMoved,hint:'Turn the question to continue'},
    {tag:'Leaves out',label:'Real',title:'What we measured, and what we didn’t',view:'attention',
     body:L=>`<p>The lines on the model come from <strong>knocking out</strong> words and measuring the change. That shows which words the final answer <em>depended on</em>.</p><p>It is not the same as reading the raw attention inside the model. distilGPT-2 has 6 layers × 12 heads = 72 attention patterns, each looking back in its own way. Some follow grammar, some just look at the previous word.</p>
       ${h.quiz(L,'q2','Removing “chased” moved the odds a lot. What can you say?',['The model understands chasing','The answer depended heavily on that word','The model is broken'],1,['Careful. It shows the word mattered for the odds, not that the model understands it like you do.','Yes. That’s exactly what this measurement shows, nothing more.','No, depending on some words more than others is how it works.'])}`,need:L=>L.f.q2===1,hint:'Answer to continue'},
    {tag:'Recap',label:'Recap',title:'What you saw',view:'attention',
     body:L=>`<ul class="mxrecap"><li>Earlier words change what comes next. The machine <strong>looks back</strong> at them.</li><li>Removing a word and re-running shows <strong>which words the answer depended on</strong>.</li><li>Inside, each token asks a <strong>question</strong>, matches it against <strong>labels</strong>, and borrows information from the best matches.</li><li>72 heads look back in different ways at once.</li></ul>
       <div class="mxfield"><span class="kicker">Field note</span><p>How I word a question changes which words the AI leans on, so small changes in my prompt can change the answer.</p></div>`}],
  math:L=>`<p>For one head, each token turns its numbers into a query <span class="mxm">q</span>, a key <span class="mxm">k</span> and a value <span class="mxm">v</span>. The share of attention token <i>i</i> gives to earlier token <i>j</i> is:</p>
    <div class="mxeq">a<sub>ij</sub> = softmax<sub>j</sub>( q<sub>i</sub> · k<sub>j</sub> ÷ √d )</div><p>Then it mixes the values: <span class="mxm">out<sub>i</sub> = Σ a<sub>ij</sub> v<sub>j</sub></span>. In distilGPT-2, d = 64 and there are 12 heads per layer.</p>
    ${h.slider('qa','Question direction',-180,180,1,L.f.qa==null?20:L.f.qa,v=>v+'°')}${qkHTML(L.f.qa==null?20:L.f.qa)}
    <p class="muted">Our “knock out” measure: influence<sub>j</sub> = ½ Σ<sub>w</sub> | P(w | all words) − P(w | without word j) |, from 0 (no change) to 1 (completely different).</p>`,
  leaves:`<ul class="mxrecap"><li>The lines show influence measured by removing words, not the model’s raw attention weights.</li><li>Removing a word also shifts the positions of the words after it, which adds a small effect of its own.</li><li>Real attention runs in every layer for every token at once, not just for the last one.</li><li>Big models have dozens of layers and many more heads, so their patterns are much richer.</li></ul>`,
  input:(L,k,el)=>{if(k==='qa'){L.f.qa=+el.value;L.f.qaMoved=true;const b=document.getElementById('mxv-qa');if(b)b.textContent=el.value+'°';const box=document.getElementById('mxqk');if(box)box.outerHTML=qkHTML(L.f.qa);return true}},
  onRun:(L)=>{const a=attState(L);a.ko=-1;a.koTop=null},
  note:'How I word a question changes which words the AI leans on, so small changes in my prompt can change the answer.',
  takeaway:'Attention lets each token look back at earlier ones. Removing a word and re-running shows which words the answer depended on. Inside, tokens match questions against labels and borrow information from the best matches.'};
A.mxAttGuess=i=>{const L=MX.LS('attention');L.f.guess=R().key+':'+i;MX.render()};

/* ============ 7. NEXT-WORD ODDS ============ */
const SM=['pizza','snacks','dinner','rocks'];
function smHTML(z){const ex=z.map(v=>Math.exp(v));const s=ex.reduce((a,b)=>a+b,0);
  return `<div id="mxsm"><div class="mxtable"><div><span>Token</span><span>Score z</span><span>e<sup>z</sup></span><span>Share</span></div>${SM.map((w,i)=>`<div><code>${w}</code><span>${z[i].toFixed(1)}</span><span>${ex[i]<10?ex[i].toFixed(2):Math.round(ex[i])}</span><span><strong>${Math.round(ex[i]/s*100)}%</strong></span></div>`).join('')}<div><span></span><span></span><span>Σ = ${Math.round(s*10)/10}</span><span>100%</span></div></div></div>`}
function smSliders(L){const z=L.f.z||[3,2.5,1.5,-1];return SM.map((w,i)=>h.slider('z'+i,'Score for “'+w+'”',-3,6,0.5,z[i],v=>(+v).toFixed(1))).join('')+smHTML(z)}
LESSONS.odds={live:true,
  learn:['That the machine scores every token','How scores become percentages','That confident is not the same as correct'],learnAt:[2,3,4],
  parts:['output','last','tokens'],
  metrics:L=>{const r=R();const P=MX.probs(r,1,1);return [['Choices','50,257 tokens'],['Top pick',P[0]?h.piece(P[0][0]):'–'],['Top odds',P[0]?h.pct(P[0][1]):'–'],['Source',r.src==='live'?'Live':'Recorded']]},
  scene:(L,i)=>{const s=machine();s.T=1;s.probs=MX.probs(R(),1,8);return s},
  onRun:(L,k)=>{const r=L.f.runs=L.f.runs||[];if(!r.includes(k))r.push(k)},
  steps:[
    {tag:'Setup',label:'Scores',title:'A score for every token',view:'output',calls:['output','last'],
     body:L=>`<p>At the top of the machine, every one of its <strong>50,257 tokens</strong> gets a score. A higher score means “more likely to come next.” The tray shows the top 8.</p><p>Nothing here is a fact or a sentence yet. It’s just a ranking.</p>`},
    {tag:'Predict',label:'Guess',title:'Beat the machine',view:'output',
     body:L=>{const r=MX.recRes('eat');const top=MX.probs(r,1,30);const g=(L.f.guess||'').trim().toLowerCase();const rank=g?top.findIndex(x=>word(x[0]).toLowerCase()===g):-1;
       return `<p>“After school, I like to eat ___”. Type the word you think the machine ranks first.</p>
       <form class="mxrow" data-form="mxGuess"><input type="text" id="mxguess" maxlength="20" value="${h.esc(L.f.guess||'')}" placeholder="pizza" aria-label="Your guess"><button class="btn btn-ghost mxbtn" type="submit">Check</button></form>
       ${g?`${h.note(rank===0?'Exactly right! You think like the machine.':rank>0?`“${h.esc(g)}” is #${rank+1} with ${h.pct(top[rank][1])}. The machine’s top pick is “${h.esc(word(top[0][0]))}”.`:`“${h.esc(g)}” isn’t in its top 30. Its top pick is “${h.esc(word(top[0][0]))}”, a word that fits almost any sentence.`)}${h.bars(MX.probs(r,1,8))}`:''}`},need:L=>!!L.f.guess,hint:'Make a guess to continue',
     scene:L=>L.f.guess?{pieces:REC.eat.pieces,ids:REC.eat.ids,probs:MX.probs(MX.recRes('eat'),1,8)}:{pieces:REC.eat.pieces,ids:REC.eat.ids,probs:[]}},
    {tag:'Try',label:'Monitor',title:'Run the model monitor',view:'output',
     body:L=>`<p>Try a few sentences. Which ones make the machine sure, and which ones leave it guessing?</p>${(L.f.runs||[]).length>=2?h.take('When many next words fit, the odds spread out. When one fits best, one bar towers over the rest.'):''}`,
     monitor:L=>h.monitor({T:1})+h.assist(R().key,R().text),need:L=>(L.f.runs||[]).length>=2,hint:'Run 2 different sentences'},
    {tag:'Key idea',label:'Percent',title:'From scores to percentages',view:'output',
     body:L=>{const r=R();const t=r.top.slice(0,4);const P=MX.probs(r,1,4);return `<p>The raw scores are just numbers. The machine turns them into percentages with a function called <strong>softmax</strong>: bigger scores get a much bigger share, and all the shares add up to 100%.</p>
       <div class="mxtable"><div><span>Token</span><span>Raw score</span><span>Share</span></div>${t.map((x,i)=>`<div><code>${h.piece(x[0])}</code><span>${x[1].toFixed(2)}</span><span><strong>${h.pct(P[i][1])}</strong></span></div>`).join('')}</div>
       <p class="muted" style="font-size:14px">Every extra point of score multiplies the share by about 2.7 (that’s the number e).</p>`}},
    {tag:'Try',label:'Sure or made up',title:'Sure doesn’t mean true',view:'output',
     body:L=>{const f=MX.probs(MX.recRes('france'),1,5),z=MX.probs(MX.recRes('zorbax'),1,5);return `<div class="mxpair"><div><span class="kicker">The capital of France is…</span>${h.bars(f,{rest:false})}</div><div><span class="kicker">The capital of Zorbax (made up) is…</span>${h.bars(z,{rest:false})}</div></div>
       <p>This small model doesn’t even put “Paris” near the top. And for a place that doesn’t exist, it answers just as smoothly: “is located…”, “is a…”. The odds look the same for a real place and a fake one.</p>
       ${h.quiz(L,'q1','What does a high percentage tell you?',['The answer is true','The words often follow each other in text it learned from','The model checked a source'],1,['No. It only says how well the words fit the pattern. That’s how confident-sounding mistakes happen.','Yes. It’s about patterns in text, not facts about the world. Check important answers somewhere else.','This model can’t check anything. It never looks outside itself.'])}`},need:L=>L.f.q1===1,hint:'Answer to continue',
     scene:L=>({pieces:REC.zorbax.pieces,ids:REC.zorbax.ids,probs:MX.probs(MX.recRes('zorbax'),1,8)})},
    {tag:'Math',label:'Softmax',title:'Softmax lab',view:'output',body:L=>`<p>Drag the scores. Watch how one point of difference changes the shares.</p>${smSliders(L)}`,need:L=>!!L.f.zMoved,hint:'Move a slider to continue'},
    {tag:'Recap',label:'Recap',title:'What you saw',view:'output',
     body:L=>`<ul class="mxrecap"><li>The machine gives <strong>every token a score</strong>, then softmax turns scores into percentages.</li><li>High odds mean the words fit a <strong>pattern</strong> it learned, not that they are true.</li><li>A real place and a made-up place can get the same smooth, confident answer.</li></ul>
       <div class="mxfield"><span class="kicker">Field note</span><p>High odds mean the words fit a pattern, not that they’re true. I check important answers somewhere else.</p></div>`}],
  math:L=>`<p>Softmax turns scores <span class="mxm">z<sub>1</sub> … z<sub>n</sub></span> into probabilities that add up to 1:</p><div class="mxeq">P(w) = e<sup>z<sub>w</sub></sup> ÷ Σ<sub>j</sub> e<sup>z<sub>j</sub></sup></div><p>For distilGPT-2 the sum runs over all 50,257 tokens.</p>${smSliders(L)}`,
  leaves:`<ul class="mxrecap"><li>We show the top 8 tokens. Thousands of others share the rest of the odds.</li><li>Big assistants rank “Paris” first because they learned from far more text. Being right more often still isn’t the same as checking.</li><li>Some assistants can look things up with a search tool. That’s added around the model, and it can still pick bad sources.</li></ul>`,
  input:(L,k,el)=>{if(/^z\d$/.test(k)){const i=+k[1];const z=L.f.z=L.f.z||[3,2.5,1.5,-1];z[i]=+el.value;L.f.zMoved=true;const b=document.getElementById('mxv-'+k);if(b)b.textContent=(+el.value).toFixed(1);const box=document.getElementById('mxsm');if(box)box.outerHTML=smHTML(z);return true}},
  submit:(L,form,el)=>{if(form==='mxGuess'){const v=el.querySelector('input').value.trim().slice(0,20);if(v){L.f.guess=v;MX.render()}}},
  note:'High odds mean the words fit a pattern, not that they’re true. I check important answers somewhere else.',
  takeaway:'Every token gets a score; softmax turns scores into percentages. High odds mean the words fit a pattern from training, not that the answer is true, which is why a made-up place can get a confident answer.'};

/* ============ 8. TEMPERATURE ============ */
let recIdx={};
function write(L){const r=R();const m=MX.mon();const T=m.T;const g=L.f.gens=L.f.gens||[];
  if(live()&&r.src==='live'){const e={T,text:'',src:'live',pending:true};m.gen.unshift(e);MX.render();
    M.generate(r.ids,T,8,t=>{e.text=t;const el=document.getElementById('mxgen0');if(el)el.textContent=t}).then(t=>{e.text=t;e.pending=false;g.push(T);MX.render()});return}
  const opts=[0.2,1,1.6];const near=opts.reduce((a,b)=>Math.abs(b-T)<Math.abs(a-T)?b:a);const list=((REC[r.key]||REC.dog).samples||{})[near]||[];const k=r.key+near;recIdx[k]=((recIdx[k]==null?-1:recIdx[k])+1)%Math.max(1,list.length);
  m.gen.unshift({T,text:list[recIdx[k]]||'',src:'recorded',near});if(m.gen.length>8)m.gen.length=8;g.push(T);MX.render()}
A.mxWrite=()=>write(MX.LS('temp'));
function genList(){const m=MX.mon();const r=R();if(!m.gen.length)return '<p class="muted" style="font-size:14px">Nothing written yet.</p>';
  return `<div class="mxgens">${m.gen.map((e,i)=>`<div class="mxgen ${i===0?'fade-in':''}"><span class="mxgen-t t${e.T<=0.4?'lo':e.T>=1.4?'hi':'mid'}">T ${(+e.T).toFixed(1)}</span><p><span class="muted">${h.esc(r.text)}</span><b ${i===0?'id="mxgen0"':''}>${h.esc(e.text||'…')}</b></p></div>`).join('')}</div>
    ${m.gen.some(e=>e.src==='recorded')?h.note('Recorded runs come from distilGPT-2 at temperature 0.2, 1.0 or 1.6, whichever is closest to your dial.'):''}`}
const DIAL=L=>h.slider('T','Temperature',0.1,2,0.1,MX.mon().T,v=>(+v).toFixed(1));
LESSONS.temp={live:true,
  learn:['Why the same prompt can give different answers','How temperature reshapes the odds','That temperature doesn’t make answers more true'],learnAt:[1,2,4],
  parts:['sampler','output'],
  init:L=>{const m=MX.mon();if(!m.preset&&!m.text)MX.runPreset('dog')},
  metrics:L=>{const r=R();const m=MX.mon();const P=MX.probs(r,m.T,1);return [['Temperature',(+m.T).toFixed(1)],['Top pick',P[0]?h.piece(P[0][0]):'–'],['Its odds',P[0]?h.pct(P[0][1]):'–'],['Written',(L.f.gens||[]).length]]},
  scene:(L,i)=>machine(),
  afterT:L=>{const b=document.querySelector('.mx-metrics');if(b){const m=MX.mon();const P=MX.probs(R(),m.T,1);const v=b.querySelectorAll('strong');if(v[0])v[0].textContent=(+m.T).toFixed(1);if(v[1]&&P[0])v[1].innerHTML=h.piece(P[0][0]);if(v[2]&&P[0])v[2].textContent=h.pct(P[0][1])}},
  steps:[
    {tag:'Setup',label:'Same prompt',title:'Same question, different answers',view:'sampler',calls:['sampler','output'],
     body:L=>`<p>Ask a chatbot the same thing twice and you can get two different answers. That’s on purpose.</p><p>After scoring every token, the machine doesn’t always take the top one. It <strong>rolls dice</strong>, weighted by the odds. The <strong>temperature dial</strong> decides how adventurous the roll is.</p>`},
    {tag:'Try',label:'Roll',title:'Write it three times',view:'sampler',
     body:L=>{const n=(L.f.gens||[]).filter(t=>Math.abs(t-1)<0.15).length;return `${h.presets('mxPreset',MX.mon().preset,['dog','once','eat','trophy','subject'])}<p>Keep the dial at <strong>1.0</strong> and press <strong>Write</strong> three times. The machine writes 8 tokens each time.</p>
       ${DIAL(L)}<div class="mxrow"><button class="btn btn-primary" data-act="mxWrite">Write 8 tokens</button><span class="muted" style="font-size:13px">${n}/3 at 1.0</span></div>${genList()}`},need:L=>(L.f.gens||[]).filter(t=>Math.abs(t-1)<0.15).length>=3,hint:'Write 3 times at temperature 1.0'},
    {tag:'Try',label:'Dial',title:'Turn the dial',view:'sampler',
     body:L=>`<p>Move the dial and watch the bars. Low temperature makes the top choice even bigger. High temperature flattens everything out.</p>${DIAL(L)}<div id="mxtbars">${h.bars(MX.probs(R(),MX.mon().T,8),{id:'mxbars'})}</div>
       ${L.f.tMoved?h.take('Temperature doesn’t change the scores. It changes how strongly the dice favor the top score.'):''}`,need:L=>!!L.f.tMoved,hint:'Move the dial to continue'},
    {tag:'Predict',label:'Guess',title:'What happens at 0.2?',view:'sampler',
     body:L=>h.quiz(L,'q1','At temperature 0.2, you press Write three times. What happens?',['Something wild and different every time','Almost the same answer every time','It refuses to answer'],1,['That’s high temperature. Low temperature plays it safe.','Yes. At 0.2 the top choice wins almost every roll, so the answers barely change.','It always answers. Temperature only changes how it picks.']),need:L=>L.f.q1===1,hint:'Answer to continue'},
    {tag:'Try',label:'Compare',title:'Safe vs wild',view:'sampler',
     body:L=>{const g=L.f.gens||[];const lo=g.some(t=>t<=0.4),hi=g.some(t=>t>=1.4);return `<p>Write once at <strong>0.2 or lower</strong> and once at <strong>1.5 or higher</strong>. Compare them.</p>${DIAL(L)}
       <div class="mxrow"><button class="btn btn-primary" data-act="mxWrite">Write 8 tokens</button><span class="muted" style="font-size:13px">${lo?'✓':'○'} low  ${hi?'✓':'○'} high</span></div>${genList()}
       ${lo&&hi?h.take('Low temperature repeats safe patterns, sometimes in loops. High temperature gets creative, and also more likely to make things up.'):''}`},need:L=>{const g=L.f.gens||[];return g.some(t=>t<=0.4)&&g.some(t=>t>=1.4)},hint:'Write once low and once high'},
    {tag:'Think',label:'Truth',title:'Does a lower dial mean more truth?',view:'sampler',
     body:L=>h.quiz(L,'q2','A friend says: “Turn temperature down and the AI will be more accurate.” Are they right?',['Yes, low temperature means true answers','No. It picks the most likely words, which can still be wrong','Temperature controls how much it searches the web'],1,['Not quite. At low temperature it repeats its most likely pattern. If that pattern is wrong, it’s wrong every time.','Right. Temperature changes how it picks, not what it knows. A confident mistake at 0.2 is still a mistake.','Temperature has nothing to do with searching.']),need:L=>L.f.q2===1,hint:'Answer to continue'},
    {tag:'Recap',label:'Recap',title:'What you saw',view:'sampler',
     body:L=>`<ul class="mxrecap"><li>The machine <strong>rolls weighted dice</strong> to pick each token.</li><li><strong>Temperature</strong> reshapes the odds: low is safe and repetitive, high is creative and riskier.</li><li>Neither setting makes an answer true.</li></ul>
       <div class="mxfield"><span class="kicker">Field note</span><p>Different answers to the same question are normal. A setting can make AI more creative or more repetitive, but not more truthful.</p></div>`}],
  math:L=>{const r=R();const t=r.top.slice(0,4);return `<p>Temperature <span class="mxm">T</span> divides every score before softmax:</p><div class="mxeq">P(w) = e<sup>z<sub>w</sub>/T</sup> ÷ Σ<sub>j</sub> e<sup>z<sub>j</sub>/T</sup></div>
    <p>Small T stretches the gaps between scores (the top one wins), large T squeezes them (everything gets closer). For “${h.esc(r.text)}…”:</p>
    <div class="mxtable"><div><span>Token</span><span>T = 0.2</span><span>T = 1.0</span><span>T = 2.0</span></div>${t.map((x,i)=>`<div><code>${h.piece(x[0])}</code>${[0.2,1,2].map(T=>`<span>${h.pct(MX.probs(r,T,4)[i][1])}</span>`).join('')}</div>`).join('')}</div>
    <p class="muted">${r.src==='live'?'Exact, from the live model.':'From the recorded run. Exact at 1.0; estimated at other temperatures because only the top 30 scores were saved.'}</p>`},
  leaves:`<ul class="mxrecap"><li>Real chatbots also cut off unlikely tokens (called top-k and top-p) before rolling the dice.</li><li>Assistants choose these settings for you, and some let developers change them.</li><li>Our writer filters a short list of words not suitable for school. Real products use much bigger safety systems.</li></ul>`,
  note:'Different answers to the same question are normal. A setting can make AI more creative or more repetitive, but not more truthful.',
  takeaway:'The machine picks each token by rolling weighted dice. Temperature reshapes the odds: low is safe and repetitive, high is creative and riskier. It never makes an answer more true.'};

/* ============ 11. LEARNING FROM MISTAKES ============ */
const lossFn=(x,z)=>{const r1=(x-2)**2+(z+1.5)**2,r2=(x+3)**2+(z-2.5)**2;return 0.045*r1-1.8*Math.exp(-r1/3)-1.5*Math.exp(-r2/1.1)+0.2*Math.sin(0.9*x)*Math.cos(0.7*z)+2.4};
const grad=(x,z,e=1e-3)=>[(lossFn(x+e,z)-lossFn(x-e,z))/(2*e),(lossFn(x,z+e)-lossFn(x,z-e))/(2*e)];
const LOW=0.69;const STARTS={corner:[5.5,5,'Far corner'],hill:[-5,4.5,'Left hill'],edge:[-1,-5.5,'Front edge']};
const clamp=v=>Math.max(-6,Math.min(6,v));
function ls(L){return L.f.ls||(L.f.ls={x:5.5,z:5,path:[[5.5,5]],lr:0.6,steps:0,start:'corner'})}
function stepOnce(L){const s=ls(L);const g=grad(s.x,s.z);s.x=+clamp(s.x-s.lr*g[0]).toFixed(3);s.z=+clamp(s.z-s.lr*g[1]).toFixed(3);s.path.push([s.x,s.z]);if(s.path.length>120)s.path.shift();s.steps++;
  if(s.lr>=2.5)L.f.bigStep=(L.f.bigStep||0)+1;if(s.start==='hill'&&s.lr<=1)L.f.hillSteps=(L.f.hillSteps||0)+1}
let runT=0;
function reset(L,k,lr){clearInterval(runT);const s=ls(L);const p=STARTS[k];s.x=p[0];s.z=p[1];s.path=[[p[0],p[1]]];s.start=k;s.steps=0;if(lr!=null)s.lr=lr}
A.mxLStep=()=>{const L=MX.LS('learning');stepOnce(L);MX.render()};
A.mxLRun=()=>{const L=MX.LS('learning');clearInterval(runT);let n=0;runT=setInterval(()=>{stepOnce(L);n++;MX.applyScene();const r=document.getElementById('mxlread');if(r)r.innerHTML=lossRead(L);if(n>=15){clearInterval(runT);MX.render()}},120)};
A.mxLStart=k=>{const L=MX.LS('learning');clearInterval(runT);const p=STARTS[k];const s=ls(L);s.x=p[0];s.z=p[1];s.path=[[p[0],p[1]]];s.start=k;MX.render()};
function lossRead(L){const s=ls(L);const v=lossFn(s.x,s.z);const g=grad(s.x,s.z);const slope=Math.hypot(g[0],g[1]);
  return `<div class="mxlread"><div><span>Loss</span><strong>${v.toFixed(2)}</strong></div><div><span>Lowest possible</span><strong>${LOW.toFixed(2)}</strong></div><div><span>Steepness</span><strong>${slope.toFixed(2)}</strong></div><div><span>Steps</span><strong>${s.steps}</strong></div></div>`}
const ctrls=(L,o)=>{const s=ls(L);o=o||{};return `${o.start!==false?`<div class="mxpresets">${Object.entries(STARTS).map(([k,v])=>`<button class="mxpre ${s.start===k?'on':''}" data-act="mxLStart" data-arg="${k}">Start: ${v[2]}</button>`).join('')}</div>`:''}
  ${o.lr!==false?h.slider('lr','Step size (learning rate)',0.1,3.5,0.1,s.lr,v=>(+v).toFixed(1)):''}
  <div class="mxrow"><button class="btn btn-primary" data-act="mxLStep">Take one step</button><button class="btn btn-ghost mxbtn" data-act="mxLRun">Take 15 steps</button></div><div id="mxlread">${lossRead(L)}</div>`};
LESSONS.learning={mode:'loss',
  learn:['What “training” means','How the slope (gradient) points downhill','Why step size and starting point matter'],learnAt:[1,3,5],
  parts:[],
  metrics:L=>{const s=ls(L);return [['Knobs here','2'],['Knobs in distilGPT-2','82 million'],['Loss now',lossFn(s.x,s.z).toFixed(2)],['Step size',(+s.lr).toFixed(1)]]},
  scene:(L,i)=>{const s=ls(L);return {mode:'loss',lossFn,ball:[s.x,s.z],path:s.path,view:'loss',focus:'loss'}},
  steps:[
    {tag:'Setup',label:'Knobs',title:'A model is a box of knobs',view:'loss',
     body:L=>`<p>Before training, distilGPT-2’s 82 million numbers were random. It wrote nonsense. <strong>Training</strong> turned those numbers, a tiny bit at a time, so it made fewer mistakes guessing the next token.</p>
       <p>Here is a model with only <strong>2 knobs</strong>. The landscape shows how wrong it is for every setting of the knobs. Height is the <strong>loss</strong>: how many mistakes. The white ball is where the knobs are now.</p><ul class="mxtasks">${tick(L.f.turned,'Turn the landscape to look around')}</ul>`,need:L=>!!L.f.turned,hint:'Turn the landscape to continue'},
    {tag:'Try',label:'By hand',title:'Turn the knobs yourself',view:'loss',
     body:L=>{const s=ls(L);return `<p>Try to find the lowest point by hand. Get the loss under <strong>1.0</strong>.</p>
       ${h.slider('kx','Knob 1',-6,6,0.1,s.x,v=>(+v).toFixed(1))}${h.slider('kz','Knob 2',-6,6,0.1,s.z,v=>(+v).toFixed(1))}<div id="mxlread">${lossRead(L)}</div>
       ${L.f.handLow?h.take('You found it! Now imagine doing this with 82 million knobs at once. You couldn’t do it by hand. Training needs a rule.'):''}`},need:L=>!!L.f.handLow,hint:'Get the loss under 1.0'},
    {tag:'Key idea',label:'Downhill',title:'Follow the slope',view:'loss',
     body:L=>`<p>Here’s the rule: wherever the ball is, find which way is <strong>downhill</strong> and take a small step that way. Then do it again.</p><p>The direction of steepest uphill is called the <strong>gradient</strong>. Training steps the opposite way. Computers can work out the gradient for all 82 million knobs at once.</p>
       ${h.quiz(L,'q1','The ball is on a slope that goes up to the right. Which way should it step?',['Right, uphill','Left, downhill','Stay still'],1,['That would make more mistakes. Training goes the other way.','Yes. Step against the slope, so the loss goes down.','It only stays still when the ground is flat, at the bottom of a valley.'])}`,need:L=>L.f.q1===1,hint:'Answer to continue'},
    {tag:'Try',label:'Step',title:'Let the rule drive',view:'loss',enter:L=>reset(L,'corner',0.6),
     body:L=>`<p>Start from the far corner and take steps. Watch the yellow trail.</p>${ctrls(L,{lr:false})}${ls(L).steps>=5?h.take('Each step is small, but together they roll the ball down to the bottom. That’s gradient descent.'):''}`,need:L=>ls(L).steps>=5,hint:'Take 5 steps'},
    {tag:'Try',label:'Too big',title:'Steps that are too big',view:'loss',enter:L=>reset(L,'corner'),
     body:L=>`<p>Set the step size to <strong>3.0 or more</strong>, then take 15 steps. What happens near the bottom?</p>${ctrls(L)}
       ${(L.f.bigStep||0)>=5?h.take('Giant steps overshoot. The ball jumps across the valley and bounces around instead of settling. Picking the step size is a big part of training.'):''}`,need:L=>(L.f.bigStep||0)>=5,hint:'Take 5 steps with a step size of 3.0 or more'},
    {tag:'Try',label:'Stuck',title:'Stuck in a small valley',view:'loss',enter:L=>reset(L,'hill',0.6),
     body:L=>{const s=ls(L);const stuck=s.start==='hill'&&Math.abs(s.x+2.84)<0.4&&Math.abs(s.z-2.34)<0.4;return `<p>Pick <strong>Start: Left hill</strong>, set the step size to <strong>0.6</strong>, and take 15 steps.</p>${ctrls(L)}
       ${stuck?h.quiz(L,'q2',`The ball stopped at loss ${lossFn(s.x,s.z).toFixed(2)}, but the lowest point is ${LOW}. Why?`,['The rule is broken','It found a small valley, and every direction nearby goes uphill','It ran out of knobs'],1,['The rule worked fine. It only looks at the ground right under the ball.','Yes. The rule only sees the slope where it stands. In a small valley, every way looks uphill, so it stops. Real training adds tricks (and lots of knobs) to escape these.','It has the same 2 knobs. It just can’t see past the walls of the valley.']):''}`},need:L=>L.f.q2===1,hint:'Get stuck, then answer'},
    {tag:'Math',label:'Rule',title:'The update rule',view:'loss',
     body:L=>{const s=ls(L);const g=grad(s.x,s.z);return `<p>Every step uses one rule for every knob <span class="mxm">w</span>, with step size <span class="mxm">η</span> (eta):</p><div class="mxeq">w ← w − η × (slope of the loss along w)</div>
       <div class="mxtable"><div><span></span><span>Knob 1</span><span>Knob 2</span></div><div><span>Now</span><span>${s.x.toFixed(2)}</span><span>${s.z.toFixed(2)}</span></div><div><span>Slope</span><span>${g[0].toFixed(2)}</span><span>${g[1].toFixed(2)}</span></div><div><span>Next</span><span>${clamp(s.x-s.lr*g[0]).toFixed(2)}</span><span>${clamp(s.z-s.lr*g[1]).toFixed(2)}</span></div></div>
       <div class="mxrow"><button class="btn btn-ghost mxbtn" data-act="mxLStep">Check it: take one step</button></div>`}},
    {tag:'Recap',label:'Recap',title:'What you saw',view:'loss',
     body:L=>`<ul class="mxrecap"><li><strong>Training</strong> turns a model’s knobs to make fewer mistakes on its training text.</li><li>The <strong>gradient</strong> points uphill; each step goes the other way.</li><li>Step size and starting point change where you end up. Sometimes it gets stuck in a small valley.</li><li>The model only gets good at what’s in its training text, including its mistakes and biases.</li></ul>
       <div class="mxfield"><span class="kicker">Field note</span><p>AI learns by copying patterns from its training text, mistakes included. What it was trained on shapes what it gets wrong.</p></div>`}],
  math:L=>{const s=ls(L);return `<p>Training minimizes the loss: the average “surprise” at the real next token in the training text.</p><div class="mxeq">loss = − average of log P(real next token)</div>
    <p>Gradient descent updates each of the knobs <span class="mxm">w</span>:</p><div class="mxeq">w ← w − η ∂loss/∂w</div><p>Our landscape is a made-up formula with 2 knobs so you can see it. distilGPT-2 has 82 million, so its landscape has 82 million directions.</p>${lossRead(L)}`},
  leaves:`<ul class="mxrecap"><li>Our 2-knob landscape is invented to be easy to see. A real model’s landscape has millions of directions and can’t be drawn.</li><li>Real training measures the slope on small batches of text, so every step is a little noisy.</li><li>Training big models takes thousands of computer chips running for weeks, and lots of energy (Lesson 12).</li><li>The model gets good at copying its training text, including its mistakes and biases (Lesson 10, Mission 2).</li></ul>`,
  input:(L,k,el)=>{const s=ls(L);
    if(k==='kx'||k==='kz'){s[k==='kx'?'x':'z']=+el.value;s.path=[[s.x,s.z]];L.f.manual=(L.f.manual||0)+1;if(lossFn(s.x,s.z)<1.0)L.f.handLow=true;const b=document.getElementById('mxv-'+k);if(b)b.textContent=(+el.value).toFixed(1);const r=document.getElementById('mxlread');if(r)r.innerHTML=lossRead(L);MX.applyScene();return true}
    if(k==='lr'){s.lr=+el.value;const b=document.getElementById('mxv-lr');if(b)b.textContent=(+el.value).toFixed(1);return true}},
  note:'AI learns by copying patterns from its training text, mistakes included. What it was trained on shapes what it gets wrong.',
  takeaway:'Training turns a model’s knobs, step by step, in the direction that makes fewer mistakes on its training text. The step size and starting point matter, and the model learns whatever patterns are in that text, including mistakes and biases.'};
})();

/* ============ GUIDES: what the student is looking at, what they can do, what the model is doing ============
   about = the "How this lesson works" card. Per step: see = on the model, do = your move, model = behind the scenes.
   Functions are re-evaluated on every render, so "behind the scenes" switches when the live model turns on. */
(function(){
const MX=window.MX,M=window.MXModel;const L=MX.LESSONS;
const LR=(live,rec)=>()=>MX.liveOn()&&MX.curRes()&&MX.curRes().src==='live'?live:rec;
const TK=(live,rec)=>()=>M&&M.tokStatus==='ready'?live:rec;
const G={
 tour:{about:{
   see:'A 3D model of distilGPT-2, a real (small) language model. From bottom to top: the <b>token tray</b> (your sentence, cut into pieces), a <b>column of numbers</b> above each piece, <b>6 stacked layers</b>, and the <b>odds tray</b> where guesses for the next word come out. The dial on the right is <b>temperature</b>.',
   do:'Turn and zoom the machine, run a sentence through it, click the glowing labels to learn each part, and grow a sentence one piece at a time.',
   model:LR('The live model is on. Every Run and every new piece is calculated by distilGPT-2 right now, on this device.','The odds you see were recorded from distilGPT-2 for each ready-made sentence. Turn on the live model and every Run and Add a piece happens for real on this device.')},
  steps:[
   {see:'The whole machine from a distance. The orange block at the front is the last word of the sentence. The machine is guessing what comes right after it.',do:'Drag the machine or use ↺ ↻ under it. Scroll (or pinch) to zoom in on any part.',model:'Nothing is running yet. The model is waiting for a sentence.'},
   {see:'When you press Run, dots carry each token up through the 6 layers. The small squares on each layer (attention heads) flash as information gets mixed. Then the bars grow on the odds tray.',do:'Choose a sentence and press Run. Press ▶ under the model to watch it again.',model:LR('distilGPT-2 just ran your sentence on this device: one pass through all 6 layers in a fraction of a second.','The bars show the odds distilGPT-2 gave for this sentence when we recorded it.')},
   {see:'Glowing dots mark five stations. Clicking one moves the camera there and opens a short explanation. The orange arcs between tokens show which earlier words mattered most.',do:'Click at least 4 labels. Press ⌂ to bring the camera back.',model:'The arcs come from a measurement: we removed each word and checked how much the odds changed. Lesson 5 lets you do it yourself.'},
   {see:'The camera moves to the odds tray: one bar per possible next token. Taller means more likely.',do:'Pick an answer. Every answer explains itself.',model:'Same odds as before. Nothing new is calculated.'},
   {see:'Each new piece is added in orange to the sentence on the right and as a new block on the token tray. The flow replays because the whole sentence goes through the machine again.',do:'Press Add a piece at least 3 times. Start over to try again.',model:LR('Each press runs distilGPT-2, rolls weighted dice over its top 50 tokens, and adds the winner.','Each piece comes from a sentence distilGPT-2 wrote when we recorded it. Turn on the live model to watch it choose new pieces now.')},
   {see:'The whole machine again.',do:'Read, then press Ask to compare this tiny model with an assistant.',model:'The assistant answer is live only where the site is connected to one. Otherwise it shows an example written by the White Box team, labeled as such.'},
   {see:'The whole machine.',do:'Read the recap, then press Finish lesson.',model:'Finishing saves a field note to your Journey page.'}]},
 tokens:{about:{
   see:'The <b>token tray</b> up close. Each block is one token, with its ID number in front. In this lesson the rest of the machine stays quiet: everything happens at the very first step, before the model reads anything.',
   do:'Answer quick questions, type your own text into the tokenizer, compare spellings and languages, and build a tiny tokenizer yourself.',
   model:TK('The real GPT-2 tokenizer is loaded on this device. Whatever you type is cut exactly the way the model would cut it.','The real tokenizer couldn’t load here. Ready-made examples use its recorded results, and your own text is cut with a rough offline guess (the page says so when it happens).')},
  steps:[
   {see:'38 characters became 8 tokens. A small dot (·) in front of a token means it includes the space before the word.',do:'Read, then press Next.',model:'This sentence was cut by the real GPT-2 tokenizer.'},
   {see:'The same tray.',do:'Pick an answer. Wrong answers explain why.',model:'No model needed. This is about how text gets cut.'},
   {see:'Whatever you type shows up on the tray, one block per token.',do:'Type text and press Cut it, or tap examples. Try 3 different ones. “Show ID numbers” reveals each token’s number.',model:TK('Your text is cut live by the real tokenizer, on this device.','Examples use recorded results; your own text uses the offline guess.')},
   {see:'Five spellings of “dog” side by side on the tray, with their ID numbers.',do:'Compare the table, then answer.',model:'Recorded from the real tokenizer.'},
   {see:'“strawberry” as the machine sees it: three blocks, no letters.',do:'Answer the question.',model:'Recorded from the real tokenizer.'},
   {see:'The tray keeps your last text. The chart on the right compares 7 languages.',do:'Read the chart, then answer.',model:'Token counts from the real GPT-2 tokenizer. Hindi and Amharic letters get split into raw bytes.'},
   {see:'Number columns now appear above the tokens: once text is cut, each token becomes a list of numbers.',do:'Press “Glue the most common pair” and watch new tokens form.',model:'This mini tokenizer runs right here. GPT-2’s was built the same way, 50,000 times, from web text.'},
   {see:'The tray with your last text.',do:'Read the recap, then press Finish lesson.',model:'Finishing saves a field note to your Journey page.'}]},
 attention:{about:{
   see:'The <b>token tray</b> and the <b>arcs</b> above it. The orange block is the word the machine continues from. Arcs connect it to earlier words: a thicker arc means that word changed the answer more. The <b>odds tray</b> at the top shows what comes next.',
   do:'Guess which word matters, knock words out (click them on the right or on the model), measure every word, and turn a question arrow to see how attention scores work.',
   model:LR('Live: every knock-out runs distilGPT-2 again without that word, and Measure runs it once per word.','Recorded: the influence numbers were measured on distilGPT-2 ahead of time. Turn on the live model to see the new odds every time you remove a word.')},
  steps:[
   {see:'The tokens of the current sentence.',do:'Read, then press Next.',model:'Nothing is running yet.'},
   {see:'The same tray. Your guess is highlighted on the right.',do:'Pick a sentence, then click the word you think matters most.',model:'Nothing runs yet. Your guess is saved for step 4.'},
   {see:'A removed word turns dark gray on the tray. With the live model on, the odds tray shows the new top guesses.',do:'Click 2 different words to remove them. Click a word again to put it back.',model:LR('distilGPT-2 runs again without the word, and both lists of odds appear side by side.','Shows how much the odds moved in the recorded run. Turn on the live model to see the new odds themselves.')},
   {see:'Arcs grow from the last word back to every earlier word. The percent labels show each word’s share of the influence.',do:'Pick a sentence and press Measure. Compare the result with your guess.',model:LR('The model runs once with every word and once without each word, then compares the odds.','Recorded influence from distilGPT-2, measured the same way: remove each word, re-run, compare.')},
   {see:'The camera moves to the attention heads: the 12 small squares on the front of each layer.',do:'Read, then answer.',model:'In every layer, each of the 12 heads makes its own questions and labels for every token.'},
   {see:'The arrow diagram on the right. Orange is the question from “it”. Blue are the labels of three earlier words. A thicker blue arrow means more attention.',do:'Drag the slider to turn the question.',model:'A toy with 2 numbers per arrow so you can see it. The real model uses 64 numbers per head.'},
   {see:'The arcs from your measurement.',do:'Read, then answer.',model:'Influence (what the answer depended on) is not the same as the model’s raw attention.'},
   {see:'The arcs from your measurement.',do:'Read the recap, then press Finish lesson.',model:'Finishing saves a field note to your Journey page.'}]},
 odds:{about:{
   see:'The top of the machine: the <b>odds tray</b>. Each bar is one possible next token, and its height shows its share. The orange bar is the top pick.',
   do:'Guess the top word, run sentences in the model monitor, compare a real place with a made-up one, and drag scores in the softmax lab.',
   model:LR('Live: each Run scores all 50,257 tokens on this device.','Recorded: odds for the ready-made sentences were measured on distilGPT-2. Turn on the live model to type your own sentence.')},
  steps:[
   {see:'The odds tray for the current sentence.',do:'Read. You can click the labels on the model.',model:'These are distilGPT-2’s scores for this sentence, turned into percentages.'},
   {see:'The tray shows “After school, I like to eat”. The bars appear after you guess.',do:'Type one word and press Check.',model:'Recorded run. We check whether your word is in the model’s top 30.'},
   {see:'The odds tray updates for every sentence you run.',do:'Tap 2 sentences, or type your own (needs the live model). Try Ask to compare with an assistant.',model:LR('Each Run happens live on this device.','Ready-made sentences use recorded runs.')},
   {see:'The same tray.',do:'Read the table.',model:'The raw scores are the model’s actual numbers before softmax.'},
   {see:'The tray shows Zorbax, the made-up place.',do:'Compare the two lists, then answer.',model:'Both lists were recorded from distilGPT-2.'},
   {see:'The same tray.',do:'Drag the sliders and watch the shares change.',model:'The lab uses 4 made-up scores so you can see the math. The model does the same thing for all 50,257 tokens.'},
   {see:'The odds tray.',do:'Read the recap, then press Finish lesson.',model:'Finishing saves a field note to your Journey page.'}]},
 temp:{about:{
   see:'The <b>odds tray</b> and the <b>temperature dial</b> on the right. The needle follows your slider, and the bars reshape as you move it.',
   do:'Write the same sentence several times, turn the dial, and compare safe and wild writing.',
   model:LR('Live: Write rolls the dice 8 times on this device, one token at a time, at your exact temperature.','Recorded: writing comes from samples distilGPT-2 wrote at 0.2, 1.0 or 1.6, whichever is closest to your dial. Odds at other temperatures are calculated from the saved scores.')},
  steps:[
   {see:'The dial and the odds tray.',do:'Read, then press Next.',model:'Nothing is running yet.'},
   {see:'The odds tray at temperature 1.0.',do:'Press Write 8 tokens three times at 1.0. Each result is added to the list.',model:LR('Each Write runs the model 8 times on this device, rolling the dice for every token.','Each Write shows another recorded sample from temperature 1.0.')},
   {see:'Watch the needle and the bars. Low makes the tall bar taller; high flattens them all.',do:'Drag the slider.',model:'Only the math changes. The scores stay the same and are divided by the temperature before softmax.'},
   {see:'The dial.',do:'Answer the question.',model:'Nothing new is calculated.'},
   {see:'Your writing list fills up, tagged with the temperature used.',do:'Set the dial low (0.2 or less) and Write, then high (1.5 or more) and Write.',model:LR('Both runs happen live on this device.','Low uses the recorded 0.2 samples; high uses the recorded 1.6 samples.')},
   {see:'The dial.',do:'Answer the question.',model:'Nothing new is calculated.'},
   {see:'The dial and the odds tray.',do:'Read the recap, then press Finish lesson.',model:'Finishing saves a field note to your Journey page.'}]},
 learning:{about:{
   see:'A different 3D scene: a <b>landscape of mistakes</b>. Each spot on the ground is one setting of a tiny model’s 2 knobs, and the height is the <b>loss</b> (how wrong it is). Green valleys are good, orange hills are bad. The <b>white ball</b> is the current setting and the <b>yellow line</b> is its path.',
   do:'Turn the landscape, move the knobs by hand, then let the training rule take steps. Change the step size and the starting point to see what can go wrong.',
   model:'No language model runs in this lesson. The landscape is a made-up formula so you can see training. The update rule is the same one used to train distilGPT-2’s 82 million knobs.'},
  steps:[
   {see:'The whole landscape. The ball starts in the far corner, high up.',do:'Drag the landscape to turn it.',model:'Nothing is running yet.'},
   {see:'The ball moves as you drag the knob sliders.',do:'Move both knobs until the loss is under 1.0.',model:'The loss is the height of the ground under the ball.'},
   {see:'The same landscape.',do:'Read, then answer.',model:'Nothing new is calculated.'},
   {see:'The ball starts in the far corner. Each step moves it downhill and adds to the yellow trail.',do:'Press Take one step 5 times, or Take 15 steps.',model:'Each step: measure the slope under the ball, then move a little the other way.'},
   {see:'The ball starts in the far corner again. With giant steps it jumps right over the valley.',do:'Set the step size to 3.0 or more, then take steps.',model:'Same rule, bigger steps.'},
   {see:'The ball starts on the left hill, next to a small valley.',do:'Take 15 steps at step size 0.6, then answer.',model:'Same rule. It only sees the slope right under the ball.'},
   {see:'The ball where you left it.',do:'Compare the table with the ball, then take one step to check the math.',model:'The table shows the exact numbers the rule uses.'},
   {see:'The ball and its path.',do:'Read the recap, then press Finish lesson.',model:'Finishing saves a field note to your Journey page.'}]}};
Object.keys(G).forEach(id=>{const D=L[id];if(!D)return;D.about=G[id].about;D.steps.forEach((s,i)=>{s.guide=G[id].steps[i]})});
})();
