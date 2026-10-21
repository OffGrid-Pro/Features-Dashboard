export const DEFAULTS = {matt:24,jake:24,hoursPerDay:8,estimateField:'Estimate',spentField:'Time spent',remainingField:'Remaining',progressField:'Progress',spentUnit:'hours'};
export const PEOPLE = {MattySolja:'Matt','14ellisj':'Jake'};
export function number(value) { if (value === null || value === undefined || value === '') return null; const n=Number(value); return Number.isFinite(n)&&n>=0?n:null; }
export function normalize(item, settings) {
 const c=item.content; if (!c?.title || item.isArchived) return null;
 const f=Object.fromEntries((item.fieldValues?.nodes||[]).filter(v=>v.field).map(v=>[v.field.name,v.number??v.name??v.date??v.text]));
 const estimate=number(f[settings.estimateField]); const spent=number(f[settings.spentField]); const remaining=number(f[settings.remainingField]);
 const done=c.state==='CLOSED'||c.state==='MERGED'||/^(done|complete|completed)$/i.test(f.Status||'');
 return {id:item.id,title:c.title,url:c.url||'',number:c.number||'',status:done?'Done':f.Status||'Todo',done,owners:(c.assignees?.nodes||[]).map(a=>a.login),labels:(c.labels?.nodes||[]).map(l=>l.name),priority:f.Priority||'',estimate:estimate===null?null:estimate*settings.hoursPerDay,spent:spent===null?null:spent*(settings.spentUnit==='days'?settings.hoursPerDay:1),remaining:remaining===null?null:remaining*settings.hoursPerDay,progress:done?100:number(f[settings.progressField]),target:f['Target date']||f['Due date']||null};
}
export function workDate(start, days) {
 const date=new Date(`${start}T12:00:00Z`); if(Number.isNaN(date.getTime())||!Number.isFinite(days)||days<0||days>100000) return null;
 let left=Math.max(1,Math.ceil(days-1e-9));
 while(true){ const d=date.getUTCDay(); if(d!==0&&d!==6&&--left===0) return date.toISOString().slice(0,10); date.setUTCDate(date.getUTCDate()+1); }
}
export function forecast(tasks, settings, start) {
 const queues={MattySolja:0,'14ellisj':0}; const blocked={}; const capacity={MattySolja:Number(settings.matt),'14ellisj':Number(settings.jake)};
 const rank=t=>/progress|review/i.test(t.status)?0:1;
 const priority=t=>({P0:0,P1:1,P2:2,P3:3,High:1,Medium:2,Low:3}[t.priority]??4);
 return [...tasks].sort((a,b)=>rank(a)-rank(b)||priority(a)-priority(b)).map(t=>{
  const row={...t,forecast:null,reason:'',overrun:t.estimate!==null&&t.spent!==null&&t.spent>t.estimate,late:false};
  if(t.done) return row;
  const owners=t.owners.filter(o=>o in capacity);
  if(t.owners.length!==1||owners.length!==1){row.reason=t.owners.length>1?'Choose one delivery owner':'Assign Matt or Jake';return row;}
  const owner=owners[0];
  if(blocked[owner]){row.reason='Earlier task needs planning';return row;}
  const remaining=t.remaining??(t.estimate===null?null:t.spent===null?t.estimate:Math.max(0,t.estimate-t.spent));
  if(remaining===null){row.reason='Estimate needed';blocked[owner]=true;return row;}
  if(t.remaining===null&&t.spent!==null&&t.estimate!==null&&t.spent>=t.estimate){row.reason='Remaining estimate needed';blocked[owner]=true;return row;}
  if(!(capacity[owner]>0)){row.reason='No weekly capacity';return row;}
  queues[owner]+=remaining/(capacity[owner]/5);
  row.forecast=workDate(start,queues[owner]); row.reason=row.forecast?'':'Forecast exceeds supported range';
  row.late=Boolean(row.forecast&&t.target&&row.forecast>t.target);
  return row;
 });
}
export function csv(rows) {
 const safe=v=>{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const fields=['Task','Status','Assignees','Priority','Estimate hours','Spent hours','Remaining hours','Progress percent','Forecast','Target','Over estimate','Planning note','GitHub URL'];
 return '\uFEFF'+[fields,...rows.map(t=>[t.title,t.status,t.owners.map(o=>PEOPLE[o]||o).join(', '),t.priority,t.estimate,t.spent,t.remaining,t.progress,t.forecast,t.target,t.overrun?'Yes':'No',t.reason,t.url])].map(r=>r.map(safe).join(',')).join('\r\n');
}
