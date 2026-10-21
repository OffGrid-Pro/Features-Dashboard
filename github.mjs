const query=`query($cursor:String){organization(login:"OffGrid-Pro"){projectV2(number:8){title url items(first:50,after:$cursor){pageInfo{hasNextPage endCursor} nodes{id isArchived fieldValues(first:100){nodes{... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2FieldCommon{name}}} ... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2FieldCommon{name}}} ... on ProjectV2ItemFieldDateValue{date field{... on ProjectV2FieldCommon{name}}} ... on ProjectV2ItemFieldTextValue{text field{... on ProjectV2FieldCommon{name}}}}} content{... on Issue{title number url state assignees(first:100){nodes{login}} labels(first:100){nodes{name}}} ... on PullRequest{title number url state assignees(first:100){nodes{login}} labels(first:100){nodes{name}}} ... on DraftIssue{title assignees(first:100){nodes{login}}}}}}}}}`;
export async function loadProject(token,fetcher=fetch) {
 let cursor=null,items=[],title='',url='';
 do {
 const response=await fetcher('https://api.github.com/graphql',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query,variables:{cursor}}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(response.status===401?'GitHub rejected the token. Check it and try again.':response.status===403?'GitHub access denied or rate limit reached. Check project access and try later.':`GitHub request failed (${response.status}). Try again.`);
 const result=await response.json();if(result.errors?.length)throw new Error('GitHub could not read the complete project. Check project permissions and organisation access.');
 const project=result.data?.organization?.projectV2;if(!project)throw new Error('Project 8 is unavailable. Check that your token can read the WattSwap project.');
 items.push(...project.items.nodes);title=project.title;url=project.url;
 cursor=project.items.pageInfo.hasNextPage?project.items.pageInfo.endCursor:null;
 if(project.items.pageInfo.hasNextPage&&!cursor)throw new Error('GitHub returned an incomplete page. Please retry.');
 }while(cursor);
 return {items,title,url,syncedAt:new Date().toISOString()};
}

// Only explicitly approved dashboard fields are included in the public snapshot.
export function publicProject(project) {
 const allowed=new Set(['Status','Priority','Estimate','Time spent','Remaining','Progress','Depends on','Target date','Due date']);
 return {title:project.title,url:project.url,syncedAt:project.syncedAt,items:project.items.filter(i=>!i.isArchived&&i.content).map(i=>({
  id:i.id,content:{title:i.content.title,number:i.content.number,url:i.content.url,state:i.content.state,
   assignees:{nodes:(i.content.assignees?.nodes||[]).map(a=>({login:a.login}))},labels:{nodes:(i.content.labels?.nodes||[]).map(l=>({name:l.name}))}},
  fieldValues:{nodes:(i.fieldValues?.nodes||[]).filter(v=>allowed.has(v.field?.name)).map(v=>({field:{name:v.field.name},...Object.fromEntries(['number','name','date','text'].filter(k=>v[k]!==undefined).map(k=>[k,v[k]]))}))}
 }))};
}
export async function loadPublicProject(fetcher=fetch) {
 const response=await fetcher('./project-data.json',{cache:'no-store',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error('The shared project feed is not available yet. The repository owner needs to finish the GitHub Pages setup.');
 const result=await response.json();
 if(!Array.isArray(result.items)||!Number.isFinite(Date.parse(result.syncedAt)))throw new Error('The shared project feed is invalid. Please try again later.');
 return result;
}
