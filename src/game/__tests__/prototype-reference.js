/*
 * Verbatim copy of the XP computation from the prototype (dont-fall-for-traps.html),
 * used only to prove the new src/game gives identical results. Do not "fix" this file.
 * Changes: wrapped in a function, state S and goal() are passed in, ACH reduced to keys + predicates.
 */
export function prototypeCompute(input, dailyGoal) {
  const S = {
    todos: new Map(Object.entries(input.todos || {})),
    routines: new Map(Object.entries(input.routines || {})),
    days: new Map(Object.entries(input.days || {})),
  };
  const goal = () => dailyGoal;
  const pad = (n) => String(n).padStart(2, '0');
  const TODO_XP = { tag: 10, ewig: 15, woche: 25, monat: 50, jahr: 120 };
  const DIFF = { 1: { l: 'Leicht', m: 1 }, 2: { l: 'Mittel', m: 1.5 }, 3: { l: 'Schwer', m: 2 } };
  const SUB_XP = 5;
  const ROUT_XP = { tag: 10, woche: 15, monat: 25, jahr: 60 };
  const ROUT_BONUS = { tag: 5, woche: 25, monat: 40, jahr: 100 };
  const GOAL_BONUS = 20;
  function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function parseYmd(s){const p=String(s).split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);}
  function startOfDay(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
  function addDays(d,n){const x=startOfDay(d);x.setDate(x.getDate()+n);return x;}
  function isoWeek(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y=t.getUTCFullYear();const w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);return {y:y,w:w};}
  function periodKey(scope,d){
    if(scope==='tag')return ymd(d);
    if(scope==='woche'){const iw=isoWeek(d);return iw.y+'-W'+pad(iw.w);}
    if(scope==='monat')return d.getFullYear()+'-'+pad(d.getMonth()+1);
    if(scope==='jahr')return String(d.getFullYear());
    return null;
  }
  function todoXp(t){return Math.round((TODO_XP[t.scope]||10)*((DIFF[t.diff||1]||DIFF[1]).m));}
  function levelInfo(xp){let L=1,acc=0,need=100;while(xp>=acc+need){acc+=need;L++;need=100+50*(L-1);}return {level:L,into:xp-acc,need:need,pct:Math.min(100,(xp-acc)/need*100)};}
  const ACH=[
    {k:'first',ok:s=>s.todosDone>=1},
    {k:'subs25',ok:s=>s.subsDone>=25},
    {k:'todo50',ok:s=>s.todosDone>=50},
    {k:'st3',ok:s=>s.best>=3},
    {k:'st7',ok:s=>s.best>=7},
    {k:'st30',ok:s=>s.best>=30},
    {k:'perfect',ok:s=>s.perfectDays>=1},
    {k:'perfect7',ok:s=>s.perfectDays>=7},
    {k:'week',ok:s=>s.met.woche>=1},
    {k:'month',ok:s=>s.met.monat>=1},
    {k:'year',ok:s=>s.yearlyDone>=1},
    {k:'lv5',ok:s=>s.level.level>=5},
    {k:'lv10',ok:s=>s.level.level>=10},
    {k:'xp1000',ok:s=>s.total>=1000}
  ];
  function compute(){
    const xpByDay=new Map();const add=(day,x)=>{if(!day||!x)return;xpByDay.set(day,(xpByDay.get(day)||0)+x);};
    let todosDone=0,subsDone=0,yearlyDone=0;
    for(const t of S.todos.values()){
      for(const s of (t.subs||[]))if(s.done&&s.doneOn){add(s.doneOn,SUB_XP);subsDone++;}
      if(t.done&&t.doneOn){add(t.doneOn,todoXp(t));todosDone++;if(t.scope==='jahr')yearlyDone++;}
    }
    const pc=new Map(),checkinsByDay=new Map(),perfect=new Set();
    const met={tag:0,woche:0,monat:0,jahr:0};let checkins=0;const g=goal();
    const keys=[...S.days.keys()].sort();
    for(const dk of keys){
      const doc=S.days.get(dk)||{};const r=doc.routines||{};const date=parseYmd(dk);let dayCount=0;
      for(const rid of Object.keys(r)){
        const c=Number(r[rid])||0;const rt=S.routines.get(rid);if(!rt||c<=0)continue;
        add(dk,(ROUT_XP[rt.scope]||10)*c);checkins+=c;dayCount+=c;
        const k=rid+'|'+periodKey(rt.scope,date);const before=pc.get(k)||0;const after=before+c;pc.set(k,after);
        const target=Math.max(1,rt.target||1);
        if(before<target&&after>=target){add(dk,ROUT_BONUS[rt.scope]||0);met[rt.scope]++;}
      }
      checkinsByDay.set(dk,dayCount);
      if(g>0&&dayCount>=g){add(dk,GOAL_BONUS);perfect.add(dk);}
    }
    let total=0;for(const v of xpByDay.values())total+=v;
    let streak=0;let d=new Date();if(!(xpByDay.get(ymd(d))>0))d=addDays(d,-1);
    while(xpByDay.get(ymd(d))>0){streak++;d=addDays(d,-1);}
    const active=[...xpByDay.keys()].filter(k=>xpByDay.get(k)>0).sort();
    let best=0,run=0,prev=null;
    for(const k of active){const dt=parseYmd(k);if(prev&&ymd(addDays(prev,1))===k)run++;else run=1;if(run>best)best=run;prev=dt;}
    const level=levelInfo(total);
    const st={xpByDay,total,level,streak,best,todosDone,subsDone,yearlyDone,pc,checkins,checkinsByDay,perfectDays:perfect.size,perfect,met};
    st.unlocked=new Set(ACH.filter(a=>a.ok(st)).map(a=>a.k));
    return st;
  }
  return compute();
}
