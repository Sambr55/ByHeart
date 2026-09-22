import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { ROOTS_BY_FAMILY } from '../content/roots'
const BASE='http://localhost:3111'
const KEY='byheart.learner.v1:'+pairId(DEFAULT_PAIR)
type R={root_id:string;transfer_prompt:{answer:string;ask:string}}
const basics=((ROOTS_BY_FAMILY as Record<string,R[]>)['the_basics']??[]).slice(0,3)
const SEED=`(()=>{localStorage.setItem('byheart.pair',${JSON.stringify(JSON.stringify(DEFAULT_PAIR))});localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify({version:1,deal_accepted_at:'2026-08-01T00:00:00.000Z',proof:[{pt:basics[0].transfer_prompt.answer,en:basics[0].transfer_prompt.ask,source:'release',clean:false,at:'1'}],inventory:{},roots_played:basics.map(r=>r.root_id),sections_completed:['the_basics'],legend:[],saved:[],liked:[],finished_cards:[],club_welcomed_at:'2026-08-20T00:00:00.000Z'}))});})()`
const SRC=`(()=>{
  const out=[];
  document.querySelectorAll('.icon-chip, .icon-ink').forEach((e)=>{
    const cs=getComputedStyle(e);
    out.push({cls:e.className.split(' ')[0], onDark: !!e.closest('.on-dark'), color: cs.color, bg: cs.backgroundColor});
  });
  return out;
})()`
const b=await chromium.launch()
const p=await b.newPage({viewport:{width:390,height:844}})
await p.goto(BASE+'/vibes'); await p.evaluate(SEED)
for(const r of ['/club','/profile','/legend']){
  await p.goto(BASE+r,{waitUntil:'networkidle'}); await p.waitForTimeout(500)
  console.log(r, JSON.stringify(await p.evaluate(SRC)))
}
await b.close()
