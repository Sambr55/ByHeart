import { chromium } from 'playwright'
const KEY = 'byheart.learner.v1:en-GB:pt-PT'
const iso = new Date(0).toISOString()
const learner = { version:1, learner_id:'ui', tester_label:'', voice_signals:[], osmosis_seen:[],
  profile:{gender:'m',age_band:'40to59',goal:'trip',skipped:[]}, created_at:iso, missions_completed:[],
  mission_completed_at:{}, inventory:{}, evidence:[], display_name:'', deal_accepted_at:iso,
  roots_played:[], collisions_played:[], sections_completed:1,
  affinity:{categories_ranked:[],free_text_favourite:'',next_world_pre:null,next_world_post:null,source_familiarities:{}},
  experiment:{test_variant:'culture_full',same_or_delayed:'unknown',cohort_tag:''},
  proof:[{pt:'Quando quiseres.',en:'Whenever you want.',source:'release',clean:true,at:iso}] }
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true })
await ctx.addInitScript(([k,v]) => { try { localStorage.setItem(k,v) } catch {} }, [KEY, JSON.stringify(learner)])
const p = await ctx.newPage()
for (const [route, name] of [['/crates','crates'],['/vocab','vocab'],['/proof','proof'],['/line','line']] as [string,string][]) {
  await p.goto('http://localhost:3111' + route, { waitUntil:'domcontentloaded' })
  await p.waitForTimeout(1400)
  await p.screenshot({ path: '.screenshots/v2-' + name + '.png', fullPage: true })
  console.log(name, '→', await p.locator('h1').first().innerText().catch(()=>'?'))
}
await b.close()
