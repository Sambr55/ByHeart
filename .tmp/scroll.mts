import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { ROOTS_BY_FAMILY } from '../content/roots'
const BASE='http://localhost:3111'
const KEY='byheart.learner.v1:'+pairId(DEFAULT_PAIR)
type R={root_id:string;transfer_prompt:{answer:string;ask:string}}
const basics=((ROOTS_BY_FAMILY as Record<string,R[]>)['the_basics']??[]).slice(0,3)
const SEED=`(()=>{localStorage.setItem('byheart.pair',${JSON.stringify(JSON.stringify(DEFAULT_PAIR))});localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify({version:1,deal_accepted_at:'2026-08-01T00:00:00.000Z',proof:[{pt:basics[0].transfer_prompt.answer,en:basics[0].transfer_prompt.ask,source:'release',clean:false,at:'1'}],inventory:{},roots_played:basics.map(r=>r.root_id),sections_completed:['the_basics'],legend:[],saved:[],liked:[],finished_cards:[],club_welcomed_at:'2026-08-20T00:00:00.000Z'}))});})()`
const SRC=`(()=>{
  const sc=document.querySelector('.app-scroll')||document.scrollingElement||document.documentElement;
  const nav=document.querySelector('[data-testid="bottom-nav"]');
  const navTop=nav?nav.getBoundingClientRect().top:innerHeight;
  const btns=[];
  document.querySelectorAll('button,a').forEach((e)=>{
    const t=(e.textContent||'').trim();
    if(!t||t.length>34) return;
    const r=e.getBoundingClientRect();
    if(r.height<36||r.width<140) return;
    const inDock=!!e.closest('.dock');
    btns.push({t:t.slice(0,26), fromNav:Math.round(navTop-r.bottom), inDock, offscreen:r.bottom>navTop+2});
  });
  return {scrollable:Math.max(0,sc.scrollHeight-sc.clientHeight), btns};
})()`
const b=await chromium.launch()
const p=await b.newPage({viewport:{width:390,height:844}})
await p.goto(BASE+'/vibes'); await p.evaluate(SEED)
for(const r of ['/profile','/calendar','/proof','/vocab','/drops','/legend','/crates']){
  try{
    await p.goto(BASE+r,{waitUntil:'networkidle'}); await p.waitForTimeout(600)
    const d:any=await p.evaluate(SRC)
    console.log(r.padEnd(10),'scroll='+String(d.scrollable).padStart(4), d.btns.map((x:any)=>`${x.t}[${x.inDock?'dock':'flow'} ${x.fromNav}${x.offscreen?' OFF':''}]`).join(' | '))
  }catch(e){console.log(r,'ERR')}
}
await b.close()
