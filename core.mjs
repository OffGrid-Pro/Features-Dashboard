export const DEFAULTS = {matt:24,jake:24,hoursPerDay:8,estimateField:'Estimate',spentField:'Time spent',remainingField:'Remaining',progressField:'Progress',spentUnit:'hours',bufferPercent:25,refreshMinutes:5,dependencyField:'Depends on'};
export const PEOPLE = {MattySolja:'Matt','14ellisj':'Jake'};
export function number(value) { if (value === null || value === undefined || value === '') return null; const n=Number(value); return Number.isFinite(n)&&n>=0?n:null; }
export function normalize(item, settings) {
 const c=item.content; if (!c?.title || item.isArchived) return null;
 const f=Object.fromEntries((item.fieldValues?.nodes||[]).filter(v=>v.field).map(v=>[v.field.name,v.number??v.name??v.date??v.text]));
 const estimate=number(f[settings.estimateField]); const spent=number(f[settings.spentField]); const remaining=number(f[settings.remainingField]);
 const done=c.state==='CLOSED'||c.state==='MERGED'||/^(done|complete|completed)$/i.test(f.Status||'');
 return {id:item.id,title:c.title,url:c.url||'',number:c.number||'',status:done?'Done':f.Status||'Todo',done,owners:(c.assignees?.nodes||[]).map(a=>a.login),labels:(c.labels?.nodes||[]).map(l=>l.name),priority:f.Priority||'',estimate:estimate===null?null:estimate*settings.hoursPerDay,spent:spent===null?null:spent*(settings.spentUnit==='days'?settings.hoursPerDay:1),remaining:remaining===null?null:remaining*settings.hoursPerDay,progress:done?100:number(f[settings.progressField]),dependencies:String(f[settings.dependencyField||'Depends on']||'').split(/[\s,;]+/).filter(Boolean),blocked:/blocked|on hold/i.test(f.Status||''),target:f['Target date']||f['Due date']||null};
}
export function workDate(start, days) {
 const date=new Date(`${start}T12:00:00Z`); if(Number.isNaN(date.getTime())||!Number.isFinite(days)||days<0||days>100000) return null;
 let left=Math.max(1,Math.ceil(days-1e-9));
 while(true){ const d=date.getUTCDay(); if(d!==0&&d!==6&&--left===0) return date.toISOString().slice(0,10); date.setUTCDate(date.getUTCDate()+1); }
}
export function monday(day) {
 const d=new Date(day+'T12:00:00Z'); if(Number.isNaN(d.getTime()))return null;
 d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);
}
export function addDays(day,n) {const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function weeklyHours(owner,settings,day) {
 const override=(settings.exceptions||[]).find(e=>e.week===monday(day));
 return Number(override?.[owner]??settings[owner==='MattySolja'?'matt':'jake'])||0;
}
export function forecast(tasks, settings, start) {
 const rank=t=>/progress|review/i.test(t.status)?0:1;
 const priority=t=>({P0:0,P1:1,P2:2,P3:3,High:1,Medium:2,Low:3}[t.priority]??4);
 const ordered=tasks.map((t,i)=>({...t,_key:t.id||'row-'+i})).sort((a,b)=>rank(a)-rank(b)||priority(a)-priority(b));
 const byId=new Map(ordered.map(t=>[t._key,t]));
 function resolve(ref,task){
  if(byId.has(ref))return byId.get(ref);
  const matches=ordered.filter(t=>t.url===ref||('#'+t.number===ref&&(!task.url||t.url?.split('/issues/')[0]===task.url.split('/issues/')[0])));
  return matches.length===1?matches[0]:null;
 }
 function schedule(multiplier){
  const results=new Map(),visiting=new Set(),held=new Set(),queues={MattySolja:{day:start,used:0},'14ellisj':{day:start,used:0}};
  function visit(t){
   if(results.has(t._key))return results.get(t._key);
   const row={...t,forecast:null,reason:'',overrun:t.estimate!==null&&t.spent!==null&&t.spent>t.estimate,late:false};
   if(visiting.has(t._key))return {...row,reason:'Dependency cycle'};
   visiting.add(t._key);
   const owner=t.owners.length===1&&t.owners[0] in queues?t.owners[0]:null;
   const finish=(reason='')=>{row.reason=reason;row.late=Boolean(row.forecast&&t.target&&row.forecast>t.target);results.set(t._key,row);visiting.delete(t._key);if(reason&&owner)held.add(owner);return row;};
   if(t.done)return finish();
   if(!owner)return finish(t.owners.length>1?'Choose one delivery owner':'Assign Matt or Jake');
   if(t.blocked??/blocked|on hold/i.test(t.status))return finish('Blocked — needs a decision');
   let earliest=start;
   for(const ref of t.dependencies||[]){const dep=resolve(ref,t);if(!dep)return finish('Dependency missing or ambiguous');const result=visit(dep);if(!dep.done&&!result.forecast)return finish(result.reason==='Dependency cycle'?'Dependency cycle':'Dependency needs planning');if(!dep.done)earliest=[earliest,addDays(result.forecast,1)].sort().at(-1);}
   if(held.has(owner))return finish('Earlier task needs planning');
   let remaining=t.remaining??(t.estimate===null?null:t.spent===null?t.estimate:Math.max(0,t.estimate-t.spent));
   if(remaining===null)return finish('Estimate needed');
   if(t.remaining===null&&t.spent!==null&&t.estimate!==null&&t.spent>=t.estimate)return finish('Remaining estimate needed');
   if(!Number.isFinite(remaining)||remaining<0)return finish('Invalid remaining effort');
   remaining*=multiplier;
   const queue=queues[owner];let day=queue.day>earliest?queue.day:earliest;let used=day===queue.day?queue.used:0;
   for(let count=0;count<3660;count++,day=addDays(day,1),used=0){
    const weekday=new Date(day+'T12:00:00Z').getUTCDay();if(!weekday||weekday===6)continue;
    const available=Math.max(0,weeklyHours(owner,settings,day)/5-used);if(available<=1e-9)continue;
    if(remaining<=available+1e-9){row.forecast=day;queues[owner]={day,used:used+remaining};return finish();}
    remaining-=available;
   }
   return finish(Number(settings[owner==='MattySolja'?'matt':'jake'])===0?'No weekly capacity':'Beyond 10-year forecast window');
  }
  ordered.forEach(visit);return results;
 }
 const expected=schedule(1),cautious=schedule(1+Number(settings.bufferPercent??25)/100);
 return ordered.map(t=>{const r=expected.get(t._key);return {...r,cautious:cautious.get(t._key)?.forecast||null};});
}
export function changesSince(previous,current) {
 const old=new Map(previous.map(t=>[t.id,t])),now=new Map(current.map(t=>[t.id,t]));const changes=[];
 for(const t of current){const before=old.get(t.id);if(!before){changes.push({kind:'Added',title:t.title});continue;}
  if(t.done&&!before.done)changes.push({kind:'Completed',title:t.title});
  else if(before.status!==t.status)changes.push({kind:'Status changed',title:t.title,detail:before.status+' → '+t.status});
  if(!t.done&&before.forecast&&t.forecast&&t.forecast>before.forecast)changes.push({kind:'Slipped',title:t.title,detail:before.forecast+' → '+t.forecast});
  if(!t.done&&before.forecast&&!t.forecast)changes.push({kind:'Forecast lost',title:t.title,detail:t.reason});
  if(before.estimate!==t.estimate||before.remaining!==t.remaining)changes.push({kind:'Effort changed',title:t.title});
 }
 for(const t of previous)if(!now.has(t.id))changes.push({kind:'Removed from view',title:t.title});
 return changes;
}
export function csv(rows) {
 const safe=v=>{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const fields=['Task','Status','Assignees','Priority','Estimate hours','Spent hours','Remaining hours','Progress percent','Expected forecast','Cautious forecast','Dependencies','Local adjustment','Target','Over estimate','Planning note','GitHub URL'];
 return '\uFEFF'+[fields,...rows.map(t=>[t.title,t.status,t.owners.map(o=>PEOPLE[o]||o).join(', '),t.priority,t.estimate,t.spent,t.remaining,t.progress,t.forecast,t.cautious,(t.dependencies||[]).join(' '),t.localOverride?'Yes':'No',t.target,t.overrun?'Yes':'No',t.reason,t.url])].map(r=>r.map(safe).join(',')).join('\r\n');
}
export function validateReport(value) {
 const fail=()=>{throw new Error('This is not a valid WattSwap report. Export a fresh report from the dashboard.');};
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s));
 if(!value||value.format!=='wattswap-report'||value.version!==1||!value.data||!Array.isArray(value.data.items)||value.data.items.length>10000||!Array.isArray(value.rows)||value.rows.length>10000||!validDate(value.start)||!Number.isFinite(Date.parse(value.capturedAt))||!Number.isFinite(Date.parse(value.data.syncedAt)))fail();
 const settings={...DEFAULTS};const bounds={matt:[0,168],jake:[0,168],hoursPerDay:[.5,24],bufferPercent:[0,200],refreshMinutes:[0,60]};
 for(const key of Object.keys(DEFAULTS)){const v=value.settings?.[key];if(typeof DEFAULTS[key]==='number'){if(typeof v!=='number'||!Number.isFinite(v)||(bounds[key]&&(v<bounds[key][0]||v>bounds[key][1])))fail();}else if(typeof v!=='string'||v.length>100)fail();settings[key]=v;}
 if(!['hours','days'].includes(settings.spentUnit))fail();
 settings.exceptions=[];
 for(const e of value.settings.exceptions||[]){if(settings.exceptions.length>=104||!validDate(e.week)||e.week!==monday(e.week)||settings.exceptions.some(x=>x.week===e.week))fail();for(const owner of Object.keys(PEOPLE))if(typeof e[owner]!=='number'||!Number.isFinite(e[owner])||e[owner]<0||e[owner]>168)fail();settings.exceptions.push({week:e.week,MattySolja:e.MattySolja,'14ellisj':e['14ellisj']});}
 const ids=new Set();
 for(const item of value.data.items){if(!item||typeof item.id!=='string'||['__proto__','prototype','constructor'].includes(item.id)||ids.has(item.id))fail();ids.add(item.id);if(item.content){if(item.content.url!==undefined&&typeof item.content.url!=='string')fail();if(typeof item.content.title!=='string'||item.content.title.length>10000)fail();for(const connection of ['assignees','labels'])if(item.content[connection]&&(!Array.isArray(item.content[connection].nodes)||item.content[connection].nodes.some(n=>!n||typeof n[connection==='assignees'?'login':'name']!=='string')))fail();}if(item.fieldValues&&(!Array.isArray(item.fieldValues.nodes)||item.fieldValues.nodes.some(n=>!n||n.field&&typeof n.field.name!=='string')))fail();}
 const overrides={};for(const [id,o]of Object.entries(value.overrides||{})){if(!ids.has(id)||['__proto__','prototype','constructor'].includes(id)||!o||typeof o!=='object')fail();const clean={};for(const key of ['estimate','spent','remaining','progress'])if(key in o){if(o[key]!==null&&(typeof o[key]!=='number'||!Number.isFinite(o[key])||o[key]<0||o[key]>(key==='progress'?100:100000)))fail();clean[key]=o[key];}if(o.owners){if(!Array.isArray(o.owners)||o.owners.length!==1||!PEOPLE[o.owners[0]])fail();clean.owners=o.owners;}if('blocked'in o){if(typeof o.blocked!=='boolean')fail();clean.blocked=o.blocked;}if('dependencies'in o){if(!Array.isArray(o.dependencies)||o.dependencies.length>1000||o.dependencies.some(d=>typeof d!=='string'))fail();clean.dependencies=o.dependencies;}overrides[id]=clean;}
 const rows=value.rows.map(t=>{if(!t||typeof t.id!=='string'||typeof t.title!=='string'||typeof t.status!=='string'||typeof t.done!=='boolean'||t.forecast!==null&&!validDate(t.forecast))fail();return {id:t.id,title:t.title,status:t.status,done:t.done,forecast:t.forecast,estimate:number(t.estimate),remaining:number(t.remaining)};});
 return {...value,settings,overrides,rows,sample:value.sample===true};
}
