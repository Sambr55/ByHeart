import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { ROOTS_BY_FAMILY } from '../content/roots'
const BASE='http://localhost:3111'
const KEY='byheart.learner.v1:'+pairId(DEFAULT_PAIR)
type R={root_id:string;transfer_prompt:{answer:string;ask:string}}
const basics=((ROOTS_BY_FAMILY as Record<string,R[]>)['the_basics']??[]).slice(0,3)
const SEED=`(()=>{localStorage.setItem('byheart.pair',${JSON.stringify(JSON.stringify(DEFAULT_PAIR))});localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify({version:1,deal_accepted_at:'2026-08-01T00:00:00.000Z',proof:[{pt:basics[0].transfer_prompt.answer,en:basics[0].transfer_prompt.ask,source:'release',clean:false,at:'1'}],inventory:{},roots_played:basics.map(r=>r.root_id),sections_completed:['the_basics'],legend:[],saved:[],liked:[],finished_cards:[],club_welcomed_at:'2026-08-20T00:00:00.000Z'}))});})()`
// Find every element whose computed colour is reddish/rust
const SRC=`(()=>{
  const out=[];
  document.querySelectorAll('*').forEach((e)=>{
    if(!e.textContent || e.children.length) return;
    const c=getComputedStyle(e).color;
    const m=c.match(/\\d+/g); if(!m) return;
    const [r,g,b]=m.map(Number);
    if(r>120 && r>g+30 && r>b+30){
      out.push({text:(e.textContent||'').trim().slice(0,28), color:c, cls:e.className});
    }
  });
  return out.slice(0,20);
})()`
const b=await chromium.launch()
const p=await b.newPage({viewport:{width:390,height:844}})
await p.goto(BASE+'/vibes'); await p.evaluate(SEED)
for(const r of ['/legend','/club','/profile','/proof']){
  await p.goto(BASE+r,{waitUntil:'networkidle'}); await p.waitForTimeout(500)
  const res=await p.evaluate(SRC)
  console.log(r, JSON.stringify(res,null,1))
}
await b.close()
