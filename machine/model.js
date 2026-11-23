/* White Box · Inside the machine: the live model.
   Runs distilGPT-2 (6 layers, 82 million numbers) inside the student's browser with Transformers.js.
   Nothing the student types leaves their device: the model file downloads once (about 80 MB) and runs locally.
   Everything here is optional. If it can't load (offline, blocked network, old device), lessons use the
   recorded runs in data.js instead and say so. */
(function(){
'use strict';
const CDN='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1';
const MODEL='Xenova/distilgpt2';
const EOS=50256;
const M={status:'off',progress:0,error:null,tokStatus:'off',name:'distilGPT-2',layers:6,heads:12,params:'82 million',vocab:50257,size:'about 80 MB'};
window.MXModel=M;
const subs=[];M.on=f=>subs.push(f);
const emit=()=>subs.forEach(f=>{try{f(M)}catch(e){}});
let T=null,tok=null,model=null;

async function lib(){if(T)return T;T=await import(CDN);T.env.allowLocalModels=false;return T}

M.loadTokenizer=async()=>{
  if(tok)return tok;if(M.tokStatus==='loading')return new Promise(r=>subs.push(()=>{if(tok)r(tok)}));
  M.tokStatus='loading';emit();
  try{const L=await lib();tok=await L.AutoTokenizer.from_pretrained(MODEL);M.tokStatus='ready'}
  catch(e){M.tokStatus='error';M.error=String(e&&e.message||e)}
  emit();return tok};

M.load=async()=>{
  if(M.status==='ready'||M.status==='loading')return;
  M.status='loading';M.progress=0;M.error=null;emit();
  try{
    const L=await lib();await M.loadTokenizer();if(!tok)throw new Error('tokenizer');
    model=await L.AutoModelForCausalLM.from_pretrained(MODEL,{dtype:'q8',progress_callback:p=>{
      if(p&&p.status==='progress'&&/onnx/.test(p.file||'')){const v=Math.round(p.progress||0);if(v!==M.progress){M.progress=v;emit()}}}});
    M.status='ready';
  }catch(e){M.status='error';M.error=String(e&&e.message||e)}
  emit()};

M.ready=()=>M.status==='ready';
M.encode=text=>Array.from(tok(text).input_ids.data).map(Number);
M.piece=id=>tok.decode([id]);
M.pieces=ids=>ids.map(id=>tok.decode([id]));

async function lastLogits(ids){
  const L=T;const n=ids.length;
  const input_ids=new L.Tensor('int64',BigInt64Array.from(ids.map(BigInt)),[1,n]);
  const attention_mask=new L.Tensor('int64',BigInt64Array.from(ids.map(()=>1n)),[1,n]);
  const o=await model({input_ids,attention_mask});const V=o.logits.dims[2];
  return o.logits.data.slice((n-1)*V,n*V)}
function lse(arr,t){let mx=-Infinity;for(let i=0;i<arr.length;i++){const v=arr[i]/t;if(v>mx)mx=v}let s=0;for(let i=0;i<arr.length;i++)s+=Math.exp(arr[i]/t-mx);return mx+Math.log(s)}
const READABLE=s=>!/�/.test(s)&&/\S/.test(s);

/* next-word scores for a text: returns the top k readable tokens with their raw scores (logits) and logZ for exact probabilities */
M.next=async(input,k=30)=>{
  const ids=Array.isArray(input)?input:M.encode(input);
  const l=await lastLogits(ids);
  const order=[...l.keys()].sort((a,b)=>l[b]-l[a]);const top=[];
  for(const i of order){const p=tok.decode([i]);if(READABLE(p))top.push([p,+l[i].toFixed(3)]);if(top.length>=k)break}
  const lz={};[0.2,0.5,1,1.5,2].forEach(t=>{lz[t]=lse(l,t)});
  return {ids,pieces:M.pieces(ids),top,logZ:+lz[1].toFixed(3),logZT:lz,full:l}};

/* exact log-partition at any temperature, given the full score list kept from M.next */
M.logZ=(full,t)=>lse(full,t);

/* how much each earlier word matters: remove it, run again, compare the two lists of odds (total variation distance, 0 to 1) */
M.influence=async(ids,onStep)=>{
  const base=await lastLogits(ids);const z=lse(base,1);const out=[];
  for(let i=0;i<ids.length;i++){
    if(i===ids.length-1||ids.length<2){out.push(null);continue}
    const l2=await lastLogits(ids.filter((_,j)=>j!==i));const z2=lse(l2,1);let tv=0;
    for(let j=0;j<base.length;j++)tv+=Math.abs(Math.exp(base[j]-z)-Math.exp(l2[j]-z2));
    out.push(+(tv/2).toFixed(3));if(onStep)onStep(i,out)}
  return out};

/* odds after removing one word (for the knock-out activity) */
M.without=async(ids,i,k=8)=>M.next(ids.filter((_,j)=>j!==i),k);

/* write a few tokens, one at a time. Filters out unsafe or unreadable tokens before sampling. */
const BLOCK=/\b(fuck|shit|bitch|cunt|dick|cock|pussy|slut|whore|nigg|fag|retard|rape|porn|nazi|kill yourself)/i;
M.BLOCK=BLOCK;
M.generate=async(ids,t,n,onTok)=>{
  let cur=ids.slice();let text='';const picks=[];
  for(let s=0;s<n;s++){
    const l=await lastLogits(cur);
    let cand=[...l.keys()].sort((a,b)=>l[b]-l[a]).slice(0,50).filter(i=>i===EOS||READABLE(tok.decode([i])));
    let pick=null;
    for(let tries=0;tries<6&&cand.length;tries++){
      const z=lse(cand.map(i=>l[i]),t);let r=Math.random(),c=cand[0];
      for(const i of cand){const p=Math.exp(l[i]/t-z);if(r<p){c=i;break}r-=p}
      const piece=c===EOS?'':tok.decode([c]);
      if(BLOCK.test((text+piece).slice(-24))){cand=cand.filter(i=>i!==c);continue}
      pick=c;break}
    if(pick===null||pick===EOS){if(pick===EOS){text+=' [end]';if(onTok)onTok(text)}break}
    cur.push(pick);picks.push(pick);text+=tok.decode([pick]);if(onTok)onTok(text)}
  return text};

/* check what a student types before it reaches the model */
M.checkInput=text=>{
  const t=String(text||'').trim();
  if(!t)return {ok:false,why:'Type a few words first.'};
  if(t.length>160)return {ok:false,why:'Keep it under 160 characters. The machine only needs a sentence.'};
  if(/[\w.+-]+@[\w-]+\.[\w.]+/.test(t))return {ok:false,why:'That looks like an email address. Keep private things private, even with a model on your own device.'};
  if(/(\+?\d[\s().-]?){9,}/.test(t))return {ok:false,why:'That looks like a phone number. Keep private things private.'};
  if(/\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|boulevard|blvd)\b/i.test(t))return {ok:false,why:'That looks like a home address. Keep private things private.'};
  if(BLOCK.test(t))return {ok:false,why:'Let’s keep it school-appropriate. Try a different sentence.'};
  return {ok:true}};
})();
